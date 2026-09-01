import Link from "next/link";

import {
  AdminRewardCatalogService,
} from "@/services/reward/admin-reward-catalog.service";

import {
  RewardCatalogTable,
  type RewardCatalogTableItem,
} from "@/components/admin/reward-catalog/RewardCatalogTable";

/**
 * ============================================================
 * ADMIN REWARD CATALOG PAGE
 * ============================================================
 */

export default async function AdminRewardCatalogPage() {
  /**
   * ==========================================================
   * GET REWARD CATALOG
   * ==========================================================
   */

  const rewards =
    await AdminRewardCatalogService.getAll();

  /**
   * ==========================================================
   * MAP DATA FOR TABLE
   * ==========================================================
   *
   * Category berasal dari relation RewardCatalog.category.
   *
   * categoryName digunakan hanya untuk kebutuhan tampilan
   * admin table.
   */

  const rewardCatalogItems:
    RewardCatalogTableItem[] =
    rewards.map(
      (reward) => ({
        id:
          reward.id,

        name:
          reward.name,

        description:
          reward.description,

        image:
          reward.image,

        categoryId:
          reward.categoryId,

        categoryName:
          reward.category?.name ??
          null,

        requiredPoints:
          reward.requiredPoints,

        stock:
          reward.stock,

        isActive:
          reward.isActive,

        sortOrder:
          reward.sortOrder,

        createdAt:
          reward.createdAt,
      })
    );

  /**
   * ==========================================================
   * SUMMARY
   * ==========================================================
   */

  const totalRewards =
    rewardCatalogItems.length;

  const activeRewards =
    rewardCatalogItems.filter(
      (reward) =>
        reward.isActive
    ).length;

  const outOfStockRewards =
    rewardCatalogItems.filter(
      (reward) =>
        reward.stock <= 0
    ).length;

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reward Catalog Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Kelola hadiah fisik yang
            dapat ditukarkan customer
            menggunakan reward point.
          </p>
        </div>

        <Link
          href="/admin/reward-catalog/create"
          className="inline-flex w-fit items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Tambah Reward
        </Link>
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* TOTAL */}

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-500">
            Total Reward
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {
              totalRewards
            }
          </p>
        </div>

        {/* ACTIVE */}

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-500">
            Reward Aktif
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {
              activeRewards
            }
          </p>
        </div>

        {/* OUT OF STOCK */}

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-500">
            Stock Habis
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {
              outOfStockRewards
            }
          </p>
        </div>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <RewardCatalogTable
        rewards={
          rewardCatalogItems
        }
      />
    </div>
  );
}
