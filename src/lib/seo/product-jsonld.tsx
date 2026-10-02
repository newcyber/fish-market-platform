import { resolveSeoImageUrl } from "@/lib/seo/seo.utils";

type ProductImage = {
  image: string;
  isThumbnail?: boolean | null;
  sortOrder?: number | null;
  mediaType?: "IMAGE" | "VIDEO" | null;
  createdAt?: string | Date | null;
};

type ProductSku = {
  price: unknown;
  stock?: number | null;
  isActive?: boolean | null;
};

type ProductReviewJsonLd = {
  username: string;
  rating: number;
  review?: string | null;
  createdAt: string | Date;
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
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  } | null;
  reviews?: ProductReviewJsonLd[];
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
    .filter(
      (image) =>
        !image.mediaType ||
        image.mediaType === "IMAGE",
    )
    .slice()
    .sort(
      (a, b) =>
        Number(Boolean(b.isThumbnail)) - Number(Boolean(a.isThumbnail)) ||
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    )
    .map((image) => resolveSeoImageUrl(image.image, baseUrl))
    .filter((image): image is string => Boolean(image));
}

function resolveVideoObjects(
  product: ProductJsonLdInput,
  options: ProductJsonLdOptions,
): Record<string, unknown>[] {
  if (!product.images || product.images.length === 0) {
    return [];
  }

  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const name = normalizeText(product.name);

  if (!name) {
    return [];
  }

  const description =
    normalizeText(product.description) || `${name} dari ${options.storeName}`;

  const thumbnailUrl = resolveProductImage(product.images, baseUrl)[0];

  if (!thumbnailUrl) {
    return [];
  }

  return product.images
    .filter(
      (media) =>
        media.mediaType === "VIDEO" &&
        Boolean(normalizeText(media.image)),
    )
    .map((media) => {
      const contentUrl = normalizeText(media.image);

      if (!contentUrl) {
        return null;
      }

      const videoObject: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: `${name} - Video`,
        description,
        thumbnailUrl,
        contentUrl,
      };

      const uploadDate = media.createdAt
        ? resolveReviewDate(media.createdAt)
        : undefined;

      if (uploadDate) {
        videoObject.uploadDate = uploadDate;
      }

      return videoObject;
    })
    .filter(
      (video): video is Record<string, unknown> => video !== null,
    );
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

  // Variant products keep their real inventory on ProductSku.
  // Using product.stock alone can incorrectly mark a product with
  // available variants as OutOfStock in Google's structured data.
  const activeSkus =
    product.skus?.filter((sku) => sku.isActive !== false) ?? [];

  if (activeSkus.length > 0) {
    const hasAvailableSku = activeSkus.some(
      (sku) => typeof sku.stock === "number" && sku.stock > 0,
    );

    return hasAvailableSku
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";
  }

  if (typeof product.stock === "number" && product.stock <= 0) {
    return "https://schema.org/OutOfStock";
  }

  return "https://schema.org/InStock";
}

function resolveCanonicalUrl(baseUrl: string, slug: string): string {
  return new URL(`/products/${encodeURIComponent(slug)}`, baseUrl).toString();
}

function resolveReviewDate(value: string | Date): string | undefined {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function resolveReviews(
  reviews: ProductReviewJsonLd[] | undefined,
): Record<string, unknown>[] {
  if (!reviews || reviews.length === 0) {
    return [];
  }

  return reviews
    .map((review) => {
      const authorName = normalizeText(review.username);

      if (!authorName) {
        return null;
      }

      const rating = Number(review.rating);

      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return null;
      }

      const reviewSchema: Record<string, unknown> = {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: authorName,
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: rating,
          bestRating: 5,
          worstRating: 1,
        },
      };

      const reviewBody = normalizeText(review.review);

      if (reviewBody) {
        reviewSchema.reviewBody = reviewBody;
      }

      const datePublished = resolveReviewDate(review.createdAt);

      if (datePublished) {
        reviewSchema.datePublished = datePublished;
      }

      return reviewSchema;
    })
    .filter(
      (review): review is Record<string, unknown> => review !== null,
    );
}

function buildBreadcrumbJsonLd(
  product: ProductJsonLdInput,
  options: ProductJsonLdOptions,
): Record<string, unknown> | null {
  const name = normalizeText(product.name);

  if (!name) {
    return null;
  }

  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const productUrl = resolveCanonicalUrl(baseUrl, product.slug);
  const productsUrl = new URL("/products", baseUrl).toString();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Produk",
        item: productsUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name,
        item: productUrl,
      },
    ],
  };
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
  const reviews = resolveReviews(product.reviews);

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

  if (
    product.aggregateRating &&
    product.aggregateRating.reviewCount > 0 &&
    product.aggregateRating.ratingValue > 0
  ) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.aggregateRating.ratingValue.toFixed(1)),
      bestRating: 5,
      worstRating: 1,
      reviewCount: product.aggregateRating.reviewCount,
    };
  }

  if (reviews.length > 0) {
    productSchema.review = reviews;
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
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: options.storeName,
      },
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
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(product, options);

  if (!jsonLd) {
    return null;
  }

  const videoJsonLd = resolveVideoObjects(product, options);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {videoJsonLd.length > 0
        ? videoJsonLd.map((video, index) => (
            <script
              key={`product-video-jsonld-${index}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(video).replace(/</g, "\\u003c"),
              }}
            />
          ))
        : null}

      {breadcrumbJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd).replace(
              /</g,
              "\\u003c",
            ),
          }}
        />
      ) : null}
    </>
  );
}