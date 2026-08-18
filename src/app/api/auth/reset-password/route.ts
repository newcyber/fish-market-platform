import { NextResponse } from "next/server";

import { PasswordResetService } from "@/services/auth/password-reset.service";

import { ResetPasswordSchema } from "@/validations/auth/reset-password.schema";

/**
 * ============================================================
 * POST /api/auth/reset-password
 * ============================================================
 *
 * Mengatur password baru menggunakan token reset yang valid.
 *
 * Keamanan:
 *
 * - Request body harus berupa JSON object yang valid.
 * - Token harus valid.
 * - Token tidak boleh expired.
 * - Token hanya dapat digunakan satu kali.
 * - Password baru divalidasi menggunakan Zod.
 * - Password baru di-hash oleh PasswordResetService.
 * - Update password dan konsumsi token dilakukan secara atomic.
 */
export async function POST(request: Request) {
  try {
    /**
     * ==========================================================
     * PARSE REQUEST BODY
     * ==========================================================
     */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Format JSON tidak valid.",
          errors: {},
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * VALIDATE INPUT
     * ==========================================================
     */

    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const validationErrors = parsed.error.flatten();

      console.error(
        "[RESET_PASSWORD_VALIDATION_ERROR]",
        validationErrors
      );

      return NextResponse.json(
        {
          success: false,

          message:
            validationErrors.formErrors[0] ??
            "Data yang dikirim tidak valid.",

          errors: validationErrors.fieldErrors,

          formErrors: validationErrors.formErrors,
        },
        {
          status: 400,
        }
      );
    }

    const { token, password } = parsed.data;

    /**
     * ==========================================================
     * RESET PASSWORD
     * ==========================================================
     *
     * Service akan:
     *
     * 1. Hash token.
     * 2. Mencari token yang valid.
     * 3. Memastikan token belum digunakan.
     * 4. Memastikan token belum expired.
     * 5. Memastikan user masih aktif.
     * 6. Meng-hash password baru.
     * 7. Mengupdate password user.
     * 8. Mengupdate passwordChangedAt.
     * 9. Menandai token sebagai sudah digunakan.
     * 10. Membersihkan token reset lain.
     *
     * Semua proses dilakukan secara atomic transaction.
     */

    const success =
      await PasswordResetService.resetPassword(
        token,
        password
      );

    /**
     * ==========================================================
     * INVALID / EXPIRED / USED TOKEN
     * ==========================================================
     */

    if (!success) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Link reset password tidak valid atau sudah kedaluwarsa.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * SUCCESS RESPONSE
     * ==========================================================
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Password berhasil diperbarui. Silakan login menggunakan password baru Anda.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /**
     * ==========================================================
     * INTERNAL SERVER ERROR
     * ==========================================================
     */

    console.error(
      "[RESET_PASSWORD_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Terjadi kesalahan saat mengatur ulang password. Silakan coba lagi.",
      },
      {
        status: 500,
      }
    );
  }
}