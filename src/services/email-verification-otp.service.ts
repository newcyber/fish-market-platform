import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";
import { EmailVerificationOtpRepository } from "@/repositories/email-verification-otp.repository";
import { UserRepository } from "@/repositories/user.repository";

/**
 * ============================================================
 * EMAIL VERIFICATION OTP SERVICE
 * ============================================================
 *
 * Business logic untuk Email Verification OTP.
 *
 * Responsibilities:
 *
 * - Generate OTP 6 digit
 * - Hash OTP
 * - Expiration
 * - Maximum verification attempts
 * - Invalidate previous OTP
 * - Verify OTP
 * - Mark email as verified
 *
 * ============================================================
 */

export class EmailVerificationOtpService {
  /**
   * ============================================================
   * CONFIGURATION
   * ============================================================
   */

  private static readonly OTP_LENGTH = 6;

  /**
   * OTP berlaku selama 10 menit.
   */

  private static readonly OTP_EXPIRES_IN_MINUTES = 10;

  /**
   * Maksimum percobaan OTP.
   */

  private static readonly MAX_ATTEMPTS = 5;

  /**
 * ============================================================
 * RESEND COOLDOWN
 * ============================================================
 *
 * User harus menunggu 60 detik sebelum meminta OTP baru.
 */

private static readonly RESEND_COOLDOWN_SECONDS = 60;

  /**
   * ============================================================
   * GENERATE CRYPTOGRAPHIC OTP
   * ============================================================
   *
   * Menggunakan crypto.randomInt agar OTP tidak menggunakan
   * Math.random().
   */

  private static generateOtp(): string {
    const min = 10 ** (
      this.OTP_LENGTH - 1
    );

    const max = 10 ** this.OTP_LENGTH;

    return crypto
      .randomInt(min, max)
      .toString();
  }

  /**
   * ============================================================
   * HASH OTP
   * ============================================================
   *
   * OTP tidak pernah disimpan dalam plain text.
   */

  private static hashOtp(
    otp: string
  ): string {
    return crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
  }

  /**
   * ============================================================
   * SAFE OTP COMPARISON
   * ============================================================
   */

  private static verifyOtpHash(
    otp: string,
    storedHash: string
  ): boolean {
    const incomingHash =
      this.hashOtp(otp);

    const incomingBuffer =
      Buffer.from(incomingHash, "hex");

    const storedBuffer =
      Buffer.from(storedHash, "hex");

    /**
     * timingSafeEqual membutuhkan buffer
     * dengan panjang yang sama.
     */

    if (
      incomingBuffer.length !==
      storedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      incomingBuffer,
      storedBuffer
    );
  }

  /**
   * ============================================================
   * CALCULATE EXPIRATION
   * ============================================================
   */

  private static getExpirationDate(): Date {
    const expiresAt = new Date();

    expiresAt.setMinutes(
      expiresAt.getMinutes() +
        this.OTP_EXPIRES_IN_MINUTES
    );

    return expiresAt;
  }

  /**
   * ============================================================
   * CREATE EMAIL VERIFICATION OTP
   * ============================================================
   *
   * Flow:
   *
   * 1. Pastikan user ada.
   * 2. Pastikan user belum verified.
   * 3. Generate OTP.
   * 4. Hash OTP.
   * 5. Invalidasi OTP sebelumnya.
   * 6. Simpan OTP baru.
   *
   * OTP raw dikembalikan dari service agar dapat dikirim
   * oleh Email Service.
   */

  static async create(
    userId: string
  ): Promise<{
    otp: string;
    expiresAt: Date;
  }> {
    const user =
      await UserRepository.findById(
        userId
      );

    if (!user) {
      throw new Error(
        "USER_NOT_FOUND"
      );
    }

    /**
     * Email sudah diverifikasi.
     */

    if (user.emailVerified) {
      throw new Error(
        "EMAIL_ALREADY_VERIFIED"
      );
    }

    const otp =
      this.generateOtp();

    const codeHash =
      this.hashOtp(otp);

    const expiresAt =
      this.getExpirationDate();

    /**
     * Invalidasi OTP lama dan buat OTP baru
     * dalam satu transaction.
     */

    await prisma.$transaction(
      async (tx) => {
        await EmailVerificationOtpRepository.invalidateActiveByUserId(
          userId,
          tx
        );

        await EmailVerificationOtpRepository.create(
  {
    user: {
      connect: {
        id: userId,
      },
    },

    codeHash,

    expiresAt,
  },
  tx
);
      }
    );

    return {
      otp,
      expiresAt,
    };
  }

