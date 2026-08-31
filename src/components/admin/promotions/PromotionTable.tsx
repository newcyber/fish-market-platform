import Link from "next/link";

import {
  PromotionStatus,
  PromotionType,
  VoucherDiscountType,
} from "@prisma/client";

export type PromotionTableItem = {
  id: string;
  name: string;
  slug: string;

  type: PromotionType;

  discountType:
    | VoucherDiscountType
    | null;

  discountValue:
    | number
    | null;

  startAt:
    | Date
    | string
    | null;

  endAt:
    | Date
    | string
    | null;

  status: PromotionStatus;

  isFeatured: boolean;

  sortOrder: number;

  itemCount: number;
};

type PromotionTableProps = {
  promotions:
    PromotionTableItem[];
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
  promotion: PromotionTableItem
) {
  if (
    promotion.type ===
    PromotionType.MARKETING
  ) {
    return "Marketing";
  }

  if (
    promotion.discountType ===
    VoucherDiscountType.PERCENTAGE
  ) {
    return `${promotion.discountValue ?? 0}%`;
  }

  if (
    promotion.discountType ===
    VoucherDiscountType.FIXED_AMOUNT
  ) {
    return formatCurrency(
      promotion.discountValue ?? 0
    );
  }

  return "-";
}

function formatDate(
  value:
    | Date
    | string
    | null
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

function getStatusLabel(
  status: PromotionStatus
) {
  switch (status) {
    case PromotionStatus.DRAFT:
      return "Draft";

    case PromotionStatus.SCHEDULED:
      return "Scheduled";

    case PromotionStatus.ACTIVE:
      return "Active";

    case PromotionStatus.ENDED:
      return "Ended";

    case PromotionStatus.CANCELLED:
      return "Cancelled";

    default:
      return status;
  }
}

function getStatusClass(
  status: PromotionStatus
) {
  switch (status) {
    case PromotionStatus.DRAFT:
      return "bg-gray-100 text-gray-700";

    case PromotionStatus.SCHEDULED:
      return "bg-blue-100 text-blue-700";

    case PromotionStatus.ACTIVE:
      return "bg-green-100 text-green-700";

    case PromotionStatus.ENDED:
      return "bg-orange-100 text-orange-700";

    case PromotionStatus.CANCELLED:
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function PromotionTable({
  promotions,
}: PromotionTableProps) {
  if (promotions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-gray-900">
          Promotion tidak ditemukan
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Belum ada promotion yang sesuai
          dengan filter.
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
                Promotion
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tipe
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Diskon
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                SKU
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
            {promotions.map(
              (promotion) => (
                <tr
                  key={
                    promotion.id
                  }
                  className="transition hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">
                        {promotion.name}
                      </span>

                      <span className="mt-0.5 text-xs text-gray-500">
                        /promotions/
                        {promotion.slug}
                      </span>

                      {promotion.isFeatured && (
                        <span className="mt-1 w-fit rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {promotion.type ===
                      PromotionType.MARKETING
                        ? "Marketing"
                        : "Price Discount"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {formatDiscount(
                        promotion
                      )}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {promotion.itemCount}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex flex-col text-gray-600">
                      <span>
                        {formatDate(
                          promotion.startAt
                        )}
                      </span>

                      <span className="text-xs text-gray-400">
                        sampai
                      </span>

                      <span>
                        {formatDate(
                          promotion.endAt
                        )}
                      </span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                        promotion.status
                      )}`}
                    >
                      {getStatusLabel(
                        promotion.status
                      )}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/promotions/${promotion.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Detail
                      </Link>

                      <Link
                        href={`/admin/promotions/${promotion.id}/edit`}
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
