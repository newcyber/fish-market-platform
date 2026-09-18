import Link from "next/link";

import { ProductService } from "@/services/product/product.service";

import { ProductToolbar } from "@/components/admin/products/ProductToolbar";

import {
  ProductTable,
  type ProductTableItem,
} from "@/components/admin/products/ProductTable";

import AdminProductsPagination from "@/components/admin/products/AdminProductsPagination";

export const dynamic = "force-dynamic";

/**
 * ==========================================================
 * PAGINATION
 * ==========================================================
 *
 * Pilihan jumlah produk per halaman:
 *
 * 12
 * 24
 * 48
 *
 * Default:
 * 12
 *
 * ==========================================================
 */

const ADMIN_PAGE_SIZE = 12;

const PAGE_SIZE_OPTIONS = [
  12,
  24,
  48,
] as const;

type AllowedPageSize =
  (typeof PAGE_SIZE_OPTIONS)[number];

interface ProductsPageProps {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    category?: string;
    stock?:
      | "available"
      | "low"
      | "out";
    page?: string;
    limit?: string;
  }>;
}

/**
 * ==========================================================
 * PARSE PAGE
 * ==========================================================
 */

function parsePage(
  value?: string
) {
  const page = Number.parseInt(
    value ?? "1",
    10
  );

  return Number.isFinite(page) &&
    page > 0
    ? page
    : 1;
}

/**
 * ==========================================================
 * PARSE PAGE SIZE
 * ==========================================================
 */

function parsePageSize(
  value?: string
): AllowedPageSize {
  const limit = Number.parseInt(
    value ?? String(ADMIN_PAGE_SIZE),
    10
  );

  if (
    PAGE_SIZE_OPTIONS.includes(
      limit as AllowedPageSize
    )
  ) {
    return limit as AllowedPageSize;
  }

  return ADMIN_PAGE_SIZE;
}

/**
 * ==========================================================
 * PAGE
 * ==========================================================
 */

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params =
    (await searchParams) ?? {};

  const requestedPage =
    parsePage(params.page);

  const pageSize =
    parsePageSize(params.limit);

  /**
   * ========================================================
   * FILTERS
   * ========================================================
   */

  const filters = {
    search: params.search,

    categoryId:
      params.category &&
      params.category !== "all"
        ? params.category
        : undefined,

    published:
      params.status === "published"
        ? true
        : params.status === "draft"
          ? false
          : undefined,

    featured:
      params.status === "featured"
        ? true
        : undefined,

    stock:
      params.stock === "available" ||
      params.stock === "low" ||
      params.stock === "out"
        ? params.stock
        : undefined,
  } as const;

  /**
   * ========================================================
   * DATA
   * ========================================================
   */

  const [
    result,
    categories,
  ] = await Promise.all([
    ProductService.getProductsAdminPaginated(
      filters,
      requestedPage,
      pageSize
    ),

    ProductService.getCategoriesForAdmin(),
  ]);

  /**
   * ========================================================
   * TABLE DATA
   * ========================================================
   */

  const tableData: ProductTableItem[] =
    result.items.map(
      (
        product: Awaited<
          typeof result.items
        >[number]
      ) => ({
        id: product.id,

        name: product.name,

        image:
          product.images[0]?.image ??
          null,

        category:
          product.category.name,

        sku: product.sku,

        price:
          Number(product.price),

        stock:
          product.stock,

        stockItems:
          product.skus.map((sku) => ({
            skuId: sku.id,

            sku: sku.sku,

            stock: sku.stock,

            optionLabels:
              sku.skuOptions
                .map(
                  (skuOption) => ({
                    groupName:
                      skuOption
                        .variantOption
                        .group.name,

                    optionLabel:
                      skuOption
                        .variantOption
                        .label,
                  })
                )
                .sort((a, b) =>
                  `${a.groupName} ${a.optionLabel}`.localeCompare(
                    `${b.groupName} ${b.optionLabel}`,
                    "id-ID"
                  )
                )
                .map(
                  (option) =>
                    `${option.groupName}: ${option.optionLabel}`
                ),
          })),

        priceItems:
          product.skus.map((sku) => ({
            skuId: sku.id,

            sku: sku.sku,

            price:
              Number(sku.price),

            optionLabels:
              sku.skuOptions
                .map(
                  (skuOption) => ({
                    groupName:
                      skuOption
                        .variantOption
                        .group.name,

                    optionLabel:
                      skuOption
                        .variantOption
                        .label,
                  })
                )
                .sort((a, b) =>
                  `${a.groupName} ${a.optionLabel}`.localeCompare(
                    `${b.groupName} ${b.optionLabel}`,
                    "id-ID"
                  )
                )
                .map(
                  (option) =>
                    `${option.groupName}: ${option.optionLabel}`
                ),
          })),

        featured:
          product.featured,

        published:
          product.isPublished,
      })
    );

  /**
   * ========================================================
   * CURRENT PAGE
   * ========================================================
   */

  const totalPages =
    result.totalPages;

  const currentPage = Math.min(
    result.page,
    Math.max(
      1,
      totalPages || 1
    )
  );

  /**
   * ========================================================
   * FILTER KEY
   * ========================================================
   *
   * Digunakan ProductTable untuk mereset
   * selected products ketika filter berubah.
   *
   * ========================================================
   */

  const filterKey = [
    filters.search ?? "",

    filters.categoryId ?? "",

    filters.published === undefined
      ? ""
      : String(filters.published),

    filters.featured === undefined
      ? ""
      : String(filters.featured),

    filters.stock ?? "",
  ].join("|");

  /**
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (
    <div className="flex flex-col gap-6">
      {/* ====================================================
          HEADER
          ==================================================== */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Product Management
        </h1>

        <p className="mt-2 text-muted-foreground">
          Kelola seluruh produk marketplace.
        </p>
      </div>

      {/* ====================================================
          TOOLBAR
          ==================================================== */}

      <ProductToolbar
        search={params.search}
        status={params.status}
        category={params.category}
        stock={params.stock}
        categories={categories}
      />

      {/* ====================================================
          PRODUCT TABLE
          ==================================================== */}

      <ProductTable
        products={tableData}
        totalProducts={result.total}
        filterKey={filterKey}
        filters={filters}
      />

      {/* ====================================================
          PAGINATION
          ==================================================== */}

      <AdminProductsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={result.total}
        pageSize={pageSize}
      />
    </div>
  );
}