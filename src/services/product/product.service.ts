import {
  ProductRepository,
} from "@/repositories/ProductRepository";

import {
  Prisma,
  ProductDiscountType,
} from "@prisma/client";

/**
 * ============================================================
 *
 * PRODUCT FILTERS
 *
 * ============================================================
 */

export interface ProductFilters {
  search?: string;

  categoryId?: string;

  published?: boolean;

  featured?: boolean;
}

/**
 * ============================================================
 *
 * PRODUCT VARIANT OPTION INPUT
 *
 * ============================================================
 */

export interface ProductVariantOptionInput {
  id?: string;

  label: string;

  /**
   * Nilai tambahan terhadap harga produk.
   *
   * Contoh:
   *
   * Utuh        = 0
   * Dibersihkan = 5000
   * Fillet      = 10000
   */
  priceAdjustment: number;
}

/**
 * ============================================================
 *
 * PRODUCT WEIGHT OPTION INPUT
 *
 * ============================================================
 */

export interface ProductWeightOptionInput {
  id?: string;

  label: string;

  price: number;
}

/**
 * ============================================================
 * PRODUCT WEIGHT × VARIANT PRICE INPUT
 * ============================================================
 */

export interface ProductWeightVariantPriceInput {
  weightLabel: string;

  variantLabel: string;

  price: number;
}

/**
 * ============================================================
 *
 * CREATE PRODUCT INPUT
 *
 * ============================================================
 */

export interface CreateProductInput {
  categoryId: string;

  name: string;

  slug: string;

  description?: string | null;

  sku?: string | null;

  /**
   * ============================================================
   * PRODUCT PRICE
   * ============================================================
   *
   * Harga dasar produk.
   *
   * Digunakan sebagai fallback apabila produk
   * tidak menggunakan pilihan berat.
   */

  price: number;

  /**
   * ============================================================
   * PRODUCT DISCOUNT
   * ============================================================
   *
   * Konfigurasi diskon produk.
   *
   * Contoh percentage:
   *
   * isDiscountActive: true
   * discountType: PERCENTAGE
   * discountValue: 10
   *
   * Artinya:
   * Diskon 10%.
   *
   * ------------------------------------------------------------
   *
   * Contoh fixed amount:
   *
   * isDiscountActive: true
   * discountType: FIXED_AMOUNT
   * discountValue: 5000
   *
   * Artinya:
   * Diskon Rp5.000.
   */

  isDiscountActive?: boolean;

  discountType?:
    | ProductDiscountType
    | null;

  discountValue?:
    | number
    | null;

  /**
   * Tanggal mulai diskon.
   *
   * Jika null, diskon dapat langsung aktif.
   */

  discountStartAt?:
    | Date
    | null;

  /**
   * Tanggal berakhir diskon.
   *
   * Jika null, diskon tidak memiliki
   * batas waktu berakhir.
   */

  discountEndAt?:
    | Date
    | null;

  /**
   * ============================================================
   * PRODUCT STOCK
   * ============================================================
   */

  stock: number;

  /**
   * ============================================================
   * PRODUCT VARIANT OPTIONS
   * ============================================================
   *
   * Contoh:
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
   */

  variantOptions?:
    ProductVariantOptionInput[];

  /**
   * ============================================================
   * PRODUCT WEIGHT OPTIONS
   * ============================================================
   *
   * Contoh:
   *
   * [
   *   {
   *     label: "500gr",
   *     price: 25000,
   *   },
   *   {
   *     label: "1kg",
   *     price: 45000,
   *   },
   * ]
   */

  weightOptions?:
    ProductWeightOptionInput[];

    /**
 * ============================================================
 * PRODUCT WEIGHT × VARIANT PRICES
 * ============================================================
 */

weightVariantPrices?:
  ProductWeightVariantPriceInput[];

  /**
   * ============================================================
   * PRODUCT STATUS
   * ============================================================
   */

  isPublished?: boolean;

  featured?: boolean;
}

/**
 * ============================================================
 *
 * UPDATE PRODUCT INPUT
 *
 * ============================================================
 */

export type UpdateProductInput =
  Partial<CreateProductInput>;

