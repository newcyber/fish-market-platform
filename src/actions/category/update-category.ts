"use server";

import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

import CategoryService from "@/services/category/category.service";

import type {
  ActionResult,
} from "@/types/action-result";

import {
  categorySchema,
} from "@/validations/category.validation";

/**
 * ============================================================
 * UPDATE CATEGORY ACTION
 * ============================================================
 */

export async function updateCategoryAction(
  id: string,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    /**
     * ==========================================================
     * VALIDATE CATEGORY ID
     * ==========================================================
     */

    if (!id) {
      return {
        success: false,
        message:
          "ID kategori tidak valid.",
      };
    }

    /**
     * ==========================================================
     * PARSE FORM DATA
     * ==========================================================
     */

const rawData = {
  name:
    String(
      formData.get("name") ?? ""
    ),

  slug:
    String(
      formData.get("slug") ?? ""
    ),

  description:
    String(
      formData.get("description") ?? ""
    ),

  image:
    String(
      formData.get("image") ?? ""
    ).trim() || null,

  sortOrder:
    Number(
      formData.get("sortOrder") ?? 0
    ),

  isActive:
    formData.get("isActive") ===
    "true",
};

    /**
     * ==========================================================
     * VALIDATE DATA
     * ==========================================================
     */

    const parsed =
      categorySchema.safeParse(
        rawData
      );

    if (!parsed.success) {
      return {
        success: false,

        message:
          "Data kategori tidak valid.",

        errors:
          parsed.error.flatten()
            .fieldErrors,
      };
    }

    /**
     * ==========================================================
     * UPDATE CATEGORY
     * ==========================================================
     */

    await CategoryService.updateCategory(
      id,
      parsed.data
    );

    /**
     * ==========================================================
     * REVALIDATE PAGES
     * ==========================================================
     */

    revalidatePath(
      "/admin/categories"
    );

    revalidatePath(
      `/admin/categories/${id}/edit`
    );

    /**
     * ==========================================================
     * REDIRECT WITH FLASH MESSAGE
     * ==========================================================
     */

    redirect(
      "/admin/categories?success=updated"
    );
  } catch (error) {
    /**
     * ==========================================================
     * IMPORTANT
     * ==========================================================
     *
     * Next.js redirect menggunakan error internal.
     *
     * Jangan menangkap redirect sebagai error biasa.
     */

    if (
      error instanceof Error &&
      error.message.includes(
        "NEXT_REDIRECT"
      )
    ) {
      throw error;
    }

    console.error(
      "[UPDATE_CATEGORY_ACTION_ERROR]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui kategori.",
    };
  }
}
