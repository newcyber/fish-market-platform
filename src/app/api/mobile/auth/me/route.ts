import { NextResponse } from "next/server";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

/**
 * ============================================================
 * MOBILE CURRENT USER API
 * ============================================================
 *
 * GET /api/mobile/auth/me
 *
 * Mengembalikan user yang sedang terautentikasi
 * berdasarkan Mobile Access Token.
 *
 * ============================================================
 */

export async function GET(
  request: Request
) {
  try {
    const user =
      await requireMobileAuth(
        request
      );

    return NextResponse.json({
      success: true,

      data: {
        user,
      },
    });
  } catch (error) {
    /**
     * ========================================================
     * EXPECTED MOBILE AUTH ERRORS
     * ========================================================
     */

    if (
      error instanceof MobileAuthError
    ) {
      switch (error.code) {
        /**
         * ----------------------------------------------------
         * INVALID AUTHORIZATION / ACCESS TOKEN
         * ----------------------------------------------------
         */

        case "MISSING_AUTHORIZATION":
        case "INVALID_AUTHORIZATION":
        case "INVALID_ACCESS_TOKEN":
          return NextResponse.json(
            {
              success: false,

              code:
                error.code,

              message:
                error.message,
            },
            {
              status: 401,
            }
          );

        /**
         * ----------------------------------------------------
         * ACCOUNT INACTIVE
         * ----------------------------------------------------
         */

        case "ACCOUNT_INACTIVE":
          return NextResponse.json(
            {
              success: false,

              code:
                error.code,

              message:
                error.message,
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
                error.code,

              message:
                error.message,
            },
            {
              status: 403,
            }
          );

        /**
         * ----------------------------------------------------
         * SESSION INVALIDATED
         * ----------------------------------------------------
         *
         * Terjadi ketika password berubah setelah access token
         * diterbitkan.
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
     * ========================================================
     * UNEXPECTED ERROR
     * ========================================================
     */

    console.error(
      "[MOBILE_ME_API_ERROR]",
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
