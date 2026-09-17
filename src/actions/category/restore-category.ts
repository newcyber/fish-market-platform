"use server";

import { revalidatePath } from "next/cache";

import CategoryService from "@/services/category/category.service";

export interface RestoreCategoryResult {
  success: boolean;
  message?: string;
}

export async function restoreCategoryAction(
  id: string,
): Promise<RestoreCategoryResult> {
  const normalizedId =
    typeof id === "string"
      ? id.trim()
      : "";

  if (!normalizedId) {
    return {
      success: false,
      message:
        "ID kategori tidak valid.",
    };
  }

  try {
    await CategoryService.restoreCategory(
      normalizedId,
    );

    revalidatePath(
      "/admin/categories",
    );

    return {
      success: true,
      message:
        "Kategori berhasil dipulihkan.",
    };
  } catch (error) {
    console.error(
      "Restore category failed:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Kategori gagal dipulihkan.",
    };
  }
}