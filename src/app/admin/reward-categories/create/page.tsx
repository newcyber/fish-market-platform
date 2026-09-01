import Link from "next/link";

import {
  requireAdmin,
} from "@/lib/auth/admin";

import {
  RewardCategoryForm,
} from "@/components/admin/reward-category/RewardCategoryForm";

/**
 * ============================================================
 * CREATE REWARD CATEGORY PAGE
 * ============================================================
 */

export default async function CreateRewardCategoryPage() {
  /**
   * ==========================================================
   * AUTHORIZATION
   * ==========================================================
   */

  await requireAdmin();

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <main className="space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 text-sm text-gray-500">
            Reward Category
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Tambah Reward Category
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Tambahkan category baru untuk
            mengelompokkan Reward Catalog.
          </p>
        </div>

        <Link
          href="/admin/reward-categories"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Kembali
        </Link>
      </div>

      {/* ======================================================
          FORM
      ====================================================== */}

      <RewardCategoryForm
        mode="create"
      />
    </main>
  );
}
