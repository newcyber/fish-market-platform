"use server";

import { AuthError } from "next-auth";
import { Role } from "@prisma/client";

import { signIn } from "@/auth";
import { UserRepository } from "@/repositories/user.repository";
import AddressService from "@/services/address/address.service";
import WhatsAppLoginOtpService from "@/services/auth/whatsapp-login-otp.service";

function normalizeOtp(otp: string): string {
  return otp.trim().replace(/\s/g, "");
}

export async function requestWhatsAppLoginOtp(phone: string) {
  try {
    const normalizedPhone =
      WhatsAppLoginOtpService.normalizePhone(phone);

    const result = await WhatsAppLoginOtpService.request(
      normalizedPhone,
    );

    return {
      success: true,
      message: "Kode OTP telah dikirim ke WhatsApp Anda.",
      data: {
        phone: result.phone,
        resendAvailableAt: result.resendAvailableAt,
      },
    };
  } catch (error) {
    console.error(
      "[WHATSAPP_LOGIN_REQUEST_OTP]",
      error,
    );

    if (error instanceof Error) {
      if (error.message === "INVALID_PHONE") {
        return {
          success: false,
          code: "INVALID_PHONE",
          message:
            "Nomor WhatsApp Indonesia tidak valid.",
        };
      }

      if (error.message === "ACCOUNT_NOT_FOUND") {
        return {
          success: false,
          code: "ACCOUNT_NOT_FOUND",
          message:
            "Nomor WhatsApp belum terdaftar di Pisjo Market.",
        };
      }

      if (error.message === "ACCOUNT_NOT_VERIFIED") {
        return {
          success: false,
          code: "ACCOUNT_NOT_VERIFIED",
          message: "Akun belum selesai diverifikasi.",
        };
      }

      if (error.message === "WHATSAPP_SEND_FAILED") {
        return {
          success: false,
          code: "WHATSAPP_SEND_FAILED",
          message:
            "Gagal mengirim OTP melalui WhatsApp. Silakan coba lagi.",
        };
      }

      if (error.message.startsWith("OTP_RESEND_COOLDOWN:")) {
        const retryAfterSeconds = Number(
          error.message.replace(
            "OTP_RESEND_COOLDOWN:",
            "",
          ),
        );

        return {
          success: false,
          code: "OTP_RESEND_COOLDOWN",
          message:
            `Silakan tunggu ${retryAfterSeconds} detik sebelum meminta kode baru.`,
          data: {
            retryAfterSeconds,
          },
        };
      }
    }

    return {
      success: false,
      message: "Gagal mengirim OTP. Silakan coba lagi.",
    };
  }
}

export async function verifyWhatsAppLoginOtp(
  phone: string,
  otp: string,
) {
  try {
    const normalizedPhone =
      WhatsAppLoginOtpService.normalizePhone(phone);

    const normalizedOtp = normalizeOtp(otp);

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return {
        success: false,
        code: "INVALID_OTP",
        message:
          "Kode OTP harus terdiri dari 6 digit angka.",
      };
    }

    await signIn("whatsapp-login-otp", {
      phone: normalizedPhone,
      otp: normalizedOtp,
      redirect: false,
    });

    const user = await UserRepository.findByPhone(
      normalizedPhone,
    );

    if (
      !user ||
      !user.isActive ||
      !(
        user.role === Role.CUSTOMER ||
        user.role === Role.ADMIN ||
        user.role === Role.SUPER_ADMIN
      )
    ) {
      return {
        success: false,
        code: "ACCOUNT_NOT_FOUND",
        message:
          "Akun tidak ditemukan atau tidak memiliki akses login WhatsApp.",
      };
    }

    const hasAddress =
      user.role === Role.CUSTOMER
        ? await AddressService.hasActiveAddress(user.id)
        : true;

    return {
      success: true,
      message: "Login berhasil.",
      data: {
        role: user.role,
        hasAddress,
        phone: user.phone,
      },
    };
  } catch (error) {
    console.error(
      "[WHATSAPP_LOGIN_VERIFY_OTP]",
      error,
    );

    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          success: false,
          code: "INVALID_OTP",
          message:
            "Kode OTP tidak valid. Silakan coba lagi.",
        };
      }
    }

    if (error instanceof Error) {
      switch (error.message) {
        case "INVALID_PHONE":
          return {
            success: false,
            code: "INVALID_PHONE",
            message: "Nomor WhatsApp tidak valid.",
          };

        case "INVALID_OTP":
        case "INVALID_OTP_FORMAT":
          return {
            success: false,
            code: "INVALID_OTP",
            message:
              "Kode OTP tidak valid. Silakan coba lagi.",
          };

        case "OTP_NOT_FOUND_OR_EXPIRED":
          return {
            success: false,
            code: "OTP_NOT_FOUND_OR_EXPIRED",
            message:
              "Kode OTP sudah kedaluwarsa atau tidak ditemukan. Silakan kirim ulang.",
          };

        case "OTP_MAX_ATTEMPTS_EXCEEDED":
          return {
            success: false,
            code: "OTP_MAX_ATTEMPTS_EXCEEDED",
            message:
              "Terlalu banyak percobaan. Silakan minta OTP baru.",
          };

        case "ACCOUNT_NOT_FOUND":
          return {
            success: false,
            code: "ACCOUNT_NOT_FOUND",
            message:
              "Akun tidak ditemukan atau tidak memiliki akses login WhatsApp.",
          };

        case "ACCOUNT_NOT_VERIFIED":
          return {
            success: false,
            code: "ACCOUNT_NOT_VERIFIED",
            message:
              "Akun belum selesai diverifikasi.",
          };
      }
    }

    return {
      success: false,
      message:
        "Gagal memverifikasi OTP. Silakan coba lagi.",
    };
  }
}
