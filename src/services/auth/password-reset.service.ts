import { prisma } from "@/lib/prisma";

import {
  createPasswordResetToken,
  hashPasswordResetToken,
} from "@/lib/auth/password-reset";

import {
  hashPassword,
} from "@/lib/auth/password";

import { UserRepository } from "@/repositories/user.repository";

import { PasswordResetTokenRepository } from "@/repositories/password-reset-token.repository";

/**
 * ============================================================
 * PASSWORD RESET REQUEST RESULT
 * ============================================================
 *
 * Raw token hanya tersedia sesaat setelah token dibuat dan
 * digunakan oleh caller untuk membuat reset URL.
 */
export interface PasswordResetRequestResult {
  rawToken: string;

  user: {
    name: string | null;
    email: string;
  };
}

/**
 * ============================================================
 * PASSWORD RESET SERVICE
 * ============================================================
 *
 * Menangani business logic untuk:
 *
 * - Forgot Password
 * - Generate reset token
 * - Validate reset token
 * - Reset password
 */
export class PasswordResetService {
  /**
   * ==========================================================
   * CREATE PASSWORD RESET REQUEST
   * ==========================================================
   *
   * Menghasilkan token reset password baru.
   *
   * Token lama user akan dihapus sehingga hanya token terbaru
   * yang dapat digunakan.
   *
   * Jika user tidak ditemukan, method mengembalikan null.
   * API route tetap memberikan respons generik untuk mencegah
   * email enumeration.
   */
  static async createResetRequest(
    email: string
  ): Promise<PasswordResetRequestResult | null> {
    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await UserRepository.findActiveByEmail(
        normalizedEmail
      );

    if (!user) {
      return null;
    }

    /**
     * Generate token baru.
     */

    const {
      rawToken,
      tokenHash,
      expiresAt,
    } = createPasswordResetToken();

    /**
     * Hapus token lama dan buat token baru.
     *
     * Menggunakan transaction agar proses konsisten.
     */

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
        },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
    });

    /**
     * Raw token tidak pernah disimpan di database.
     *
     * Token hanya dikembalikan ke caller agar dapat digunakan
     * untuk membangun reset URL dan dikirim melalui email.
     */

    return {
      rawToken,

      user: {
        name: user.name ?? null,
        email: user.email,
      },
    };
  }

  /**
   * ==========================================================
   * VALIDATE RESET TOKEN
   * ==========================================================
   */

  static async validateResetToken(
    rawToken: string
  ) {
    const tokenHash =
      hashPasswordResetToken(rawToken);

    return PasswordResetTokenRepository
      .findValidByTokenHash(tokenHash);
  }

  /**
   * ==========================================================
   * RESET PASSWORD
   * ==========================================================
   *
   * Proses:
   *
   * 1. Hash raw token
   * 2. Cari token valid
   * 3. Hash password baru
   * 4. Update password
   * 5. Tandai token sebagai used
   * 6. Invalidate token reset lain
   *
   * Seluruh proses penting dilakukan secara atomic.
   */

  static async resetPassword(
    rawToken: string,
    newPassword: string
  ): Promise<boolean> {
    const tokenHash =
      hashPasswordResetToken(rawToken);

    const passwordHash =
      await hashPassword(newPassword);

    const result =
      await prisma.$transaction(
        async (tx) => {
          /**
           * Cari token valid di dalam transaction.
           */

          const resetToken =
            await tx.passwordResetToken.findFirst({
              where: {
                tokenHash,

                usedAt: null,

                expiresAt: {
                  gt: new Date(),
                },

                user: {
                  isActive: true,
                  deletedAt: null,
                },
              },
            });

          /**
           * Token tidak valid / expired / sudah digunakan.
           */

          if (!resetToken) {
            return false;
          }

          /**
           * Update password user.
           */

          await tx.user.update({
            where: {
              id: resetToken.userId,
            },

            data: {
              password: passwordHash,
              passwordChangedAt: new Date(),
            },
          });

          /**
           * Tandai token utama sebagai sudah digunakan.
           */

          await tx.passwordResetToken.update({
            where: {
              id: resetToken.id,
            },

            data: {
              usedAt: new Date(),
            },
          });

          /**
           * Hapus token reset lain milik user.
           */

          await tx.passwordResetToken.deleteMany({
            where: {
              userId: resetToken.userId,

              id: {
                not: resetToken.id,
              },
            },
          });

          return true;
        }
      );

    return result;
  }
}

export default PasswordResetService;