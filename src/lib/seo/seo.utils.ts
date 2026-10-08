import { SEO_DEFAULT_DESCRIPTION, SEO_DEFAULT_TITLE } from "./seo.constants";

export function normalizeSeoText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}


export type ProductSeoContentInput = {
  productName: string;
  categoryName?: string | null;
  description?: string | null;
  storeName: string;
  locationLabel?: string;
};

export type ProductSeoContent = {
  title: string;
  description: string;
};

function compactSeoFragment(value: string | null | undefined): string {
  return normalizeSeoText(value).replace(/\s+/g, " ");
}

/**
 * Build the same product metadata that the public product page uses.
 *
 * Keeping this in one helper is important because the admin SEO analyzer
 * and the public page must evaluate the same title/description instead of
 * scoring the raw database description as if it were the meta description.
 */
export function buildProductSeoContent(
  input: ProductSeoContentInput,
): ProductSeoContent {
  const productName = compactSeoFragment(input.productName) || "Produk";
  const categoryName = compactSeoFragment(input.categoryName);
  const storeName =
    compactSeoFragment(input.storeName) || "Pisjo Market";
  const locationLabel =
    compactSeoFragment(input.locationLabel) || "Jogja";
  const rawDescription = compactSeoFragment(input.description);

  const rawTitle = `${productName} | ${storeName} ${locationLabel}`;
  const title =
    rawTitle.length <= 60
      ? rawTitle
      : `${rawTitle.slice(0, 57).trimEnd()}...`;

  const intro = categoryName
    ? `Beli ${productName} ${categoryName.toLowerCase()} di ${storeName} ${locationLabel}.`
    : `Beli ${productName} di ${storeName} ${locationLabel}.`;

  const suffix = " Cek harga, stok, dan pesan online.";

  let description = `${intro}${suffix}`;

  if (rawDescription) {
    const combined = `${intro} ${rawDescription}`;
    const normalized = resolveSeoDescription(combined);

    // Prefer real product content while guaranteeing that the product,
    // category/local intent, and transactional context remain visible.
    description = normalized;
  }

  return {
    title,
    description,
  };
}

export function resolveSeoTitle(
  value: string | null | undefined,
  fallback = SEO_DEFAULT_TITLE,
): string {
  return normalizeSeoText(value) || fallback;
}

export function resolveSeoDescription(
  value: string | null | undefined,
  fallback = SEO_DEFAULT_DESCRIPTION,
): string {
  const normalized = normalizeSeoText(value) || fallback;

  // Keep descriptions compact enough for search snippets without
  // cutting through a word whenever possible. Google may still
  // rewrite snippets, but sending a controlled description is safer.
  if (normalized.length <= 160) {
    return normalized;
  }

  const shortened = normalized.slice(0, 157).trimEnd();
  const lastSpace = shortened.lastIndexOf(" ");

  return `${(lastSpace > 100 ? shortened.slice(0, lastSpace) : shortened).trimEnd()}...`;
}

export function resolveSeoBaseUrl(
  value: string | null | undefined,
  fallback = process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "https://app.pusatikansegar.com",
): string {
  const normalized = normalizeSeoText(value);
  const candidate = normalized || fallback;

  try {
    const url = new URL(candidate);

    if (!["http:", "https:"].includes(url.protocol)) {
      return fallback.replace(/\/+$/, "");
    }

    // Canonical bases must never carry query strings or fragments.
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/+$/, "");
  } catch {
    return fallback.replace(/\/+$/, "");
  }
}

export function resolveCanonicalUrl(baseUrl: string, pathname = "/"): string {
  const normalizedBaseUrl = resolveSeoBaseUrl(baseUrl);
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  try {
    const url = new URL(normalizedPath, `${normalizedBaseUrl}/`);

    // Tracking parameters should never become canonical URLs. Functional
    // parameters such as ?category= remain untouched.
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
      "msclkid",
      "dclid",
    ];

    for (const parameter of trackingParams) {
      url.searchParams.delete(parameter);
    }

    if (url.pathname === "/") {
      url.pathname = "/";
    }

    return url.toString();
  } catch {
    return `${normalizedBaseUrl}${normalizedPath}`;
  }
}

export function resolveSeoImageUrl(
  value: string | null | undefined,
  baseUrl: string,
): string | undefined {
  const normalized = normalizeSeoText(value);

  if (!normalized) {
    return undefined;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  try {
    return new URL(normalized.replace(/^\/+/, "/"), `${resolveSeoBaseUrl(baseUrl)}/`).toString();
  } catch {
    return undefined;
  }
}
