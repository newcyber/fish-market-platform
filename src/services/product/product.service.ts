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

  unit: string;

  price: number;

  stock: number;

  weight: number;

  isPublished?: boolean;

  featured?: boolean;
}

export type UpdateProductInput =
  Partial<CreateProductInput>;

export class ProductService {
  /**
   * Product List
   */
  static async getProducts(
    filters: ProductFilters = {}
  ) {
    return ProductRepository.findMany(filters);
  }

  /**
   * Product Detail
   */
  static async getProductById(
    id: string
  ) {
    return ProductRepository.findById(id);
  }

  /**
   * Product by Slug
   */
  static async getProductBySlug(
    slug: string
  ) {
    return ProductRepository.findBySlug(slug);
  }

  /**
   * Create Product
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

    return ProductRepository.create({
      ...input,
    });
  }

  /**
   * Update Product
   */
  static async updateProduct(
    id: string,
    input: UpdateProductInput
  ) {
    const product =
      await ProductRepository.findById(id);

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

    return ProductRepository.update(
      id,
      {
        ...input,
      }
    );
  }

  /**
   * Soft Delete Product
   */
  static async deleteProduct(
    id: string
  ) {
    const product =
      await ProductRepository.findById(id);

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
   * Publish Product
   */
  static async publishProduct(
    id: string
  ) {
    const product =
      await ProductRepository.findById(id);

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    return ProductRepository.update(id, {
      isPublished: true,
    });
  }

  /**
   * Unpublish Product
   */
  static async unpublishProduct(
    id: string
  ) {
    const product =
      await ProductRepository.findById(id);

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    return ProductRepository.update(id, {
      isPublished: false,
    });
  }

  /**
 * Toggle Publish Product
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
    return this.unpublishProduct(id);
  }

  return this.publishProduct(id);
}

  /**
   * Set Featured
   */
  static async setFeatured(
    id: string,
    featured: boolean
  ) {
    const product =
      await ProductRepository.findById(id);

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    return ProductRepository.update(id, {
      featured,
    });
  }
}

export default ProductService;