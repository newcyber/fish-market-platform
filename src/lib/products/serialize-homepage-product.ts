/**
 * ============================================================
 * SERIALIZE HOMEPAGE PRODUCT
 * ============================================================
 *
 * Harga homepage mengikuti SKU aktif dengan harga terendah.
 *
 * Untuk product single-SKU:
 * - harga = SKU.price
 * - stok  = SKU.stock
 *
 * Untuk product multi-variant:
 * - harga = harga SKU aktif terendah
 * - stok tidak ditampilkan sebagai stok product-level
 *
 * ============================================================
 */

export interface HomepageProductSerializerInput {
  id: string;

  name: string;

  slug: string;

  price: {
    toNumber: () => number;
  };

  stock: number;

  isPreOrder: boolean;

  preOrderMinDays: number | null;

  preOrderMaxDays: number | null;

  images: Array<{
    id: string;

    image: string | null;

    sortOrder: number | null;

    isThumbnail: boolean;
  }>;

  variantGroups: Array<{
    id: string;
  }>;

  skus: Array<{
    price: {
      toNumber: () => number;
    };

    stock: number;
  }>;
}

export interface HomepageProductRating {
  averageRating: number | null;
  reviewCount: number;
}

export function serializeHomepageProduct(
  product: HomepageProductSerializerInput,
  rating?: HomepageProductRating | null,
) {
  const hasVariants = product.variantGroups.length > 0;

  const hasAvailableSku = product.skus.some((sku) => sku.stock > 0);

  const lowStockVariantStocks = hasVariants
    ? product.skus
        .map((sku) => sku.stock)
        .filter((stock) => stock > 0 && stock <= 5)
    : [];

  const lowStockVariantStock =
    lowStockVariantStocks.length > 0
      ? Math.min(...lowStockVariantStocks)
      : null;

  const lowestActiveSku = product.skus.reduce<
    HomepageProductSerializerInput["skus"][number] | null
  >((lowest, sku) => {
    if (!lowest) {
      return sku;
    }

    return sku.price.toNumber() < lowest.price.toNumber() ? sku : lowest;
  }, null);

  const displayPrice = lowestActiveSku
    ? lowestActiveSku.price.toNumber()
    : product.price.toNumber();

  /**
   * Stock yang ditampilkan pada product card.
   *
   * Non-variant:
   * gunakan stock SKU aktif dengan harga terendah.
   *
   * Variant:
   * tampilkan total stock seluruh SKU aktif yang tersedia,
   * sehingga product card tetap dapat menampilkan `Stok N`.
   */
  const variantTotalStock = hasVariants
    ? product.skus.reduce(
        (total, sku) =>
          total + Math.max(0, sku.stock),
        0,
      )
    : null;

  const displayStock = hasVariants
    ? variantTotalStock
    : lowestActiveSku
      ? Math.max(0, lowestActiveSku.stock)
      : null;

  return {
    id: product.id,

    name: product.name,

    slug: product.slug,

    price: displayPrice,

    rating: rating?.averageRating ?? null,

    reviewCount: rating?.reviewCount ?? 0,

    stock: displayStock,

    isPreOrder: product.isPreOrder,

    preOrderMinDays: product.preOrderMinDays,

    preOrderMaxDays: product.preOrderMaxDays,

    isOutOfStock:
      !product.isPreOrder &&
      (hasVariants
        ? !hasAvailableSku
        : displayStock !== null && displayStock <= 0),

    images: product.images.map((image) => ({
      id: image.id,

      image: image.image,

      sortOrder: image.sortOrder,

      isThumbnail: image.isThumbnail,
    })),

    hasVariants,

    lowStockVariantStock,
  };
}