  /**
   * ============================================================
   * VERIFY EMAIL OTP
   * ============================================================
   */

  static async verify(
    userId: string,
    otp: string
  ): Promise<void> {
    const user =
      await UserRepository.findById(
        userId
      );

    if (!user) {
      throw new Error(
        "USER_NOT_FOUND"
      );
    }

    /**
     * Jika sudah verified, tidak perlu verifikasi ulang.
     */

    if (user.emailVerified) {
      throw new Error(
        "EMAIL_ALREADY_VERIFIED"
      );
    }

    const verificationOtp =
      await EmailVerificationOtpRepository.findLatestActiveByUserId(
        userId
      );

    /**
     * Tidak ada OTP aktif atau OTP sudah expired.
     */

    if (!verificationOtp) {
      throw new Error(
        "OTP_NOT_FOUND_OR_EXPIRED"
      );
    }

    /**
     * Maksimum attempt.
     */

    if (
      verificationOtp.attempts >=
      this.MAX_ATTEMPTS
    ) {
      await EmailVerificationOtpRepository.markAsUsed(
        verificationOtp.id
      );

      throw new Error(
        "OTP_MAX_ATTEMPTS_EXCEEDED"
      );
    }

    /**
     * Validasi OTP.
     */

    const isValid =
      this.verifyOtpHash(
        otp,
        verificationOtp.codeHash
      );

    /**
     * OTP salah.
     */

    if (!isValid) {
      const updatedOtp =
        await EmailVerificationOtpRepository.incrementAttempts(
          verificationOtp.id
        );

      /**
       * Jika attempt terakhir mencapai batas,
       * OTP langsung dinonaktifkan.
       */

      if (
        updatedOtp.attempts >=
        this.MAX_ATTEMPTS
      ) {
        await EmailVerificationOtpRepository.markAsUsed(
          verificationOtp.id
        );

        throw new Error(
          "OTP_MAX_ATTEMPTS_EXCEEDED"
        );
      }

      throw new Error(
        "INVALID_OTP"
      );
    }

    /**
     * OTP valid.
     *
     * Update email verification dan tandai OTP
     * sebagai used dalam satu transaction.
     */

    await prisma.$transaction(
      async (tx) => {
        await tx.user.update({
          where: {
            id: userId,
          },

          data: {
            emailVerified: new Date(),
          },
        });

        await EmailVerificationOtpRepository.markAsUsed(
          verificationOtp.id,
          tx
        );
      }
    );
  }

  /**
   * ============================================================
   * RESEND OTP
   * ============================================================
   *
   * Saat ini resend menggunakan create().
   * OTP lama akan otomatis dinonaktifkan.
   *
   * Rate limiting akan kita tambahkan pada tahap API/service
   * berikutnya agar resend tidak dapat digunakan untuk spam.
   */

  /**
 * ============================================================
 * RESEND OTP
 * ============================================================
 *
 * Flow:
 *
 * 1. Pastikan user ada dan belum verified.
 * 2. Ambil OTP terakhir.
 * 3. Cek cooldown.
 * 4. Jika cooldown sudah selesai, buat OTP baru.
 * 5. OTP lama otomatis dinonaktifkan oleh create().
 */

static async resend(
  userId: string
): Promise<{
  otp: string;
  expiresAt: Date;
  resendAvailableAt: Date;
}> {
  const user =
    await UserRepository.findById(
      userId
    );

  if (!user) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  if (user.emailVerified) {
    throw new Error(
      "EMAIL_ALREADY_VERIFIED"
    );
  }

  const latestOtp =
    await EmailVerificationOtpRepository.findLatestByUserId(
      userId
    );

  if (latestOtp) {
    const resendAvailableAt =
      new Date(
        latestOtp.createdAt.getTime() +
          this.RESEND_COOLDOWN_SECONDS *
            1000
      );

    const now =
      new Date();

    if (now < resendAvailableAt) {
      const retryAfterSeconds =
        Math.ceil(
          (resendAvailableAt.getTime() -
            now.getTime()) /
            1000
        );

      throw new Error(
        `OTP_RESEND_COOLDOWN:${retryAfterSeconds}`
      );
    }
  }

  const {
    otp,
    expiresAt,
  } =
    await this.create(userId);

  return {
    otp,
    expiresAt,

    resendAvailableAt:
      new Date(
        Date.now() +
          this.RESEND_COOLDOWN_SECONDS *
            1000
      ),
  };
}
}

export default EmailVerificationOtpService;