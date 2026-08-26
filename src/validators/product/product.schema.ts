import { ProductDiscountType } from "@prisma/client";
import { z } from "zod";

/**
 * ============================================================
 * PRODUCT VARIANT OPTION
 * ============================================================
 *
 * `id`  = database ID untuk option existing.
 * `key` = temporary/client reference untuk option baru.
 *
 * Jangan gunakan priceAdjustment di option.
 * Harga final berada di ProductSku.price.
 */
export const ProductVariantOptionInputSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "ID option tidak valid.")
    .optional(),

  key: z
    .string()
    .trim()
    .min(1, "Reference key option tidak valid.")
    .max(150, "Reference key option terlalu panjang.")
    .optional(),

  label: z
    .string()
    .trim()
    .min(1, "Nama option wajib diisi.")
    .max(100, "Nama option terlalu panjang."),

  sortOrder: z
    .coerce
    .number()
    .int()
    .min(0)
    .optional(),

  isActive: z.boolean().optional(),
});

/**
 * ============================================================
 * PRODUCT VARIANT GROUP
 * ============================================================
 *
 * Tidak ada lagi konsep khusus weight.
 *
 * Berat, kondisi, grade, ukuran, warna, dll semuanya
 * diperlakukan sebagai VariantGroup.
 */
export const ProductVariantGroupInputSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "ID group varian tidak valid.")
    .optional(),

  name: z
    .string()
    .trim()
    .min(1, "Nama group varian wajib diisi.")
    .max(100, "Nama group varian terlalu panjang."),

  sortOrder: z
    .coerce
    .number()
    .int()
    .min(0)
    .optional(),

  isActive: z.boolean().optional(),

  options: z
    .array(ProductVariantOptionInputSchema)
    .min(1, "Setiap group varian harus memiliki minimal satu option."),
});

/**
 * ============================================================
 * PRODUCT SKU
 * ============================================================
 *
 * `optionRefs` dapat berisi:
 *
 * - ProductVariantOption.id untuk option existing
 * - ProductVariantOption.key untuk option baru
 *
 * Service akan resolve reference tersebut setelah option
 * database dibuat/ditemukan.
 */
export const ProductSkuInputSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "ID SKU tidak valid.")
    .optional(),

  sku: z
    .string()
    .trim()
    .min(1, "SKU wajib diisi.")
    .max(150, "SKU terlalu panjang."),

  price: z
    .coerce
    .number()
    .finite("Harga SKU tidak valid.")
    .min(0, "Harga SKU tidak boleh negatif."),

  stock: z
    .coerce
    .number()
    .int("Stok SKU harus berupa bilangan bulat.")
    .min(0, "Stok SKU tidak boleh negatif."),

  optionRefs: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Reference option SKU tidak valid.")
    )
    .default([]),

  isActive: z.boolean().optional(),
});

/**
 * ============================================================
 * PRODUCT BASIC FIELDS
 * ============================================================
 */
const ProductBaseFields = {
  categoryId: z
    .string()
    .trim()
    .min(1, "Kategori wajib dipilih."),

  name: z
    .string()
    .trim()
    .min(1, "Nama produk wajib diisi.")
    .max(255, "Nama produk terlalu panjang."),

  slug: z
    .string()
    .trim()
    .min(1, "Slug produk wajib diisi.")
    .max(255, "Slug produk terlalu panjang."),

  description: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((value) =>
      value && value.length > 0 ? value : null
    ),

  /**
   * Parent/product code.
   * Inventory/transaction SKU canonical berada di ProductSku.sku.
   */
  sku: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((value) =>
      value && value.length > 0 ? value : null
    ),

  /**
   * Legacy/fallback product-level price.
   * Untuk produk dengan SKU, harga transaksi berasal dari SKU.
   */
  price: z
    .coerce
    .number()
    .finite("Harga produk tidak valid.")
    .min(0, "Harga produk tidak boleh negatif."),

  /**
   * Legacy/fallback product-level stock.
   * Untuk produk dengan SKU, stok transaksi berasal dari SKU.
   */
  stock: z
    .coerce
    .number()
    .int("Stok harus berupa bilangan bulat.")
    .min(0, "Stok tidak boleh negatif."),

  isDiscountActive: z
    .union([
      z.boolean(),
      z.literal("true"),
      z.literal("false"),
    ])
    .transform((value) => value === true || value === "true")
    .default(false),

  discountType: z
    .nativeEnum(ProductDiscountType)
    .nullable()
    .optional()
    .transform((value) => value ?? null),

  discountValue: z
    .coerce
    .number()
    .finite("Nilai diskon tidak valid.")
    .min(0, "Nilai diskon tidak boleh negatif.")
    .nullable()
    .optional()
    .transform((value) =>
      value === null || value === undefined ? null : value
    ),

  discountStartAt: z
    .coerce
    .date()
    .nullable()
    .optional()
    .transform((value) => value ?? null),

  discountEndAt: z
    .coerce
    .date()
    .nullable()
    .optional()
    .transform((value) => value ?? null),

  isPublished: z
    .union([
      z.boolean(),
      z.literal("true"),
      z.literal("false"),
    ])
    .transform((value) => value === true || value === "true"),

  featured: z
    .union([
      z.boolean(),
      z.literal("true"),
      z.literal("false"),
    ])
    .transform((value) => value === true || value === "true"),
};

