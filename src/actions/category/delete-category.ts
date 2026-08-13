"use server";

import { revalidatePath } from "next/cache";

import CategoryService from "@/services/category/category.service";

export async function deleteCategoryAction(
  formData: FormData
): Promise<void> {
  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    throw new Error(
      "ID kategori tidak valid."
    );
  }

  await CategoryService.deleteCategory(
    id
  );

  revalidatePath(
    "/admin/categories"
  );
}