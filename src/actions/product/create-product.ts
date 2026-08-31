"use server";

import { requireAdmin } from "@/lib/auth/admin";

import {
  revalidatePath,
} from "next/cache";

import {
  ProductService,
} from "@/services/product/product.service";

import {
  ProductImageService,
} from "@/services/product/product-image.service";

import {
  ProductSchema,
} from "@/validators/product/product.schema";

import type {
  ActionResult,
} from "@/types/action-result";

/**
 * ============================================================
 *
 * NORMALIZE OPTIONAL DATE
 *
 * ============================================================
 */

function normalizeOptionalDate(
  value: FormDataEntryValue | null
): Date | null {
  if (
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const rawValue =
    String(value).trim();

  const date =
    new Date(rawValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Format tanggal diskon tidak valid."
    );
  }

  return date;
}

/**
 * ============================================================
 *
 * NORMALIZE PRICE
 *
 * ============================================================
 */

function normalizePrice(
  value: FormDataEntryValue | null
): number | null {
  if (
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const normalized =
    String(value)
      .replace(
        /[^0-9]/g,
        ""
      )
      .trim();

  if (!normalized) {
    return null;
  }

  const numberValue =
    Number(normalized);

  if (
    !Number.isFinite(
      numberValue
    )
  ) {
    return null;
  }

  return numberValue;
}

/**
 * ============================================================
 * PARSE JSON PAYLOAD
 * ============================================================
 */

function parseJsonArray(
  value: FormDataEntryValue | null,
  fieldName: string
): unknown[] {
  if (
    value === null ||
    String(value).trim() === ""
  ) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(
      String(value)
    );
  } catch {
    throw new Error(
      `Data ${fieldName} tidak valid.`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Data ${fieldName} harus berupa array.`
    );
  }

  return parsed;
}

function parseVariantGroups(
  value: FormDataEntryValue | null
) {
  return parseJsonArray(
    value,
    "variantGroups"
  );
}

function parseSkus(
  value: FormDataEntryValue | null
) {
  return parseJsonArray(
    value,
    "skus"
  );
}

function normalizeBoolean(
  value: FormDataEntryValue | null,
  fallback = false
): boolean {
  if (value === null) {
    return fallback;
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  return (
    normalized === "true" ||
    normalized === "on" ||
    normalized === "1"
  );
}

/**
 * ============================================================
 *
 * CREATE PRODUCT ACTION
 *
 * ============================================================
 *
 * Flow:
 *
 * ProductForm
 *      ↓
 * FormData
 *      ↓
 * Authorization
 *      ↓
 * Parse variantOptions
 *      ↓
 * Parse weightOptions
 *      ↓
 * Product validation
 *      ↓
 * ProductService.createProduct()
 *      ↓
 * ProductImageService.upload()
 *      ↓
 * Revalidate paths
 *
 * ============================================================
 */

export async function createProductAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    /**
     * ========================================================
     *
     * AUTHORIZATION
     *
     * ========================================================
     *
     * Create product merupakan mutation admin.
     *
     * Hanya:
     *
     * - ADMIN
     * - SUPER_ADMIN
     *
     * yang boleh menjalankan action ini.
     *
     * Authorization harus dilakukan
     * sebelum validasi dan mutation apa pun.
     *
     * ========================================================
     */

    await requireAdmin();

    /**
     * ========================================================
     *
     * FORM DATA GUARD
     *
     * ========================================================
     */

    if (
      !formData ||
      typeof formData.get !== "function" ||
      typeof formData.getAll !== "function"
    ) {
      return {
        success: false,
        message:
          "Data form produk tidak valid.",
      };
    }

    /**
     * ========================================================
     * PRODUCT VARIANTS / SKUS
     * ========================================================
     *
     * ProductForm v3 mengirim
     * variantGroups dan skus sebagai JSON.
     */

    const variantGroups =
      parseVariantGroups(
        formData.get(
          "variantGroups"
        )
      );

    const skus =
      parseSkus(
        formData.get(
          "skus"
        )
      );

    /**
     * ========================================================
     *
     * GET PRODUCT IMAGE FILES
     *
     * ========================================================
     *
     * Input:
     *
     * <input
     *   name="images"
     *   type="file"
     *   multiple
     * />
     *
     * ========================================================
     */

    const imageFiles =
      formData
        .getAll("images")
        .filter(
          (value): value is File =>
            value instanceof File &&
            value.size > 0
        );

    /**
     * ========================================================
     *
     * VALIDATE PRODUCT
     *
     * ========================================================
     */

    const parsed =
      ProductSchema.safeParse({
        categoryId:
          formData.get(
            "categoryId"
          ),

        name:
          formData.get(
            "name"
          ),

        slug:
          formData.get(
            "slug"
          ),

        description:
          formData.get(
            "description"
          ),

        sku:
          formData.get(
            "sku"
          ),

        price:
          formData.get(
            "price"
          ),

        isDiscountActive:
          normalizeBoolean(
            formData.get(
              "isDiscountActive"
            ),
            false
          ),

        discountType:
          (() => {
            const value =
              formData.get(
                "discountType"
              );

            if (
              value === null ||
              String(
                value
              ).trim() === ""
            ) {
              return null;
            }

            return String(
              value
            );
          })(),

        discountValue:
          normalizePrice(
            formData.get(
              "discountValue"
            )
          ),

        discountStartAt:
          normalizeOptionalDate(
            formData.get(
              "discountStartAt"
            )
          ),

        discountEndAt:
          normalizeOptionalDate(
            formData.get(
              "discountEndAt"
            )
          ),

        stock:
          formData.get(
            "stock"
          ),

        variantGroups,

        skus,

        isPublished:
          normalizeBoolean(
            formData.get(
              "isPublished"
            ),
            true
          ),

        featured:
          normalizeBoolean(
            formData.get(
              "featured"
            ),
            false
          ),
      });

    /**
     * ========================================================
     *
     * VALIDATION FAILED
     *
     * ========================================================
     */

    if (!parsed.success) {
      const { error } =
        parsed;

      const { fieldErrors } =
        error.flatten();

      console.error(
        "[CREATE_PRODUCT_VALIDATION_ERROR]",
        {
          fieldErrors,
          issues:
            error.issues,
        }
      );

      /**
       * Ambil error pertama agar
       * user langsung mengetahui
       * field mana yang bermasalah.
       */

      const firstError =
        Object.values(
          fieldErrors
        )
          .flat()
          .find(
            (
              message
            ): message is string =>
              Boolean(message)
          );

      return {
        success: false,

        message:
          firstError ??
          "Validasi gagal. Silakan periksa kembali data produk.",

        errors:
          fieldErrors,
      };
    }

    /**
     * ========================================================
     *
     * CREATE PRODUCT
     *
     * ========================================================
     *
     * Product harus dibuat terlebih dahulu
     * agar kita mendapatkan product.id.
     *
     * ========================================================
     */

    const product =
      await ProductService.createProduct(
        parsed.data
      );

    if (!product) {
      throw new Error(
        "Produk gagal dibuat atau tidak dapat ditemukan setelah proses create."
      );
    }

    /**
     * ========================================================
     *
     * UPLOAD PRODUCT IMAGES
     *
     * ========================================================
     *
     * File:
     *
     * ProductForm
     *      ↓
     * FormData
     *      ↓
     * ProductImageService.upload()
     *      ↓
     * StorageService.save()
     *      ↓
     * ProductImage database
     *
     * ========================================================
     */

    if (
      imageFiles.length > 0
    ) {
      await ProductImageService.upload(
        product.id,
        imageFiles
      );
    }

    /**
     * ========================================================
     *
     * REVALIDATE ADMIN PAGES
     *
     * ========================================================
     *
     * Dilakukan setelah upload selesai
     * agar gambar langsung tersedia
     * ketika halaman produk dibuka kembali.
     *
     * ========================================================
     */

    revalidatePath(
      "/admin/products"
    );

    revalidatePath(
      "/admin/products/create"
    );

    revalidatePath(
      `/admin/products/${product.id}`
    );

    revalidatePath(
      `/admin/products/${product.id}/edit`
    );

    /**
     * ========================================================
     *
     * REVALIDATE PUBLIC PAGES
     *
     * ========================================================
     */

    revalidatePath(
      "/"
    );

    revalidatePath(
      "/products"
    );

    revalidatePath(
      `/products/${product.slug}`
    );

    revalidatePath(
      "/customer/products"
    );

    /**
     * ========================================================
     *
     * SUCCESS
     *
     * ========================================================
     *
     * Jangan redirect di sini.
     *
     * ProductForm/useActionState dapat menangani
     * success state sesuai implementasi Anda saat ini.
     *
     * ========================================================
     */

    return {
      success: true,

      message:
        "Produk berhasil ditambahkan.",
    };
  } catch (error) {
    console.error(
      "[CREATE_PRODUCT_ACTION_ERROR]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menambahkan produk.",
    };
  }
}
