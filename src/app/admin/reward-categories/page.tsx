import Link from "next/link";

import {
  AdminRewardCategoryService,
} from "@/services/reward/admin-reward-category.service";

/**
 * ============================================================
 * ADMIN REWARD CATEGORY PAGE
 * ============================================================
 */

export default async function AdminRewardCategoriesPage() {
  const categories =
    await AdminRewardCategoryService.getAll();

  const categoriesWithRewardCount =
    await Promise.all(
      categories.map(
        async (category) => ({
          ...category,

          rewardCount:
            await AdminRewardCategoryService.getRewardCount(
              category.id
            ),
        })
      )
    );

  const totalCategories =
    categoriesWithRewardCount.length;

  const activeCategories =
    categoriesWithRewardCount.filter(
      (category) =>
        category.isActive
    ).length;

  const inactiveCategories =
    totalCategories -
    activeCategories;

  return (
    <div className="space-y-6">
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reward Category Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Kelola kategori hadiah yang
            digunakan pada Reward Catalog.
          </p>
        </div>

        <Link
          href="/admin/reward-categories/create"
          className="inline-flex w-fit items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Tambah Category
        </Link>
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-500">
            Total Category
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {totalCategories}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-500">
            Category Aktif
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {activeCategories}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-500">
            Category Nonaktif
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {inactiveCategories}
          </p>
        </div>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Category
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Slug
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Reward
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Urutan
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {categoriesWithRewardCount.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      Belum ada reward category
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Buat category pertama untuk
                      mengelompokkan reward.
                    </p>
                  </td>
                </tr>
              ) : (
                categoriesWithRewardCount.map(
                  (category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {category.name}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {category.slug}
                        </code>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {category.rewardCount}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex min-w-8 justify-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          {category.sortOrder}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            category.isActive
                              ? "inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                              : "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                          }
                        >
                          <span
                            className={
                              category.isActive
                                ? "mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500"
                                : "mr-1.5 h-1.5 w-1.5 rounded-full bg-gray-400"
                            }
                          />

                          {category.isActive
                            ? "Aktif"
                            : "Nonaktif"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Link
                          href={`/admin/reward-categories/${category.id}/edit`}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
