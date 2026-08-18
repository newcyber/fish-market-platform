"use server";

import { EmailVerificationEmailService } from "@/services/email-verification-email.service";
import { EmailVerificationOtpService } from "@/services/email-verification-otp.service";
import { UserRepository } from "@/repositories/user.repository";

/**
 * ============================================================
 * RESEND EMAIL VERIFICATION ACTION
 * ============================================================
 *
 * Mengirim ulang OTP verifikasi email.
 *
 * Security:
 *
 * - User harus ada.
 * - Email belum boleh verified.
 * - Dilindungi cooldown OTP.
 * - OTP lama otomatis dinonaktifkan.
 *
 * ============================================================
 */

export async function resendEmailVerificationAction(
  email: string
) {
  try {
    /**
     * ========================================================
     * NORMALIZE EMAIL
     * ========================================================
     */

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      return {
        success: false,

        message:
          "Email wajib diisi.",
      };
    }

    /**
     * ========================================================
     * FIND USER
     * ========================================================
     */

    const user =
      await UserRepository.findByEmail(
        normalizedEmail
      );

    /**
     * Jangan membocorkan terlalu banyak informasi.
     *
     * Untuk flow internal verifikasi setelah register,
     * kita tetap memberikan pesan yang jelas.
     */

    if (!user) {
      return {
        success: false,

        message:
          "Akun tidak ditemukan.",
      };
    }

    /**
     * ========================================================
     * EMAIL ALREADY VERIFIED
     * ========================================================
     */

    if (user.emailVerified) {
      return {
        success: false,

        message:
          "Email akun ini sudah terverifikasi.",
      };
    }

    /**
     * ========================================================
     * CREATE NEW OTP
     * ========================================================
     */

    const {
      otp,
      expiresAt,
      resendAvailableAt,
    } =
      await EmailVerificationOtpService.resend(
        user.id
      );

    /**
     * ========================================================
     * SEND EMAIL
     * ========================================================
     */

    await EmailVerificationEmailService.sendVerificationOtp({
      to: user.email,
      name: user.name,
      otp,
      expiresAt,
    });

    return {
      success: true,

      message:
        "Kode verifikasi baru telah dikirim ke email Anda.",

      data: {
        email: user.email,
        resendAvailableAt,
      },
    };
  } catch (error) {
    console.error(
      "[RESEND_EMAIL_VERIFICATION_ACTION_ERROR]",
      error
    );

    /**
     * ========================================================
     * HANDLE COOLDOWN
     * ========================================================
     */

    if (
      error instanceof Error &&
      error.message.startsWith(
        "OTP_RESEND_COOLDOWN:"
      )
    ) {
      const retryAfterSeconds =
        Number(
          error.message.replace(
            "OTP_RESEND_COOLDOWN:",
            ""
          )
        );

      return {
        success: false,

        message:
          `Silakan tunggu ${retryAfterSeconds} detik sebelum meminta kode baru.`,

        data: {
          retryAfterSeconds,
        },
      };
    }

    /**
     * ========================================================
     * GENERIC ERROR
     * ========================================================
     */

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Gagal mengirim ulang kode verifikasi.",
    };
  }
}