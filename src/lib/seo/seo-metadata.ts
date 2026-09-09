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

export type SeoPageOverrides = {
  title?: string | null;
  description?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  pathname?: string;
  image?: string | null;
  noIndex?: boolean;
  noFollow?: boolean;
};

export function buildSeoMetadata(
  settings: SeoSettings,
  overrides: SeoPageOverrides = {}
): Metadata {
  const storeName =
    normalizeSeoText(settings.storeName) || "Pisjo Market Platform";

  const globalTitle = resolveSeoTitle(
    settings.seoTitle,
    storeName
  );

  const globalDescription = resolveSeoDescription(
    settings.seoDescription,
    settings.storeDescription?.trim() || undefined
  );

  const baseUrl = resolveSeoBaseUrl(settings.seoCanonicalUrl);

  const title = resolveSeoTitle(
    overrides.title,
    globalTitle
  );

  const description = resolveSeoDescription(
    overrides.description,
    globalDescription
  );

  const pathname = overrides.pathname ?? "/";
  const canonicalUrl = resolveCanonicalUrl(baseUrl, pathname);

  const ogTitle =
    normalizeSeoText(overrides.ogTitle) ||
    normalizeSeoText(settings.seoOgTitle) ||
    title;

  const ogDescription =
    normalizeSeoText(overrides.ogDescription) ||
    normalizeSeoText(settings.seoOgDescription) ||
    description;

  const image = resolveSeoImageUrl(
    overrides.image || settings.seoOgImage,
    baseUrl
  );

  const twitterCard =
    settings.seoTwitterCard?.trim() || SEO_DEFAULT_TWITTER_CARD;

  const robotsIndex =
    overrides.noIndex === true
      ? false
      : settings.seoRobotsIndex;

  const robotsFollow =
    overrides.noFollow === true
      ? false
      : settings.seoRobotsFollow;

  const metadata: Metadata = {
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
      card:
        twitterCard === "summary"
          ? "summary"
          : "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      ...(image ? { images: [image] } : {}),
    },
  };

  const googleVerification =
    normalizeSeoText(settings.seoGoogleVerification);

  if (googleVerification) {
    metadata.verification = {
      google: googleVerification,
    };
  }

  return metadata;
}
