import CategoryService from "@/services/category/category.service";

import {
  CategoryToolbar,
} from "@/components/admin/categories/CategoryToolbar";

import {
  CategoryTable,
  type CategoryTableItem,
} from "@/components/admin/categories/CategoryTable";

export const dynamic = "force-dynamic";

interface CategoriesPageProps {
  searchParams?: Promise<{
    search?: string;
  }>;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params =
    (await searchParams) ?? {};

  const categories =
    await CategoryService.getCategories({
      search: params.search,
    });

  const tableData:
    CategoryTableItem[] =
    categories.map((category) => ({
      id: category.id,

      name: category.name,

      slug: category.slug,

      sortOrder:
        category.sortOrder,

      isActive:
        category.isActive,

      totalProducts:
        category._count.products,
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Category Management
        </h1>

        <p className="mt-2 text-muted-foreground">
          Kelola seluruh kategori
          produk.
        </p>
      </div>

      <CategoryToolbar
        search={params.search}
      />

      <CategoryTable
        categories={tableData}
      />
    </div>
  );
}