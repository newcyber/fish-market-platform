"use server";

import { requireSuperAdmin } from "@/lib/auth/admin";

import {
  generateAiSeoRecommendation,
} from "@/lib/seo/ai-seo.service";

import type {
  AiSeoRecommendation,
  AiSeoRecommendationInput,
} from "@/lib/seo/ai-seo";

import {
  analyzeLandingPageSeo,
} from "@/lib/seo/landing-page-seo-analyzer";

import settingsService from "@/services/settings/settings.service";

import landingPageService from "@/repositories/landing-page/landing-page.service";

import { getSiteUrls } from "@/services/site/site-url.service";

export interface GenerateLandingPageSeoRecommendationActionResult {
  success: boolean;
  message: string;
  data?: AiSeoRecommendation;
}

function getString(
  value: unknown,
): string | null {
  return typeof value === "string"
    ? value.trim() || null
    : null;
}

export async function generateLandingPageSeoRecommendationAction(): Promise<GenerateLandingPageSeoRecommendationActionResult> {
  try {
    await requireSuperAdmin();

    const settings =
      await settingsService.getSettings();

    const siteUrls =
      await getSiteUrls();

    if (!settings.seoAiEnabled) {
      return {
        success: false,
        message:
          "AI SEO sedang dinonaktifkan. Aktifkan AI SEO terlebih dahulu.",
      };
    }

    const landingPage =
      await landingPageService.getLandingPage();

    const analysis =
      await analyzeLandingPageSeo();

    const images =
      landingPage.config.images ?? {};

    /**
     * ========================================================
     * CURRENT GLOBAL SEO METADATA
     * ========================================================
     *
     * Global SEO Settings menjadi sumber utama metadata
     * Landing Page.
     *
     * Hero Title tetap merupakan H1/content Landing Page
     * dan tidak digunakan sebagai SEO title.
     *
     * ========================================================
     */

    const title =
      settings.seoTitle?.trim() ||
      settings.storeName?.trim() ||
      "Pisjo Market";

    const description =
      settings.seoDescription?.trim() ||
      settings.storeDescription?.trim() ||
      "Fresh Seafood";

    const ogTitle =
      settings.seoOgTitle?.trim() ||
      title;

    const ogDescription =
      settings.seoOgDescription?.trim() ||
      description;

    const ogImage =
      getString(images.ogImage) ||
      settings.seoOgImage?.trim() ||
      null;

    const input: AiSeoRecommendationInput = {
      entityType: "site",
      entityId: landingPage.id,

      name:
        settings.storeName?.trim() ||
        "Pisjo Market",

      description,

      slug: "home",

      currentMetadata: {
        title,
        description,
        canonicalUrl:
          siteUrls.landingPageUrl,
        ogTitle,
        ogDescription,
        ogImage,
      },

      analysis:
        analysis.analysis,
    };

    const recommendation =
      await generateAiSeoRecommendation(
        input,
      );

    return {
      success: true,
      message:
        "Rekomendasi SEO Landing Page dari AI berhasil dibuat.",
      data: recommendation,
    };
  } catch (error) {
    console.error(
      "[GENERATE_LANDING_PAGE_SEO_RECOMMENDATION_ERROR]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal membuat rekomendasi SEO Landing Page dengan AI.",
    };
  }
}