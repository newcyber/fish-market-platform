/**
 * ============================================================
 * LANDING PAGE TYPES
 * ============================================================
 *
 * Type contract untuk konfigurasi public marketing landing page.
 *
 * Struktur ini sengaja dipisahkan dari StoreSettings.
 *
 * ============================================================
 */

export interface LandingPageBrandConfig {
  storeName?: string;
  tagline?: string;
  logo?: string | null;
}

export interface LandingPageHeroConfig {
  eyebrow?: string;
  title?: string;
  highlight?: string;
  description?: string;
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  image?: string | null;
}

export interface LandingPageBenefit {
  title: string;
  description: string;
  icon?: string;
}

/**
 * ============================================================
 * BENEFITS SECTION
 * ============================================================
 *
 * Konfigurasi header untuk section Benefits.
 *
 * Data benefit tetap disimpan terpisah dalam
 * LandingPageConfig.benefits.
 *
 * ============================================================
 */

export interface LandingPageBenefitsSectionConfig {
  eyebrow?: string;
  title?: string;
  description?: string;
}

export interface LandingPageAppConfig {
  enabled?: boolean;
  title?: string;
  description?: string;
  image?: string | null;
  buttonLabel?: string;
}

export interface LandingPageStep {
  number: number;
  title: string;
  description: string;
}

export interface LandingPageCtaConfig {
  eyebrow?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

export interface LandingPageImagesConfig {
  hero?: string | null;
  app?: string | null;
  ogImage?: string | null;
}

export interface LandingPageConfig {
  brand?: LandingPageBrandConfig;
  hero?: LandingPageHeroConfig;

  benefitsSection?: LandingPageBenefitsSectionConfig;
  benefits?: LandingPageBenefit[];

  app?: LandingPageAppConfig;
  steps?: LandingPageStep[];
  cta?: LandingPageCtaConfig;
  images?: LandingPageImagesConfig;
}

/**
 * ============================================================
 * LANDING PAGE SETTINGS
 * ============================================================
 */

export interface LandingPageSettingsData {
  id: string;
  key: string;
  enabled: boolean;
  config: LandingPageConfig;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ============================================================
 * ANDROID APP
 * ============================================================
 */

export interface LandingPageAndroidAppData {
  id: string;
  key: string;
  enabled: boolean;
  appName: string;
  version: string;
  description: string | null;
  fileName: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  sha256: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ============================================================
 * SEO ANALYSIS
 * ============================================================
 */

export interface LandingPageSeoAnalysisData {
  id: string;
  landingPageSettingsId: string;
  score: number;
  analysis: unknown;
  recommendations: unknown;
  source: string;
  createdAt: Date;
}

/**
 * ============================================================
 * PUBLIC LANDING PAGE DATA
 * ============================================================
 *
 * Data yang secara khusus disediakan untuk public landing page.
 *
 * Contract ini mencegah component public bergantung langsung
 * pada struktur database.
 *
 * ============================================================
 */

export interface PublicLandingPageUrls {
  store: string;
  android: string | null;
}

export interface PublicLandingPageData {
  enabled: boolean;

  brand: {
    storeName: string;
    storeDescription: string;
    siteLogo: string | null;
  };

  config: LandingPageConfig;

  androidApp: LandingPageAndroidAppData | null;

  urls: PublicLandingPageUrls;
}