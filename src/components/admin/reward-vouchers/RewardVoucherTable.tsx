import Link from "next/link";

import {
  VoucherDiscountType,
} from "@prisma/client";

export type RewardVoucherTableItem = {
  id: string;
  name: string;

  requiredPoints: number;

  discountType: VoucherDiscountType;
  discountValue: number | string;

  minimumPurchase: number | string | null;
  maximumDiscount: number | string | null;

  isActive: boolean;
  sortOrder: number;

  createdAt: Date | string;
};

type RewardVoucherTableProps = {
  rewards: RewardVoucherTableItem[];
};

function toNumber(value: number | string): number {
  const result = Number(value);

  return Number.isFinite(result)
    ? result
    : 0;
}

function formatCurrency(
  value: number | string
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(toNumber(value));
}

function formatDiscount(
  reward: RewardVoucherTableItem
) {
  if (
    reward.discountType ===
    VoucherDiscountType.PERCENTAGE
  ) {
    return `${toNumber(
      reward.discountValue
    )}%`;
  }

  return formatCurrency(
    reward.discountValue
  );
}

function formatDate(
  value: Date | string
) {
  const date = new Date(value);

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

export function RewardVoucherTable({
  rewards,
}: RewardVoucherTableProps) {
  if (rewards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-gray-900">
          Reward voucher belum tersedia
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Belum ada konfigurasi reward
          voucher yang dibuat.
        </p>
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
                Benefit
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Minimum Pembelian
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Maximum Diskon
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
                    <div className="flex min-w-45 flex-col">
                      <span className="font-semibold text-gray-900">
                        {reward.name}
                      </span>

                      <span className="mt-0.5 text-xs text-gray-400">
                        Dibuat{" "}
                        {formatDate(
                          reward.createdAt
                        )}
                      </span>
                    </div>
                  </td>

                  {/* POINT */}

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      {new Intl.NumberFormat(
                        "id-ID"
                      ).format(
                        reward.requiredPoints
                      )}
                    </span>

                    <span className="ml-1 text-xs text-gray-500">
                      point
                    </span>
                  </td>

                  {/* BENEFIT */}

                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {formatDiscount(
                          reward
                        )}
                      </span>

                      <span className="text-xs text-gray-500">
                        {reward.discountType ===
                        VoucherDiscountType.PERCENTAGE
                          ? "Persentase"
                          : "Nominal"}
                      </span>
                    </div>
                  </td>

                  {/* MINIMUM PURCHASE */}

                  <td className="whitespace-nowrap px-6 py-4">
                    {reward.minimumPurchase ===
                    null ? (
                      <span className="text-sm text-gray-400">
                        -
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(
                          reward.minimumPurchase
                        )}
                      </span>
                    )}
                  </td>

                  {/* MAXIMUM DISCOUNT */}

                  <td className="whitespace-nowrap px-6 py-4">
                    {reward.maximumDiscount ===
                    null ? (
                      <span className="text-sm text-gray-400">
                        -
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(
                          reward.maximumDiscount
                        )}
                      </span>
                    )}
                  </td>

                  {/* SORT ORDER */}

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700">
                      {reward.sortOrder}
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
                        href={`/admin/reward-vouchers/${reward.id}/edit`}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                      >
                        Edit
                      </Link>
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