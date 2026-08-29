import { notFound } from "next/navigation";

import { RewardVoucherForm } from "@/components/admin/reward-vouchers/RewardVoucherForm";
import { AdminRewardVoucherService } from "@/services/reward-voucher/admin-reward-voucher.service";

/**
 * ============================================================
 * EDIT REWARD VOUCHER PAGE
 * ============================================================
 */

type EditRewardVoucherPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditRewardVoucherPage({
  params,
}: EditRewardVoucherPageProps) {
  const { id } = await params;

  let rewardVoucher;

  try {
    rewardVoucher =
      await AdminRewardVoucherService.getById(
        id
      );
  } catch (error) {
    console.error(
      "[ADMIN_EDIT_REWARD_VOUCHER_PAGE_ERROR]",
      error
    );

    notFound();
  }

  return (
    <div className="space-y-6">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Reward Voucher
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Perbarui informasi dan pengaturan
          reward voucher.
        </p>
      </div>

      {/* ====================================================
          FORM
      ==================================================== */}

      <RewardVoucherForm
        mode="edit"
        initialData={{
          id:
            rewardVoucher.id,

          name:
            rewardVoucher.name,

          requiredPoints:
            rewardVoucher.requiredPoints,

          discountType:
            rewardVoucher.discountType,

          discountValue:
            rewardVoucher.discountValue.toNumber(),

          minimumPurchase:
            rewardVoucher.minimumPurchase
              ?.toNumber() ?? null,

          maximumDiscount:
            rewardVoucher.maximumDiscount
              ?.toNumber() ?? null,

          sortOrder:
            rewardVoucher.sortOrder,

          isActive:
            rewardVoucher.isActive,
        }}
      />
    </div>
  );
}