import { notFound } from "next/navigation";

import CategoryForm from "@/components/admin/categories/CategoryForm";
import CategoryService from "@/services/category/category.service";

import {
  updateCategoryAction,
} from "@/actions/category/update-category";

import type {
  ActionResult,
} from "@/types/action-result";

export const dynamic = "force-dynamic";

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;

  /**
   * GET CATEGORY
   */
  const category =
    await CategoryService.getCategoryById(id);

  if (!category) {
    notFound();
  }

  /**
   * BOUND SERVER ACTION
   *
   * CategoryForm menggunakan useActionState(),
   * sehingga action harus menerima:
   * (prevState, formData).
   */
  async function action(
    prevState: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> {
    "use server";

    return updateCategoryAction(
      id,
      prevState,
      formData,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Edit Kategori
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Perbarui informasi, gambar, urutan,
          dan status kategori produk.
        </p>
      </div>

      <CategoryForm
        submitLabel="Update Kategori"
        action={action}
        defaultValues={{
          name: category.name,
          slug: category.slug,
          image: category.image ?? undefined,
          description:
            category.description ?? "",
          sortOrder:
            category.sortOrder ?? 0,
          isActive:
            category.isActive ?? true,
        }}
      />
    </div>
  );
}