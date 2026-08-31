import { NextResponse } from "next/server";

import MobileAuthService from "@/services/auth/mobile-auth.service";

/**
 * ============================================================
 * MOBILE LOGOUT API
 * ============================================================
 *
 * POST /api/mobile/auth/logout
 *
 * Android mengirim refreshToken.
 *
 * Server:
 *   refreshToken
 *        ↓
 *   SHA-256 hash
 *        ↓
 *   MobileSession
 *        ↓
 *   revokedAt
 *
 * Logout hanya mencabut session/device yang memiliki
 * refresh token tersebut.
 *
 * Session mobile pada device lain tetap aktif.
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
     * INVALID INPUT
     * --------------------------------------------------------
     *
     * Untuk logout, kita tidak perlu membedakan apakah
     * token memang ditemukan atau tidak.
     *
     * Response tetap aman dan idempotent.
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
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * REVOKE MOBILE SESSION
     * --------------------------------------------------------
     */

    await MobileAuthService.logout(
      refreshToken
    );

    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        "Logout berhasil.",
    });
  } catch (error) {
    /**
     * --------------------------------------------------------
     * UNEXPECTED ERROR
     * --------------------------------------------------------
     */

    console.error(
      "[MOBILE_LOGOUT_API_ERROR]",
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
