import {
  ProductDiscountType,
} from "@prisma/client";

import { z } from "zod";

/**
 * ============================================================
 * PRODUCT VARIANT OPTION SCHEMA
 * ============================================================
 *
 * Setiap varian dapat memiliki tambahan harga sendiri.
 *
 * Contoh:
 *
 * {
 *   label: "Utuh",
 *   priceAdjustment: 0
 * }
 *
 * {
 *   label: "Dibersihkan",
 *   priceAdjustment: 5000
 * }
 *
 * {
 *   label: "Fillet",
 *   priceAdjustment: 10000
 * }
 *
 * ============================================================
 */

export const ProductVariantOptionSchema =
  z.object({
    /**
     * ========================================================
     * EXISTING OPTION ID
     * ========================================================
     *
     * ID hanya tersedia ketika option berasal dari database.
     *
     * Option baru tidak memiliki ID.
     */

    id:
      z
        .string()
        .trim()
        .min(
          1,
          "ID varian tidak valid."
        )
        .optional(),

    /**
     * ========================================================
     * VARIANT LABEL
     * ========================================================
     */

    label:
      z
        .string()
        .trim()
        .min(
          1,
          "Nama varian wajib diisi."
        )
        .max(
          100,
          "Nama varian terlalu panjang."
        ),

    /**
     * ========================================================
     * PRICE ADJUSTMENT
     * ========================================================
     */

    priceAdjustment:
      z
        .coerce
        .number()
        .finite(
          "Tambahan harga varian tidak valid."
        )
        .min(
          0,
          "Tambahan harga varian tidak boleh negatif."
        ),
  });

/**
 * ============================================================
 * PRODUCT WEIGHT OPTION SCHEMA
 * ============================================================
 *
 * Setiap pilihan berat memiliki harga sendiri.
 *
 * ============================================================
 */

export const ProductWeightOptionSchema =
  z.object({
    /**
     * ========================================================
     * EXISTING OPTION ID
     * ========================================================
     *
     * ID hanya tersedia ketika option berasal dari database.
     *
     * Option baru tidak memiliki ID.
     */

    id:
      z
        .string()
        .trim()
        .min(
          1,
          "ID pilihan berat tidak valid."
        )
        .optional(),

    /**
     * ========================================================
     * WEIGHT LABEL
     * ========================================================
     */

    label:
      z
        .string()
        .trim()
        .min(
          1,
          "Label berat wajib diisi."
        )
        .max(
          100,
          "Label berat terlalu panjang."
        ),

    /**
     * ========================================================
     * WEIGHT PRICE
     * ========================================================
     */

    price:
      z
        .coerce
        .number()
        .finite(
          "Harga pilihan berat tidak valid."
        )
        .min(
          0,
          "Harga pilihan berat tidak boleh negatif."
        ),
  });

/**
 * ============================================================
 * PRODUCT WEIGHT × VARIANT PRICE SCHEMA
 * ============================================================
 *
 * Harga khusus untuk kombinasi:
 *
 *     Berat × Varian
 *
 * Contoh:
 *
 * 1 KG + Utuh
 * = Rp100.000
 *
 * 1 KG + Dibersihkan
 * = Rp105.000
 *
 * 2 KG + Utuh
 * = Rp200.000
 *
 * 2 KG + Dibersihkan
 * = Rp207.000
 *
 * ============================================================
 *
 * Jika kombinasi tidak dikirim, pricing engine akan melakukan
 * fallback ke:
 *
 *     ProductWeightOption.price
 *     +
 *     ProductVariantOption.priceAdjustment
 *
 * ============================================================
 */

export const ProductWeightVariantPriceSchema =
  z.object({
    /**
     * ========================================================
     * WEIGHT LABEL
     * ========================================================
     */

    weightLabel: z
      .string()
      .trim()
      .min(
        1,
        "Label berat wajib diisi."
      )
      .max(
        100,
        "Label berat terlalu panjang."
      ),

    /**
     * ========================================================
     * VARIANT LABEL
     * ========================================================
     */

    variantLabel: z
      .string()
      .trim()
      .min(
        1,
        "Nama varian wajib diisi."
      )
      .max(
        100,
        "Nama varian terlalu panjang."
      ),

    /**
     * ========================================================
     * COMBINATION PRICE
     * ========================================================
     */

    price: z
      .coerce
      .number()
      .finite(
        "Harga kombinasi tidak valid."
      )
      .min(
        0,
        "Harga kombinasi tidak boleh negatif."
      ),
  });

/**
 * ============================================================
 * PRODUCT SCHEMA
 * ============================================================
 */

