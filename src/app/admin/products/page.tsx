import Link from "next/link";
import { ProductService } from "@/services/product/product.service";

import { ProductToolbar } from "@/components/admin/products/ProductToolbar";
import {
  ProductTable,
  type ProductTableItem,
} from "@/components/admin/products/ProductTable";

export const dynamic = "force-dynamic";

const ADMIN_PAGE_SIZE = 20;

interface ProductsPageProps {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    category?: string;
    stock?: "available" | "low" | "out";
    page?: string;
  }>;
}

function parsePage(value?: string) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function Pagination({
  currentPage,
  totalPages,
  total,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    params.set("page", String(page));
    return `/admin/products?${params.toString()}`;
  };

  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const endPage = Math.min(totalPages, startPage + 4);
  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Halaman {currentPage} dari {totalPages} · {total.toLocaleString("id-ID")} produk
      </p>

      <nav
        className="flex flex-wrap items-center gap-1"
        aria-label="Pagination produk"
      >
        <Link
          href={buildHref(Math.max(1, currentPage - 1))}
          aria-disabled={currentPage === 1}
          className={`rounded-md border px-3 py-2 text-sm transition ${
            currentPage === 1
              ? "pointer-events-none opacity-50"
              : "hover:bg-muted"
          }`}
        >
          Sebelumnya
        </Link>

        {startPage > 1 && (
          <>
            <Link
              href={buildHref(1)}
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              1
            </Link>
            <span className="px-1 text-muted-foreground">…</span>
          </>
        )}

        {pages.map((page) => (
          <Link
            key={page}
            href={buildHref(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`min-w-9 rounded-md border px-3 py-2 text-center text-sm transition ${
              page === currentPage
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {page}
          </Link>
        ))}

        {endPage < totalPages && (
          <>
            <span className="px-1 text-muted-foreground">…</span>
            <Link
              href={buildHref(totalPages)}
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              {totalPages}
            </Link>
          </>
        )}

        <Link
          href={buildHref(Math.min(totalPages, currentPage + 1))}
          aria-disabled={currentPage === totalPages}
          className={`rounded-md border px-3 py-2 text-sm transition ${
            currentPage === totalPages
              ? "pointer-events-none opacity-50"
              : "hover:bg-muted"
          }`}
        >
          Berikutnya
        </Link>
      </nav>
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = (await searchParams) ?? {};
  const requestedPage = parsePage(params.page);

  const filters = {
    search: params.search,
    categoryId:
      params.category && params.category !== "all"
        ? params.category
        : undefined,
    published:
      params.status === "published"
        ? true
        : params.status === "draft"
          ? false
          : undefined,
    featured:
      params.status === "featured" ? true : undefined,
    stock:
      params.stock === "available" ||
      params.stock === "low" ||
      params.stock === "out"
        ? params.stock
        : undefined,
  } as const;

  const [result, categories] = await Promise.all([
    ProductService.getProductsAdminPaginated(
      filters,
      requestedPage,
      ADMIN_PAGE_SIZE
    ),
    ProductService.getCategoriesForAdmin(),
  ]);

  const tableData: ProductTableItem[] = result.items.map(
    (product: Awaited<typeof result.items>[number]) => ({
      id: product.id,
      name: product.name,
      image: product.images[0]?.image ?? null,
      category: product.category.name,
      sku: product.sku,
      price: Number(product.price),
      stock: product.stock,
      stockItems: product.skus.map((sku) => ({
        skuId: sku.id,
        sku: sku.sku,
        stock: sku.stock,
        optionLabels: sku.skuOptions
          .map((skuOption) => ({
            groupName: skuOption.variantOption.group.name,
            optionLabel: skuOption.variantOption.label,
          }))
          .sort((a, b) =>
            `${a.groupName} ${a.optionLabel}`.localeCompare(
              `${b.groupName} ${b.optionLabel}`,
              "id-ID"
            )
          )
          .map((option) => `${option.groupName}: ${option.optionLabel}`),
      })),
      priceItems: product.skus.map((sku) => ({
        skuId: sku.id,
        sku: sku.sku,
        price: Number(sku.price),
        optionLabels: sku.skuOptions
          .map((skuOption) => ({
            groupName: skuOption.variantOption.group.name,
            optionLabel: skuOption.variantOption.label,
          }))
          .sort((a, b) =>
            `${a.groupName} ${a.optionLabel}`.localeCompare(
              `${b.groupName} ${b.optionLabel}`,
              "id-ID"
            )
          )
          .map((option) => `${option.groupName}: ${option.optionLabel}`),
      })),
      featured: product.featured,
      published: product.isPublished,
    })
  );

  const totalPages = result.totalPages;
  const currentPage = Math.min(
    result.page,
    Math.max(1, totalPages || 1)
  );

  const filterKey = [
    filters.search ?? "",
    filters.categoryId ?? "",
    filters.published === undefined ? "" : String(filters.published),
    filters.featured === undefined ? "" : String(filters.featured),
    filters.stock ?? "",
  ].join("|");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Product Management
        </h1>
        <p className="mt-2 text-muted-foreground">
          Kelola seluruh produk marketplace.
        </p>
      </div>

      <ProductToolbar
        search={params.search}
        status={params.status}
        category={params.category}
        stock={params.stock}
        categories={categories}
      />

      <ProductTable
        products={tableData}
        totalProducts={result.total}
        filterKey={filterKey}
        filters={filters}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={result.total}
        searchParams={{
          search: params.search,
          status: params.status,
          category: params.category,
          stock: params.stock,
        }}
      />
    </div>
  );
}
