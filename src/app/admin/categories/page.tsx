import CategoryService from "@/services/category/category.service";

import {
  CategoryToolbar,
} from "@/components/admin/categories/CategoryToolbar";

import {
  CategoryTable,
  type CategoryTableItem,
} from "@/components/admin/categories/CategoryTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface CategoriesPageProps {
  searchParams?: Promise<{
    search?: string;
    active?: string;
    status?: string;
    page?: string;
    success?: string;
  }>;
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(
    value ?? "1",
    10,
  );

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return 1;
  }

  return parsed;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params =
    (await searchParams) ?? {};

  /*
   * ==========================================================
   * STATUS FILTER
   * ==========================================================
   *
   * active=active
   * active=inactive
   * status=deleted
   *
   * Jika status=deleted, filter active
   * sengaja tidak digunakan.
   */
  const isDeleted =
    params.status === "deleted";

  const active =
    isDeleted
      ? undefined
      : params.active === "active"
        ? true
        : params.active === "inactive"
          ? false
          : undefined;

  const requestedPage =
    parsePage(params.page);

  /*
   * ==========================================================
   * CATEGORY FILTERS
   * ==========================================================
   */
  const filters = {
    search: params.search,
    active,
    deleted: isDeleted,
  };

  /*
   * ==========================================================
   * FETCH CATEGORIES
   * ==========================================================
   */
  let result =
    await CategoryService.getCategoriesPaginated(
      filters,
      requestedPage,
      PAGE_SIZE,
    );

  /*
   * ==========================================================
   * SAFE PAGINATION
   * ==========================================================
   *
   * Jika kategori dihapus / filter berubah dan
   * halaman yang diminta sudah tidak tersedia,
   * otomatis ambil halaman terakhir.
   */
  if (
    result.total > 0 &&
    requestedPage > result.totalPages
  ) {
    result =
      await CategoryService.getCategoriesPaginated(
        filters,
        result.totalPages,
        PAGE_SIZE,
      );
  }

  /*
   * ==========================================================
   * TABLE DATA
   * ==========================================================
   */
  const tableData: CategoryTableItem[] =
    result.items.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image ?? null,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      totalProducts:
        category._count.products,
    }));

  /*
   * ==========================================================
   * SAFE PAGE
   * ==========================================================
   */
  const safePage =
    result.totalPages > 0
      ? Math.min(
          result.page,
          result.totalPages,
        )
      : 1;

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */
  return (
    <div className="flex flex-col gap-6">
      {/* ======================================================
          HEADER
      ======================================================= */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Category Management
        </h1>

        <p className="mt-2 text-muted-foreground">
          {isDeleted
            ? "Kelola kategori yang telah dihapus sementara."
            : "Kelola seluruh kategori produk."}
        </p>
      </div>

      {/* ======================================================
          TOOLBAR
      ======================================================= */}
      <CategoryToolbar
        search={params.search}
        active={params.active}
        status={params.status}
      />

      {/* ======================================================
          CATEGORY TABLE
      ======================================================= */}
      <CategoryTable
        categories={tableData}
        total={result.total}
        page={safePage}
        limit={result.limit}
        totalPages={result.totalPages}
        filters={filters}
      />
    </div>
  );
}