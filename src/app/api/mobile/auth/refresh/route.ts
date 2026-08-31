import { NextResponse } from "next/server";

import MobileAuthService from "@/services/auth/mobile-auth.service";

/**
 * ============================================================
 * MOBILE REFRESH TOKEN API
 * ============================================================
 *
 * POST /api/mobile/auth/refresh
 *
 * Digunakan oleh aplikasi Android ketika access token
 * sudah expired atau mendekati expiry.
 *
 * Flow:
 *
 * Android
 *   ↓
 * Refresh Token
 *   ↓
 * MobileAuthService.refresh()
 *   ↓
 * Validate MobileSession
 *   ↓
 * Rotate Refresh Token
 *   ↓
 * New Access Token + Refresh Token
 *
 * ============================================================
 */

export async function POST(
  request: Request
) {
  try {
    /**
     * --------------------------------------------------------
     * PARSE REQUEST
     * --------------------------------------------------------
     */

    const body =
      await request.json();

    const refreshToken =
      typeof body?.refreshToken === "string"
        ? body.refreshToken.trim()
        : "";

    /**
     * --------------------------------------------------------
     * VALIDATE REFRESH TOKEN
     * --------------------------------------------------------
     */

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,

          code:
            "INVALID_REFRESH_TOKEN",

          message:
            "Refresh token tidak valid.",
        },
        {
          status: 401,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * REFRESH SESSION
     * --------------------------------------------------------
     */

    const result =
      await MobileAuthService.refresh(
        refreshToken
      );

    /**
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     *
     * Hanya expose data yang memang diperlukan Android.
     *
     * Jangan pernah expose:
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
     * --------------------------------------------------------
     * EXPECTED AUTH ERRORS
     * --------------------------------------------------------
     */

    if (
      error instanceof Error
    ) {
      switch (error.message) {
        /**
         * ----------------------------------------------------
         * INVALID REFRESH TOKEN
         * ----------------------------------------------------
         */

        case "INVALID_REFRESH_TOKEN":
          return NextResponse.json(
            {
              success: false,

              code:
                "INVALID_REFRESH_TOKEN",

              message:
                "Refresh token tidak valid.",
            },
            {
              status: 401,
            }
          );

        /**
         * ----------------------------------------------------
         * REFRESH TOKEN REVOKED
         * ----------------------------------------------------
         *
         * Terjadi ketika:
         *
         * - user logout
         * - refresh token sudah pernah digunakan
         * - concurrent refresh request kalah race
         */

        case "REFRESH_TOKEN_REVOKED":
          return NextResponse.json(
            {
              success: false,

              code:
                "REFRESH_TOKEN_REVOKED",

              message:
                "Session aplikasi sudah tidak berlaku. Silakan login kembali.",
            },
            {
              status: 401,
            }
          );

        /**
         * ----------------------------------------------------
         * REFRESH TOKEN EXPIRED
         * ----------------------------------------------------
         */

        case "REFRESH_TOKEN_EXPIRED":
          return NextResponse.json(
            {
              success: false,

              code:
                "REFRESH_TOKEN_EXPIRED",

              message:
                "Session aplikasi sudah kedaluwarsa. Silakan login kembali.",
            },
            {
              status: 401,
            }
          );

        /**
         * ----------------------------------------------------
         * ACCOUNT INACTIVE
         * ----------------------------------------------------
         *
         * User:
         *
         * - disabled
         * - soft deleted
         */

        case "ACCOUNT_INACTIVE":
          return NextResponse.json(
            {
              success: false,

              code:
                "ACCOUNT_INACTIVE",

              message:
                "Akun Anda tidak dapat digunakan.",
            },
            {
              status: 403,
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
         * PASSWORD CHANGED
         * ----------------------------------------------------
         *
         * Compatibility mapping.
         *
         * Saat ini MobileAuthService.refresh()
         * menggunakan SESSION_INVALIDATED.
         */

        case "PASSWORD_CHANGED":
          return NextResponse.json(
            {
              success: false,

              code:
                "PASSWORD_CHANGED",

              message:
                "Password telah berubah. Silakan login kembali.",
            },
            {
              status: 401,
            }
          );

        /**
         * ----------------------------------------------------
         * SESSION INVALIDATED
         * ----------------------------------------------------
         *
         * Terjadi ketika password user berubah setelah
         * MobileSession dibuat.
         *
         * MobileSession kemudian direvoke oleh service.
         */

        case "SESSION_INVALIDATED":
          return NextResponse.json(
            {
              success: false,

              code:
                "SESSION_INVALIDATED",

              message:
                "Sesi aplikasi tidak berlaku karena password telah diubah. Silakan login kembali.",
            },
            {
              status: 401,
            }
          );
      }
    }

    /**
     * --------------------------------------------------------
     * UNEXPECTED ERROR
     * --------------------------------------------------------
     */

    console.error(
      "[MOBILE_REFRESH_API_ERROR]",
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