/**
 * ============================================================
 * COMMON VARIANT / SKU VALIDATION
 * ============================================================
 *
 * Validasi di sini hanya memeriksa konsistensi payload.
 * Validasi terhadap database ID existing tetap dilakukan
 * oleh ProductService dalam transaction.
 */
/**
 * ============================================================
 * COMMON VARIANT / SKU VALIDATION
 * ============================================================
 *
 * Validasi di sini hanya memeriksa konsistensi payload.
 * Validasi terhadap database ID existing tetap dilakukan
 * oleh ProductService dalam transaction.
 *
 * Type validation menggunakan schema Zod yang sama dengan
 * payload sebenarnya, sehingga tidak perlu menggunakan `any`.
 * ============================================================
 */

type VariantSkuValidationData = {
  variantGroups?: z.infer<
    typeof ProductVariantGroupInputSchema
  >[];

  skus?: z.infer<
    typeof ProductSkuInputSchema
  >[];
};

function addVariantSkuValidation<
  T extends z.ZodTypeAny
>(schema: T) {
  return schema.superRefine(
    (data, context) => {
      /**
       * `T` adalah schema generic yang dapat berupa
       * ProductCreateSchema maupun ProductUpdateSchema.
       *
       * Kedua schema tersebut memiliki struktur:
       *
       * - variantGroups
       * - skus
       *
       * Type assertion di sini hanya menyatakan kontrak
       * internal yang memang sudah dijamin oleh schema
       * yang dikirim ke helper ini.
       */
      const validationData =
        data as VariantSkuValidationData;

      const groups =
        Array.isArray(
          validationData.variantGroups
        )
          ? validationData.variantGroups
          : [];

      const skus =
        Array.isArray(
          validationData.skus
        )
          ? validationData.skus
          : [];

      /**
       * --------------------------------------------------------
       * Duplicate group names
       * --------------------------------------------------------
       */

      const groupNameSet =
        new Set<string>();

      groups.forEach(
        (group, groupIndex) => {
          const normalizedName =
            group.name
              .trim()
              .toLowerCase();

          if (
            groupNameSet.has(
              normalizedName
            )
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "variantGroups",
                groupIndex,
                "name",
              ],

              message:
                `Group varian "${group.name}" terduplikasi.`,
            });
          }

          groupNameSet.add(
            normalizedName
          );

          /**
           * ------------------------------------------------------
           * Duplicate option labels inside same group
           * ------------------------------------------------------
           */

          const optionLabelSet =
            new Set<string>();

          const optionRefSet =
            new Set<string>();

          group.options.forEach(
            (option, optionIndex) => {
              const normalizedLabel =
                option.label
                  .trim()
                  .toLowerCase();

              if (
                optionLabelSet.has(
                  normalizedLabel
                )
              ) {
                context.addIssue({
                  code:
                    z.ZodIssueCode.custom,

                  path: [
                    "variantGroups",
                    groupIndex,
                    "options",
                    optionIndex,
                    "label",
                  ],

                  message:
                    `Option "${option.label}" terduplikasi dalam group "${group.name}".`,
                });
              }

              optionLabelSet.add(
                normalizedLabel
              );

              /**
               * --------------------------------------------------
               * ID dan key boleh sama-sama ada pada object
               * existing, tetapi key tidak boleh dipakai dua
               * kali dalam payload.
               * --------------------------------------------------
               */

              if (option.key) {
                const normalizedKey =
                  option.key
                    .trim()
                    .toLowerCase();

                if (
                  optionRefSet.has(
                    normalizedKey
                  )
                ) {
                  context.addIssue({
                    code:
                      z.ZodIssueCode.custom,

                    path: [
                      "variantGroups",
                      groupIndex,
                      "options",
                      optionIndex,
                      "key",
                    ],

                    message:
                      `Reference key "${option.key}" terduplikasi dalam group "${group.name}".`,
                  });
                }

                optionRefSet.add(
                  normalizedKey
                );
              }

              /**
               * --------------------------------------------------
               * Option baru harus punya key.
               * --------------------------------------------------
               */

              if (
                !option.id &&
                !option.key
              ) {
                context.addIssue({
                  code:
                    z.ZodIssueCode.custom,

                  path: [
                    "variantGroups",
                    groupIndex,
                    "options",
                    optionIndex,
                  ],

                  message:
                    "Option baru harus memiliki reference key.",
                });
              }
            }
          );
        }
      );

      /**
       * --------------------------------------------------------
       * No variant group
       * --------------------------------------------------------
       *
       * Produk tanpa variant boleh memiliki:
       *
       * - 0 SKU: service dapat membuat default SKU
       * - 1 SKU: SKU harus tanpa optionRefs
       *
       * Lebih dari satu SKU tanpa variant tidak diperbolehkan.
       */

      if (
        groups.length === 0
      ) {
        if (
          skus.length > 1
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "skus",
            ],

            message:
              "Produk tanpa variant hanya boleh memiliki satu SKU.",
          });
        }

        if (
          skus.length === 1 &&
          skus[0].optionRefs.length > 0
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "skus",
              0,
              "optionRefs",
            ],

            message:
              "SKU produk tanpa variant tidak boleh memiliki optionRefs.",
          });
        }

        return;
      }

      /**
       * --------------------------------------------------------
       * Build local option reference ownership
       * --------------------------------------------------------
       *
       * key -> group name
       * id  -> group name
       */

      const refToGroup =
        new Map<string, string>();

      groups.forEach(
        (group) => {
          group.options.forEach(
            (option) => {
              if (option.id) {
                refToGroup.set(
                  option.id,
                  group.name
                );
              }

              if (option.key) {
                refToGroup.set(
                  option.key,
                  group.name
                );
              }
            }
          );
        }
      );

      /**
       * --------------------------------------------------------
       * SKU validation
       * --------------------------------------------------------
       */

      const skuSet =
        new Set<string>();

      skus.forEach(
        (sku, skuIndex) => {
          const normalizedSku =
            sku.sku
              .trim()
              .toLowerCase();

          /**
           * ----------------------------------------------------
           * Duplicate SKU
           * ----------------------------------------------------
           */

          if (
            skuSet.has(
              normalizedSku
            )
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "skus",
                skuIndex,
                "sku",
              ],

              message:
                `SKU "${sku.sku}" terduplikasi dalam payload.`,
            });
          }

          skuSet.add(
            normalizedSku
          );

          /**
           * ----------------------------------------------------
           * SKU harus memilih tepat satu option dari setiap group.
           * ----------------------------------------------------
           */

          if (
            sku.optionRefs.length !==
            groups.length
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "skus",
                skuIndex,
                "optionRefs",
              ],

              message:
                "Setiap SKU harus memiliki tepat satu option dari setiap group varian.",
            });

            return;
          }

          /**
           * ----------------------------------------------------
           * Tidak boleh ada duplicate reference dalam SKU.
           * ----------------------------------------------------
           */

          if (
            new Set(
              sku.optionRefs
            ).size !==
            sku.optionRefs.length
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "skus",
                skuIndex,
                "optionRefs",
              ],

              message:
                "Option reference dalam satu SKU tidak boleh duplikat.",
            });
          }

          /**
           * ----------------------------------------------------
           * Pastikan SKU hanya memilih satu option dari
           * setiap variant group.
           * ----------------------------------------------------
           */

          const selectedGroupNames =
            new Set<string>();

          sku.optionRefs.forEach(
            (
              optionRef,
              optionIndex
            ) => {
              const groupName =
                refToGroup.get(
                  optionRef
                );

              /**
               * ------------------------------------------------
               * Reference tidak ditemukan
               * ------------------------------------------------
               */

              if (!groupName) {
                context.addIssue({
                  code:
                    z.ZodIssueCode.custom,

                  path: [
                    "skus",
                    skuIndex,
                    "optionRefs",
                    optionIndex,
                  ],

                  message:
                    "SKU memiliki optionRef yang tidak ditemukan pada variantGroups payload.",
                });

                return;
              }

              /**
               * ------------------------------------------------
               * Dua option dari group yang sama
               * ------------------------------------------------
               */

              if (
                selectedGroupNames.has(
                  groupName
                )
              ) {
                context.addIssue({
                  code:
                    z.ZodIssueCode.custom,

                  path: [
                    "skus",
                    skuIndex,
                    "optionRefs",
                    optionIndex,
                  ],

                  message:
                    `SKU hanya boleh memilih satu option dari group "${groupName}".`,
                });
              }

              selectedGroupNames.add(
                groupName
              );
            }
          );
        }
      );
    }
  );
}

