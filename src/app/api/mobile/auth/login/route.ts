import { NextResponse } from "next/server";

import MobileAuthService from "@/services/auth/mobile-auth.service";

/**
 * ============================================================
 * MOBILE LOGIN API
 * ============================================================
 *
 * POST /api/mobile/auth/login
 *
 * Digunakan oleh aplikasi Android.
 *
 * Flow:
 *
 * Android
 *   ↓
 * Login API
 *   ↓
 * MobileAuthService
 *   ↓
 * UserRepository
 *   ↓
 * Password verification
 *   ↓
 * MobileSession
 *   ↓
 * Access Token + Refresh Token
 *
 * ============================================================
 */

export async function POST(
  request: Request
) {
  /**
   * ==========================================================
   * PARSE REQUEST
   * ==========================================================
   */

  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,

        message:
          "Format request tidak valid.",
      },
      {
        status: 400,
      }
    );
  }

  /**
   * ==========================================================
   * EXTRACT INPUT
   * ==========================================================
   *
   * Jangan mempercayai bentuk payload dari client.
   *
   * Validasi final tetap dilakukan oleh
   * MobileAuthService melalui LoginSchema.
   */

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof body.email === "string"
      ? body.email
      : "";

  const password =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof body.password === "string"
      ? body.password
      : "";

  /**
   * ==========================================================
   * AUTHENTICATE
   * ==========================================================
   */

  try {
    const result =
      await MobileAuthService.login({
        email,
        password,
      });

    /**
     * ========================================================
     * SUCCESS RESPONSE
     * ========================================================
     *
     * Jangan pernah mengembalikan:
     *
     * - password
     * - password hash
     * - refreshTokenHash
     * - MobileSession
     * - database internal information
     */

    return NextResponse.json({
      success: true,

      data: {
        user: result.user,

        accessToken:
          result.accessToken,

        refreshToken:
          result.refreshToken,

        refreshTokenExpiresAt:
          result.refreshTokenExpiresAt,
      },
    });
  } catch (error) {
    /**
     * ========================================================
     * EXPECTED AUTH ERRORS
     * ========================================================
     */

    if (
      error instanceof Error
    ) {
      switch (error.message) {
        /**
         * ----------------------------------------------------
         * INVALID INPUT
         * ----------------------------------------------------
         */

        case "INVALID_LOGIN_INPUT":
          return NextResponse.json(
            {
              success: false,

              message:
                "Data login tidak valid.",
            },
            {
              status: 400,
            }
          );

        /**
         * ----------------------------------------------------
         * EMAIL NOT VERIFIED
         * ----------------------------------------------------
         */

        case "EMAIL_NOT_VERIFIED":
          return NextResponse.json(
            {
              success: false,

              code:
                "EMAIL_NOT_VERIFIED",

              message:
                "Email Anda belum diverifikasi.",
            },
            {
              status: 403,
            }
          );

        /**
         * ----------------------------------------------------
         * INVALID CREDENTIALS
         * ----------------------------------------------------
         */

        case "INVALID_CREDENTIALS":
          return NextResponse.json(
            {
              success: false,

              message:
                "Email atau password salah.",
            },
            {
              status: 401,
            }
          );
      }
    }

    /**
     * ========================================================
     * UNEXPECTED ERROR
     * ========================================================
     */

    console.error(
      "[MOBILE_LOGIN_API_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Terjadi kesalahan pada server.",
      },
      {
        status: 500,
      }
    );
  }
}