/**
 * ============================================================
 *
 * NORMALIZE VARIANT OPTIONS
 *
 * ============================================================
 *
 * Tujuan:
 *
 * - Mempertahankan ID option lama ketika update product.
 * - Membersihkan whitespace pada label.
 * - Menolak label kosong.
 * - Menolak harga adjustment negatif / invalid.
 * - Mencegah duplicate label secara case-insensitive.
 *
 * PENTING:
 *
 * id tidak dibuat ulang di sini.
 *
 * Jika option berasal dari database:
 *
 * {
 *   id: "existing-id",
 *   label: "Utuh",
 *   priceAdjustment: 0
 * }
 *
 * maka ID tersebut tetap dipertahankan sampai proses update.
 *
 * Jika option baru:
 *
 * {
 *   label: "Fillet",
 *   priceAdjustment: 10000
 * }
 *
 * maka id tetap undefined dan service akan membuat record baru.
 * ============================================================
 */

function normalizeVariantOptions(
  options:
    | ProductVariantOptionInput[]
    | undefined
): ProductVariantOptionInput[] | undefined {
  if (
    options ===
    undefined
  ) {
    return undefined;
  }

  const normalizedOptions:
    ProductVariantOptionInput[] =
    [];

  const usedLabels =
    new Set<string>();

  for (
    const option of
    options
  ) {
    const label =
      option.label.trim();

    if (!label) {
      continue;
    }

    const priceAdjustment =
      Number(
        option.priceAdjustment
      );

    if (
      !Number.isFinite(
        priceAdjustment
      ) ||
      priceAdjustment < 0
    ) {
      throw new Error(
        `Harga tambahan untuk varian "${label}" tidak valid.`
      );
    }

    const normalizedLabel =
      label.toLowerCase();

    if (
      usedLabels.has(
        normalizedLabel
      )
    ) {
      throw new Error(
        `Varian "${label}" terduplikasi.`
      );
    }

    usedLabels.add(
      normalizedLabel
    );

    normalizedOptions.push({
      /**
       * Existing option:
       * preserve ID.
       *
       * New option:
       * ID tetap undefined.
       */
      ...(option.id
        ? {
            id:
              option.id,
          }
        : {}),

      label,

      priceAdjustment,
    });
  }

  return normalizedOptions;
}

/**
 * ============================================================
 *
 * NORMALIZE WEIGHT OPTIONS
 *
 * ============================================================
 *
 * Tujuan:
 *
 * - Mempertahankan ID weight option lama.
 * - Membersihkan whitespace pada label.
 * - Menolak label kosong.
 * - Menolak harga negatif / invalid.
 * - Mencegah duplicate label secara case-insensitive.
 *
 * PENTING:
 *
 * Weight option dapat direferensikan oleh FlashSaleItem.
 *
 * Karena itu ID existing TIDAK BOLEH hilang saat update.
 * ============================================================
 */

function normalizeWeightOptions(
  options:
    | ProductWeightOptionInput[]
    | undefined
): ProductWeightOptionInput[] | undefined {
  if (
    options ===
    undefined
  ) {
    return undefined;
  }

  const normalizedOptions:
    ProductWeightOptionInput[] =
    [];

  const usedLabels =
    new Set<string>();

  for (
    const option of
    options
  ) {
    const label =
      option.label.trim();

    if (!label) {
      continue;
    }

    const price =
      Number(
        option.price
      );

    if (
      !Number.isFinite(
        price
      ) ||
      price < 0
    ) {
      throw new Error(
        `Harga untuk pilihan berat "${label}" tidak valid.`
      );
    }

    const normalizedLabel =
      label.toLowerCase();

    if (
      usedLabels.has(
        normalizedLabel
      )
    ) {
      throw new Error(
        `Pilihan berat "${label}" terduplikasi.`
      );
    }

    usedLabels.add(
      normalizedLabel
    );

    normalizedOptions.push({
      /**
       * Existing weight:
       * preserve ID.
       *
       * New weight:
       * ID tetap undefined.
       */
      ...(option.id
        ? {
            id:
              option.id,
          }
        : {}),

      label,

      price,
    });
  }

  return normalizedOptions;
}

