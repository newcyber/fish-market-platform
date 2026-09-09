import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import {
  getAvailableRewardVouchers,
} from "@/services/reward-voucher/reward-voucher.service";

/**
 * ============================================================
 * GET /api/mobile/rewards/vouchers
 * ============================================================
 *
 * Mengambil katalog Reward Voucher yang sedang aktif.
 *
 * Endpoint ini bersifat public karena katalog reward voucher
 * tidak mengandung data personal customer.
 *
 * ============================================================
 */

export async function GET() {
  try {
    /**
     * ========================================================
     * 1. GET ACTIVE REWARD VOUCHERS
     * ========================================================
     */

    const rewards =
      await getAvailableRewardVouchers();

    /**
     * ========================================================
     * 2. MAP TO MOBILE DTO
     * ========================================================
     *
     * Prisma Decimal dikonversi menjadi number agar kontrak
     * API mobile tidak bergantung pada tipe Prisma.
     */

    const items =
      rewards.map((reward) => ({
        id:
          reward.id,

        name:
          reward.name,

        requiredPoints:
          reward.requiredPoints,

        discountType:
          reward.discountType,

        discountValue:
          reward.discountValue.toNumber(),

        minimumPurchase:
          reward.minimumPurchase
            ? reward.minimumPurchase.toNumber()
            : null,

        maximumDiscount:
          reward.maximumDiscount
            ? reward.maximumDiscount.toNumber()
            : null,

        sortOrder:
          reward.sortOrder,
      }));

    /**
     * ========================================================
     * 3. SUCCESS
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
     * 4. UNEXPECTED ERROR
     * ========================================================
     */

    console.error(
      "[MOBILE_REWARD_VOUCHERS_GET]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Gagal mengambil katalog reward voucher.",
      500
    );
  }
}