/**
 * ============================================================
 * CREATE
 * ============================================================
 *
 * variantGroups default []:
 * create tanpa variant memang valid.
 */
export const ProductCreateSchema =
  addVariantSkuValidation(
    z.object({
      ...ProductBaseFields,

      variantGroups: z
        .array(ProductVariantGroupInputSchema)
        .default([]),

      skus: z
        .array(ProductSkuInputSchema)
        .default([]),
    })
  );

/**
 * ============================================================
 * UPDATE
 * ============================================================
 *
 * variantGroups undefined:
 *   jangan sentuh variant existing.
 *
 * variantGroups []:
 *   hapus/nonaktifkan konfigurasi variant secara eksplisit.
 *
 * variantGroups [...]:
 *   sinkronkan konfigurasi variant.
 *
 * Hal yang sama berlaku untuk skus.
 */
export const ProductUpdateSchema =
  addVariantSkuValidation(
    z.object({
      categoryId: ProductBaseFields.categoryId.optional(),
      name: ProductBaseFields.name.optional(),
      slug: ProductBaseFields.slug.optional(),
      description: ProductBaseFields.description,
      sku: ProductBaseFields.sku,

      price: ProductBaseFields.price.optional(),
      stock: ProductBaseFields.stock.optional(),

      isDiscountActive:
        ProductBaseFields.isDiscountActive.optional(),
      discountType: ProductBaseFields.discountType,
      discountValue: ProductBaseFields.discountValue,
      discountStartAt: ProductBaseFields.discountStartAt,
      discountEndAt: ProductBaseFields.discountEndAt,

      isPublished:
        ProductBaseFields.isPublished.optional(),
      featured:
        ProductBaseFields.featured.optional(),

      /**
       * Sengaja TANPA default([]).
       */
      variantGroups: z
        .array(ProductVariantGroupInputSchema)
        .optional(),

      skus: z
        .array(ProductSkuInputSchema)
        .optional(),
    })
  );

/**
 * Compatibility alias sementara.
 *
 * Code baru:
 *   ProductCreateSchema
 *   ProductUpdateSchema
 *
 * Jangan gunakan ProductSchema untuk update.
 */
export const ProductSchema = ProductCreateSchema;

export type ProductCreateInput =
  z.infer<typeof ProductCreateSchema>;

export type ProductUpdateInput =
  z.infer<typeof ProductUpdateSchema>;

export type ProductInput =
  z.infer<typeof ProductCreateSchema>;

export type ProductVariantGroupInput =
  z.infer<typeof ProductVariantGroupInputSchema>;

export type ProductVariantOptionInput =
  z.infer<typeof ProductVariantOptionInputSchema>;

export type ProductSkuInput =
  z.infer<typeof ProductSkuInputSchema>;