/**
 * ============================================================
 * NORMALIZE WEIGHT × VARIANT PRICES
 * ============================================================
 */

function normalizeWeightVariantPrices(
  options:
    | ProductWeightVariantPriceInput[]
    | undefined
):
  | ProductWeightVariantPriceInput[]
  | undefined {
  if (options === undefined) {
    return undefined;
  }

  const normalized:
    ProductWeightVariantPriceInput[] = [];

  const usedKeys =
    new Set<string>();

  for (const option of options) {
    const weightLabel =
      option.weightLabel.trim();

    const variantLabel =
      option.variantLabel.trim();

    if (
      !weightLabel ||
      !variantLabel
    ) {
      continue;
    }

    const price =
      Number(option.price);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      throw new Error(
        `Harga kombinasi "${weightLabel} × ${variantLabel}" tidak valid.`
      );
    }

    const key =
      `${weightLabel.toLowerCase()}::${variantLabel.toLowerCase()}`;

    if (
      usedKeys.has(key)
    ) {
      throw new Error(
        `Harga kombinasi "${weightLabel} × ${variantLabel}" terduplikasi.`
      );
    }

    usedKeys.add(key);

    normalized.push({
      weightLabel,
      variantLabel,
      price,
    });
  }

  return normalized;
}

/**
 * ============================================================
 * BUILD WEIGHT × VARIANT PRICE CREATE DATA
 * ============================================================
 */

function buildWeightVariantPriceCreateData(
  prices:
    ProductWeightVariantPriceInput[],
  weightOptions: Array<{
    id: string;
    label: string;
  }>,
  variantOptions: Array<{
    id: string;
    label: string;
  }>
) {
  const weightMap =
    new Map(
      weightOptions.map(
        (option) => [
          option.label.toLowerCase(),
          option.id,
        ]
      )
    );

  const variantMap =
    new Map(
      variantOptions.map(
        (option) => [
          option.label.toLowerCase(),
          option.id,
        ]
      )
    );

  return prices.map(
    (item) => {
      const weightId =
        weightMap.get(
          item.weightLabel.toLowerCase()
        );

      if (!weightId) {
        throw new Error(
          `Pilihan berat "${item.weightLabel}" tidak ditemukan.`
        );
      }

      const variantId =
        variantMap.get(
          item.variantLabel.toLowerCase()
        );

      if (!variantId) {
        throw new Error(
          `Varian "${item.variantLabel}" tidak ditemukan.`
        );
      }

      return {
        weightOptionId:
          weightId,

        variantOptionId:
          variantId,

        price:
          item.price,
      };
    }
  );
}

/**
 * ============================================================
 *
 * PRODUCT SERVICE
 *
 * ============================================================
 */

export class ProductService {
  /**
   * ==========================================================
   *
   * PRODUCT LIST
   *
   * ==========================================================
   */

  static async getProducts(
    filters: ProductFilters = {}
  ) {
    return ProductRepository.findMany(
      filters
    );
  }

  /**
   * ==========================================================
   *
   * PRODUCT DETAIL
   *
   * ==========================================================
   */

  static async getProductById(
    id: string
  ) {
    return ProductRepository.findById(
      id
    );
  }

  /**
   * ==========================================================
   *
   * PRODUCT BY SLUG
   *
   * ==========================================================
   */

  static async getProductBySlug(
    slug: string
  ) {
    return ProductRepository.findBySlug(
      slug
    );
  }

  /**
   * ==========================================================
   *
   * CREATE PRODUCT
   *
   * ==========================================================
   */

