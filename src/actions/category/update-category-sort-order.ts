"use server";

import { revalidatePath } from "next/cache";

import CategoryService from "@/services/category/category.service";

export interface UpdateCategorySortOrderResult {
  success: boolean;
  message?: string;
}

export async function updateCategorySortOrderAction(
  id: string,
  sortOrder: number
): Promise<UpdateCategorySortOrderResult> {
  const normalizedId =
    typeof id === "string" ? id.trim() : "";

  if (!normalizedId) {
    return {
      success: false,
      message: "ID kategori tidak valid.",
    };
  }

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0 ||
    sortOrder > 999999
  ) {
    return {
      success: false,
      message:
        "Urutan harus berupa angka bulat antara 0 sampai 999.999.",
    };
  }

  try {
    await CategoryService.updateCategorySortOrder(
      normalizedId,
      sortOrder
    );

    revalidatePath("/admin/categories");

    return {
      success: true,
      message:
        "Urutan kategori berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "Update category sort order failed:",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Urutan kategori gagal diperbarui.",
    };
  }
}