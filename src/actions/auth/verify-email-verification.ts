"use server";

import { EmailVerificationOtpService } from "@/services/email-verification-otp.service";
import { UserRepository } from "@/repositories/user.repository";

/**
 * ============================================================
 * VERIFY EMAIL VERIFICATION ACTION
 * ============================================================
 *
 * Server Action untuk memverifikasi kode OTP email.
 *
 * Flow:
 *
 * 1. Normalize email
 * 2. Validasi OTP
 * 3. Cari user
 * 4. Pastikan email belum verified
 * 5. Verifikasi OTP
 * 6. Jika valid, emailVerified akan diupdate
 *
 * ============================================================
 */

export async function verifyEmailVerificationAction(
  email: string,
  otp: string
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

    /**
     * ========================================================
     * NORMALIZE OTP
     * ========================================================
     *
     * Hapus spasi yang mungkin ikut ter-copy dari email.
     */

    const normalizedOtp =
      otp
        .trim()
        .replace(/\s/g, "");

    /**
     * ========================================================
     * VALIDATE EMAIL
     * ========================================================
     */

    if (!normalizedEmail) {
      return {
        success: false,

        message:
          "Email wajib diisi.",
      };
    }

    /**
     * ========================================================
     * VALIDATE OTP
     * ========================================================
     *
     * OTP harus tepat 6 digit angka.
     */

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return {
        success: false,

        message:
          "Kode verifikasi harus terdiri dari 6 digit angka.",
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
        success: true,

        message:
          "Email Anda sudah terverifikasi.",

        data: {
          email: user.email,
          alreadyVerified: true,
        },
      };
    }

    /**
     * ========================================================
     * VERIFY OTP
     * ========================================================
     */

    await EmailVerificationOtpService.verify(
      user.id,
      normalizedOtp
    );

    /**
     * ========================================================
     * SUCCESS
     * ========================================================
     */

    return {
      success: true,

      message:
        "Email berhasil diverifikasi. Silakan login menggunakan akun Anda.",

      data: {
        email: user.email,
        verified: true,
      },
    };
  } catch (error) {
    console.error(
      "[VERIFY_EMAIL_VERIFICATION_ACTION_ERROR]",
      error
    );

    /**
     * ========================================================
     * HANDLE KNOWN OTP ERRORS
     * ========================================================
     */

    if (error instanceof Error) {
      switch (error.message) {
        case "USER_NOT_FOUND":
          return {
            success: false,
            message:
              "Akun tidak ditemukan.",
          };

        case "EMAIL_ALREADY_VERIFIED":
          return {
            success: true,
            message:
              "Email Anda sudah terverifikasi.",
          };

        case "OTP_NOT_FOUND_OR_EXPIRED":
          return {
            success: false,
            message:
              "Kode verifikasi tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru.",
            code:
              "OTP_NOT_FOUND_OR_EXPIRED",
          };

        case "INVALID_OTP":
          return {
            success: false,
            message:
              "Kode verifikasi tidak valid. Silakan coba lagi.",
            code:
              "INVALID_OTP",
          };

        case "OTP_MAX_ATTEMPTS_EXCEEDED":
          return {
            success: false,
            message:
              "Terlalu banyak percobaan. Silakan minta kode verifikasi baru.",
            code:
              "OTP_MAX_ATTEMPTS_EXCEEDED",
          };
      }
    }

    /**
     * ========================================================
     * GENERIC ERROR
     * ========================================================
     */

    return {
      success: false,

      message:
        "Terjadi kesalahan saat memverifikasi email.",
    };
  }
}