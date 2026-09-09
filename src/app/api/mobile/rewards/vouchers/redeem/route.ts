import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import {
  redeemRewardVoucher,
} from "@/services/reward-voucher/reward-voucher.service";

/**
 * ============================================================
 * POST /api/mobile/rewards/vouchers/redeem
 * ============================================================
 *
 * Customer menukarkan Reward Point menjadi voucher personal.
 *
 * Business logic tetap berada di:
 * reward-voucher.service.ts
 *
 * Route ini hanya menangani:
 * - authentication
 * - parsing body
 * - validation input
 * - error mapping
 * - response DTO
 *
 * ============================================================
 */

type RedeemRewardVoucherBody = {
  rewardVoucherSettingId: string;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function parseJsonBody(
  request: Request
): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(
  request: Request
) {
  try {
    /**
     * ========================================================
     * 1. AUTHENTICATION
     * ========================================================
     */

    const user =
      await requireMobileAuth(request);

    /**
     * ========================================================
     * 2. PARSE BODY
     * ========================================================
     */

    const rawBody =
      await parseJsonBody(request);

    if (!isRecord(rawBody)) {
      return mobileError(
        "INVALID_BODY",
        "Body request tidak valid.",
        400
      );
    }

    const rewardVoucherSettingId =
      rawBody.rewardVoucherSettingId;

    if (
      typeof rewardVoucherSettingId !==
        "string" ||
      !rewardVoucherSettingId.trim()
    ) {
      return mobileError(
        "INVALID_REWARD_VOUCHER",
        "Reward voucher tidak valid.",
        400
      );
    }

    const body:
      RedeemRewardVoucherBody = {
      rewardVoucherSettingId:
        rewardVoucherSettingId.trim(),
    };

    /**
     * ========================================================
     * 3. REDEEM
     * ========================================================
     *
     * user.id berasal dari access token.
     * User ID dari client tidak pernah dipercaya.
     */

    const result =
      await redeemRewardVoucher(
        user.id,
        body.rewardVoucherSettingId
      );

    /**
     * ========================================================
     * 4. SERIALIZE DTO
     * ========================================================
     *
     * Jangan expose Prisma Decimal / Date secara langsung.
     */

    return mobileSuccess(
      {
        pointsSpent:
          result.pointsSpent,

        remainingPoints:
          result.remainingPoints,

        rewardVoucherSetting: {
          id:
            result.rewardVoucherSetting.id,

          name:
            result.rewardVoucherSetting.name,

          requiredPoints:
            result.rewardVoucherSetting
              .requiredPoints,

          discountType:
            result.rewardVoucherSetting
              .discountType,

          discountValue:
            result.rewardVoucherSetting
              .discountValue.toNumber(),
        },

        voucher: {
          id:
            result.voucher.id,

          code:
            result.voucher.code,

          name:
            result.voucher.name,

          discountType:
            result.voucher.discountType,

          discountValue:
            result.voucher.discountValue.toNumber(),

          minimumPurchase:
            result.voucher.minimumPurchase
              ? result.voucher.minimumPurchase
                  .toNumber()
              : null,

          maximumDiscount:
            result.voucher.maximumDiscount
              ? result.voucher.maximumDiscount
                  .toNumber()
              : null,

          startAt:
            result.voucher.startAt
              ? result.voucher.startAt.toISOString()
              : null,

          endAt:
            result.voucher.endAt
              ? result.voucher.endAt.toISOString()
              : null,
        },

        userVoucher: {
          id:
            result.userVoucher.id,
        },

        transaction: {
          id:
            result.transaction.id,

          type:
            result.transaction.type,

          points:
            result.transaction.points,
        },
      },
      201
    );
  } catch (error) {
    /**
     * ========================================================
     * 5. AUTH ERROR
     * ========================================================
     */

    if (
      error instanceof
      MobileAuthError
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
     * 6. BUSINESS ERROR
     * ========================================================
     */

    if (error instanceof Error) {
      const message =
        error.message;

      if (
        message ===
        "Reward voucher tidak valid."
      ) {
        return mobileError(
          "INVALID_REWARD_VOUCHER",
          message,
          400
        );
      }

      if (
        message ===
        "Reward voucher tidak ditemukan."
      ) {
        return mobileError(
          "REWARD_VOUCHER_NOT_FOUND",
          message,
          404
        );
      }

      if (
        message ===
        "Reward voucher sedang tidak tersedia."
      ) {
        return mobileError(
          "REWARD_VOUCHER_UNAVAILABLE",
          message,
          409
        );
      }

      if (
        message.startsWith(
          "Point tidak mencukupi."
        )
      ) {
        return mobileError(
          "INSUFFICIENT_POINTS",
          message,
          400
        );
      }

      if (
        message ===
          "Customer tidak ditemukan." ||
        message ===
          "User ID tidak valid."
      ) {
        return mobileError(
          "CUSTOMER_NOT_FOUND",
          "Customer tidak ditemukan.",
          404
        );
      }
    }

    /**
     * ========================================================
     * 7. UNEXPECTED ERROR
     * ========================================================
     */

    console.error(
      "[MOBILE_REWARD_VOUCHER_REDEEM]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Gagal menukarkan reward voucher.",
      500
    );
  }
}
