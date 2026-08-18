"use server";

import { Role } from "@prisma/client";

import CustomerService from "@/services/customer/customer.service";
import {
  RegisterSchema,
  type RegisterInput,
} from "@/validations/auth/register.schema";

import { EmailVerificationOtpService } from "@/services/email-verification-otp.service";
import { EmailVerificationEmailService } from "@/services/email-verification-email.service";

/**
 * ============================================================
 * REGISTER CUSTOMER ACTION
 * ============================================================
 *
 * Action untuk registrasi customer dari halaman publik.
 *
 * Flow:
 *
 * 1. Validasi input
 * 2. Buat customer
 * 3. Generate Email Verification OTP
 * 4. Simpan OTP dalam bentuk hash
 * 5. Kirim OTP ke email customer
 * 6. Frontend redirect ke halaman verifikasi
 *
 * Role dan status akun ditentukan langsung oleh server
 * agar tidak dapat dimanipulasi dari client.
 *
 * ============================================================
 */

export async function registerCustomerAction(
  input: RegisterInput
) {
  try {
    /**
     * ========================================================
     * VALIDATE INPUT
     * ========================================================
     */

    const parsed =
      RegisterSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,

        message:
          parsed.error.issues[0]?.message ??
          "Data registrasi tidak valid.",
      };
    }

    const {
      name,
      email,
      password,
    } = parsed.data;

    /**
     * ========================================================
     * CREATE CUSTOMER
     * ========================================================
     *
     * Role tidak berasal dari client.
     *
     * Semua registrasi publik selalu menjadi CUSTOMER.
     */

    const customer =
      await CustomerService.createCustomer({
        name,
        email,
        password,

        role: Role.CUSTOMER,

        isActive: true,
      });

    /**
     * ========================================================
     * CREATE EMAIL VERIFICATION OTP
     * ========================================================
     */

    const {
      otp,
      expiresAt,
    } =
      await EmailVerificationOtpService.create(
        customer.id
      );

    /**
     * ========================================================
     * SEND VERIFICATION EMAIL
     * ========================================================
     */

    await EmailVerificationEmailService.sendVerificationOtp({
      to: customer.email,
      name: customer.name,
      otp,
      expiresAt,
    });

    /**
     * ========================================================
     * SUCCESS RESPONSE
     * ========================================================
     */

    return {
      success: true,

      message:
        "Registrasi berhasil. Kode verifikasi telah dikirim ke email Anda.",

      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        requiresEmailVerification: true,
      },
    };
  } catch (error) {
    console.error(
      "[REGISTER_CUSTOMER_ACTION_ERROR]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat melakukan registrasi.",
    };
  }
}