  static async createProduct(
    input: CreateProductInput
  ) {
    const slugExists =
      await ProductRepository.existsBySlug(
        input.slug
      );

    if (slugExists) {
      throw new Error(
        "Slug produk sudah digunakan."
      );
    }

    if (input.sku) {
      const skuExists =
        await ProductRepository.existsBySku(
          input.sku
        );

      if (skuExists) {
        throw new Error(
          "SKU produk sudah digunakan."
        );
      }
    }

    const variantOptions =
      normalizeVariantOptions(
        input.variantOptions
      ) ?? [];

    const weightOptions =
      normalizeWeightOptions(
        input.weightOptions
      ) ?? [];

    const weightVariantPrices =
      normalizeWeightVariantPrices(
        input.weightVariantPrices
      ) ?? [];

    /**
     * ==========================================================
     * CREATE PRODUCT + WEIGHTS + VARIANTS + MATRIX
     * ==========================================================
     *
     * Semua perubahan dilakukan dalam satu transaction.
     */

    return ProductRepository.transaction(
      async (tx: Prisma.TransactionClient) => {
        const product =
          await tx.product.create({
            data: {
              categoryId:
                input.categoryId,

              name:
                input.name,

              slug:
                input.slug,

              description:
                input.description?.trim() ||
                null,

              sku:
                input.sku?.trim() ||
                null,

              price:
                input.price,

              isDiscountActive:
                input.isDiscountActive ??
                false,

              discountType:
                input.isDiscountActive
                  ? input.discountType ??
                    null
                  : null,

              discountValue:
                input.isDiscountActive
                  ? input.discountValue ??
                    null
                  : null,

              discountStartAt:
                input.isDiscountActive
                  ? input.discountStartAt ??
                    null
                  : null,

              discountEndAt:
                input.isDiscountActive
                  ? input.discountEndAt ??
                    null
                  : null,

              stock:
                input.stock,

              isPublished:
                input.isPublished ??
                true,

              featured:
                input.featured ??
                false,

              variantOptions: {
                create:
                  variantOptions.map(
                    (
                      option,
                      index
                    ) => ({
                      label:
                        option.label,

                      priceAdjustment:
                        option.priceAdjustment,

                      sortOrder:
                        index,

                      isActive:
                        true,
                    })
                  ),
              },

              weightOptions: {
                create:
                  weightOptions.map(
                    (
                      option,
                      index
                    ) => ({
                      label:
                        option.label,

                      price:
                        option.price,

                      sortOrder:
                        index,

                      isActive:
                        true,
                    })
                  ),
              },
            },

            include: {
              weightOptions: {
                select: {
                  id: true,
                  label: true,
                },
              },

              variantOptions: {
                select: {
                  id: true,
                  label: true,
                },
              },
            },
          });

        /**
         * ========================================================
         * CREATE WEIGHT × VARIANT PRICES
         * ========================================================
         */

        if (
          weightVariantPrices.length > 0
        ) {
          const matrix =
            buildWeightVariantPriceCreateData(
              weightVariantPrices,

              product.weightOptions,

              product.variantOptions
            );

          if (matrix.length > 0) {
            await tx.productWeightVariantPrice.createMany({
              data: matrix.map(
                (item) => ({
                  productId:
                    product.id,

                  weightOptionId:
                    item.weightOptionId,

                  variantOptionId:
                    item.variantOptionId,

                  price:
                    item.price,
                })
              ),
            });
          }
        }

        return product;
      }
    );
  }

  /**
   * ==========================================================
   *
   * UPDATE PRODUCT
   *
   * ==========================================================
   */

