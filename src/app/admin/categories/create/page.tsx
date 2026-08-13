import { redirect } from "next/navigation";

import CategoryForm from "@/components/admin/categories/CategoryForm";

import {
  createCategoryAction,
} from "@/actions/category/create-category";

export const dynamic = "force-dynamic";

export default async function CreateCategoryPage() {
  async function action(
    formData: FormData
  ) {
    "use server";

    const result =
      await createCategoryAction(
        null,
        formData
      );

    if (!result.success) {
      console.error(result);

      return;
    }

    redirect("/admin/categories");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Tambah Kategori
        </h1>

        <p className="text-muted-foreground">
          Tambahkan kategori baru
          untuk produk.
        </p>
      </div>

      <CategoryForm
        action={action}
      />
    </div>
  );
}