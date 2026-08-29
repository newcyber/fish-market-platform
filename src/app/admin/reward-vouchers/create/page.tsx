import Link from "next/link";

import {
  RewardVoucherForm,
} from "@/components/admin/reward-vouchers/RewardVoucherForm";

/**
 * ============================================================
 * CREATE REWARD VOUCHER PAGE
 * ============================================================
 */

export default function CreateRewardVoucherPage() {
  return (
    <div className="space-y-6">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Tambah Reward Voucher
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Buat reward voucher baru yang
          dapat ditukarkan customer
          menggunakan point.
        </p>
      </div>

      {/* ======================================================
          FORM
      ====================================================== */}

      <RewardVoucherForm
        mode="create"
      />
    </div>
  );
}