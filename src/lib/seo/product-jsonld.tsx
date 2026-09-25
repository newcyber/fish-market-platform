import { resolveSeoImageUrl } from "@/lib/seo/seo.utils";

type ProductImage = {
  image: string;
  isThumbnail?: boolean | null;
  sortOrder?: number | null;
};

type ProductSku = {
  price: unknown;
  stock?: number | null;
  isActive?: boolean | null;
};

export type ProductJsonLdInput = {
  name: string;
  description?: string | null;
  slug: string;
  sku?: string | null;
  category?: {
    name?: string | null;
  } | null;
  images?: ProductImage[];
  skus?: ProductSku[];
  price?: unknown;
  stock?: number | null;
  isPublished?: boolean;
  isPreOrder?: boolean;
};

type ProductJsonLdOptions = {
  baseUrl: string;
  storeName: string;
  currency?: string;
};

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

function toFiniteNumber(value: unknown): number | undefined {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function resolveProductImage(
  images: ProductImage[] | undefined,
  baseUrl: string,
): string[] {
  if (!images || images.length === 0) {
    return [];
  }

  return images
    .slice()
    .sort(
      (a, b) =>
        Number(Boolean(b.isThumbnail)) - Number(Boolean(a.isThumbnail)) ||
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    )
    .map((image) => resolveSeoImageUrl(image.image, baseUrl))
    .filter((image): image is string => Boolean(image));
}

function resolvePrices(product: ProductJsonLdInput): number[] {
  const skuPrices =
    product.skus
      ?.filter((sku) => sku.isActive !== false)
      .map((sku) => toFiniteNumber(sku.price))
      .filter((price): price is number => price !== undefined) ?? [];

  if (skuPrices.length > 0) {
    return skuPrices;
  }

  const fallbackPrice = toFiniteNumber(product.price);

  return fallbackPrice === undefined ? [] : [fallbackPrice];
}

function resolveAvailability(product: ProductJsonLdInput): string {
  if (product.isPreOrder) {
    return "https://schema.org/PreOrder";
  }

  if (typeof product.stock === "number" && product.stock <= 0) {
    return "https://schema.org/OutOfStock";
  }

  return "https://schema.org/InStock";
}

function resolveCanonicalUrl(baseUrl: string, slug: string): string {
  return new URL(`/products/${encodeURIComponent(slug)}`, baseUrl).toString();
}

export function buildProductJsonLd(
  product: ProductJsonLdInput,
  options: ProductJsonLdOptions,
): Record<string, unknown> | null {
  if (product.isPublished === false) {
    return null;
  }

  const name = normalizeText(product.name);

  if (!name) {
    return null;
  }

  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const productUrl = resolveCanonicalUrl(baseUrl, product.slug);
  const prices = resolvePrices(product);
  const images = resolveProductImage(product.images, baseUrl);

  const description =
    normalizeText(product.description) || `${name} dari ${options.storeName}`;

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: options.storeName,
    },
  };

  if (images.length > 0) {
    productSchema.image = images;
  }

  const productSku = normalizeText(product.sku);

  if (productSku) {
    productSchema.sku = productSku;
  }

  const categoryName = normalizeText(product.category?.name);

  if (categoryName) {
    productSchema.category = categoryName;
  }

  if (prices.length > 0) {
    const lowPrice = Math.min(...prices);
    const highPrice = Math.max(...prices);

    productSchema.offers = {
      "@type": "AggregateOffer",
      url: productUrl,
      priceCurrency: options.currency ?? "IDR",
      lowPrice,
      highPrice,
      offerCount: prices.length,
      availability: resolveAvailability(product),
    };
  }

  return productSchema;
}

export function ProductJsonLd({
  product,
  options,
}: {
  product: ProductJsonLdInput;
  options: ProductJsonLdOptions;
}) {
  const jsonLd = buildProductJsonLd(product, options);

  if (!jsonLd) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
