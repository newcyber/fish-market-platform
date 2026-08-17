import CategoryService from "@/services/category/category.service";

import {
  CategoryToolbar,
} from "@/components/admin/categories/CategoryToolbar";

import {
  CategoryTable,
  type CategoryTableItem,
} from "@/components/admin/categories/CategoryTable";

export const dynamic =
  "force-dynamic";

/**
 * ============================================================
 * PAGE PROPS
 * ============================================================
 */

interface CategoriesPageProps {
  searchParams?: Promise<{
    search?: string;
    success?: string;
  }>;
}

/**
 * ============================================================
 * CATEGORIES PAGE
 * ============================================================
 */

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  /**
   * ==========================================================
   * SEARCH PARAMS
   * ==========================================================
   */

  const params =
    (await searchParams) ?? {};

  /**
   * ==========================================================
   * GET CATEGORIES
   * ==========================================================
   */

  const categories =
    await CategoryService.getCategories({
      search:
        params.search,
    });

  /**
   * ==========================================================
   * TABLE DATA
   * ==========================================================
   *
   * Total produk berasal dari:
   *
   * category._count.products
   */

  const tableData:
    CategoryTableItem[] =
    categories.map(
      (category) => ({
        id:
          category.id,

        name:
          category.name,

        slug:
          category.slug,

        totalProducts:
          category._count
            ?.products ?? 0,
      })
    );

  /**
   * ==========================================================
   * FLASH MESSAGE
   * ==========================================================
   */

  const successMessage =
    params.success === "updated"
      ? "Kategori berhasil diperbarui."
      : params.success === "created"
        ? "Kategori berhasil ditambahkan."
        : params.success === "deleted"
          ? "Kategori berhasil dihapus."
          : null;

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="flex flex-col gap-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Category Management
        </h1>

        <p className="mt-2 text-muted-foreground">
          Kelola seluruh kategori produk.
        </p>
      </div>

      {/* ======================================================
          SUCCESS NOTIFICATION
      ====================================================== */}

      {successMessage && (
        <div
          className="
            rounded-xl
            border
            border-green-200
            bg-green-50
            px-4
            py-3
            text-sm
            font-medium
            text-green-700
          "
        >
          {successMessage}
        </div>
      )}

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <CategoryToolbar
        search={
          params.search
        }
      />

      {/* ======================================================
          CATEGORY TABLE
      ====================================================== */}

      <CategoryTable
        categories={
          tableData
        }
      />
    </div>
  );
}