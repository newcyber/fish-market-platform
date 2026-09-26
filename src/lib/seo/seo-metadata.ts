import type { Metadata } from "next";

import {
  SEO_DEFAULT_LOCALE,
  SEO_DEFAULT_TWITTER_CARD,
  SEO_DEFAULT_TYPE,
} from "./seo.constants";

import {
  normalizeSeoText,
  resolveCanonicalUrl,
  resolveSeoBaseUrl,
  resolveSeoDescription,
  resolveSeoImageUrl,
  resolveSeoTitle,
} from "./seo.utils";

/**
 * ============================================================
 * SEO SETTINGS
 * ============================================================
 */

export type SeoSettings = {
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  seoCanonicalUrl: string | null;
  seoOgTitle: string | null;
  seoOgDescription: string | null;
  seoOgImage: string | null;
  seoTwitterCard: string | null;
  seoRobotsIndex: boolean;
  seoRobotsFollow: boolean;
  seoGoogleVerification: string | null;
  seoAiEnabled: boolean;
  storeName: string;
  storeDescription: string | null;
};

/**
 * ============================================================
 * PAGE SEO OVERRIDES
 * ============================================================
 */

export type SeoPageOverrides = {
  title?: string | null;
  description?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  pathname?: string;
  image?: string | null;
  baseUrl?: string | null;
  noIndex?: boolean;
  noFollow?: boolean;
};

/**
 * ============================================================
 * BUILD SEO METADATA
 * ============================================================
 *
 * Prioritas canonical/base URL:
 *
 * 1. overrides.baseUrl
 *    Digunakan oleh halaman yang secara eksplisit menentukan
 *    host canonical, misalnya storefront atau landing page.
 *
 * 2. settings.seoCanonicalUrl
 *    Digunakan sebagai konfigurasi SEO global.
 *
 * 3. Production storefront URL
 *    Digunakan sebagai fallback aman ketika environment lokal
 *    memiliki NEXT_PUBLIC_APP_URL=http://localhost:3000.
 *
 * Catatan:
 * Jangan menggunakan NEXT_PUBLIC_APP_URL / APP_URL sebagai
 * fallback utama untuk canonical SEO karena nilai tersebut
 * dapat berbeda antara local development dan production.
 *
 * ============================================================
 */

export function buildSeoMetadata(
  settings: SeoSettings,
  overrides: SeoPageOverrides = {},
): Metadata {
  /**
   * ==========================================================
   * STORE IDENTITY
   * ==========================================================
   */

  const storeName =
    normalizeSeoText(settings.storeName) || "Pisjo Market Platform";

  /**
   * ==========================================================
   * GLOBAL SEO TITLE
   * ==========================================================
   */

  const globalTitle = resolveSeoTitle(settings.seoTitle, storeName);

  /**
   * ==========================================================
   * GLOBAL SEO DESCRIPTION
   * ==========================================================
   */

  const globalDescription = resolveSeoDescription(
    settings.seoDescription,
    settings.storeDescription?.trim() || undefined,
  );

  /**
   * ==========================================================
   * CANONICAL / BASE URL
   * ==========================================================
   *
   * Explicit page override harus menang.
   *
   * Contoh:
   *
   * Product page:
   * baseUrl = https://app.pusatikansegar.com
   *
   * Landing page:
   * baseUrl = https://pusatikansegar.com
   *
   * Jika tidak diberikan, gunakan seoCanonicalUrl dari
   * database.
   *
   * Jika keduanya tidak tersedia, resolveSeoBaseUrl() akan
   * menggunakan fallback production yang aman.
   *
   * Jangan mengambil NEXT_PUBLIC_APP_URL secara langsung di
   * sini karena local .env dapat berisi localhost.
   * ==========================================================
   */

  const baseUrl = resolveSeoBaseUrl(
    overrides.baseUrl ?? settings.seoCanonicalUrl ?? undefined,
    "https://app.pusatikansegar.com",
  );

  /**
   * ==========================================================
   * PAGE TITLE
   * ==========================================================
   */

  const title = resolveSeoTitle(overrides.title, globalTitle);

  /**
   * ==========================================================
   * PAGE DESCRIPTION
   * ==========================================================
   */

  const description = resolveSeoDescription(
    overrides.description,
    globalDescription,
  );

  /**
   * ==========================================================
   * CANONICAL URL
   * ==========================================================
   */

  const pathname = overrides.pathname ?? "/";

  const canonicalUrl = resolveCanonicalUrl(baseUrl, pathname);

  /**
   * ==========================================================
   * OPEN GRAPH
   * ==========================================================
   */

  const ogTitle =
    normalizeSeoText(overrides.ogTitle) ||
    normalizeSeoText(settings.seoOgTitle) ||
    title;

  const ogDescription =
    normalizeSeoText(overrides.ogDescription) ||
    normalizeSeoText(settings.seoOgDescription) ||
    description;

  /**
   * ==========================================================
   * SEO IMAGE
   * ==========================================================
   */

  const image = resolveSeoImageUrl(
    overrides.image || settings.seoOgImage,
    baseUrl,
  );

  /**
   * ==========================================================
   * TWITTER CARD
   * ==========================================================
   */

  const twitterCard =
    settings.seoTwitterCard?.trim() || SEO_DEFAULT_TWITTER_CARD;

  /**
   * ==========================================================
   * ROBOTS
   * ==========================================================
   */

  const robotsIndex =
    overrides.noIndex === true ? false : settings.seoRobotsIndex;

  const robotsFollow =
    overrides.noFollow === true ? false : settings.seoRobotsFollow;

  /**
   * ==========================================================
   * METADATA
   * ==========================================================
   */

  const metadata: Metadata = {
    /**
     * metadataBase penting untuk memastikan relative URL
     * seperti Open Graph image dapat di-resolve dengan benar.
     */
    metadataBase: new URL(baseUrl),

    title: {
      absolute: title,
    },

    description,

    keywords: normalizeSeoText(settings.seoKeywords) || undefined,

    alternates: {
      canonical: canonicalUrl,
    },

    robots: {
      index: robotsIndex,
      follow: robotsFollow,
    },

    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: storeName,
      locale: SEO_DEFAULT_LOCALE,
      type: SEO_DEFAULT_TYPE,

      ...(image
        ? {
            images: [
              {
                url: image,
                alt: ogTitle,
              },
            ],
          }
        : {}),
    },

    twitter: {
      card: twitterCard === "summary" ? "summary" : "summary_large_image",

      title: ogTitle,

      description: ogDescription,

      ...(image
        ? {
            images: [image],
          }
        : {}),
    },
  };

  /**
   * ==========================================================
   * GOOGLE SEARCH CONSOLE VERIFICATION
   * ==========================================================
   */

  const googleVerification = normalizeSeoText(settings.seoGoogleVerification);

  if (googleVerification) {
    metadata.verification = {
      google: googleVerification,
    };
  }

  return metadata;
}
