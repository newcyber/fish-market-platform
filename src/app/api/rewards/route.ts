import {
  NextResponse,
} from "next/server";

import {
  RewardCatalogService,
} from "@/services/reward/reward-catalog.service";

/**
 * ============================================================
 * GET /api/rewards
 * ============================================================
 *
 * Customer mengambil daftar reward yang tersedia.
 *
 * Response hanya berisi reward:
 *
 * - isActive = true
 * - stock > 0
 *
 * Endpoint ini TIDAK membutuhkan authentication karena
 * katalog reward merupakan informasi publik/customer-facing.
 *
 * Claim reward tetap membutuhkan authentication melalui:
 *
 * POST /api/rewards/claims
 *
 * ============================================================
 */

export async function GET() {
  try {
    /**
     * ========================================================
     * GET AVAILABLE REWARDS
     * ========================================================
     */

    const rewards =
      await RewardCatalogService.getAvailableRewards();

    /**
     * ========================================================
     * SUCCESS RESPONSE
     * ========================================================
     */

    return NextResponse.json(
      {
        success: true,
        data: rewards,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /**
     * ========================================================
     * ERROR HANDLING
     * ========================================================
     */

    console.error(
      "[GET /api/rewards]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil katalog reward.",
      },
      {
        status: 500,
      }
    );
  }
}
