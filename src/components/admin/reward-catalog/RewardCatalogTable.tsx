import Link from "next/link";

import {
  DeleteRewardCatalogButton,
} from "@/components/admin/reward-catalog/DeleteRewardCatalogButton";

export type RewardCatalogTableItem = {
  id: string;

  name: string;

  description: string | null;

  image: string | null;

  requiredPoints: number;

  stock: number;

  isActive: boolean;

  sortOrder: number;

  createdAt: Date | string;
};

type RewardCatalogTableProps = {
  rewards: RewardCatalogTableItem[];
};

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID"
  ).format(value);
}

function formatDate(
  value: Date | string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function getStatusLabel(
  isActive: boolean
) {
  return isActive
    ? "Aktif"
    : "Nonaktif";
}

export function RewardCatalogTable({
  rewards,
}: RewardCatalogTableProps) {
  if (
    rewards.length === 0
  ) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-gray-900">
          Reward catalog belum tersedia
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Belum ada reward fisik
          yang dibuat.
        </p>

        <div className="mt-5">
          <Link
            href="/admin/reward-catalog/create"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Tambah Reward
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Reward
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Point
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Stock
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

          <tbody className="divide-y divide-gray-200 bg-white">
            {rewards.map(
              (reward) => (
                <tr
                  key={reward.id}
                  className="transition hover:bg-gray-50"
                >
                  {/* REWARD */}

                  <td className="px-6 py-4">
                    <div className="flex min-w-60 items-center gap-3">
                      {reward.image ? (
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={reward.image}
                            alt={
                              reward.name
                            }
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium text-gray-400">
                          No Image
                        </div>
                      )}

                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold text-gray-900">
                          {reward.name}
                        </span>

                        {reward.description ? (
                          <span className="mt-0.5 line-clamp-2 max-w-md text-xs text-gray-500">
                            {
                              reward.description
                            }
                          </span>
                        ) : (
                          <span className="mt-0.5 text-xs text-gray-400">
                            Tidak ada
                            deskripsi
                          </span>
                        )}

                        <span className="mt-0.5 text-xs text-gray-400">
                          Dibuat{" "}
                          {formatDate(
                            reward.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* POINT */}

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      {formatNumber(
                        reward.requiredPoints
                      )}
                    </span>

                    <span className="ml-1 text-xs text-gray-500">
                      point
                    </span>
                  </td>

                  {/* STOCK */}

                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span
                        className={
                          reward.stock > 0
                            ? "font-semibold text-gray-900"
                            : "font-semibold text-red-600"
                        }
                      >
                        {formatNumber(
                          reward.stock
                        )}
                      </span>

                      <span
                        className={
                          reward.stock > 0
                            ? "text-xs text-gray-500"
                            : "text-xs font-medium text-red-500"
                        }
                      >
                        {reward.stock >
                        0
                          ? "tersedia"
                          : "habis"}
                      </span>
                    </div>
                  </td>

                  {/* SORT ORDER */}

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700">
                      {
                        reward.sortOrder
                      }
                    </span>
                  </td>

                  {/* STATUS */}

                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={
                        reward.isActive
                          ? "inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                          : "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"
                      }
                    >
                      <span
                        className={
                          reward.isActive
                            ? "mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500"
                            : "mr-1.5 h-1.5 w-1.5 rounded-full bg-gray-400"
                        }
                      />

                      {getStatusLabel(
                        reward.isActive
                      )}
                    </span>
                  </td>

                  {/* ACTION */}

                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/reward-catalog/${reward.id}/edit`}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                    >
                    Edit
                    </Link>

                      <DeleteRewardCatalogButton
                      rewardId={
                      reward.id
                    }
                        rewardName={
                      reward.name
                    }
                      />
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
