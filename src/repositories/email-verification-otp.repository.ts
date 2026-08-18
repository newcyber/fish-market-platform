import { EmailVerificationOtp, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * EMAIL VERIFICATION OTP REPOSITORY
 * ============================================================
 *
 * Repository khusus untuk seluruh database operation
 * Email Verification OTP.
 *
 * Responsibilities:
 *
 * - Create OTP
 * - Find active OTP
 * - Invalidate previous OTP
 * - Increment verification attempts
 * - Mark OTP as used
 * - Cleanup expired OTP
 *
 * Business logic seperti generate code, hashing, expiration,
 * dan validation tidak diletakkan di repository.
 */

export class EmailVerificationOtpRepository {
  /**
   * ============================================================
   * CREATE OTP
   * ============================================================
   */

  static async create(
  data: Prisma.EmailVerificationOtpCreateInput,
  tx?: Prisma.TransactionClient
): Promise<EmailVerificationOtp> {
  const client = tx ?? prisma;

  return client.emailVerificationOtp.create({
    data,
  });
}

  /**
   * ============================================================
   * FIND BY ID
   * ============================================================
   */

  static async findById(
    id: string
  ): Promise<EmailVerificationOtp | null> {
    return prisma.emailVerificationOtp.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * ============================================================
   * FIND LATEST ACTIVE OTP
   * ============================================================
   *
   * OTP dianggap aktif apabila:
   *
   * - Belum digunakan
   * - Belum expired
   */

  static async findLatestActiveByUserId(
    userId: string
  ): Promise<EmailVerificationOtp | null> {
    return prisma.emailVerificationOtp.findFirst({
      where: {
        userId,

        usedAt: null,

        expiresAt: {
          gt: new Date(),
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * ============================================================
   * FIND LATEST OTP
   * ============================================================
   *
   * Digunakan ketika kita perlu mengetahui OTP terakhir,
   * termasuk yang sudah expired.
   */

  static async findLatestByUserId(
    userId: string
  ): Promise<EmailVerificationOtp | null> {
    return prisma.emailVerificationOtp.findFirst({
      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * ============================================================
   * INVALIDATE ACTIVE OTP
   * ============================================================
   *
   * Semua OTP aktif sebelumnya akan dibuat tidak dapat
   * digunakan ketika OTP baru dibuat.
   *
   * Kita menggunakan updateMany karena dalam kondisi tertentu
   * lebih dari satu OTP aktif bisa saja ada akibat request
   * yang berjalan secara bersamaan.
   */

  static async invalidateActiveByUserId(
    userId: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;

    return client.emailVerificationOtp.updateMany({
      where: {
        userId,
        usedAt: null,
      },

      data: {
        usedAt: new Date(),
      },
    });
  }

  /**
   * ============================================================
   * INCREMENT ATTEMPTS
   * ============================================================
   */

  static async incrementAttempts(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<EmailVerificationOtp> {
    const client = tx ?? prisma;

    return client.emailVerificationOtp.update({
      where: {
        id,
      },

      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  }

  /**
   * ============================================================
   * MARK OTP AS USED
   * ============================================================
   */

  static async markAsUsed(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<EmailVerificationOtp> {
    const client = tx ?? prisma;

    return client.emailVerificationOtp.update({
      where: {
        id,
      },

      data: {
        usedAt: new Date(),
      },
    });
  }

  /**
   * ============================================================
   * DELETE EXPIRED OTP
   * ============================================================
   *
   * Method ini aman dipanggil secara berkala atau sebelum
   * membuat OTP baru.
   */

  static async deleteExpired(
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;

    return client.emailVerificationOtp.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * ============================================================
   * DELETE BY USER
   * ============================================================
   *
   * Berguna apabila:
   *
   * - User dihapus
   * - Cleanup manual
   * - Reset verification process
   */

  static async deleteByUserId(
    userId: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;

    return client.emailVerificationOtp.deleteMany({
      where: {
        userId,
      },
    });
  }
}

export default EmailVerificationOtpRepository;