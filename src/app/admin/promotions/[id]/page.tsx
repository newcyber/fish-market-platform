import { notFound } from "next/navigation";
import Link from "next/link";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Pencil,
  Star,
  Tag,
} from "lucide-react";

import PromotionService from "@/services/promotion/promotion.service";

import PromotionLifecycleActions from "@/components/admin/promotions/PromotionLifecycleActions";

/**
 * ============================================================
 * PROMOTION DETAIL PAGE
 * ============================================================
 */

export const dynamic = "force-dynamic";

interface PromotionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ============================================================
 * FORMAT DATE
 * ============================================================
 */

function formatDate(
  date: Date | null
) {
  if (!date) {
    return "Tidak ditentukan.";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(date)
  );
}

/**
 * ============================================================
 * STATUS STYLE
 * ============================================================
 */

function getStatusStyle(
  status: string
) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Aktif",
        className:
          "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
      };

    case "SCHEDULED":
      return {
        label: "Terjadwal",
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
      };

    case "DRAFT":
      return {
        label: "Draft",
        className:
          "bg-muted text-muted-foreground",
      };

    case "ENDED":
      return {
        label: "Berakhir",
        className:
          "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
      };

    case "CANCELLED":
      return {
        label: "Dibatalkan",
        className:
          "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
      };

    default:
      return {
        label: status,
        className:
          "bg-muted text-muted-foreground",
      };
  }
}

/**
 * ============================================================
 * PROMOTION TYPE LABEL
 * ============================================================
 */

function getPromotionTypeLabel(
  type: string
) {
  switch (type) {
    case "PRICE_DISCOUNT":
      return "Price Discount";

    case "MARKETING":
      return "Marketing";

    default:
      return type;
  }
}

/**
 * ============================================================
 * DISCOUNT LABEL
 * ============================================================
 */

