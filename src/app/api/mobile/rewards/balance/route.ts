import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import {
  getCustomerRewardPointBalance,
} from "@/services/reward-voucher/reward-voucher.service";

/**
 * ============================================================
 * MOBILE REWARD POINT BALANCE API
 * ============================================================
 *
 * GET /api/mobile/rewards/balance
 *
 * PRIVATE endpoint.
 *
 * Saldo point hanya boleh diambil dari customer yang sedang
 * ter-authenticated melalui Mobile Access Token.
 *
 * userId TIDAK pernah diterima dari query parameter atau
 * request body.
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

    const balance =
      await getCustomerRewardPointBalance(
        user.id
      );

    return mobileSuccess(
      {
        balance,
      },
      200
    );
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
          return mobileError(
            error.code,
            error.message,
            401
          );

        /**
         * ----------------------------------------------------
         * ACCOUNT INACTIVE
         * ----------------------------------------------------
         */

        case "ACCOUNT_INACTIVE":
        case "EMAIL_NOT_VERIFIED":
          return mobileError(
            error.code,
            error.message,
            403
          );

        /**
         * ----------------------------------------------------
         * SESSION INVALIDATED
         * ----------------------------------------------------
         */

        case "SESSION_INVALIDATED":
          return mobileError(
            "SESSION_INVALIDATED",
            "Sesi aplikasi tidak berlaku karena password telah diubah. Silakan login kembali.",
            401
          );
      }
    }

    /**
     * ========================================================
     * UNEXPECTED ERROR
     * ========================================================
     */

    console.error(
      "[MOBILE_REWARD_BALANCE_GET]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Gagal mengambil saldo reward point.",
      500
    );
  }
}
