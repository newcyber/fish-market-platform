import type {
  LandingPageAppConfig,
  LandingPageBenefit,
  LandingPageBrandConfig,
  LandingPageBenefitsSectionConfig,
  LandingPageConfig,
  LandingPageCtaConfig,
  LandingPageHeroConfig,
  LandingPageImagesConfig,
  LandingPageRewardSectionConfig,
  LandingPageStep,
  LandingPageTutorialSectionConfig,
} from "./landing-page.types";

/**
 * ============================================================
 * LANDING PAGE VALIDATION
 * ============================================================
 *
 * Runtime validation untuk JSON LandingPageSettings.config.
 *
 * Database menyimpan config sebagai JSON sehingga TypeScript
 * tidak dapat menjamin bentuk datanya saat runtime.
 *
 * Validator ini memastikan data aman digunakan oleh service
 * dan public landing page.
 *
 * ============================================================
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function optionalNullableString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === "string";
}

/**
 * ============================================================
 * BRAND
 * ============================================================
 */

function validateBrand(value: unknown): value is LandingPageBrandConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    optionalString(value.storeName) &&
    optionalString(value.tagline) &&
    optionalNullableString(value.logo)
  );
}

/**
 * ============================================================
 * HERO
 * ============================================================
 */

function validateHero(value: unknown): value is LandingPageHeroConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    optionalString(value.eyebrow) &&
    optionalString(value.title) &&
    optionalString(value.highlight) &&
    optionalString(value.description) &&
    optionalString(value.primaryButtonLabel) &&
    optionalString(value.primaryButtonHref) &&
    optionalString(value.secondaryButtonLabel) &&
    optionalString(value.secondaryButtonHref) &&
    optionalNullableString(value.image)
  );
}

/**
 * ============================================================
 * BENEFITS SECTION
 * ============================================================
 *
 * Header section Benefits:
 * - eyebrow
 * - title
 * - description
 *
 * Data benefit tetap disimpan pada
 * LandingPageConfig.benefits.
 *
 * ============================================================
 */

function validateBenefitsSection(
  value: unknown,
): value is LandingPageBenefitsSectionConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    optionalString(value.eyebrow) &&
    optionalString(value.title) &&
    optionalString(value.description)
  );
}

/**
 * ============================================================
 * REWARD SECTION
 * ============================================================
 */

function validateRewardSection(
  value: unknown,
): value is LandingPageRewardSectionConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.enabled === undefined || typeof value.enabled === "boolean") &&
    optionalString(value.eyebrow) &&
    optionalString(value.title) &&
    optionalString(value.description) &&
    optionalString(value.buttonLabel) &&
    optionalString(value.buttonHref) &&
    (value.featuredLimit === undefined ||
      (typeof value.featuredLimit === "number" &&
        Number.isInteger(value.featuredLimit) &&
        value.featuredLimit >= 1 &&
        value.featuredLimit <= 10)) &&
    (value.compactLimit === undefined ||
      (typeof value.compactLimit === "number" &&
        Number.isInteger(value.compactLimit) &&
        value.compactLimit >= 0 &&
        value.compactLimit <= 20))
  );
}

/**
 * ============================================================
 * TUTORIAL SECTION
 * ============================================================
 */

function validateTutorialStep(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" && typeof value.description === "string"
  );
}

function validateTutorialSection(
  value: unknown,
): value is LandingPageTutorialSectionConfig {
  if (!isRecord(value)) {
    return false;
  }

  if (value.enabled !== undefined && typeof value.enabled !== "boolean") {
    return false;
  }

  if (
    !optionalString(value.eyebrow) ||
    !optionalString(value.title) ||
    !optionalString(value.description) ||
    !optionalNullableString(value.image) ||
    !optionalString(value.infoText)
  ) {
    return false;
  }

  if (value.steps !== undefined) {
    if (
      !Array.isArray(value.steps) ||
      value.steps.length > 3 ||
      !value.steps.every(validateTutorialStep)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * ============================================================
 * BENEFIT
 * ============================================================
 */

function validateBenefit(value: unknown): value is LandingPageBenefit {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    optionalString(value.icon)
  );
}

/**
 * ============================================================
 * APP
 * ============================================================
 */

function validateApp(value: unknown): value is LandingPageAppConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.enabled === undefined || typeof value.enabled === "boolean") &&
    optionalString(value.title) &&
    optionalString(value.description) &&
    optionalNullableString(value.image) &&
    optionalString(value.buttonLabel) &&
    optionalString(value.buttonHref)
  );
}

