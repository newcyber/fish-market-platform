import Link from "next/link";

import {
  AdminRewardVoucherService,
} from "@/services/reward-voucher/admin-reward-voucher.service";

import {
  RewardVoucherTable,
  type RewardVoucherTableItem,
} from "@/components/admin/reward-vouchers/RewardVoucherTable";

import { Plus } from "lucide-react";

/**
 * ============================================================
 * ADMIN REWARD VOUCHERS PAGE
 * ============================================================
 */

export default async function AdminRewardVouchersPage() {
  const rewards =
    await AdminRewardVoucherService.getAll();

  const rewardVoucherItems:
    RewardVoucherTableItem[] =
    rewards.map(
      (reward) => ({
        id: reward.id,

        name: reward.name,

        requiredPoints:
          reward.requiredPoints,

        discountType:
          reward.discountType,

        discountValue:
          Number(
            reward.discountValue
          ),

        minimumPurchase:
          reward.minimumPurchase ===
          null
            ? null
            : Number(
                reward.minimumPurchase
              ),

        maximumDiscount:
          reward.maximumDiscount ===
          null
            ? null
            : Number(
                reward.maximumDiscount
              ),

        isActive:
          reward.isActive,

        sortOrder:
          reward.sortOrder,

        createdAt:
          reward.createdAt,
      })
    );

  return (
    <div className="space-y-6">
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
  <div className="min-w-0">
    <h1 className="text-2xl font-bold text-gray-900">
      Reward Voucher Management
    </h1>

    <p className="mt-1 text-sm text-gray-500">
      Kelola reward voucher yang
      dapat ditukarkan customer
      menggunakan point.
    </p>
  </div>

  <Link
    href="/admin/reward-vouchers/create"
    className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:w-auto"
  >
    <Plus className="h-4 w-4" />
    Buat Reward Voucher
  </Link>
</div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="text-sm text-gray-500">
        Total reward voucher:{" "}
        <span className="font-semibold text-gray-900">
          {rewardVoucherItems.length}
        </span>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <RewardVoucherTable
        rewards={
          rewardVoucherItems
        }
      />
    </div>
  );
}
