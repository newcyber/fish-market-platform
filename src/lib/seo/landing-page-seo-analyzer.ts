import {
  analyzeSeoMetadata,
  type SeoAnalysisIssue,
  type SeoAnalysisResult,
} from "./seo-analyzer";

import landingPageService from "@/repositories/landing-page/landing-page.service";

const LANDING_PAGE_URL = "https://pusatikansegar.com";

export type LandingPageSeoAnalysis = {
  name: string;
  url: string;
  analysis: SeoAnalysisResult;
};

function normalize(value?: string | null): string {
  return value?.trim() ?? "";
}

function getString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function analyzeLandingPageSeo(): Promise<LandingPageSeoAnalysis> {
  const landingPage =
    await landingPageService.getLandingPage();

  const config = landingPage.config;

  const hero = config.hero ?? {};
  const benefits = config.benefits ?? [];
  const steps = config.steps ?? [];
  const images = config.images ?? {};

  const title = normalize(
    getString(hero.title),
  );

  const description = normalize(
    getString(hero.description),
  );

  const ogImage = normalize(
    getString(images.ogImage),
  );

  const heroImage = normalize(
    getString(images.hero),
  );

  const appImage = normalize(
    getString(images.app),
  );

  const issues: SeoAnalysisIssue[] = [];

  const metadataAnalysis =
    analyzeSeoMetadata({
      entityType: "site",
      name: "Pisjo Market",
      title,
      description,
      canonicalUrl: LANDING_PAGE_URL,
      ogTitle: title,
      ogDescription: description,
      ogImage,

      // Root landing page tidak memiliki slug.
      slug: "home",
    });

  issues.push(...metadataAnalysis.issues);

  /**
   * ============================================================
   * LANDING PAGE CONTENT
   * ============================================================
   */

  if (benefits.length === 0) {
    issues.push({
      code: "LANDING_BENEFITS_MISSING",
      severity: "warning",
      field: "benefits",
      message:
        "Landing Page belum memiliki benefit yang terdeteksi.",
      recommendation:
        "Tambahkan beberapa benefit utama untuk menjelaskan alasan pelanggan memilih Pisjo Market.",
    });
  } else if (benefits.length < 3) {
    issues.push({
      code: "LANDING_BENEFITS_THIN",
      severity: "warning",
      field: "benefits",
      message:
        "Jumlah benefit Landing Page masih sedikit.",
      recommendation:
        "Pertimbangkan menampilkan minimal tiga benefit utama.",
    });
  } else {
    issues.push({
      code: "LANDING_BENEFITS_OK",
      severity: "success",
      field: "benefits",
      message:
        `Landing Page memiliki ${benefits.length} benefit.`,
    });
  }

  if (steps.length === 0) {
    issues.push({
      code: "LANDING_STEPS_MISSING",
      severity: "warning",
      field: "steps",
      message:
        "Langkah belanja belum tersedia.",
      recommendation:
        "Tambahkan langkah singkat agar pengunjung memahami cara berbelanja.",
    });
  } else {
    issues.push({
      code: "LANDING_STEPS_OK",
      severity: "success",
      field: "steps",
      message:
        `Landing Page memiliki ${steps.length} langkah belanja.`,
    });
  }

  /**
   * ============================================================
   * LANDING PAGE IMAGES
   * ============================================================
   */

  if (!heroImage) {
    issues.push({
      code: "LANDING_HERO_IMAGE_MISSING",
      severity: "warning",
      field: "images.hero",
      message:
        "Hero image Landing Page belum tersedia.",
      recommendation:
        "Tambahkan gambar Hero yang relevan dengan brand dan produk utama.",
    });
  } else {
    issues.push({
      code: "LANDING_HERO_IMAGE_OK",
      severity: "success",
      field: "images.hero",
      message:
        "Hero image Landing Page tersedia.",
    });
  }

  if (!appImage) {
    issues.push({
      code: "LANDING_APP_IMAGE_MISSING",
      severity: "info",
      field: "images.app",
      message:
        "App showcase image belum tersedia.",
    });
  } else {
    issues.push({
      code: "LANDING_APP_IMAGE_OK",
      severity: "success",
      field: "images.app",
      message:
        "App showcase image tersedia.",
    });
  }

  /**
   * ============================================================
   * TECHNICAL LANDING PAGE
   * ============================================================
   */

  if (!landingPage.enabled) {
    issues.push({
      code: "LANDING_DISABLED",
      severity: "warning",
      field: "enabled",
      message:
        "Landing Page sedang dinonaktifkan.",
      recommendation:
        "Aktifkan Landing Page jika halaman marketing ingin diindeks mesin pencari.",
    });
  } else {
    issues.push({
      code: "LANDING_ENABLED",
      severity: "success",
      field: "enabled",
      message:
        "Landing Page aktif.",
    });
  }

  /**
   * ============================================================
   * SCORE
   * ============================================================
   */

  const scoredIssues = issues.filter(
    (issue) => issue.severity !== "info",
  );

  const totalChecks = scoredIssues.length;

  const positiveChecks =
    scoredIssues.filter(
      (issue) =>
        issue.severity === "success",
    ).length;

  const score =
    totalChecks === 0
      ? 0
      : Math.round(
          (positiveChecks / totalChecks) * 100,
        );

  return {
    name: "Pisjo Market Landing Page",
    url: LANDING_PAGE_URL,
    analysis: {
      score,
      issues,
      analyzedAt:
        new Date().toISOString(),
    },
  };
}