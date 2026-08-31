import Link from "next/link";

import {
  PromotionStatus,
} from "@prisma/client";

import PromotionService from "@/services/promotion/promotion.service";

import {
  PromotionTable,
  type PromotionTableItem,
} from "@/components/admin/promotions/PromotionTable";

type AdminPromotionsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
};

function parsePage(
  value?: string
): number {
  if (!value) {
    return 1;
  }

  const page = Number(value);

  if (
    !Number.isInteger(page) ||
    page < 1
  ) {
    return 1;
  }

  return page;
}

function parseStatus(
  value?: string
): PromotionStatus | undefined {
  if (!value) {
    return undefined;
  }

  if (
    Object.values(PromotionStatus).includes(
      value as PromotionStatus
    )
  ) {
    return value as PromotionStatus;
  }

  return undefined;
}

export default async function AdminPromotionsPage({
  searchParams,
}: AdminPromotionsPageProps) {
  const params =
    await searchParams;

  const page =
    parsePage(params.page);

  const status =
    parseStatus(params.status);

  const limit = 20;

  const result =
    await PromotionService.getMany({
      search:
        params.search?.trim() ||
        undefined,

      status,

      skip:
        (page - 1) * limit,

      take:
        limit,
    });

  const promotions:
    PromotionTableItem[] =
    result.items.map(
      (promotion) => ({
        id: promotion.id,

        name:
          promotion.name,

        slug:
          promotion.slug,

        type:
          promotion.type,

        discountType:
          promotion.discountType,

        discountValue:
          promotion.discountValue
            ? Number(
                promotion.discountValue
              )
            : null,

        startAt:
          promotion.startAt,

        endAt:
          promotion.endAt,

        status:
          promotion.status,

        isFeatured:
          promotion.isFeatured,

        sortOrder:
          promotion.sortOrder,

        itemCount:
          promotion.items.length,
      })
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        result.total / limit
      )
    );

  return (
    <div className="space-y-6">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Promotion Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Kelola promotion, diskon, periode,
            dan produk yang mengikuti promotion.
          </p>
        </div>

        <Link
          href="/admin/promotions/create"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          + Buat Promotion
        </Link>
      </div>

      {/* ====================================================
          FILTER
      ==================================================== */}

      <form
        method="GET"
        className="rounded-xl border border-gray-200 bg-white p-4"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <input
            type="search"
            name="search"
            defaultValue={
              params.search ?? ""
            }
            placeholder="Cari nama atau slug promotion..."
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <select
            name="status"
            defaultValue={
              params.status ?? ""
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">
              Semua Status
            </option>

            <option
              value={
                PromotionStatus.DRAFT
              }
            >
              Draft
            </option>

            <option
              value={
                PromotionStatus.SCHEDULED
              }
            >
              Scheduled
            </option>

            <option
              value={
                PromotionStatus.ACTIVE
              }
            >
              Active
            </option>

            <option
              value={
                PromotionStatus.ENDED
              }
            >
              Ended
            </option>

            <option
              value={
                PromotionStatus.CANCELLED
              }
            >
              Cancelled
            </option>
          </select>

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Filter
          </button>
        </div>
      </form>

      {/* ====================================================
          SUMMARY
      ==================================================== */}

      <div className="text-sm text-gray-500">
        Total promotion ditemukan:{" "}
        <span className="font-semibold text-gray-900">
          {result.total}
        </span>
      </div>

      {/* ====================================================
          TABLE
      ==================================================== */}

      <PromotionTable
        promotions={promotions}
      />

      {/* ====================================================
          PAGINATION
      ==================================================== */}

      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
          <span className="text-sm text-gray-500">
            Halaman {page} dari{" "}
            {totalPages}
          </span>

          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={{
                  pathname:
                    "/admin/promotions",
                  query: {
                    ...(params.search
                      ? {
                          search:
                            params.search,
                        }
                      : {}),
                    ...(params.status
                      ? {
                          status:
                            params.status,
                        }
                      : {}),
                    page:
                      page - 1,
                  },
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Sebelumnya
              </Link>
            )}

            {page < totalPages && (
              <Link
                href={{
                  pathname:
                    "/admin/promotions",
                  query: {
                    ...(params.search
                      ? {
                          search:
                            params.search,
                        }
                      : {}),
                    ...(params.status
                      ? {
                          status:
                            params.status,
                        }
                      : {}),
                    page:
                      page + 1,
                  },
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Berikutnya
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
