import {
  notFound,
} from "next/navigation";

import {
  requireAdmin,
} from "@/lib/auth/admin";

import {
  AdminRewardCategoryService,
} from "@/services/reward/admin-reward-category.service";

import {
  RewardCategoryForm,
} from "@/components/admin/reward-category/RewardCategoryForm";

/**
 * ============================================================
 * ADMIN REWARD CATEGORY EDIT PAGE
 * ============================================================
 *
 * URL:
 *
 * /admin/reward-categories/[id]/edit
 *
 * ============================================================
 */

type RewardCategoryEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default async function RewardCategoryEditPage({
  params,
}: RewardCategoryEditPageProps) {
  /**
   * ==========================================================
   * AUTHORIZATION
   * ==========================================================
   */

  await requireAdmin();

  /**
   * ==========================================================
   * RESOLVE PARAMS
   * ==========================================================
   */

  const {
    id,
  } = await params;

  /**
   * ==========================================================
   * VALIDATE ID
   * ==========================================================
   */

  const normalizedId =
    String(
      id ?? ""
    ).trim();

  if (!normalizedId) {
    notFound();
  }

  /**
   * ==========================================================
   * GET CATEGORY
   * ==========================================================
   */

  let category;

  try {
    category =
      await AdminRewardCategoryService.getById(
        normalizedId
      );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "Reward category tidak ditemukan."
    ) {
      notFound();
    }

    throw error;
  }

  /**
   * ==========================================================
   * RENDER
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
            Edit Reward Category
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Perbarui nama, slug, urutan,
            atau status category.
          </p>
        </div>
      </div>

      {/* ======================================================
          FORM
      ====================================================== */}

      <RewardCategoryForm
        mode="edit"
        initialData={{
          id:
            category.id,

          name:
            category.name,

          slug:
            category.slug,

          sortOrder:
            category.sortOrder,

          isActive:
            category.isActive,
        }}
      />
    </main>
  );
}
