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
  primaryButtonHref?: string;

  secondaryButtonLabel?: string;
  secondaryButtonHref?: string;

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
  displayLimit?: number;
}

export interface LandingPageValuePropositionItem {
  title: string;
  description: string;
  icon?: string;
}

export interface LandingPageValuePropositionSectionConfig {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  items?: LandingPageValuePropositionItem[];
}

export interface LandingPageHowItWorksSectionConfig {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  backgroundImage?: string | null;
}

export interface LandingPageFeaturedProductsSectionConfig {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
  mobileButtonLabel?: string;
  displayLimit?: number;
}

/**
 * ============================================================
 * REWARD SECTION
 * ============================================================
 *
 * Konfigurasi section Reward Point pada public Landing Page.
 *
 * Data hadiah TIDAK disimpan di LandingPageSettings.
 * Data hadiah diambil realtime dari RewardCatalog.
 *
 * ============================================================
 */

export interface LandingPageRewardSectionConfig {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
  buttonHref?: string;
  featuredLimit?: number;
  compactLimit?: number;
}

/**
 * ============================================================
 * TESTIMONIAL SECTION
 * ============================================================
 */

export interface LandingPageTestimonial {
  name: string;
  role?: string;
  message: string;
  rating?: number;
  avatar?: string | null;

  /**
   * Gambar produk yang ditampilkan pada kartu testimonial.
   * Tidak berkaitan dengan avatar pelanggan.
   */
  productImage?: string | null;
}

export interface LandingPageTestimonialsSectionConfig {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  items?: LandingPageTestimonial[];
}

/**
 * ============================================================
 * FAQ SECTION
 * ============================================================
 */

export interface LandingPageFaqItem {
  question: string;
  answer: string;
}

export interface LandingPageFaqSectionConfig {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  backgroundImage?: string | null;
  illustrationImage?: string | null;
  illustrationAlt?: string | null;
  items?: LandingPageFaqItem[];
}

export interface LandingPageTutorialStep {
  title: string;
  description: string;
}

export interface LandingPageTutorialSectionConfig {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  image?: string | null;
  steps?: LandingPageTutorialStep[];
  infoText?: string;
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
  buttonHref?: string;
  backgroundImage?: string | null;
}

export interface LandingPageImagesConfig {
  /**
   * Gambar visual utama di sisi kanan hero.
   */
  hero?: string | null;

  /**
   * Background artwork hero untuk desktop.
   */
  heroBackground?: string | null;

  /**
   * Background artwork hero untuk perangkat mobile.
   */
  heroBackgroundMobile?: string | null;

  app?: string | null;
  ogImage?: string | null;
}

export interface LandingPageConfig {
  brand?: LandingPageBrandConfig;
  hero?: LandingPageHeroConfig;

  benefitsSection?: LandingPageBenefitsSectionConfig;
  benefits?: LandingPageBenefit[];
  valuePropositionSection?: LandingPageValuePropositionSectionConfig;
  howItWorksSection?: LandingPageHowItWorksSectionConfig;
  featuredProductsSection?: LandingPageFeaturedProductsSectionConfig;

  rewardSection?: LandingPageRewardSectionConfig;

  testimonialsSection?: LandingPageTestimonialsSectionConfig;

  faqSection?: LandingPageFaqSectionConfig;

  tutorialSection?: LandingPageTutorialSectionConfig;

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
 * IOS APP
 * ============================================================
 *
 * iOS tidak menggunakan file upload seperti Android.
 * Distribusi aplikasi dilakukan melalui App Store URL.
 *
 * ============================================================
 */

export interface LandingPageIosAppData {
  id: string;
  key: string;
  enabled: boolean;

  appName: string;
  version: string;
  description: string | null;

  appStoreUrl: string | null;

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

  /**
   * URL download APK Android.
   *
   * null apabila Android app tidak aktif
   * atau file APK belum tersedia.
   */
  android: string | null;

  /**
   * URL App Store untuk aplikasi iOS.
   *
   * null apabila iOS app tidak aktif
   * atau App Store URL belum tersedia.
   */
  ios: string | null;
}

/**
 * ============================================================
 * PUBLIC LANDING PAGE REWARD
 * ============================================================
 */

export interface PublicLandingPageReward {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  requiredPoints: number;
  stock: number;
  sortOrder: number;
}

export interface PublicLandingPageData {
  enabled: boolean;

  brand: {
    storeName: string;
    storeDescription: string;
    siteLogo: string | null;
  };

  config: LandingPageConfig;

  rewards: PublicLandingPageReward[];

  androidApp: LandingPageAndroidAppData | null;

  urls: PublicLandingPageUrls;
}
