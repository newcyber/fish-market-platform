import {
  ProductRepository,
} from "@/repositories/ProductRepository";

import {
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
  label: string;

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
 * Fungsi ini:
 *
 * 1. Membersihkan label.
 * 2. Memastikan priceAdjustment valid.
 * 3. Menghapus option kosong.
 * 4. Mencegah duplikasi label.
 * 5. Menjaga urutan input dari admin.
 */

function normalizeVariantOptions(
  options:
    | ProductVariantOptionInput[]
    | undefined
): ProductVariantOptionInput[] | undefined {
  if (options === undefined) {
    return undefined;
  }

  const normalizedOptions:
    ProductVariantOptionInput[] = [];

  const usedLabels =
    new Set<string>();

  for (const option of options) {
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
 */

function normalizeWeightOptions(
  options:
    | ProductWeightOptionInput[]
    | undefined
): ProductWeightOptionInput[] | undefined {
  if (options === undefined) {
    return undefined;
  }

  const normalizedOptions:
    ProductWeightOptionInput[] = [];

  const usedLabels =
    new Set<string>();

  for (const option of options) {
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
      label,
      price,
    });
  }

  return normalizedOptions;
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

    return ProductRepository.create({
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

        /**
 * ==========================================================
 * PRODUCT DISCOUNT
 * ==========================================================
 */

isDiscountActive:
  input.isDiscountActive ??
  false,

discountType:
  input.isDiscountActive
    ? input.discountType ?? null
    : null,

discountValue:
  input.isDiscountActive
    ? input.discountValue ?? null
    : null,

discountStartAt:
  input.isDiscountActive
    ? input.discountStartAt ?? null
    : null,

discountEndAt:
  input.isDiscountActive
    ? input.discountEndAt ?? null
    : null,

      stock:
        input.stock,

      isPublished:
        input.isPublished ??
        true,

      featured:
        input.featured ??
        false,

      /**
       * CREATE VARIANT OPTIONS
       */

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

      /**
       * CREATE WEIGHT OPTIONS
       */

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
    });
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

    return ProductRepository.update(
      id,
      {
        categoryId:
          input.categoryId,

        name:
          input.name,

        slug:
          input.slug,

        description:
          input.description !== undefined
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

          /**
 * ==========================================================
 * PRODUCT DISCOUNT
 * ==========================================================
 */

isDiscountActive:
  input.isDiscountActive,

discountType:
  input.isDiscountActive === false
    ? null
    : input.discountType,

discountValue:
  input.isDiscountActive === false
    ? null
    : input.discountValue,

discountStartAt:
  input.isDiscountActive === false
    ? null
    : input.discountStartAt,

discountEndAt:
  input.isDiscountActive === false
    ? null
    : input.discountEndAt,

        stock:
          input.stock,

        isPublished:
          input.isPublished,

        featured:
          input.featured,

        /**
         * UPDATE VARIANT OPTIONS
         */

        ...(variantOptions !==
        undefined
          ? {
              variantOptions: {
                deleteMany: {},

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
            }
          : {}),

        /**
         * UPDATE WEIGHT OPTIONS
         */

        ...(weightOptions !==
        undefined
          ? {
              weightOptions: {
                deleteMany: {},

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
            }
          : {}),
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