import { PasswordResetToken } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * PASSWORD RESET TOKEN REPOSITORY
 * ============================================================
 *
 * Repository khusus untuk seluruh operasi database
 * PasswordResetToken.
 *
 * Route handler dan service tidak perlu melakukan query Prisma
 * secara langsung.
 */

export class PasswordResetTokenRepository {
  /**
   * ==========================================================
   * DELETE USER TOKENS
   * ==========================================================
   *
   * Menghapus seluruh token reset password lama milik user.
   *
   * Saat user meminta reset password baru, token lama harus
   * tidak dapat digunakan lagi.
   */

  static async deleteByUserId(
    userId: string
  ): Promise<number> {
    const result =
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId,
        },
      });

    return result.count;
  }

  /**
   * ==========================================================
   * CREATE TOKEN
   * ==========================================================
   *
   * Hanya token hash yang disimpan ke database.
   *
   * Raw token tidak pernah masuk database.
   */

  static async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  /**
   * ==========================================================
   * FIND VALID TOKEN
   * ==========================================================
   *
   * Token hanya valid jika:
   *
   * - tokenHash cocok
   * - belum expired
   * - belum pernah digunakan
   */

  static async findValidByTokenHash(
    tokenHash: string
  ): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,

        usedAt: null,

        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * ==========================================================
   * MARK TOKEN AS USED
   * ==========================================================
   *
   * Setelah password berhasil di-reset, token tidak boleh
   * digunakan kembali.
   */

  static async markAsUsed(
    id: string
  ): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.update({
      where: {
        id,
      },

      data: {
        usedAt: new Date(),
      },
    });
  }

  /**
   * ==========================================================
   * DELETE EXPIRED TOKENS
   * ==========================================================
   *
   * Helper untuk maintenance/cleanup token yang sudah expired.
   *
   * Tidak wajib dipanggil setiap request.
   */

  static async deleteExpired(): Promise<number> {
    const result =
      await prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });

    return result.count;
  }
}

export default PasswordResetTokenRepository;