export const ProductSchema =
  z
    .object({
      /**
       * ======================================================
       * CATEGORY
       * ======================================================
       */

      categoryId: z
        .string()
        .trim()
        .min(
          1,
          "Kategori wajib dipilih."
        ),

      /**
       * ======================================================
       * BASIC INFORMATION
       * ======================================================
       */

      name: z
        .string()
        .trim()
        .min(
          1,
          "Nama produk wajib diisi."
        )
        .max(
          255,
          "Nama produk terlalu panjang."
        ),

      slug: z
        .string()
        .trim()
        .min(
          1,
          "Slug produk wajib diisi."
        )
        .max(
          255,
          "Slug produk terlalu panjang."
        ),

      description: z
        .string()
        .trim()
        .nullable()
        .optional()
        .transform(
          (value) =>
            value &&
            value.length > 0
              ? value
              : null
        ),

      sku: z
        .string()
        .trim()
        .nullable()
        .optional()
        .transform(
          (value) =>
            value &&
            value.length > 0
              ? value
              : null
        ),

      /**
       * ======================================================
       * BASE PRICE
       * ======================================================
       *
       * Digunakan sebagai fallback apabila customer tidak
       * memilih weight option.
       *
       * Jika customer memilih berat:
       *
       *     ProductWeightOption.price
       *
       * Jika customer memilih varian:
       *
       *     ProductVariantOption.priceAdjustment
       *
       * Jika tersedia harga khusus:
       *
       *     ProductWeightVariantPrice.price
       *
       * ======================================================
       */

      price: z
        .coerce
        .number()
        .finite(
          "Harga produk tidak valid."
        )
        .min(
          0,
          "Harga produk tidak boleh negatif."
        ),

      /**
       * ======================================================
       * PRODUCT DISCOUNT
       * ======================================================
       */

      isDiscountActive: z
        .union([
          z.boolean(),
          z.literal("true"),
          z.literal("false"),
        ])
        .transform(
          (value) =>
            value === true ||
            value === "true"
        )
        .default(false),

      discountType: z
        .nativeEnum(
          ProductDiscountType
        )
        .nullable()
        .optional()
        .transform(
          (value) =>
            value ?? null
        ),

      discountValue: z
        .coerce
        .number()
        .finite(
          "Nilai diskon tidak valid."
        )
        .min(
          0,
          "Nilai diskon tidak boleh negatif."
        )
        .nullable()
        .optional()
        .transform(
          (value) =>
            value === null ||
            value === undefined
              ? null
              : value
        ),

      discountStartAt: z
        .coerce
        .date()
        .nullable()
        .optional()
        .transform(
          (value) =>
            value ?? null
        ),

      discountEndAt: z
        .coerce
        .date()
        .nullable()
        .optional()
        .transform(
          (value) =>
            value ?? null
        ),

      /**
       * ======================================================
       * STOCK
       * ======================================================
       */

      stock: z
        .coerce
        .number()
        .int(
          "Stok harus berupa bilangan bulat."
        )
        .min(
          0,
          "Stok tidak boleh negatif."
        ),

      /**
       * ======================================================
       * PRODUCT VARIANTS
       * ======================================================
       */

      variantOptions: z
        .array(
          ProductVariantOptionSchema
        )
        .default([]),

      /**
       * ======================================================
       * PRODUCT WEIGHT OPTIONS
       * ======================================================
       */

      weightOptions: z
        .array(
          ProductWeightOptionSchema
        )
        .default([]),

      /**
       * ======================================================
       * PRODUCT WEIGHT × VARIANT PRICES
       * ======================================================
       *
       * Tidak wajib.
       *
       * [] berarti tidak ada harga khusus dan pricing
       * engine akan menggunakan fallback pricing.
       *
       * ======================================================
       */

      weightVariantPrices: z
        .array(
          ProductWeightVariantPriceSchema
        )
        .default([]),

      /**
       * ======================================================
       * PUBLICATION STATUS
       * ======================================================
       */

      isPublished: z
        .union([
          z.boolean(),
          z.literal("true"),
          z.literal("false"),
        ])
        .transform(
          (value) =>
            value === true ||
            value === "true"
        ),

      /**
       * ======================================================
       * FEATURED STATUS
       * ======================================================
       */

      featured: z
        .union([
          z.boolean(),
          z.literal("true"),
          z.literal("false"),
        ])
        .transform(
          (value) =>
            value === true ||
            value === "true"
        ),
    })

    /**
     * ==========================================================
     * CROSS FIELD VALIDATION
     * ==========================================================
     */

    .superRefine(
      (
        data,
        context
      ) => {
        /**
         * ====================================================
         * VALIDATE PRODUCT DISCOUNT
         * ====================================================
         */

        if (
          data.isDiscountActive
        ) {
          if (
            !data.discountType
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "discountType",
              ],

              message:
                "Jenis diskon wajib dipilih.",
            });
          }

          if (
            data.discountValue ===
              null ||
            data.discountValue ===
              undefined ||
            data.discountValue <= 0
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "discountValue",
              ],

              message:
                "Nilai diskon harus lebih besar dari 0.",
            });
          }

          /**
           * Diskon persentase maksimal 100%.
           */

          if (
            data.discountType ===
              ProductDiscountType.PERCENTAGE &&
            data.discountValue !==
              null &&
            data.discountValue !==
              undefined &&
            data.discountValue > 100
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "discountValue",
              ],

              message:
                "Diskon persentase tidak boleh lebih dari 100%.",
            });
          }

          /**
           * Tanggal akhir tidak boleh lebih awal
           * dari tanggal mulai.
           */

          if (
            data.discountStartAt &&
            data.discountEndAt &&
            data.discountEndAt <
              data.discountStartAt
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "discountEndAt",
              ],

              message:
                "Tanggal berakhir diskon tidak boleh lebih awal dari tanggal mulai.",
            });
          }
        }

        /**
         * ====================================================
         * VALIDATE DUPLICATE VARIANTS
         * ====================================================
         */

        const variantSet =
          new Set<string>();

        data.variantOptions.forEach(
          (
            variant,
            index
          ) => {
            const normalized =
              variant.label
                .trim()
                .toLowerCase();

            if (
              variantSet.has(
                normalized
              )
            ) {
              context.addIssue({
                code:
                  z.ZodIssueCode.custom,

                path: [
                  "variantOptions",
                  index,
                  "label",
                ],

                message:
                  `Varian "${variant.label}" terduplikasi.`,
              });

              return;
            }

            variantSet.add(
              normalized
            );
          }
        );

        /**
         * ====================================================
         * VALIDATE DUPLICATE WEIGHT LABELS
         * ====================================================
         */

        const weightSet =
          new Set<string>();

        data.weightOptions.forEach(
          (
            weight,
            index
          ) => {
            const normalized =
              weight.label
                .trim()
                .toLowerCase();

            if (
              weightSet.has(
                normalized
              )
            ) {
              context.addIssue({
                code:
                  z.ZodIssueCode.custom,

                path: [
                  "weightOptions",
                  index,
                  "label",
                ],

                message:
                  `Pilihan berat "${weight.label}" terduplikasi.`,
              });

              return;
            }

            weightSet.add(
              normalized
            );
          }
        );

        /**
         * ====================================================
         * VALIDATE WEIGHT × VARIANT PRICES
         * ====================================================
         *
         * Pastikan:
         *
         * 1. Weight memang ada.
         * 2. Variant memang ada.
         * 3. Combination tidak duplikat.
         *
         * ====================================================
         */

        const weightVariantPriceSet =
          new Set<string>();

        const validWeightLabels =
          new Set(
            data.weightOptions.map(
              (weight) =>
                weight.label
                  .trim()
                  .toLowerCase()
            )
          );

        const validVariantLabels =
          new Set(
            data.variantOptions.map(
              (variant) =>
                variant.label
                  .trim()
                  .toLowerCase()
            )
          );

        data.weightVariantPrices.forEach(
          (
            item,
            index
          ) => {
            const weightLabel =
              item.weightLabel
                .trim()
                .toLowerCase();

            const variantLabel =
              item.variantLabel
                .trim()
                .toLowerCase();

            /**
             * ==================================================
             * WEIGHT MUST EXIST
             * ==================================================
             */

            if (
              !validWeightLabels.has(
                weightLabel
              )
            ) {
              context.addIssue({
                code:
                  z.ZodIssueCode.custom,

                path: [
                  "weightVariantPrices",
                  index,
                  "weightLabel",
                ],

                message:
                  `Berat "${item.weightLabel}" tidak ditemukan.`,
              });
            }

            /**
             * ==================================================
             * VARIANT MUST EXIST
             * ==================================================
             */

            if (
              !validVariantLabels.has(
                variantLabel
              )
            ) {
              context.addIssue({
                code:
                  z.ZodIssueCode.custom,

                path: [
                  "weightVariantPrices",
                  index,
                  "variantLabel",
                ],

                message:
                  `Varian "${item.variantLabel}" tidak ditemukan.`,
              });
            }

            /**
             * ==================================================
             * DUPLICATE COMBINATION
             * ==================================================
             */

            const combinationKey =
              `${weightLabel}::${variantLabel}`;

            if (
              weightVariantPriceSet.has(
                combinationKey
              )
            ) {
              context.addIssue({
                code:
                  z.ZodIssueCode.custom,

                path: [
                  "weightVariantPrices",
                  index,
                ],

                message:
                  `Harga kombinasi "${item.weightLabel} × ${item.variantLabel}" terduplikasi.`,
              });

              return;
            }

            weightVariantPriceSet.add(
              combinationKey
            );
          }
        );
      }
    );

/**
 * ============================================================
 * PRODUCT SCHEMA TYPE
 * ============================================================
 */

export type ProductInput =
  z.infer<
    typeof ProductSchema
  >;

export type ProductWeightOptionInput =
  z.infer<
    typeof ProductWeightOptionSchema
  >;

export type ProductVariantOptionInput =
  z.infer<
    typeof ProductVariantOptionSchema
  >;

export type ProductWeightVariantPriceInput =
  z.infer<
    typeof ProductWeightVariantPriceSchema
  >;