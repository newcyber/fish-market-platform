import { z } from "zod";

/**
 * ============================================================
 *
 * PRODUCT VARIANT OPTION SCHEMA
 *
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
 * Harga akhir nantinya:
 *
 * harga berat + priceAdjustment varian
 *
 * ============================================================
 */

export const ProductVariantOptionSchema =
  z.object({
    /**
     * ========================================================
     * VARIANT LABEL
     * ========================================================
     */

    label: z
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
     *
     * Contoh:
     *
     * Utuh         = 0
     * Dibersihkan  = 5000
     * Fillet       = 10000
     */

    priceAdjustment: z
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
 *
 * PRODUCT WEIGHT OPTION SCHEMA
 *
 * ============================================================
 *
 * Setiap pilihan berat memiliki harga sendiri.
 *
 * Contoh:
 *
 * {
 *   label: "500gr",
 *   price: 25000
 * }
 *
 * {
 *   label: "1kg",
 *   price: 45000
 * }
 *
 * {
 *   label: "2kg",
 *   price: 80000
 * }
 *
 * ============================================================
 */

export const ProductWeightOptionSchema =
  z.object({
    /**
     * ========================================================
     * WEIGHT LABEL
     * ========================================================
     */

    label: z
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

    price: z
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
 *
 * PRODUCT SCHEMA
 *
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
            value && value.length > 0
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
            value && value.length > 0
              ? value
              : null
        ),

      /**
       * ======================================================
       * BASE PRICE
       * ======================================================
       *
       * Digunakan sebagai harga fallback.
       *
       * Jika customer memilih berat tertentu,
       * harga akan menggunakan:
       *
       * ProductWeightOption.price
       *
       * Jika customer memilih varian,
       * maka harga akhir akan ditambah:
       *
       * ProductVariantOption.priceAdjustment
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
       *
       * Contoh:
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
       *
       * Contoh:
       *
       * [
       *   {
       *     label: "500gr",
       *     price: 25000
       *   },
       *   {
       *     label: "1kg",
       *     price: 45000
       *   }
       * ]
       */

      weightOptions: z
        .array(
          ProductWeightOptionSchema
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
    .superRefine(
      (
        data,
        context
      ) => {
        /**
         * ====================================================
         * VALIDATE DUPLICATE VARIANTS
         * ====================================================
         *
         * Contoh tidak valid:
         *
         * Utuh
         * UTUH
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
         *
         * Contoh tidak valid:
         *
         * 1kg
         * 1KG
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
      }
    );

/**
 * ============================================================
 *
 * PRODUCT SCHEMA TYPE
 *
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