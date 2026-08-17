"use server";

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

import {
  ProductImageService,
} from "@/services/product/product-image.service";

/**
 * ============================================================
 *
 * UPDATE PRODUCT ACTION
 *
 * ============================================================
 *
 * Flow:
 *
 * ProductForm
 *      ↓
 * FormData
 *      ↓
 *
 * variantOptions[]
 * variantOptionPrices[]
 *
 * weightOptions[]
 * weightOptionPrices[]
 *
 *      ↓
 *
 * ProductSchema
 *
 *      ↓
 *
 * ProductService.updateProduct()
 *
 * ============================================================
 */

/**
 * ============================================================
 *
 * HELPER
 *
 * NORMALIZE PRICE
 *
 * Support:
 *
 * 15000
 * 15.000
 * 15,000
 * Rp 15.000
 *
 * ============================================================
 */

function normalizePrice(
  value: FormDataEntryValue | string | null | undefined
): number {
  const rawValue =
    String(value ?? "").trim();

  if (!rawValue) {
    return 0;
  }

  const normalizedValue =
    rawValue.replace(
      /[^0-9]/g,
      ""
    );

  if (!normalizedValue) {
    return 0;
  }

  const parsedValue =
    Number(normalizedValue);

  if (
    !Number.isFinite(
      parsedValue
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    parsedValue
  );
}

/**
 * ============================================================
 *
 * UPDATE PRODUCT
 *
 * ============================================================
 */

export async function updateProductAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {

    /**
 * ==========================================================
 *
 * GET PRODUCT IMAGES
 *
 * ==========================================================
 *
 * Ambil file gambar baru dari FormData.
 *
 * File kosong diabaikan.
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
     * ==========================================================
     *
     * VALIDATE PRODUCT ID
     *
     * ==========================================================
     */

    const productId =
      String(id ?? "").trim();

    if (!productId) {
      return {
        success: false,

        message:
          "ID produk tidak valid.",
      };
    }

    /**
     * ==========================================================
     *
     * VALIDATE FORM DATA
     *
     * ==========================================================
     */

    if (
      !formData ||
      typeof formData.get !==
        "function" ||
      typeof formData.getAll !==
        "function"
    ) {
      return {
        success: false,

        message:
          "Data form produk tidak valid.",
      };
    }

    /**
     * ==========================================================
     *
     * VARIANT LABELS
     *
     * ==========================================================
     *
     * ProductForm mengirim:
     *
     * variantOptions
     * variantOptions
     *
     * Contoh:
     *
     * [
     *   "Utuh",
     *   "Dibersihkan"
     * ]
     *
     * ==========================================================
     */

    const variantLabels =
      formData
        .getAll(
          "variantOptions"
        )
        .map(
          (value) =>
            String(value).trim()
        );

    /**
     * ==========================================================
     *
     * VARIANT PRICE ADJUSTMENTS
     *
     * ==========================================================
     *
     * ProductForm mengirim:
     *
     * variantOptionPrices
     * variantOptionPrices
     *
     * Contoh:
     *
     * [
     *   "0",
     *   "5000"
     * ]
     *
     * ==========================================================
     */

    const variantPrices =
      formData
        .getAll(
          "variantOptionPrices"
        )
        .map(
          (value) =>
            String(value).trim()
        );

    /**
     * ==========================================================
     *
     * BUILD VARIANT OPTIONS
     *
     * ==========================================================
     *
     * Result:
     *
     * [
     *   {
     *     label: "Utuh",
     *     priceAdjustment: 0
     *   },
     *   {
     *     label: "Dibersihkan",
     *     priceAdjustment: 5000
     *   }
     * ]
     *
     * ==========================================================
     */

    const variantOptions =
      variantLabels.reduce<
        Array<{
          label: string;
          priceAdjustment: number;
        }>
      >(
        (
          result,
          label,
          index
        ) => {
          /**
           * Skip label kosong.
           */

          if (!label) {
            return result;
          }

          /**
           * Hindari duplicate variant.
           *
           * Perbandingan dibuat
           * case-insensitive.
           */

          const alreadyExists =
            result.some(
              (item) =>
                item.label
                  .toLowerCase() ===
                label.toLowerCase()
            );

          if (alreadyExists) {
            return result;
          }

          const rawPrice =
            variantPrices[index] ??
            "";

          const priceAdjustment =
            normalizePrice(
              rawPrice
            );

          result.push({
            label,
            priceAdjustment,
          });

          return result;
        },
        []
      );

    /**
     * ==========================================================
     *
     * WEIGHT LABELS
     *
     * ==========================================================
     *
     * Contoh:
     *
     * [
     *   "250gr",
     *   "500gr",
     *   "1kg"
     * ]
     *
     * ==========================================================
     */

    const weightLabels =
      formData
        .getAll(
          "weightOptions"
        )
        .map(
          (value) =>
            String(value).trim()
        );

    /**
     * ==========================================================
     *
     * WEIGHT PRICES
     *
     * ==========================================================
     *
     * Contoh:
     *
     * [
     *   "15000",
     *   "30000",
     *   "60000"
     * ]
     *
     * ==========================================================
     */

    const weightPrices =
      formData
        .getAll(
          "weightOptionPrices"
        )
        .map(
          (value) =>
            String(value).trim()
        );

    /**
     * ==========================================================
     *
     * BUILD WEIGHT OPTIONS
     *
     * ==========================================================
     *
     * Result:
     *
     * [
     *   {
     *     label: "250gr",
     *     price: 15000
     *   },
     *   {
     *     label: "500gr",
     *     price: 30000
     *   },
     *   {
     *     label: "1kg",
     *     price: 60000
     *   }
     * ]
     *
     * ==========================================================
     */

    const weightOptions =
      weightLabels.reduce<
        Array<{
          label: string;
          price: number;
        }>
      >(
        (
          result,
          label,
          index
        ) => {
          /**
           * Skip label kosong.
           */

          if (!label) {
            return result;
          }

          /**
           * Hindari duplicate weight.
           */

          const alreadyExists =
            result.some(
              (item) =>
                item.label
                  .toLowerCase() ===
                label.toLowerCase()
            );

          if (alreadyExists) {
            return result;
          }

          const rawPrice =
            weightPrices[index] ??
            "";

          const price =
            normalizePrice(
              rawPrice
            );

          result.push({
            label,
            price,
          });

          return result;
        },
        []
      );

    /**
     * ==========================================================
     *
     * PREPARE RAW DATA
     *
     * ==========================================================
     */

    const rawData = {
      categoryId:
        String(
          formData.get(
            "categoryId"
          ) ?? ""
        ).trim(),

      name:
        String(
          formData.get(
            "name"
          ) ?? ""
        ).trim(),

      slug:
        String(
          formData.get(
            "slug"
          ) ?? ""
        ).trim(),

      description:
        String(
          formData.get(
            "description"
          ) ?? ""
        ).trim(),

      sku:
        String(
          formData.get(
            "sku"
          ) ?? ""
        ).trim(),

      price:
        formData.get(
          "price"
        ),

      stock:
        formData.get(
          "stock"
        ),

      /**
       * Format:
       *
       * [
       *   {
       *     label: string,
       *     priceAdjustment: number
       *   }
       * ]
       */

      variantOptions,

      /**
       * Format:
       *
       * [
       *   {
       *     label: string,
       *     price: number
       *   }
       * ]
       */

      weightOptions,

      isPublished:
        formData.get(
          "isPublished"
        ),

      featured:
        formData.get(
          "featured"
        ),
    };

    /**
     * ==========================================================
     *
     * PRODUCT VALIDATION
     *
     * ==========================================================
     */

    const parsed =
      ProductSchema.safeParse(
        rawData
      );

    /**
     * ==========================================================
     *
     * VALIDATION FAILED
     *
     * ==========================================================
     */

    if (!parsed.success) {
      const fieldErrors =
        parsed.error
          .flatten()
          .fieldErrors;

      console.error(
        "[UPDATE_PRODUCT_VALIDATION_ERROR]",
        {
          rawData,

          fieldErrors,

          issues:
            parsed.error.issues,
        }
      );

      /**
       * Ambil pesan error pertama
       * agar lebih mudah melakukan
       * debugging.
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
              Boolean(
                message
              )
          );

      return {
        success: false,

        message:
          firstError ??
          "Validasi gagal. Periksa kembali data produk.",

        errors:
          fieldErrors,
      };
    }

    /**
     * ==========================================================
     *
     * UPDATE PRODUCT
     *
     * ==========================================================
     */

    await ProductService.updateProduct(
  productId,
  parsed.data
);

/**
 * ==========================================================
 *
 * UPLOAD NEW PRODUCT IMAGES
 *
 * ==========================================================
 *
 * Gambar lama tidak dihapus.
 *
 * Hanya gambar baru yang dipilih
 * pada ProductForm yang akan ditambahkan.
 */

if (imageFiles.length > 0) {
  await ProductImageService.upload(
    productId,
    imageFiles
  );
}

    /**
     * ==========================================================
     *
     * REVALIDATE ADMIN
     *
     * ==========================================================
     */

    revalidatePath(
      "/admin/products"
    );

    revalidatePath(
      `/admin/products/${productId}`
    );

    revalidatePath(
      `/admin/products/${productId}/edit`
    );

    /**
     * ==========================================================
     *
     * REVALIDATE CUSTOMER
     *
     * ==========================================================
     */

    revalidatePath(
      "/"
    );

    revalidatePath(
      "/products"
    );

    revalidatePath(
      "/customer/products"
    );

    /**
     * ==========================================================
     *
     * SUCCESS
     *
     * Redirect ditangani oleh
     * ProductForm setelah
     * state.success === true.
     *
     * ==========================================================
     */

    return {
      success: true,

      message:
        "Produk berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "[UPDATE_PRODUCT_ACTION_ERROR]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memperbarui produk.",
    };
  }
}