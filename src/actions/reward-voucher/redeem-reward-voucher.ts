"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  redeemRewardVoucher,
} from "@/services/reward-voucher/reward-voucher.service";

/**
 * ============================================================
 * REDEEM REWARD VOUCHER ACTION
 * ============================================================
 *
 * Customer hanya mengirim rewardVoucherSettingId.
 *
 * userId TIDAK boleh berasal dari client.
 * User ID selalu diambil dari authenticated session.
 * ============================================================
 */

export async function redeemRewardVoucherAction(
  rewardVoucherSettingId: string
) {
  try {
    /**
     * ==========================================================
     * AUTHENTICATION
     * ==========================================================
     */

    const session =
      await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Silakan login terlebih dahulu.",
      };
    }

    /**
     * ==========================================================
     * REWARD VOUCHER ID VALIDATION
     * ==========================================================
     */

    const normalizedSettingId =
      typeof rewardVoucherSettingId ===
      "string"
        ? rewardVoucherSettingId.trim()
        : "";

    if (!normalizedSettingId) {
      return {
        success: false,
        message:
          "Reward voucher tidak valid.",
      };
    }

    /**
     * ==========================================================
     * REDEEM
     * ==========================================================
     *
     * Business validation dan atomic transaction
     * dilakukan oleh service.
     */

    const result =
      await redeemRewardVoucher(
        session.user.id,
        normalizedSettingId
      );

    /**
     * ==========================================================
     * REVALIDATE CUSTOMER DATA
     * ==========================================================
     */

    revalidatePath("/customer/account");

    return {
      success: true,
      message:
        "Reward voucher berhasil ditukarkan.",
      data: result,
    };
  } catch (error) {
    console.error(
      "[REDEEM_REWARD_VOUCHER_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menukarkan reward voucher.",
    };
  }
}