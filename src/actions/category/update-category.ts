"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/types/action-result";

import CategoryService from "@/services/category/category.service";

import {
  updateCategorySchema,
} from "@/validators/categories/update-category.validator";

export async function updateCategoryAction(
  id: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed =
    updateCategorySchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      description:
        formData.get("description"),
      image: formData.get("image"),
      sortOrder:
        formData.get("sortOrder"),
      isActive:
        formData.get("isActive"),
    });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validasi gagal.",
      errors:
        parsed.error.flatten()
          .fieldErrors,
    };
  }

  try {
    await CategoryService.updateCategory(
      id,
      parsed.data
    );

    revalidatePath(
      "/admin/categories"
    );

    revalidatePath(
      `/admin/categories/${id}/edit`
    );

    redirect("/admin/categories");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan.",
    };
  }
}