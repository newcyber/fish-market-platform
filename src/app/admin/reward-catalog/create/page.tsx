import Link from "next/link";

import {
  RewardCatalogForm,
} from "@/components/admin/reward-catalog/RewardCatalogForm";

/**
 * ============================================================
 * CREATE REWARD CATALOG PAGE
 * ============================================================
 */

export default function CreateRewardCatalogPage() {
  return (
    <main className="space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Tambah Reward
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Tambahkan hadiah baru ke dalam
            katalog reward.
          </p>
        </div>

        <Link
          href="/admin/reward-catalog"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Kembali
        </Link>
      </div>

      {/* ======================================================
          FORM
      ====================================================== */}

      <RewardCatalogForm
        mode="create"
      />
    </main>
  );
}
