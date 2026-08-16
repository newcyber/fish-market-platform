"use server";

import {
  redirect,
} from "next/navigation";

import {
  revalidatePath,
} from "next/cache";

import {
  ProductService,
} from "@/services/product/product.service";

import {
  ProductSchema,
} from "@/validators/product/product.schema";

import type {
  ActionResult,
} from "@/types/action-result";

export async function updateProductAction(
  id: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  /**
   * ============================================================
   * GET VARIANT OPTIONS
   * ============================================================
   *
   * Mengambil semua input dengan:
   *
   * name="variantOptions"
   *
   */

  const variantOptions =
    Array.from(
      new Set(
        formData
          .getAll("variantOptions")
          .map((value) =>
            String(value).trim()
          )
          .filter(
            (value) =>
              value.length > 0
          )
      )
    );

  /**
   * ============================================================
   * GET WEIGHT OPTIONS
   * ============================================================
   *
   * Mengambil semua input dengan:
   *
   * name="weightOptions"
   *
   */

  const weightOptions =
    Array.from(
      new Set(
        formData
          .getAll("weightOptions")
          .map((value) =>
            String(value).trim()
          )
          .filter(
            (value) =>
              value.length > 0
          )
      )
    );

  /**
   * ============================================================
   * VALIDATE DATA
   * ============================================================
   */

  const parsed =
    ProductSchema.safeParse({
      categoryId:
        formData.get("categoryId"),

      name:
        formData.get("name"),

      slug:
        formData.get("slug"),

      description:
        formData.get("description"),

      sku:
        formData.get("sku"),

      price:
        formData.get("price"),

      stock:
        formData.get("stock"),

      variantOptions,

      weightOptions,

      isPublished:
        formData.get("isPublished"),

      featured:
        formData.get("featured"),
    });

  /**
   * ============================================================
   * VALIDATION FAILED
   * ============================================================
   */

  if (!parsed.success) {
    return {
      success: false,

      message:
        "Validasi gagal.",

      errors:
        parsed.error
          .flatten()
          .fieldErrors,
    };
  }

  try {
    /**
     * ==========================================================
     * UPDATE PRODUCT
     * ==========================================================
     */

    await ProductService.updateProduct(
      id,
      parsed.data
    );

    /**
     * ==========================================================
     * REVALIDATE ADMIN
     * ==========================================================
     */

    revalidatePath(
      "/admin/products"
    );

    revalidatePath(
      `/admin/products/${id}/edit`
    );

    /**
     * ==========================================================
     * REVALIDATE CUSTOMER
     * ==========================================================
     */

    revalidatePath(
      "/customer/products"
    );

    revalidatePath(
      "/"
    );

    redirect(
      "/admin/products"
    );
  } catch (error) {
    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memperbarui produk.",
    };
  }
}