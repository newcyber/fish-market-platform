"use server";

import { auth } from "@/auth";

import {
  markRewardAsViewed,
} from "@/services/reward-point/reward-point.service";

/**
 * ============================================================
 * MARK REWARD AS VIEWED ACTION
 * ============================================================
 *
 * Client hanya mengirim rewardId.
 *
 * userId TIDAK boleh dipercaya dari client.
 * userId selalu diambil dari authenticated session.
 */
export async function markRewardAsViewedAction(
  rewardId: string
) {
  try {
    /**
     * ========================================================
     * 1. AUTHENTICATION
     * ========================================================
     */

    const session =
      await auth();

    if (!session?.user?.id) {
      return {
        success: false,

        message:
          "Sesi login tidak ditemukan.",
      };
    }

    /**
     * ========================================================
     * 2. VALIDATE REWARD ID
     * ========================================================
     */

    const normalizedRewardId =
      String(rewardId).trim();

    if (!normalizedRewardId) {
      return {
        success: false,

        message:
          "Reward ID tidak valid.",
      };
    }

    /**
     * ========================================================
     * 3. MARK AS VIEWED
     * ========================================================
     */

    const result =
      await markRewardAsViewed(
        normalizedRewardId,
        session.user.id
      );

    return {
      success: true,

      alreadyViewed:
        result.alreadyViewed,
    };
  } catch (error) {
    console.error(
      "[MARK_REWARD_AS_VIEWED_ACTION_ERROR]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Gagal menandai reward sebagai sudah dilihat.",
    };
  }
}