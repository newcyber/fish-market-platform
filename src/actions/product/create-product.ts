"use server";

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
     *
     * VARIANT OPTIONS
     *
     * ProductForm mengirim:
     *
     * variantOptions = "Utuh"
     * variantOptions = "Dibersihkan"
     *
     * ========================================================
     */

    /**
 * ========================================================
 *
 * VARIANT OPTIONS
 *
 * ProductForm mengirim:
 *
 * variantOptions[]
 * variantOptionPrices[]
 *
 * Contoh:
 *
 * variantOptions:
 * ["Utuh", "Dibersihkan"]
 *
 * variantOptionPrices:
 * ["0", "5000"]
 *
 * Hasil:
 *
 * [
 *   {
 *     label: "Utuh",
 *     priceAdjustment: 0,
 *   },
 *   {
 *     label: "Dibersihkan",
 *     priceAdjustment: 5000,
 *   },
 * ]
 *
 * ========================================================
 */

const variantLabels =
  formData
    .getAll("variantOptions")
    .map(
      (value) =>
        String(value).trim()
    );

const variantPrices =
  formData
    .getAll("variantOptionPrices")
    .map(
      (value) =>
        String(value)
    );

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
      if (!label) {
        return result;
      }

      const alreadyExists =
        result.some(
          (item) =>
            item.label.toLowerCase() ===
            label.toLowerCase()
        );

      if (alreadyExists) {
        return result;
      }

      const rawPrice =
        variantPrices[index] ??
        "";

      const normalizedPrice =
        rawPrice.replace(
          /[^0-9]/g,
          ""
        );

      const priceAdjustment =
        normalizedPrice.length > 0
          ? Number(
              normalizedPrice
            )
          : 0;

      result.push({
        label,

        priceAdjustment:
          Number.isFinite(
            priceAdjustment
          )
            ? Math.max(
                0,
                priceAdjustment
              )
            : 0,
      });

      return result;
    },
    []
  );

    /**
     * ========================================================
     *
     * WEIGHT OPTIONS
     *
     * ProductForm mengirim:
     *
     * weightOptions = "500gr"
     * weightOptionPrices = "25000"
     *
     * ========================================================
     */

    const weightLabels =
      formData
        .getAll("weightOptions")
        .map(
          (value) =>
            String(value).trim()
        );

    const weightPrices =
      formData
        .getAll(
          "weightOptionPrices"
        )
        .map(
          (value) =>
            String(value)
        );

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
          if (!label) {
            return result;
          }

          const rawPrice =
            weightPrices[index] ??
            "";

          const normalizedPrice =
            rawPrice.replace(
              /[^0-9]/g,
              ""
            );

          const price =
            normalizedPrice.length > 0
              ? Number(
                  normalizedPrice
                )
              : 0;

          result.push({
            label,
            price,
          });

          return result;
        },
        []
      );

    /**
     * ========================================================
     *
     * GET PRODUCT IMAGE FILES
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
      formData.get("categoryId"),

    name:
      formData.get("name"),

    slug:
      formData.get("slug"),

    description:
      formData.get("description"),

    sku:
      formData.get("sku"),

    unit:
      formData.get("unit"),

    /**
     * ========================================================
     * PRODUCT PRICE
     * ========================================================
     */

    price:
      formData.get("price"),

    /**
     * ========================================================
     * PRODUCT DISCOUNT
     * ========================================================
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

    /**
     * ========================================================
     * PRODUCT STOCK
     * ========================================================
     */

    stock:
      formData.get("stock"),

    weight:
      formData.get("weight"),

    /**
     * ========================================================
     * PRODUCT OPTIONS
     * ========================================================
     */

    variantOptions,

    weightOptions,

    weightVariantPrices:
      parseWeightVariantPrices(
        formData.get(
          "weightVariantPrices"
        )
      ),

    /**
     * ========================================================
     * PRODUCT STATUS
     * ========================================================
     */

    isPublished:
      formData.get(
        "isPublished"
      ),

    featured:
      formData.get(
        "featured"
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
  console.error(
    "[CREATE_PRODUCT_VALIDATION_ERROR]",
    parsed.error.flatten().fieldErrors
  );

  return {
    success: false,

    message:
      "Validasi gagal. Silakan periksa kembali data produk.",

    errors:
      parsed.error.flatten().fieldErrors,
  };
}

    /**
     * ========================================================
     *
     * CREATE PRODUCT
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

    /**
     * ========================================================
     *
     * UPLOAD PRODUCT IMAGES
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