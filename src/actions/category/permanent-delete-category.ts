"use server";

import { revalidatePath } from "next/cache";

import CategoryService from "@/services/category/category.service";

export interface PermanentDeleteCategoryResult {
  success: boolean;
  message?: string;
}

export async function permanentDeleteCategoryAction(
  id: string,
): Promise<PermanentDeleteCategoryResult> {
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
    await CategoryService.permanentDeleteCategory(
      normalizedId,
    );

    revalidatePath(
      "/admin/categories",
    );

    return {
      success: true,
      message:
        "Kategori berhasil dihapus permanen.",
    };
  } catch (error) {
    console.error(
      "Permanent delete category failed:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Kategori gagal dihapus permanen.",
    };
  }
}