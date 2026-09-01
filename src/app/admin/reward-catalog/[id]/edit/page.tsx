import {
  notFound,
} from "next/navigation";

import {
  requireAdmin,
} from "@/lib/auth/admin";

import {
  AdminRewardCatalogService,
} from "@/services/reward/admin-reward-catalog.service";

import {
  RewardCatalogForm,
} from "@/components/admin/reward-catalog/RewardCatalogForm";

/**
 * ============================================================
 * ADMIN REWARD CATALOG EDIT PAGE
 * ============================================================
 *
 * URL:
 *
 * /admin/reward-catalog/[id]/edit
 *
 * Tanggung jawab:
 *
 * - memastikan admin memiliki akses
 * - mengambil reward berdasarkan ID
 * - menampilkan form dalam mode edit
 *
 * Business logic tetap berada di service.
 * ============================================================
 */

type RewardCatalogEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default async function RewardCatalogEditPage({
  params,
}: RewardCatalogEditPageProps) {
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
   *
   * Next.js App Router versi modern menggunakan
   * async params.
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
   * GET REWARD
   * ==========================================================
   */

  let reward;

  try {
    reward =
      await AdminRewardCatalogService.getById(
        normalizedId
      );
  } catch (error) {
    /**
     * Reward tidak ditemukan.
     *
     * Service memang melempar error ketika
     * reward tidak tersedia.
     */

    if (
      error instanceof Error &&
      error.message ===
        "Reward tidak ditemukan."
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
    <div className="space-y-6">
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div>
        <div className="mb-1 text-sm text-gray-500">
          Reward Catalog
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Edit Reward
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Perbarui informasi hadiah,
          gambar, point, stock, dan
          status reward.
        </p>
      </div>

      {/* ======================================================
          FORM
      ====================================================== */}

      <RewardCatalogForm
        mode="edit"
        initialData={{
          id:
            reward.id,

          name:
            reward.name,

          description:
            reward.description,

          image:
            reward.image,

          requiredPoints:
            reward.requiredPoints,

          stock:
            reward.stock,

          sortOrder:
            reward.sortOrder,

          isActive:
            reward.isActive,
        }}
      />
    </div>
  );
}
