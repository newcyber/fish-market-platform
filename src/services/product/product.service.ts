import { ProductRepository } from "@/repositories/ProductRepository";

export interface ProductFilters {
  search?: string;

  categoryId?: string;

  published?: boolean;

  featured?: boolean;
}

export interface CreateProductInput {
  categoryId: string;

  name: string;

  slug: string;

  description?: string;

  sku?: string;

  price: number;

  stock: number;

  variantOptions?: string[];

  weightOptions?: string[];

  isPublished?: boolean;

  featured?: boolean;
}

export type UpdateProductInput =
  Partial<CreateProductInput>;

export class ProductService {
  /**
   * ============================================================
   * PRODUCT LIST
   * ============================================================
   */

  static async getProducts(
    filters: ProductFilters = {}
  ) {
    return ProductRepository.findMany(
      filters
    );
  }

  /**
   * ============================================================
   * PRODUCT DETAIL
   * ============================================================
   */

  static async getProductById(
    id: string
  ) {
    return ProductRepository.findById(
      id
    );
  }

  /**
   * ============================================================
   * PRODUCT BY SLUG
   * ============================================================
   */

  static async getProductBySlug(
    slug: string
  ) {
    return ProductRepository.findBySlug(
      slug
    );
  }

  /**
   * ============================================================
   * CREATE PRODUCT
   * ============================================================
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

    /**
     * Bersihkan opsi kosong dan duplikat.
     */

    const variantOptions =
      Array.from(
        new Set(
          (input.variantOptions ?? [])
            .map((item) =>
              item.trim()
            )
            .filter(
              Boolean
            )
        )
      );

    const weightOptions =
      Array.from(
        new Set(
          (input.weightOptions ?? [])
            .map((item) =>
              item.trim()
            )
            .filter(
              Boolean
            )
        )
      );

    return ProductRepository.create({
      categoryId:
        input.categoryId,

      name:
        input.name,

      slug:
        input.slug,

      description:
        input.description || null,

      sku:
        input.sku || null,

      price:
        input.price,

      stock:
        input.stock,

      isPublished:
        input.isPublished ?? true,

      featured:
        input.featured ?? false,

      variantOptions: {
        create:
          variantOptions.map(
            (label, index) => ({
              label,

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
            (label, index) => ({
              label,

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
   * ============================================================
   * UPDATE PRODUCT
   * ============================================================
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

    /**
     * ==========================================================
     * CHECK SLUG
     * ==========================================================
     */

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

    /**
     * ==========================================================
     * CHECK SKU
     * ==========================================================
     */

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

    /**
     * ==========================================================
     * CLEAN OPTIONS
     * ==========================================================
     */

    const variantOptions =
      input.variantOptions !== undefined
        ? Array.from(
            new Set(
              input.variantOptions
                .map((item) =>
                  item.trim()
                )
                .filter(Boolean)
            )
          )
        : undefined;

    const weightOptions =
      input.weightOptions !== undefined
        ? Array.from(
            new Set(
              input.weightOptions
                .map((item) =>
                  item.trim()
                )
                .filter(Boolean)
            )
          )
        : undefined;

    /**
     * ==========================================================
     * UPDATE PRODUCT
     * ==========================================================
     *
     * deleteMany() menghapus opsi lama.
     * create() membuat ulang opsi sesuai
     * kondisi terbaru dari Admin.
     */

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
          input.description || null,

        sku:
          input.sku || null,

        price:
          input.price,

        stock:
          input.stock,

        isPublished:
          input.isPublished,

        featured:
          input.featured,

        ...(variantOptions !== undefined
          ? {
              variantOptions: {
                deleteMany: {},

                create:
                  variantOptions.map(
                    (
                      label,
                      index
                    ) => ({
                      label,

                      sortOrder:
                        index,

                      isActive:
                        true,
                    })
                  ),
              },
            }
          : {}),

        ...(weightOptions !== undefined
          ? {
              weightOptions: {
                deleteMany: {},

                create:
                  weightOptions.map(
                    (
                      label,
                      index
                    ) => ({
                      label,

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
   * ============================================================
   * SOFT DELETE PRODUCT
   * ============================================================
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
   * ============================================================
   * PUBLISH PRODUCT
   * ============================================================
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
        isPublished: true,
      }
    );
  }

  /**
   * ============================================================
   * UNPUBLISH PRODUCT
   * ============================================================
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
        isPublished: false,
      }
    );
  }

  /**
   * ============================================================
   * TOGGLE PUBLISH
   * ============================================================
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

    if (product.isPublished) {
      return this.unpublishProduct(
        id
      );
    }

    return this.publishProduct(
      id
    );
  }

  /**
   * ============================================================
   * SET FEATURED
   * ============================================================
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