import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import {
  RewardCatalogService,
} from "@/services/reward/reward-catalog.service";

/**
 * ============================================================
 * MOBILE REWARD API
 * ============================================================
 *
 * GET /api/mobile/rewards
 *
 * PUBLIC endpoint.
 *
 * Digunakan oleh aplikasi mobile untuk mengambil katalog
 * reward fisik yang tersedia.
 *
 * Filtering availability dilakukan oleh
 * RewardCatalogService / RewardCatalogRepository:
 *
 * - reward aktif
 * - stock > 0
 * - category aktif
 *
 * ============================================================
 */

export async function GET() {
  try {
    const rewards =
      await RewardCatalogService.getAvailableRewards();

    const items = rewards.map(
      (reward) => ({
        id: reward.id,

        name: reward.name,

        description:
          reward.description,

        image:
          reward.image,

        requiredPoints:
          reward.requiredPoints,

        stock:
          reward.stock,

        sortOrder:
          reward.sortOrder,

        category:
          reward.category
            ? {
                id:
                  reward.category.id,

                name:
                  reward.category.name,

                slug:
                  reward.category.slug,
              }
            : null,
      })
    );

    return mobileSuccess(
      {
        items,
      },
      200
    );
  } catch (error) {
    console.error(
      "[MOBILE_REWARDS_GET]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Gagal mengambil katalog reward.",
      500
    );
  }
}
