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
 * - Reset URL menggunakan APP_URL sebagai canonical
 *   application URL server-side.
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
     *
     * APP_URL adalah canonical URL aplikasi untuk kebutuhan
     * server-side seperti:
     *
     * - Password reset email
     * - Email verification
     * - Notification links
     * - System-generated links
     *
     * Jangan menggunakan request URL sebagai sumber utama karena
     * request dapat datang melalui proxy/reverse proxy.
     */

    const configuredAppUrl =
      process.env.APP_URL?.trim();

    if (!configuredAppUrl) {
      console.error(
        "[FORGOT_PASSWORD_CONFIG_ERROR] APP_URL is not configured."
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Terjadi kesalahan konfigurasi server. Silakan coba lagi.",
        },
        {
          status: 500,
        }
      );
    }

    const appUrl =
      configuredAppUrl.replace(
        /\/$/,
        ""
      );

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
          user.name?.trim() ||
          "Pelanggan",

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
