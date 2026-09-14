"use server";

import { requireSuperAdmin } from "@/lib/auth/admin";

import {
  analyzeLandingPageSeo,
} from "@/lib/seo/landing-page-seo-analyzer";

import landingPageService from "@/repositories/landing-page/landing-page.service";

export interface AnalyzeLandingPageSeoActionResult {
  success: boolean;
  message: string;
  data?: Awaited<
    ReturnType<typeof analyzeLandingPageSeo>
  >;
}

export async function analyzeLandingPageSeoAction(): Promise<AnalyzeLandingPageSeoActionResult> {
  try {
    await requireSuperAdmin();

    const result =
      await analyzeLandingPageSeo();

    await landingPageService.createSeoAnalysis({
      score: result.analysis.score,
      analysis: {
        score: result.analysis.score,
        issues: result.analysis.issues,
        analyzedAt:
          result.analysis.analyzedAt,
      },
      recommendations: {
        issues: result.analysis.issues
          .filter(
            (issue) =>
              issue.recommendation,
          )
          .map((issue) => ({
            code: issue.code,
            field: issue.field,
            message: issue.message,
            recommendation:
              issue.recommendation,
          })),
      },
      source: "RULE_ENGINE",
    });

    return {
      success: true,
      message:
        "Analisis SEO Landing Page berhasil.",
      data: result,
    };
  } catch (error) {
    console.error(
      "[ANALYZE_LANDING_PAGE_SEO_ERROR]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal melakukan analisis SEO Landing Page.",
    };
  }
}