import { notFound } from "next/navigation";

import Link from "next/link";

import {
  Calendar,
  Package,
  Pencil,
  Tag,
} from "lucide-react";

import {
  FlashSaleItemsSection,
} from "@/components/admin/flash-sales/FlashSaleItemsSection";

import FlashSaleService from "@/services/flash-sale/flash-sale.service";

import ProductService from "@/services/product/product.service";

/**
 * ============================================================
 * FLASH SALE DETAIL PAGE
 * ============================================================
 */

export const dynamic = "force-dynamic";

interface FlashSaleDetailPageProps {
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
  date: Date
) {
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
 * GET STATUS STYLE
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

    case "INACTIVE":
      return {
        label: "Tidak Aktif",

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
 * FLASH SALE DETAIL PAGE
 * ============================================================
 */

export default async function FlashSaleDetailPage({
  params,
}: FlashSaleDetailPageProps) {
  const {
    id,
  } = await params;

  /**
   * ==========================================================
   * GET FLASH SALE
   * ==========================================================
   */

  const flashSale =
    await FlashSaleService.getById(
      id
    );

  /**
   * ==========================================================
   * NOT FOUND
   * ==========================================================
   */

  if (!flashSale) {
    notFound();
  }

  /**
   * ==========================================================
   * GET PRODUCTS
   * ==========================================================
   *
   * Ambil seluruh produk yang published agar
   * hanya produk aktif yang dapat dipilih
   * untuk Flash Sale.
   */

  const products =
    await ProductService.getProducts({
      published: true,
    });

  /**
   * ==========================================================
   * NORMALIZE PRODUCTS
   * ==========================================================
   *
   * Prisma Decimal tidak dapat langsung
   * dikirim ke Client Component.
   */

  const normalizedProducts =
    products.map(
      (product) => ({
        id:
          product.id,

        name:
          product.name,

        price:
          Number(
            product.price
          ),

        stock:
          Number(
            product.stock ?? 0
          ),

        weightOptions:
          product.weightOptions.map(
            (weightOption) => ({
              id:
                weightOption.id,

              label:
                weightOption.label,

              price:
                Number(
                  weightOption.price
                ),
            })
          ),
      })
    );

  /**
   * ==========================================================
   * NORMALIZE FLASH SALE ITEMS
   * ==========================================================
   */

  const normalizedItems =
    flashSale.items.map(
      (item) => ({
        id:
          item.id,

        originalPrice:
          Number(
            item.originalPrice
          ),

        flashPrice:
          Number(
            item.flashPrice
          ),

        stockLimit:
          item.stockLimit,

        soldQuantity:
          item.soldQuantity,

        perUserLimit:
  item.perUserLimit ?? 0,

        sortOrder:
          item.sortOrder,

        isActive:
          item.isActive,

        product: {
          id:
            item.product.id,

          name:
            item.product.name,
        },

        weightOption:
          item.weightOption
            ? {
                id:
                  item.weightOption.id,

                label:
                  item.weightOption.label,
              }
            : null,
      })
    );

  const status =
    getStatusStyle(
      flashSale.status
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
              {flashSale.name}
            </h1>

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <p className="text-muted-foreground">
            Kelola informasi campaign dan produk
            Flash Sale.
          </p>
        </div>

        <Link
  href={`/admin/flash-sales/${flashSale.id}/edit`}
  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
>
  <Pencil className="h-4 w-4" />

  Edit Flash Sale
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
                Status Campaign
              </p>

              <p className="font-semibold">
                {status.label}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Campaign saat ini berstatus{" "}
            {status.label.toLowerCase()}.
          </p>
        </div>

        {/* SCHEDULE */}

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
                Jadwal Campaign
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
                  flashSale.startAt
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Berakhir
              </p>

              <p className="font-medium">
                {formatDate(
                  flashSale.endAt
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ITEMS */}

        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Produk Promo
              </p>

              <p className="font-semibold">
                {flashSale.items.length} Item
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Produk yang sudah ditambahkan
            ke campaign Flash Sale.
          </p>
        </div>
      </div>

      {/* ==================================================== */}
      {/* CAMPAIGN INFORMATION */}
      {/* ==================================================== */}

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Informasi Campaign
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Detail dasar Flash Sale.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">
              Nama
            </p>

            <p className="mt-1 font-medium">
              {flashSale.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Slug
            </p>

            <p className="mt-1 font-medium">
              {flashSale.slug}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">
              Deskripsi
            </p>

            <p className="mt-1 whitespace-pre-wrap font-medium">
              {flashSale.description ||
                "Belum ada deskripsi."}
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* FLASH SALE ITEMS */}
      {/* ==================================================== */}

      <FlashSaleItemsSection
        flashSaleId={flashSale.id}
        items={normalizedItems}
        products={normalizedProducts}
      />
    </div>
  );
}