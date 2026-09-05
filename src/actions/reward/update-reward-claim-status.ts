"use server";

import {
  RewardClaimStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";

import {
  updateRewardClaimStatus,
} from "@/services/reward/reward-claim.service";

export async function updateRewardClaimStatusAction(
  claimId: string,
  status: RewardClaimStatus,
  rejectionReason?: string
) {
  try {
    await requireAdmin();

    const normalizedClaimId =
      String(claimId ?? "").trim();

    if (!normalizedClaimId) {
      return {
        success: false,
        message:
          "Claim ID wajib diisi.",
      };
    }

    if (!status) {
      return {
        success: false,
        message:
          "Status reward claim wajib diisi.",
      };
    }

    const normalizedReason =
      String(
        rejectionReason ?? ""
      ).trim();

    if (
      status ===
        RewardClaimStatus.REJECTED &&
      !normalizedReason
    ) {
      return {
        success: false,
        message:
          "Alasan penolakan wajib diisi.",
      };
    }

    const result =
      await updateRewardClaimStatus(
        normalizedClaimId,
        status,
        status ===
          RewardClaimStatus.REJECTED
          ? normalizedReason
          : undefined
      );

    if (!result.success) {
      return {
        success: false,
        message:
          "Gagal memperbarui reward claim.",
      };
    }

    revalidatePath(
      "/admin/reward-claims"
    );

    revalidatePath(
      `/admin/reward-claims/${normalizedClaimId}`
    );

    return {
      success: true,
      message:
        result.idempotent
          ? "Status reward claim sudah berada pada status tersebut."
          : "Status reward claim berhasil diperbarui.",
      data: {
        id: result.claim.id,
        status: result.claim.status,
      },
      refund: result.refund,
    };
  } catch (error) {
    console.error(
      "[UPDATE_REWARD_CLAIM_STATUS_ACTION]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memperbarui reward claim.",
    };
  }
}