  static async updateProduct(
    id: string,
    input: UpdateProductInput
  ) {
    const product =
      await ProductRepository.findById(
        id
      );

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    if (
      input.slug &&
      input.slug !== product.slug
    ) {
      const slugExists =
        await ProductRepository.existsBySlug(
          input.slug
        );

      if (slugExists) {
        throw new Error(
          "Slug produk sudah digunakan."
        );
      }
    }

    if (
      input.sku &&
      input.sku !== product.sku
    ) {
      const skuExists =
        await ProductRepository.existsBySku(
          input.sku
        );

      if (skuExists) {
        throw new Error(
          "SKU produk sudah digunakan."
        );
      }
    }

    const variantOptions =
      normalizeVariantOptions(
        input.variantOptions
      );

    const weightOptions =
      normalizeWeightOptions(
        input.weightOptions
      );

    const weightVariantPrices =
      normalizeWeightVariantPrices(
        input.weightVariantPrices
      );

    return ProductRepository.transaction(
      async (tx: Prisma.TransactionClient) => {
        /**
         * ========================================================
         * UPDATE PRODUCT CORE
         * ========================================================
         */

        await tx.product.update({
          where: {
            id,
          },

          data: {
            categoryId:
              input.categoryId,

            name:
              input.name,

            slug:
              input.slug,

            description:
              input.description !==
              undefined
                ? input.description?.trim() ||
                  null
                : undefined,

            sku:
              input.sku !== undefined
                ? input.sku?.trim() ||
                  null
                : undefined,

            price:
              input.price,

            isDiscountActive:
              input.isDiscountActive,

            discountType:
              input.isDiscountActive ===
              false
                ? null
                : input.discountType,

            discountValue:
              input.isDiscountActive ===
              false
                ? null
                : input.discountValue,

            discountStartAt:
              input.isDiscountActive ===
              false
                ? null
                : input.discountStartAt,

            discountEndAt:
              input.isDiscountActive ===
              false
                ? null
                : input.discountEndAt,

            stock:
              input.stock,

            isPublished:
              input.isPublished,

            featured:
              input.featured,
          },
        });

        /**
         * ========================================================
         * UPDATE WEIGHT + VARIANT + MATRIX
         * ========================================================
         *
         * Matrix hanya direbuild ketika weightOptions atau
         * variantOptions dikirim oleh caller.
         *
         * Jika hanya field produk biasa yang diubah,
         * matrix lama tetap aman.
         */

                /**
         * ========================================================
         * UPDATE WEIGHT + VARIANT + MATRIX
         * ========================================================
         *
         * IMPORTANT:
         *
         * Jangan menggunakan:
         *
         *   deleteMany() + createMany()
         *
         * untuk seluruh option.
         *
         * Alasannya:
         *
         * - ProductWeightOption.id direferensikan FlashSaleItem
         * - ProductWeightVariantPrice mereferensikan
         *   WeightOption + VariantOption
         * - ID existing harus dipertahankan.
         *
         * Strategi:
         *
         * 1. Hapus matrix lama.
         * 2. Update option existing berdasarkan ID.
         * 3. Create option baru.
         * 4. Hapus option lama yang sudah tidak digunakan.
         * 5. Rebuild matrix menggunakan ID option terbaru.
         *
         * ========================================================
         */

        const shouldRebuildOptions =
          variantOptions !==
            undefined ||
          weightOptions !==
            undefined;

        if (shouldRebuildOptions) {
          /**
           * ======================================================
           * LOAD EXISTING OPTIONS
           * ======================================================
           */

          const existingVariants =
            await tx.productVariantOption.findMany({
              where: {
                productId:
                  id,
              },

              select: {
                id: true,
                label: true,
              },
            });

          const existingWeights =
            await tx.productWeightOption.findMany({
              where: {
                productId:
                  id,
              },

              select: {
                id: true,
                label: true,
              },
            });

          /**
           * ======================================================
           * DELETE MATRIX FIRST
           * ======================================================
           *
           * Matrix mereferensikan:
           *
           * - ProductWeightOption
           * - ProductVariantOption
           *
           * sehingga matrix lama harus dihapus sebelum option
           * yang tidak lagi digunakan dihapus.
           */

          await tx.productWeightVariantPrice.deleteMany({
            where: {
              productId:
                id,
            },
          });

          /**
           * ======================================================
           * TRACK ACTIVE IDS
           * ======================================================
           */

          const activeVariantIds =
            new Set<string>();

          const activeWeightIds =
            new Set<string>();

          /**
           * ======================================================
           * SYNCHRONIZE VARIANTS
           * ======================================================
           */

          if (
            variantOptions !==
            undefined
          ) {
            for (
              let index = 0;
              index <
              variantOptions.length;
              index++
            ) {
              const option =
                variantOptions[index];

              /**
               * --------------------------------------------------
               * EXISTING VARIANT
               * --------------------------------------------------
               */

              if (
                option.id
              ) {
                const existing =
                  existingVariants.find(
                    (
                      item
                    ) =>
                      item.id ===
                      option.id
                  );

                /**
                 * ID harus benar-benar milik product ini.
                 */

                if (!existing) {
                  throw new Error(
                    `Variant "${option.label}" memiliki ID yang tidak valid untuk produk ini.`
                  );
                }

                await tx.productVariantOption.update({
                  where: {
                    id:
                      option.id,
                  },

                  data: {
                    label:
                      option.label,

                    priceAdjustment:
                      option.priceAdjustment,

                    sortOrder:
                      index,

                    isActive:
                      true,
                  },
                });

                activeVariantIds.add(
                  option.id
                );
              }

              /**
               * --------------------------------------------------
               * NEW VARIANT
               * --------------------------------------------------
               */

              else {
                const created =
                  await tx.productVariantOption.create({
                    data: {
                      productId:
                        id,

                      label:
                        option.label,

                      priceAdjustment:
                        option.priceAdjustment,

                      sortOrder:
                        index,

                      isActive:
                        true,
                    },

                    select: {
                      id: true,
                    },
                  });

                activeVariantIds.add(
                  created.id
                );
              }
            }
          }

          /**
           * ======================================================
           * SYNCHRONIZE WEIGHTS
           * ======================================================
           */

          if (
            weightOptions !==
            undefined
          ) {
            for (
              let index = 0;
              index <
              weightOptions.length;
              index++
            ) {
              const option =
                weightOptions[index];

              /**
               * --------------------------------------------------
               * EXISTING WEIGHT
               * --------------------------------------------------
               */

              if (
                option.id
              ) {
                const existing =
                  existingWeights.find(
                    (
                      item
                    ) =>
                      item.id ===
                      option.id
                  );

                /**
                 * ID harus benar-benar milik product ini.
                 */

                if (!existing) {
                  throw new Error(
                    `Pilihan berat "${option.label}" memiliki ID yang tidak valid untuk produk ini.`
                  );
                }

                await tx.productWeightOption.update({
                  where: {
                    id:
                      option.id,
                  },

                  data: {
                    label:
                      option.label,

                    price:
                      option.price,

                    sortOrder:
                      index,

                    isActive:
                      true,
                  },
                });

                activeWeightIds.add(
                  option.id
                );
              }

              /**
               * --------------------------------------------------
               * NEW WEIGHT
               * --------------------------------------------------
               */

              else {
                const created =
                  await tx.productWeightOption.create({
                    data: {
                      productId:
                        id,

                      label:
                        option.label,

                      price:
                        option.price,

                      sortOrder:
                        index,

                      isActive:
                        true,
                    },

                    select: {
                      id: true,
                    },
                  });

                activeWeightIds.add(
                  created.id
                );
              }
            }
          }

          /**
           * ======================================================
           * DELETE REMOVED VARIANTS
           * ======================================================
           *
           * Hanya variant yang memang tidak dikirim lagi
           * yang akan dihapus.
           *
           * Matrix lama sudah dihapus sebelumnya sehingga
           * FK ProductWeightVariantPrice tidak menghalangi.
           */

          if (
            variantOptions !==
            undefined
          ) {
            const removedVariantIds =
              existingVariants
                .map(
                  (
                    item
                  ) =>
                    item.id
                )
                .filter(
                  (
                    existingId
                  ) =>
                    !activeVariantIds.has(
                      existingId
                    )
                );

            if (
              removedVariantIds.length >
              0
            ) {
              await tx.productVariantOption.deleteMany({
                where: {
                  id: {
                    in:
                      removedVariantIds,
                  },

                  productId:
                    id,
                },
              });
            }
          }

          /**
           * ======================================================
           * DELETE REMOVED WEIGHTS
           * ======================================================
           *
           * IMPORTANT:
           *
           * Weight dapat direferensikan oleh FlashSaleItem.
           *
           * Jangan pernah menghapus weight yang masih digunakan
           * Flash Sale.
           *
           * Karena FlashSaleItem menggunakan relation:
           *
           *   weightOptionId -> ProductWeightOption
           *
           * dengan ON DELETE CASCADE.
           *
           * Kita memilih FAIL-SAFE:
           *
           * jika masih digunakan Flash Sale,
           * update dibatalkan dan user mendapat error.
           */

          if (
            weightOptions !==
            undefined
          ) {
            const removedWeightIds =
              existingWeights
                .map(
                  (
                    item
                  ) =>
                    item.id
                )
                .filter(
                  (
                    existingId
                  ) =>
                    !activeWeightIds.has(
                      existingId
                    )
                );

            if (
              removedWeightIds.length >
              0
            ) {
              const flashSaleReferences =
                await tx.flashSaleItem.findMany({
                  where: {
                    weightOptionId: {
                      in:
                        removedWeightIds,
                    },
                  },

                  select: {
                    id: true,
                    weightOptionId:
                      true,
                  },
                });

              if (
                flashSaleReferences.length >
                0
              ) {
                throw new Error(
                  "Pilihan berat tidak dapat dihapus karena masih digunakan oleh Flash Sale. Hapus atau ubah item Flash Sale terlebih dahulu."
                );
              }

              await tx.productWeightOption.deleteMany({
                where: {
                  id: {
                    in:
                      removedWeightIds,
                  },

                  productId:
                    id,
                },
              });
            }
          }

          /**
           * ======================================================
           * REBUILD MATRIX
           * ======================================================
           *
           * Matrix hanya direbuild jika:
           *
           * - weightOptions dikirim
           * - variantOptions dikirim
           * - weightVariantPrices tersedia
           */

          if (
            weightVariantPrices &&
            weightVariantPrices.length >
              0 &&
            weightOptions &&
            variantOptions
          ) {
            const createdWeights =
              await tx.productWeightOption.findMany({
                where: {
                  productId:
                    id,
                },

                select: {
                  id: true,
                  label: true,
                },
              });

            const createdVariants =
              await tx.productVariantOption.findMany({
                where: {
                  productId:
                    id,
                },

                select: {
                  id: true,
                  label: true,
                },
              });

            const matrix =
              buildWeightVariantPriceCreateData(
                weightVariantPrices,

                createdWeights,

                createdVariants
              );

            if (
              matrix.length > 0
            ) {
              await tx.productWeightVariantPrice.createMany({
                data:
                  matrix.map(
                    (
                      item
                    ) => ({
                      productId:
                        id,

                      weightOptionId:
                        item.weightOptionId,

                      variantOptionId:
                        item.variantOptionId,

                      price:
                        item.price,
                    })
                  ),
              });
            }
          }
        }

        /**
         * ========================================================
         * RETURN UPDATED PRODUCT
         * ========================================================
         */

        return tx.product.findUnique({
          where: {
            id,
          },

          include: {
            weightOptions: true,

            variantOptions: true,

            weightVariantPrices: true,
          },
        });
      }
    );
  }