/**
 * ============================================================
 * STEP
 * ============================================================
 */

function validateStep(value: unknown): value is LandingPageStep {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.number === "number" &&
    Number.isInteger(value.number) &&
    typeof value.title === "string" &&
    typeof value.description === "string"
  );
}

/**
 * ============================================================
 * CTA
 * ============================================================
 */

function validateCta(value: unknown): value is LandingPageCtaConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    optionalString(value.eyebrow) &&
    optionalString(value.title) &&
    optionalString(value.description) &&
    optionalString(value.buttonLabel) &&
    optionalString(value.buttonHref)
  );
}

/**
 * ============================================================
 * IMAGES
 * ============================================================
 */

function validateImages(value: unknown): value is LandingPageImagesConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    optionalNullableString(value.hero) &&
    optionalNullableString(value.app) &&
    optionalNullableString(value.ogImage)
  );
}

/**
 * ============================================================
 * VALIDATE LANDING PAGE CONFIG
 * ============================================================
 */

export function isLandingPageConfig(
  value: unknown,
): value is LandingPageConfig {
  if (!isRecord(value)) {
    return false;
  }

  if (value.brand !== undefined && !validateBrand(value.brand)) {
    return false;
  }

  if (value.hero !== undefined && !validateHero(value.hero)) {
    return false;
  }

  if (
    value.benefitsSection !== undefined &&
    !validateBenefitsSection(value.benefitsSection)
  ) {
    return false;
  }

  if (
    value.rewardSection !== undefined &&
    !validateRewardSection(value.rewardSection)
  ) {
    return false;
  }

  if (
    value.tutorialSection !== undefined &&
    !validateTutorialSection(value.tutorialSection)
  ) {
    return false;
  }

  if (value.benefits !== undefined) {
    if (!Array.isArray(value.benefits)) {
      return false;
    }

    if (!value.benefits.every(validateBenefit)) {
      return false;
    }
  }

  if (value.app !== undefined && !validateApp(value.app)) {
    return false;
  }

  if (value.steps !== undefined) {
    if (!Array.isArray(value.steps)) {
      return false;
    }

    if (!value.steps.every(validateStep)) {
      return false;
    }
  }

  if (value.cta !== undefined && !validateCta(value.cta)) {
    return false;
  }

  if (value.images !== undefined && !validateImages(value.images)) {
    return false;
  }

  return true;
}

/**
 * ============================================================
 * DEFAULT LANDING PAGE BENEFITS SECTION
 * ============================================================
 */

const DEFAULT_LANDING_PAGE_BENEFITS_SECTION = {
  eyebrow: "KENAPA PISJO MARKET?",
  title: "Belanja seafood jadi lebih mudah",
  description:
    "Pilihan ikan dan seafood berkualitas untuk kebutuhan rumah maupun usaha, dengan proses belanja yang praktis.",
};

/**
 * ============================================================
 * DEFAULT LANDING PAGE REWARD SECTION
 * ============================================================
 */

const DEFAULT_LANDING_PAGE_REWARD_SECTION = {
  enabled: true,
  eyebrow: "REWARD POINT",
  title: "Hadiah Poin Menarik",
  description:
    "Belanja, kumpulkan poin, lalu tukarkan dengan berbagai hadiah menarik dari Pisjo Market.",
  buttonLabel: "Lihat Semua Hadiah",
  buttonHref: "/customer/rewards",
  featuredLimit: 3,
  compactLimit: 10,
};

/**
 * ============================================================
 * DEFAULT LANDING PAGE BENEFITS
 * ============================================================
 */

