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
 * PARSE WEIGHT × VARIANT PRICES
 * ============================================================
 *
 * ProductForm mengirim satu field JSON:
 *
 * weightVariantPrices = [
 *   {
 *     weightLabel: "1 KG",
 *     variantLabel: "Utuh",
 *     price: 100000,
 *   },
 * ]
 *
 * Cell matrix yang kosong tidak dikirim sebagai record.
 * ============================================================
 */
function parseWeightVariantPrices(
  value: FormDataEntryValue | null
): Array<{
  weightLabel: string;
  variantLabel: string;
  price: number;
}> {
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
      "Data harga berat × varian tidak valid."
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Data harga berat × varian harus berupa array."
    );
  }

  return parsed.map((item, index) => {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item)
    ) {
      throw new Error(
        `Data harga kombinasi pada index ${index} tidak valid.`
      );
    }

    const record =
      item as Record<string, unknown>;

    const weightLabel =
      String(record.weightLabel ?? "").trim();

    const variantLabel =
      String(record.variantLabel ?? "").trim();

    const rawPrice =
      String(record.price ?? "").trim();

    if (!weightLabel) {
      throw new Error(
        `Label berat pada kombinasi index ${index} wajib diisi.`
      );
    }

    if (!variantLabel) {
      throw new Error(
        `Label varian pada kombinasi index ${index} wajib diisi.`
      );
    }

    if (!rawPrice) {
      throw new Error(
        `Harga pada kombinasi "${weightLabel} × ${variantLabel}" wajib diisi.`
      );
    }

    const normalizedPrice =
      rawPrice.replace(/[^0-9]/g, "");

    const price =
      normalizedPrice.length > 0
        ? Number(normalizedPrice)
        : NaN;

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      throw new Error(
        `Harga pada kombinasi "${weightLabel} × ${variantLabel}" tidak valid.`
      );
    }

    return {
      weightLabel,
      variantLabel,
      price,
    };
  });
}

/**
 * ============================================================
 *
 * UPDATE PRODUCT
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

        const variantIds =
  formData
    .getAll("variantOptionIds")
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
      id?: string;
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
  ...(variantIds[index]
    ? {
        id: variantIds[index],
      }
    : {}),

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

        const weightIds =
  formData
    .getAll("weightOptionIds")
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
      id?: string;
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
  ...(weightIds[index]
    ? {
        id: weightIds[index],
      }
    : {}),

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

  /**
   * ==========================================================
   * PRODUCT DISCOUNT
   * ==========================================================
   */

  isDiscountActive:
    formData.get(
      "isDiscountActive"
    ) === "true" ||
    formData.get(
      "isDiscountActive"
    ) === "on",

  discountType: (() => {
    const value =
      formData.get(
        "discountType"
      );

    if (
      value === null ||
      String(value).trim() === ""
    ) {
      return null;
    }

    return String(value);
  })(),

  discountValue: (() => {
    const value =
      formData.get(
        "discountValue"
      );

    if (
      value === null ||
      String(value).trim() === ""
    ) {
      return null;
    }

    return normalizePrice(
      value
    );
  })(),

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

  variantOptions,

  weightOptions,

  weightVariantPrices:
    parseWeightVariantPrices(
      formData.get(
        "weightVariantPrices"
      )
    ),

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
      const { error } = parsed;

      const { fieldErrors } = error.flatten();

      console.error("[UPDATE_PRODUCT_VALIDATION_ERROR]", {
        rawData,
        fieldErrors,
        issues: error.issues,
      });

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