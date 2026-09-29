"use server";

import { Role } from "@prisma/client";

import { signIn } from "@/auth";
import AddressService from "@/services/address/address.service";
import WhatsAppRegistrationOtpService from "@/services/auth/whatsapp-registration-otp.service";
import { UserRepository } from "@/repositories/user.repository";

function normalizeOtp(otp: string) {
  return otp.trim().replace(/\s/g, "");
}

export async function requestWhatsAppRegistrationOtp(
  phone: string,
) {
  try {
    const normalizedPhone =
      WhatsAppRegistrationOtpService.normalizePhone(phone);

    const result =
      await WhatsAppRegistrationOtpService.request(normalizedPhone);

    return {
      success: true,
      message: "Kode OTP telah dikirim ke WhatsApp Anda.",
      data: {
        phone: result.phone,
        resendAvailableAt: result.resendAvailableAt,
      },
    };
  } catch (error) {
    console.error("[WHATSAPP_REGISTER_REQUEST_OTP]", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "INVALID_PHONE":
          return {
            success: false,
            code: "INVALID_PHONE",
            message: "Nomor WhatsApp Indonesia tidak valid.",
          };

        case "ACCOUNT_ALREADY_EXISTS":
          return {
            success: false,
            code: "ACCOUNT_ALREADY_EXISTS",
            message: "Nomor WhatsApp ini sudah terdaftar. Silakan masuk.",
          };

        case "PHONE_ALREADY_USED":
          return {
            success: false,
            code: "PHONE_ALREADY_USED",
            message: "Nomor WhatsApp sudah digunakan oleh akun lain.",
          };

        case "WHATSAPP_GATEWAY_NOT_CONFIGURED":
          return {
            success: false,
            message: "Layanan WhatsApp sedang tidak tersedia.",
          };

        default:
          if (error.message.startsWith("OTP_RESEND_COOLDOWN:")) {
            const retryAfterSeconds = Number(
              error.message.replace("OTP_RESEND_COOLDOWN:", ""),
            );

            return {
              success: false,
              code: "OTP_RESEND_COOLDOWN",
              message: `Silakan tunggu ${retryAfterSeconds} detik sebelum meminta kode baru.`,
              data: { retryAfterSeconds },
            };
          }
      }
    }

    return {
      success: false,
      message: "Gagal mengirim OTP. Silakan coba lagi.",
    };
  }
}

export async function verifyWhatsAppRegistrationOtp(
  phone: string,
  otp: string,
  name: string,
) {
  try {
    const normalizedPhone =
      WhatsAppRegistrationOtpService.normalizePhone(phone);
    const normalizedOtp = normalizeOtp(otp);

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return {
        success: false,
        code: "INVALID_OTP",
        message: "Kode OTP harus terdiri dari 6 digit angka.",
      };
    }

    if (name.trim().length < 3) {
      return {
        success: false,
        code: "INVALID_NAME",
        message: "Nama minimal 3 karakter.",
      };
    }

    await signIn("whatsapp-otp", {
      phone: normalizedPhone,
      otp: normalizedOtp,
      name: name.trim(),
      redirect: false,
    });

    const user =
      await UserRepository.findByPhone(normalizedPhone);

    if (!user || user.role !== Role.CUSTOMER) {
      return {
        success: false,
        message: "Akun customer tidak ditemukan setelah verifikasi.",
      };
    }

    const hasAddress =
      await AddressService.hasActiveAddress(user.id);

    return {
      success: true,
      message: "Akun berhasil dibuat.",
      data: {
        role: user.role,
        hasAddress,
        phone: user.phone,
      },
    };
  } catch (error) {
    console.error("[WHATSAPP_REGISTER_VERIFY_OTP]", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "INVALID_OTP":
        case "INVALID_OTP_FORMAT":
          return {
            success: false,
            code: "INVALID_OTP",
            message: "Kode OTP tidak valid. Silakan coba lagi.",
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
            message: "Proses registrasi tidak ditemukan. Silakan mulai lagi.",
          };
      }
    }

    return {
      success: false,
      message: "Gagal memverifikasi OTP. Silakan coba lagi.",
    };
  }
}
