"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/types/action-result";

import CategoryService from "@/services/category/category.service";

import {
  createCategorySchema,
} from "@/validators/categories/create-category.validator";

export async function createCategoryAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed =
    createCategorySchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      image: formData.get("image"),
      sortOrder: formData.get("sortOrder"),
      isActive: formData.get("isActive"),
    });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validasi gagal.",
      errors:
        parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await CategoryService.createCategory(
      parsed.data
    );

    revalidatePath(
      "/admin/categories"
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