const DEFAULT_LANDING_PAGE_TUTORIAL_SECTION = {
  enabled: true,
  eyebrow: "PANDUAN INSTALASI",
  title: "Cara Pasang PISJO di iPhone",
  description:
    "Cukup buka PISJO Market di Safari, lalu simpan ke Home Screen seperti aplikasi.",
  image: null,
  steps: [
    {
      title: "Buka di Safari",
      description: "Akses app.pusatikansegar.com melalui Safari di iPhone.",
    },
    {
      title: "Tap Share",
      description: "Tekan ikon Share pada Safari.",
    },
    {
      title: "Add to Home Screen",
      description:
        'Pilih "Add to Home Screen" agar PISJO tampil seperti aplikasi.',
    },
  ],
  infoText: "Tidak perlu App Store",
};

const DEFAULT_LANDING_PAGE_BENEFITS: LandingPageBenefit[] = [
  {
    title: "Seafood Segar & Pilihan",
    description:
      "Nikmati pilihan ikan dan seafood berkualitas untuk kebutuhan rumah maupun usaha.",
    icon: "fish",
  },
  {
    title: "Belanja Lebih Mudah",
    description:
      "Cari produk, masukkan ke keranjang, dan selesaikan pesanan dengan proses yang praktis.",
    icon: "shopping-bag",
  },
  {
    title: "Akses dari Android",
    description:
      "Nikmati pengalaman belanja yang lebih praktis melalui perangkat Android.",
    icon: "smartphone",
  },
  {
    title: "Pesanan Mudah Dipantau",
    description:
      "Pantau proses pesanan Anda dari checkout hingga pesanan selesai.",
    icon: "package-check",
  },
];

/**
 * ============================================================
 * DEFAULT LANDING PAGE STEPS
 * ============================================================
 */

const DEFAULT_LANDING_PAGE_STEPS = [
  {
    number: 1,
    title: "Buka Pisjo Market",
    description:
      "Kunjungi store Pisjo Market melalui browser atau perangkat Android.",
  },
  {
    number: 2,
    title: "Pilih produk",
    description:
      "Cari dan pilih produk seafood atau kebutuhan yang Anda inginkan.",
  },
  {
    number: 3,
    title: "Checkout",
    description:
      "Masukkan produk ke keranjang dan selesaikan proses pemesanan.",
  },
  {
    number: 4,
    title: "Pantau pesanan",
    description: "Pantau perkembangan pesanan Anda sampai proses selesai.",
  },
];

/**
 * ============================================================
 * NORMALIZE LANDING PAGE CONFIG
 * ============================================================
 *
 * Normalisasi dilakukan di memory.
 *
 * Artinya default di bawah tidak langsung ditulis ke database.
 * Database baru menyimpan nilai tersebut ketika konfigurasi
 * disimpan melalui admin.
 *
 * ============================================================
 */

export function normalizeLandingPageConfig(value: unknown): LandingPageConfig {
  if (!isLandingPageConfig(value)) {
    return {
      benefitsSection: DEFAULT_LANDING_PAGE_BENEFITS_SECTION,
      benefits: DEFAULT_LANDING_PAGE_BENEFITS,
      rewardSection: DEFAULT_LANDING_PAGE_REWARD_SECTION,
      tutorialSection: DEFAULT_LANDING_PAGE_TUTORIAL_SECTION,
      steps: DEFAULT_LANDING_PAGE_STEPS,
    };
  }

  return {
    ...value,

    benefitsSection:
      value.benefitsSection ?? DEFAULT_LANDING_PAGE_BENEFITS_SECTION,

    tutorialSection:
      value.tutorialSection ?? DEFAULT_LANDING_PAGE_TUTORIAL_SECTION,

    benefits:
      Array.isArray(value.benefits) && value.benefits.length > 0
        ? value.benefits
        : DEFAULT_LANDING_PAGE_BENEFITS,

    steps:
      Array.isArray(value.steps) && value.steps.length > 0
        ? value.steps
        : DEFAULT_LANDING_PAGE_STEPS,
  };
}
