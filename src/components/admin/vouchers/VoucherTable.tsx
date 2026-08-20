import Link from "next/link";

import {
  VoucherDiscountType,
} from "@prisma/client";

import {
  VoucherStatusBadge,
} from "./VoucherStatusBadge";

export type VoucherTableItem = {
  id: string;
  code: string;
  name: string;

  discountType: VoucherDiscountType;
  discountValue: number;

  usageLimit: number | null;
  usageCount: number;

  perUserLimit: number | null;

  startAt: Date | string | null;
  endAt: Date | string | null;

  isActive: boolean;
};

type VoucherTableProps = {
  vouchers: VoucherTableItem[];
};

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function formatDiscount(
  voucher: VoucherTableItem
) {
  if (
    voucher.discountType ===
    VoucherDiscountType.PERCENTAGE
  ) {
    return `${voucher.discountValue}%`;
  }

  return formatCurrency(
    voucher.discountValue
  );
}

function formatDate(
  value: Date | string | null
) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(value)
  );
}

function getUsageLabel(
  voucher: VoucherTableItem
) {
  const usageLimit =
    voucher.usageLimit === null
      ? "∞"
      : voucher.usageLimit;

  return `${voucher.usageCount} / ${usageLimit}`;
}

export function VoucherTable({
  vouchers,
}: VoucherTableProps) {
  if (vouchers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-gray-900">
          Voucher tidak ditemukan
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Belum ada voucher yang sesuai dengan filter.
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
                Voucher
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Diskon
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Penggunaan
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Periode
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
            {vouchers.map(
              (voucher) => (
                <tr
                  key={voucher.id}
                  className="transition hover:bg-gray-50"
                >
                  {/* VOUCHER */}

                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">
                        {voucher.code}
                      </span>

                      <span className="mt-0.5 text-sm text-gray-500">
                        {voucher.name}
                      </span>
                    </div>
                  </td>

                  {/* DISCOUNT */}

                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {formatDiscount(
                          voucher
                        )}
                      </span>

                      <span className="text-xs text-gray-500">
                        {voucher.discountType ===
                        VoucherDiscountType.PERCENTAGE
                          ? "Persentase"
                          : "Nominal"}
                      </span>
                    </div>
                  </td>

                  {/* USAGE */}

                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {getUsageLabel(
                          voucher
                        )}
                      </span>

                      {voucher.perUserLimit !==
                        null && (
                        <span className="text-xs text-gray-500">
                          Maks.{" "}
                          {
                            voucher.perUserLimit
                          }{" "}
                          / pengguna
                        </span>
                      )}
                    </div>
                  </td>

                  {/* VALIDITY */}

                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex flex-col text-gray-600">
                      <span>
                        {formatDate(
                          voucher.startAt
                        )}
                      </span>

                      <span className="text-xs text-gray-400">
                        sampai
                      </span>

                      <span>
                        {formatDate(
                          voucher.endAt
                        )}
                      </span>
                    </div>
                  </td>

                  {/* STATUS */}

                  <td className="whitespace-nowrap px-6 py-4">
                    <VoucherStatusBadge
                      isActive={
                        voucher.isActive
                      }
                      usageLimit={
                        voucher.usageLimit
                      }
                      usageCount={
                        voucher.usageCount
                      }
                      startAt={
                        voucher.startAt
                      }
                      endAt={
                        voucher.endAt
                      }
                    />
                  </td>

                  {/* ACTION */}

                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/vouchers/${voucher.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Detail
                      </Link>

                      <Link
                        href={`/admin/vouchers/${voucher.id}/edit`}
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