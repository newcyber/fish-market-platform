import { NextResponse } from "next/server";

import { PasswordResetService } from "@/services/auth/password-reset.service";

import { EmailService } from "@/services/email/email.service";

import { createPasswordResetEmail } from "@/services/email/templates/password-reset.template";

import { ForgotPasswordSchema } from "@/validations/auth/forgot-password.schema";

/**
 * ============================================================
 * POST /api/auth/forgot-password
 * ============================================================
 *
 * Membuat request reset password.
 *
 * Keamanan:
 *
 * - Email selalu divalidasi.
 * - Tidak membocorkan apakah email terdaftar atau tidak.
 * - Token lama akan dihapus ketika request baru dibuat.
 * - Raw token tidak disimpan di database.
 * - Hanya token hash yang disimpan.
 * - Reset URL dikirim melalui email.
 */

export async function POST(
  request: Request
) {
  try {
    /**
     * ==========================================================
     * PARSE REQUEST BODY
     * ==========================================================
     */

    const body = await request.json();

    /**
     * ==========================================================
     * VALIDATE INPUT
     * ==========================================================
     */

    const parsed =
      ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const validationErrors =
        parsed.error.flatten();

      console.error(
        "[FORGOT_PASSWORD_VALIDATION_ERROR]",
        validationErrors
      );

      return NextResponse.json(
        {
          success: false,

          message:
            validationErrors.formErrors[0] ??
            "Data yang dikirim tidak valid.",

          errors:
            validationErrors.fieldErrors,

          formErrors:
            validationErrors.formErrors,
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * EXTRACT EMAIL
     * ==========================================================
     */

    const {
      email,
    } = parsed.data;

    /**
     * ==========================================================
     * CREATE PASSWORD RESET REQUEST
     * ==========================================================
     *
     * Method ini mengembalikan:
     *
     * PasswordResetRequestResult | null
     *
     * Jika user ditemukan:
     *
     * {
     *   rawToken: string,
     *   user: {
     *     name: string | null,
     *     email: string
     *   }
     * }
     *
     * Jika user tidak ditemukan:
     *
     * null
     */

    const resetRequest =
      await PasswordResetService.createResetRequest(
        email
      );

    /**
     * ==========================================================
     * GENERIC SUCCESS RESPONSE
     * ==========================================================
     *
     * Jangan memberi tahu client apakah email ditemukan.
     *
     * Hal ini mencegah:
     *
     * Email Enumeration Attack
     */

    if (!resetRequest) {
      return NextResponse.json({
        success: true,

        message:
          "Jika email tersebut terdaftar, instruksi untuk mengatur ulang password akan dikirim.",
      });
    }

    /**
     * ==========================================================
     * EXTRACT RESET REQUEST DATA
     * ==========================================================
     */

    const {
      rawToken,
      user,
    } = resetRequest;

    /**
     * ==========================================================
     * BUILD APPLICATION URL
     * ==========================================================
     */

    const appUrl =
      (
        process.env.NEXT_PUBLIC_APP_URL ??
        "http://localhost:3000"
      ).replace(/\/$/, "");

    /**
     * ==========================================================
     * BUILD RESET PASSWORD URL
     * ==========================================================
     */

    const resetUrl =
      `${appUrl}/reset-password?token=${encodeURIComponent(
        rawToken
      )}`;

    /**
     * ==========================================================
     * CREATE PASSWORD RESET EMAIL
     * ==========================================================
     */

    const emailTemplate =
      createPasswordResetEmail({
        userName:
          user.name?.trim() || "Pelanggan",

        resetUrl,
      });

    /**
     * ==========================================================
     * SEND PASSWORD RESET EMAIL
     * ==========================================================
     */

    await EmailService.send({
      to: user.email,

      subject:
        emailTemplate.subject,

      html:
        emailTemplate.html,

      text:
        emailTemplate.text,
    });

    /**
     * ==========================================================
     * SUCCESS RESPONSE
     * ==========================================================
     */

    return NextResponse.json({
      success: true,

      message:
        "Jika email tersebut terdaftar, instruksi untuk mengatur ulang password akan dikirim.",
    });
  } catch (error) {
    /**
     * ==========================================================
     * INTERNAL ERROR
     * ==========================================================
     */

    console.error(
      "[FORGOT_PASSWORD_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Terjadi kesalahan saat memproses permintaan reset password. Silakan coba lagi.",
      },
      {
        status: 500,
      }
    );
  }
}