  /**
   * ==========================================================
   *
   * SOFT DELETE PRODUCT
   *
   * ==========================================================
   */

  static async deleteProduct(
    id: string
  ) {
    const product =
      await ProductRepository.findById(
        id
      );

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    return ProductRepository.softDelete(
      id
    );
  }

  /**
   * ==========================================================
   *
   * PUBLISH PRODUCT
   *
   * ==========================================================
   */

  static async publishProduct(
    id: string
  ) {
    const product =
      await ProductRepository.findById(
        id
      );

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    return ProductRepository.update(
      id,
      {
        isPublished:
          true,
      }
    );
  }

  /**
   * ==========================================================
   *
   * UNPUBLISH PRODUCT
   *
   * ==========================================================
   */

  static async unpublishProduct(
    id: string
  ) {
    const product =
      await ProductRepository.findById(
        id
      );

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    return ProductRepository.update(
      id,
      {
        isPublished:
          false,
      }
    );
  }

  /**
   * ==========================================================
   *
   * TOGGLE PUBLISH
   *
   * ==========================================================
   */

  static async togglePublish(
    id: string
  ) {
    const product =
      await ProductRepository.findById(
        id
      );

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    if (
      product.isPublished
    ) {
      return this.unpublishProduct(
        id
      );
    }

    return this.publishProduct(
      id
    );
  }

  /**
   * ==========================================================
   *
   * SET FEATURED
   *
   * ==========================================================
   */

  static async setFeatured(
    id: string,
    featured: boolean
  ) {
    const product =
      await ProductRepository.findById(
        id
      );

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    return ProductRepository.update(
      id,
      {
        featured,
      }
    );
  }
}

export default ProductService;