function getDiscountLabel(
  promotion: {
    type: string;
    discountType:
      | string
      | null;
    discountValue:
      | unknown
      | null;
  }
) {
  if (
    promotion.type !==
    "PRICE_DISCOUNT"
  ) {
    return "Tidak ada discount.";
  }

  if (
    !promotion.discountType ||
    promotion.discountValue ===
      null
  ) {
    return "Discount belum ditentukan.";
  }

  const value =
    Number(
      promotion.discountValue
    );

  if (
    promotion.discountType ===
    "PERCENTAGE"
  ) {
    return `${value}%`;
  }

  if (
    promotion.discountType ===
    "FIXED_AMOUNT"
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

  return String(
    promotion.discountValue
  );
}

/**
 * ============================================================
 * PROMOTION DETAIL PAGE
 * ============================================================
 */

export default async function PromotionDetailPage({
  params,
}: PromotionDetailPageProps) {
  const {
    id,
  } = await params;

  /**
   * ==========================================================
   * GET PROMOTION
   * ==========================================================
   */

  const promotion =
    await PromotionService.getById(
      id
    );

  /**
   * ==========================================================
   * NOT FOUND
   * ==========================================================
   */

  if (!promotion) {
    notFound();
  }

  const status =
    getStatusStyle(
      promotion.status
    );

  const discountLabel =
    getDiscountLabel(
      promotion
    );

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div className="space-y-2">

          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-3xl font-bold tracking-tight">
              {promotion.name}
            </h1>

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
            >
              {status.label}
            </span>

          </div>

          <p className="text-muted-foreground">
            Kelola informasi dan produk
            yang mengikuti promotion.
          </p>

        </div>

        <Link
          href={`/admin/promotions/${promotion.id}/edit`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          <Pencil className="h-4 w-4" />

          Edit Promotion
        </Link>

      </div>

      {/* ==================================================== */}
      {/* OVERVIEW */}
      {/* ==================================================== */}

      <div className="grid gap-6 md:grid-cols-3">

        {/* STATUS */}

        <div className="rounded-xl border bg-card p-6">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Tag className="h-5 w-5 text-muted-foreground" />
            </div>

            <div>

              <p className="text-sm text-muted-foreground">
                Status Promotion
              </p>

              <p className="font-semibold">
                {status.label}
              </p>

            </div>

          </div>

          <p className="text-sm text-muted-foreground">
            Promotion saat ini berstatus{" "}
            {status.label.toLowerCase()}.
          </p>

        </div>

        {/* PERIOD */}

        <div className="rounded-xl border bg-card p-6">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>

            <div>

              <p className="text-sm text-muted-foreground">
                Periode
              </p>

              <p className="font-semibold">
                Jadwal Promotion
              </p>

            </div>

          </div>

          <div className="space-y-2 text-sm">

            <div>

              <p className="text-xs text-muted-foreground">
                Mulai
              </p>

              <p className="font-medium">
                {formatDate(
                  promotion.startAt
                )}
              </p>

            </div>

            <div>

              <p className="text-xs text-muted-foreground">
                Berakhir
              </p>

              <p className="font-medium">
                {formatDate(
                  promotion.endAt
                )}
              </p>

            </div>

          </div>

        </div>

        {/* SKU */}

        <div className="rounded-xl border bg-card p-6">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>

            <div>

              <p className="text-sm text-muted-foreground">
                SKU Promo
              </p>

              <p className="font-semibold">
                {promotion.items.length} SKU
              </p>

            </div>

          </div>

          <p className="text-sm text-muted-foreground">
            SKU yang sudah ditambahkan
            ke promotion ini.
          </p>

        </div>

      </div>

      {/* ==================================================== */}
      {/* INFORMATION */}
      {/* ==================================================== */}

      <div className="rounded-xl border bg-card p-6">

        <div className="mb-6">

          <h2 className="text-lg font-semibold">
            Informasi Promotion
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Detail dasar promotion.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-2">

          {/* NAME */}

          <div>

            <p className="text-sm text-muted-foreground">
              Nama
            </p>

            <p className="mt-1 font-medium">
              {promotion.name}
            </p>

          </div>

          {/* SLUG */}

          <div>

            <p className="text-sm text-muted-foreground">
              Slug
            </p>

            <p className="mt-1 font-medium">
              {promotion.slug}
            </p>

          </div>

          {/* TYPE */}

          <div>

            <p className="text-sm text-muted-foreground">
              Tipe Promotion
            </p>

            <p className="mt-1 font-medium">
              {getPromotionTypeLabel(
                promotion.type
              )}
            </p>

          </div>

          {/* DISCOUNT */}

          <div>

            <p className="text-sm text-muted-foreground">
              Discount
            </p>

            <p className="mt-1 font-medium">
              {discountLabel}
            </p>

          </div>

          {/* FEATURED */}

          <div>

            <p className="text-sm text-muted-foreground">
              Featured
            </p>

            <div className="mt-1 flex items-center gap-2">

              {promotion.isFeatured ? (
                <>
                  <Star className="h-4 w-4 fill-current" />

                  <span className="font-medium">
                    Promotion Unggulan
                  </span>
                </>
              ) : (
                <>
                  <span className="font-medium">
                    Tidak
                  </span>
                </>
              )}

            </div>

          </div>

          {/* SORT ORDER */}

          <div>

            <p className="text-sm text-muted-foreground">
              Sort Order
            </p>

            <p className="mt-1 font-medium">
              {promotion.sortOrder}
            </p>

          </div>

          {/* DESCRIPTION */}

          <div className="md:col-span-2">

            <p className="text-sm text-muted-foreground">
              Deskripsi
            </p>

            <p className="mt-1 whitespace-pre-wrap font-medium">
              {promotion.description ||
                "Belum ada deskripsi."}
            </p>

          </div>

        </div>

      </div>

      {/* ==================================================== */}
      {/* BANNER */}
      {/* ==================================================== */}

      {promotion.banner && (
        <div className="rounded-xl border bg-card p-6">

          <div className="mb-5">

            <h2 className="text-lg font-semibold">
              Banner
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Banner yang digunakan pada promotion.
            </p>

          </div>

          <div className="overflow-hidden rounded-xl border bg-muted">

            <img
              src={promotion.banner}
              alt={promotion.name}
              className="max-h-[420px] w-full object-cover"
            />

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* PROMOTION ITEMS */}
      {/* ==================================================== */}

      <div className="rounded-xl border bg-card p-6">

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold">
              SKU Promotion
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              SKU yang menjadi target promotion ini.
            </p>

          </div>

          <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {promotion.items.length} SKU
          </span>

        </div>

        {promotion.items.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">

            <Package className="mx-auto h-8 w-8 text-muted-foreground" />

            <p className="mt-3 font-medium">
              Belum ada SKU
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Belum ada SKU yang ditambahkan
              ke promotion ini.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b">

                  <th className="px-4 py-3 text-left font-semibold">
                    Produk
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    SKU
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Variant
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Harga
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Stock
                  </th>

                </tr>

              </thead>

              <tbody>

                {promotion.items.map(
                  (item) => {

                    const variantLabels =
                      item.sku.skuOptions
                        .map(
                          (option) =>
                            option.variantOption.label
                        )
                        .filter(Boolean);

                    return (
                      <tr
                        key={item.id}
                        className="border-b last:border-0"
                      >

                        <td className="px-4 py-4">

                          <p className="font-medium">
                            {item.sku.product.name}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.sku.product.slug}
                          </p>

                        </td>

                        <td className="px-4 py-4 font-medium">
                          {item.sku.sku}
                        </td>

                        <td className="px-4 py-4 text-muted-foreground">
                          {variantLabels.length > 0
                            ? variantLabels.join(
                                ", "
                              )
                            : "-"}
                        </td>

                        <td className="px-4 py-4 font-medium">

                          {new Intl.NumberFormat(
                            "id-ID",
                            {
                              style:
                                "currency",
                              currency:
                                "IDR",
                              maximumFractionDigits: 0,
                            }
                          ).format(
                            Number(
                              item.sku.price
                            )
                          )}

                        </td>

                        <td className="px-4 py-4">

                          <div className="flex items-center gap-2">

                            {item.sku.stock >
                            0 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-orange-600" />
                            )}

                            <span>
                              {item.sku.stock}
                            </span>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

{/* ==================================================== */}
{/* PROMOTION LIFECYCLE */}
{/* ==================================================== */}

<div className="rounded-xl border bg-card p-6">
  <div className="mb-6">
    <h2 className="text-lg font-semibold">
      Promotion Lifecycle
    </h2>

    <p className="mt-1 text-sm text-muted-foreground">
      Kelola status dan lifecycle promotion.
    </p>
  </div>

  <PromotionLifecycleActions
    id={promotion.id}
    status={promotion.status}
  />
</div>

      {/* ==================================================== */}
      {/* FOOTER */}
      {/* ==================================================== */}

      <div className="flex justify-start">

        <Link
          href="/admin/promotions"
          className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
        >
          ← Kembali ke Promotion
        </Link>

      </div>

    </div>
  );
}
