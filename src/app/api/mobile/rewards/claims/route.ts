import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import {
  getCustomerRewardClaims,
} from "@/services/reward/reward-claim.service";

/**
 * ============================================================
 * GET /api/mobile/rewards/claims
 * ============================================================
 *
 * Mengambil histori claim reward milik customer yang sedang
 * authenticated melalui Mobile Access Token.
 *
 * SECURITY:
 *
 * userId tidak diterima dari client.
 *
 * userId selalu berasal dari:
 *
 * requireMobileAuth(request)
 *
 * ============================================================
 */

export async function GET(
  request: Request
) {
  try {
    /**
     * ========================================================
     * 1. MOBILE AUTHENTICATION
     * ========================================================
     */

    const user =
      await requireMobileAuth(
        request
      );

    /**
     * ========================================================
     * 2. GET CUSTOMER CLAIMS
     * ========================================================
     */

    const claims =
      await getCustomerRewardClaims(
        user.id
      );

    /**
     * ========================================================
     * 3. MAP TO MOBILE RESPONSE
     * ========================================================
     */

    const items =
      claims.map((claim) => ({
        id:
          claim.id,

        reward: {
          id:
            claim.rewardCatalog.id,

          name:
            claim.rewardName ??
            claim.rewardCatalog.name,

          description:
            claim.rewardDescription,

          image:
            claim.rewardImage ??
            claim.rewardCatalog.image,
        },

        pointsSpent:
          claim.pointsSpent,

        status:
          claim.status,

        rejectionReason:
          claim.rejectionReason,

        refundedAt:
          claim.refundedAt
            ? claim.refundedAt.toISOString()
            : null,

        approvedAt:
          claim.approvedAt
            ? claim.approvedAt.toISOString()
            : null,

        shippedAt:
          claim.shippedAt
            ? claim.shippedAt.toISOString()
            : null,

        completedAt:
          claim.completedAt
            ? claim.completedAt.toISOString()
            : null,

        shippingAddress: {
          receiverName:
            claim.receiverName,

          receiverPhone:
            claim.receiverPhone,

          province:
            claim.province,

          city:
            claim.city,

          district:
            claim.district,

          village:
            claim.village,

          postalCode:
            claim.postalCode,

          fullAddress:
            claim.fullAddress,

          latitude:
            claim.latitude,

          longitude:
            claim.longitude,
        },

        createdAt:
          claim.createdAt.toISOString(),
      }));

    /**
     * ========================================================
     * 4. SUCCESS
     * ========================================================
     */

    return mobileSuccess(
      {
        items,
      },
      200
    );
  } catch (error) {
    /**
     * ========================================================
     * 5. MOBILE AUTH ERROR
     * ========================================================
     */

    if (
      error instanceof MobileAuthError
    ) {
      switch (error.code) {
        case "MISSING_AUTHORIZATION":
        case "INVALID_AUTHORIZATION":
        case "INVALID_ACCESS_TOKEN":
          return mobileError(
            error.code,
            error.message,
            401
          );

        case "ACCOUNT_INACTIVE":
        case "EMAIL_NOT_VERIFIED":
          return mobileError(
            error.code,
            error.message,
            403
          );

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
     * 6. UNEXPECTED ERROR
     * ========================================================
     */

    console.error(
      "[MOBILE_REWARD_CLAIMS_GET]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Gagal mengambil riwayat claim reward.",
      500
    );
  }
}
