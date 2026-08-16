import { notFound } from "next/navigation";

import CategoryForm from "@/components/admin/categories/CategoryForm";

import CategoryService from "@/services/category/category.service";

import {
  updateCategoryAction,
} from "@/actions/category/update-category";

export const dynamic = "force-dynamic";

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  /**
   * ============================================================
   * PARAMS
   * ============================================================
   */

  const { id } = await params;

  /**
   * ============================================================
   * GET CATEGORY
   * ============================================================
   */

  const category =
    await CategoryService.getCategoryById(id);

  /**
   * ============================================================
   * NOT FOUND
   * ============================================================
   */

  if (!category) {
    notFound();
  }

  /**
   * ============================================================
   * SERVER ACTION
   * ============================================================
   */

  async function action(
    formData: FormData
  ) {
    "use server";

    await updateCategoryAction(
      id,
      {
        success: false,
      },
      formData
    );
  }

  /**
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Edit Kategori
        </h1>

        <p className="text-muted-foreground">
          Perbarui informasi kategori produk.
        </p>
      </div>

      <CategoryForm
        submitLabel="Update Kategori"
        action={action}
        defaultValues={{
          name: category.name,
          slug: category.slug,
          description:
            category.description ?? "",
        }}
      />
    </div>
  );
}