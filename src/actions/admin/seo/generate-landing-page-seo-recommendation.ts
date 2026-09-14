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

const LANDING_PAGE_URL =
  "https://pusatikansegar.com";

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

    const hero =
      landingPage.config.hero ?? {};

    const images =
      landingPage.config.images ?? {};

    const title =
      getString(hero.title);

    const description =
      getString(hero.description);

    const ogImage =
      getString(images.ogImage);

    const input: AiSeoRecommendationInput = {
      entityType: "site",
      entityId: landingPage.id,

      name: "Pisjo Market",
      description,
      slug: "home",

      currentMetadata: {
        title,
        description,
        canonicalUrl:
          LANDING_PAGE_URL,
        ogTitle: title,
        ogDescription:
          description,
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