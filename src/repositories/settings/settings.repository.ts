import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * STORE SETTINGS REPOSITORY
 * ============================================================
 *
 * Repository khusus untuk akses database StoreSettings.
 *
 * Karena Settings bersifat global, aplikasi hanya menggunakan
 * satu record StoreSettings.
 *
 * ============================================================
 */

/**
 * ============================================================
 * UPDATE SETTINGS PAYLOAD
 * ============================================================
 */

export interface UpdateSettingsPayload {
  /**
   * ==========================================================
   * STORE INFORMATION
   * ==========================================================
   */

  storeName: string;

  storeDescription?: string | null;

  footerDescription?: string | null;

  /**
   * ==========================================================
   * GLOBAL SEO
   * ==========================================================
   */

  seoTitle?: string | null;

  seoDescription?: string | null;

  seoKeywords?: string | null;

  seoCanonicalUrl?: string | null;

  seoOgTitle?: string | null;

  seoOgDescription?: string | null;

  seoOgImage?: string | null;

  seoTwitterCard?: string;

  seoRobotsIndex?: boolean;

  seoRobotsFollow?: boolean;

  seoGoogleVerification?: string | null;

  seoAiEnabled?: boolean;

  /**
   * ==========================================================
   * BRANDING
   * ==========================================================
   */

  siteLogo?: string | null;

  /**
   * ==========================================================
   * HERO SLIDER IMAGES
   * ==========================================================
   */

  heroSlide1Image?: string | null;

  heroSlide2Image?: string | null;

  heroSlide3Image?: string | null;

  loginSlide1Image?: string | null;
  loginSlide2Image?: string | null;
  loginSlide3Image?: string | null;
  loginSlide4Image?: string | null;

  flashSaleBannerImage?: string | null;

    heroSlide1Eyebrow?: string | null;
  heroSlide1Title?: string | null;
  heroSlide1Highlight?: string | null;
  heroSlide1Description?: string | null;
  heroSlide1Button?: string | null;

  heroSlide2Eyebrow?: string | null;
  heroSlide2Title?: string | null;
  heroSlide2Highlight?: string | null;
  heroSlide2Description?: string | null;
  heroSlide2Button?: string | null;

  heroSlide3Eyebrow?: string | null;
  heroSlide3Title?: string | null;
  heroSlide3Highlight?: string | null;
  heroSlide3Description?: string | null;
  heroSlide3Button?: string | null;

  flashSaleBannerLabel?: string | null;
  flashSaleBannerTitle?: string | null;
  flashSaleBannerHighlight?: string | null;
  flashSaleBannerDescription?: string | null;

  /**
   * ==========================================================
   * PROMO PILIHAN
   * ==========================================================
   */

  promoSectionLabel?: string | null;
  promoSectionTitle?: string | null;
  promoSectionLinkLabel?: string | null;
  promoSectionLinkHref?: string | null;

  promoCard1Image?: string | null;
  promoCard1Eyebrow?: string | null;
  promoCard1Title?: string | null;
  promoCard1Description?: string | null;
  promoCard1Button?: string | null;
  promoCard1Href?: string | null;

  promoCard2Image?: string | null;
  promoCard2Eyebrow?: string | null;
  promoCard2Title?: string | null;
  promoCard2Description?: string | null;
  promoCard2Button?: string | null;
  promoCard2Href?: string | null;

  email?: string | null;

  whatsapp?: string | null;

  /**
   * ==========================================================
   * STORE ADDRESS
   * ==========================================================
   */

  address?: string | null;

  city?: string | null;

  province?: string | null;

  postalCode?: string | null;

  /**
   * ==========================================================
   * STORE LOCATION / SHIPPING ORIGIN
   * ==========================================================
   */

  latitude?: number | null;

  longitude?: number | null;

  /**
   * ==========================================================
   * INTERNAL SHIPPING CONFIGURATION
   * ==========================================================
   */

  /**
   * Mengaktifkan / menonaktifkan kurir internal.
   */
  internalShippingEnabled?: boolean;

  /**
   * Nama layanan kurir internal.
   */
  internalShippingName?: string | null;

  /**
   * Biaya dasar ongkir.
   */
  internalShippingBaseFee?: number;

  /**
   * Biaya tambahan per kilometer.
   */
  internalShippingPerKmFee?: number;

  /**
   * Minimum ongkir kotor sebelum subsidi gratis ongkir.
   *
   * Contoh:
   *
   * baseFee = 5.000
   * perKmFee = 1.000
   * distance = 1 km
   *
   * hasil:
   * 5.000 + 1.000 = 6.000
   *
   * Jika minimum ongkir = 5.000,
   * maka gross shipping tetap minimal 5.000.
   */
  internalShippingMinFee?: number;

  /**
   * Jarak maksimum yang dilayani kurir internal.
   */
  internalShippingMaxDistance?: number;

  /**
   * Minimum subtotal transaksi agar customer
   * mendapatkan subsidi gratis ongkir.
   *
   * null berarti fitur subsidi berdasarkan minimum
   * belanja tidak digunakan.
   */
  internalShippingFreeThreshold?: number | null;

  /**
   * Maksimum nominal subsidi ongkir yang ditanggung toko.
   *
   * Contoh:
   *
   * gross shipping = Rp25.000
   * max subsidy = Rp10.000
   *
   * customer membayar:
   * Rp25.000 - Rp10.000 = Rp15.000
   */
  internalShippingFreeMaxDiscount?: number;

  /**
   * ==========================================================
   * OPERASIONAL
   * ==========================================================
   */

  openingTime?: string | null;

  closingTime?: string | null;

  /**
   * ==========================================================
   * ORDER SETTINGS
   * ==========================================================
   */

  paymentTimeoutHours?: number;
}

export interface UpdateImageBannerSettingsPayload {
  heroSlide1Image?: string | null;
  heroSlide2Image?: string | null;
  heroSlide3Image?: string | null;

  loginSlide1Image?: string | null;
  loginSlide2Image?: string | null;
  loginSlide3Image?: string | null;
  loginSlide4Image?: string | null;

  flashSaleBannerImage?: string | null;

  heroSlide1Eyebrow?: string | null;
  heroSlide1Title?: string | null;
  heroSlide1Highlight?: string | null;
  heroSlide1Description?: string | null;
  heroSlide1Button?: string | null;

  heroSlide2Eyebrow?: string | null;
  heroSlide2Title?: string | null;
  heroSlide2Highlight?: string | null;
  heroSlide2Description?: string | null;
  heroSlide2Button?: string | null;

  heroSlide3Eyebrow?: string | null;
  heroSlide3Title?: string | null;
  heroSlide3Highlight?: string | null;
  heroSlide3Description?: string | null;
  heroSlide3Button?: string | null;

  flashSaleBannerLabel?: string | null;
  flashSaleBannerTitle?: string | null;
  flashSaleBannerHighlight?: string | null;
  flashSaleBannerDescription?: string | null;

  promoSectionLabel?: string | null;
  promoSectionTitle?: string | null;
  promoSectionLinkLabel?: string | null;
  promoSectionLinkHref?: string | null;

  promoCard1Image?: string | null;
  promoCard1Eyebrow?: string | null;
  promoCard1Title?: string | null;
  promoCard1Description?: string | null;
  promoCard1Button?: string | null;
  promoCard1Href?: string | null;

  promoCard2Image?: string | null;
  promoCard2Eyebrow?: string | null;
  promoCard2Title?: string | null;
  promoCard2Description?: string | null;
  promoCard2Button?: string | null;
  promoCard2Href?: string | null;
}

export interface UpdateSeoSettingsPayload {
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  seoCanonicalUrl?: string | null;
  seoOgTitle?: string | null;
  seoOgDescription?: string | null;
  seoOgImage?: string | null;
  seoTwitterCard?: string;
  seoRobotsIndex?: boolean;
  seoRobotsFollow?: boolean;
  seoGoogleVerification?: string | null;
  seoAiEnabled?: boolean;
}

/**
 * ============================================================
 * SETTINGS REPOSITORY
 * ============================================================
 */

class SettingsRepository {
  /**
   * ==========================================================
   * GET SETTINGS
   * ==========================================================
   */

  async get() {
    return prisma.storeSettings.findFirst();
  }

  /**
   * ==========================================================
   * GET OR CREATE SETTINGS
   * ==========================================================
   */

  async getOrCreate() {
    const existingSettings =
      await prisma.storeSettings.findFirst();

    if (existingSettings) {
      return existingSettings;
    }

    return prisma.storeSettings.create({
      data: {
        /**
         * ------------------------------------------------------
         * STORE INFORMATION
         * ------------------------------------------------------
         */

        storeName: "Pisjo Market",

        storeDescription: null,

        footerDescription: null,

                /**
         * ------------------------------------------------------
         * GLOBAL SEO
         * ------------------------------------------------------
         */

        seoTitle: null,

        seoDescription: null,

        seoKeywords: null,

        seoCanonicalUrl: null,

        seoOgTitle: null,

        seoOgDescription: null,

        seoOgImage: null,

        seoTwitterCard: "summary_large_image",

        seoRobotsIndex: true,

        seoRobotsFollow: true,

        seoGoogleVerification: null,

        seoAiEnabled: true,

        /**
         * ------------------------------------------------------
         * BRANDING
         * ------------------------------------------------------
         */

        siteLogo: null,

        /**
         * ------------------------------------------------------
         * HERO SLIDER IMAGES
         * ------------------------------------------------------
         */

        heroSlide1Image: null,

        heroSlide2Image: null,

        heroSlide3Image: null,

        flashSaleBannerImage: null,

        heroSlide1Eyebrow: null,
        heroSlide1Title: null,
        heroSlide1Highlight: null,
        heroSlide1Description: null,
        heroSlide1Button: null,

        heroSlide2Eyebrow: null,
        heroSlide2Title: null,
        heroSlide2Highlight: null,
        heroSlide2Description: null,
        heroSlide2Button: null,

        heroSlide3Eyebrow: null,
        heroSlide3Title: null,
        heroSlide3Highlight: null,
        heroSlide3Description: null,
        heroSlide3Button: null,

        flashSaleBannerLabel: null,
        flashSaleBannerTitle: null,
        flashSaleBannerHighlight: null,
        flashSaleBannerDescription: null,

        email: null,

        whatsapp: null,

        /**
         * ------------------------------------------------------
         * STORE ADDRESS
         * ------------------------------------------------------
         */

        address: null,

        city: null,

        province: null,

        postalCode: null,

        /**
         * ------------------------------------------------------
         * STORE GPS / SHIPPING ORIGIN
         * ------------------------------------------------------
         */

        latitude: null,

        longitude: null,

        /**
         * ------------------------------------------------------
         * INTERNAL SHIPPING CONFIGURATION
         * ------------------------------------------------------
         *
         * Default awal konfigurasi kurir internal.
         *
         * Nilai default ini akan digunakan hanya ketika
         * StoreSettings belum memiliki record.
         *
         * ------------------------------------------------------
         */

        internalShippingEnabled: true,

        internalShippingName:
          "Kurir Internal",

        internalShippingBaseFee: 0,

        internalShippingPerKmFee: 0,

        internalShippingMinFee: 0,

        internalShippingMaxDistance: 10,

        internalShippingFreeThreshold: null,

        internalShippingFreeMaxDiscount: 0,

        /**
         * ------------------------------------------------------
         * OPERATIONAL
         * ------------------------------------------------------
         */

        openingTime: null,

        closingTime: null,

        /**
         * ------------------------------------------------------
         * ORDER SETTINGS
         * ------------------------------------------------------
         */

        paymentTimeoutHours: 24,
      },
    });
  }

  async updateSeo(
  data: UpdateSeoSettingsPayload,
) {
  const settings = await this.getOrCreate();

  const updateData = {
    ...(data.seoTitle !== undefined && {
      seoTitle: data.seoTitle,
    }),

    ...(data.seoDescription !== undefined && {
      seoDescription: data.seoDescription,
    }),

    ...(data.seoKeywords !== undefined && {
      seoKeywords: data.seoKeywords,
    }),

    ...(data.seoCanonicalUrl !== undefined && {
      seoCanonicalUrl: data.seoCanonicalUrl,
    }),

    ...(data.seoOgTitle !== undefined && {
      seoOgTitle: data.seoOgTitle,
    }),

    ...(data.seoOgDescription !== undefined && {
      seoOgDescription: data.seoOgDescription,
    }),

    ...(data.seoOgImage !== undefined && {
      seoOgImage: data.seoOgImage,
    }),

    ...(data.seoTwitterCard !== undefined && {
      seoTwitterCard: data.seoTwitterCard,
    }),

    ...(data.seoRobotsIndex !== undefined && {
      seoRobotsIndex: data.seoRobotsIndex,
    }),

    ...(data.seoRobotsFollow !== undefined && {
      seoRobotsFollow: data.seoRobotsFollow,
    }),

    ...(data.seoGoogleVerification !== undefined && {
      seoGoogleVerification: data.seoGoogleVerification,
    }),

    ...(data.seoAiEnabled !== undefined && {
      seoAiEnabled: data.seoAiEnabled,
    }),
  };

  return prisma.storeSettings.update({
    where: {
      id: settings.id,
    },
    data: updateData,
  });
}

  /**
   * ==========================================================
   * UPDATE IMAGE BANNER SETTINGS
   * ==========================================================
   *
   * Update khusus seluruh konfigurasi Image Banner.
   *
   * Hanya field yang dikirim akan diperbarui.
   * Field undefined tidak akan menyentuh nilai database.
   *
   * Digunakan oleh halaman Admin Image Banner agar perubahan
   * banner tidak mengubah Store Settings lainnya.
   */
  async updateImageBanner(
    data: UpdateImageBannerSettingsPayload
  ) {
    const settings = await this.getOrCreate();

    const updateData = {
      ...(data.heroSlide1Image !== undefined && {
        heroSlide1Image: data.heroSlide1Image,
      }),
      ...(data.heroSlide2Image !== undefined && {
        heroSlide2Image: data.heroSlide2Image,
      }),
      ...(data.heroSlide3Image !== undefined && {
        heroSlide3Image: data.heroSlide3Image,
      }),

      ...(data.loginSlide1Image !== undefined && {
        loginSlide1Image: data.loginSlide1Image,
      }),
      ...(data.loginSlide2Image !== undefined && {
        loginSlide2Image: data.loginSlide2Image,
      }),
      ...(data.loginSlide3Image !== undefined && {
        loginSlide3Image: data.loginSlide3Image,
      }),
      ...(data.loginSlide4Image !== undefined && {
        loginSlide4Image: data.loginSlide4Image,
      }),

      ...(data.flashSaleBannerImage !== undefined && {
        flashSaleBannerImage: data.flashSaleBannerImage,
      }),

      ...(data.heroSlide1Eyebrow !== undefined && {
        heroSlide1Eyebrow: data.heroSlide1Eyebrow,
      }),
      ...(data.heroSlide1Title !== undefined && {
        heroSlide1Title: data.heroSlide1Title,
      }),
      ...(data.heroSlide1Highlight !== undefined && {
        heroSlide1Highlight: data.heroSlide1Highlight,
      }),
      ...(data.heroSlide1Description !== undefined && {
        heroSlide1Description: data.heroSlide1Description,
      }),
      ...(data.heroSlide1Button !== undefined && {
        heroSlide1Button: data.heroSlide1Button,
      }),

      ...(data.heroSlide2Eyebrow !== undefined && {
        heroSlide2Eyebrow: data.heroSlide2Eyebrow,
      }),
      ...(data.heroSlide2Title !== undefined && {
        heroSlide2Title: data.heroSlide2Title,
      }),
      ...(data.heroSlide2Highlight !== undefined && {
        heroSlide2Highlight: data.heroSlide2Highlight,
      }),
      ...(data.heroSlide2Description !== undefined && {
        heroSlide2Description: data.heroSlide2Description,
      }),
      ...(data.heroSlide2Button !== undefined && {
        heroSlide2Button: data.heroSlide2Button,
      }),

      ...(data.heroSlide3Eyebrow !== undefined && {
        heroSlide3Eyebrow: data.heroSlide3Eyebrow,
      }),
      ...(data.heroSlide3Title !== undefined && {
        heroSlide3Title: data.heroSlide3Title,
      }),
      ...(data.heroSlide3Highlight !== undefined && {
        heroSlide3Highlight: data.heroSlide3Highlight,
      }),
      ...(data.heroSlide3Description !== undefined && {
        heroSlide3Description: data.heroSlide3Description,
      }),
      ...(data.heroSlide3Button !== undefined && {
        heroSlide3Button: data.heroSlide3Button,
      }),

      ...(data.flashSaleBannerLabel !== undefined && {
        flashSaleBannerLabel: data.flashSaleBannerLabel,
      }),
      ...(data.flashSaleBannerTitle !== undefined && {
        flashSaleBannerTitle: data.flashSaleBannerTitle,
      }),
      ...(data.flashSaleBannerHighlight !== undefined && {
        flashSaleBannerHighlight: data.flashSaleBannerHighlight,
      }),
      ...(data.flashSaleBannerDescription !== undefined && {
        flashSaleBannerDescription: data.flashSaleBannerDescription,
      }),

      ...(data.promoSectionLabel !== undefined && {
        promoSectionLabel: data.promoSectionLabel,
      }),
      ...(data.promoSectionTitle !== undefined && {
        promoSectionTitle: data.promoSectionTitle,
      }),
      ...(data.promoSectionLinkLabel !== undefined && {
        promoSectionLinkLabel: data.promoSectionLinkLabel,
      }),
      ...(data.promoSectionLinkHref !== undefined && {
        promoSectionLinkHref: data.promoSectionLinkHref,
      }),

      ...(data.promoCard1Image !== undefined && {
        promoCard1Image: data.promoCard1Image,
      }),
      ...(data.promoCard1Eyebrow !== undefined && {
        promoCard1Eyebrow: data.promoCard1Eyebrow,
      }),
      ...(data.promoCard1Title !== undefined && {
        promoCard1Title: data.promoCard1Title,
      }),
      ...(data.promoCard1Description !== undefined && {
        promoCard1Description: data.promoCard1Description,
      }),
      ...(data.promoCard1Button !== undefined && {
        promoCard1Button: data.promoCard1Button,
      }),
      ...(data.promoCard1Href !== undefined && {
        promoCard1Href: data.promoCard1Href,
      }),

      ...(data.promoCard2Image !== undefined && {
        promoCard2Image: data.promoCard2Image,
      }),
      ...(data.promoCard2Eyebrow !== undefined && {
        promoCard2Eyebrow: data.promoCard2Eyebrow,
      }),
      ...(data.promoCard2Title !== undefined && {
        promoCard2Title: data.promoCard2Title,
      }),
      ...(data.promoCard2Description !== undefined && {
        promoCard2Description: data.promoCard2Description,
      }),
      ...(data.promoCard2Button !== undefined && {
        promoCard2Button: data.promoCard2Button,
      }),
      ...(data.promoCard2Href !== undefined && {
        promoCard2Href: data.promoCard2Href,
      }),
    };

    return prisma.storeSettings.update({
      where: {
        id: settings.id,
      },
      data: updateData,
    });
  }

  /**
   * ==========================================================
   * UPDATE SETTINGS
   * ==========================================================
   */

  async update(
    data: UpdateSettingsPayload
  ) {
    const settings =
      await this.getOrCreate();

    return prisma.storeSettings.update({
      where: {
        id: settings.id,
      },

      data: {
        /**
         * ------------------------------------------------------
         * STORE INFORMATION
         * ------------------------------------------------------
         */

        storeName:
          data.storeName,

        storeDescription:
          data.storeDescription ?? null,

        footerDescription:
          data.footerDescription ?? null,

        /**
         * ------------------------------------------------------
         * GLOBAL SEO
         * ------------------------------------------------------
         */

        seoTitle:
          data.seoTitle ?? null,

        seoDescription:
          data.seoDescription ?? null,

        seoKeywords:
          data.seoKeywords ?? null,

        seoCanonicalUrl:
          data.seoCanonicalUrl ?? null,

        seoOgTitle:
          data.seoOgTitle ?? null,

        seoOgDescription:
          data.seoOgDescription ?? null,

        seoOgImage:
          data.seoOgImage ?? null,

        seoTwitterCard:
          data.seoTwitterCard ?? "summary_large_image",

        seoRobotsIndex:
          data.seoRobotsIndex ?? true,

        seoRobotsFollow:
          data.seoRobotsFollow ?? true,

        seoGoogleVerification:
          data.seoGoogleVerification ?? null,

        seoAiEnabled:
          data.seoAiEnabled ?? true,

        /**
         * ------------------------------------------------------
         * BRANDING
         * ------------------------------------------------------
         */

        siteLogo:
          data.siteLogo ?? null,

        email:
          data.email ?? null,

        whatsapp:
          data.whatsapp ?? null,

        /**
         * ------------------------------------------------------
         * STORE ADDRESS
         * ------------------------------------------------------
         */

        address:
          data.address ?? null,

        city:
          data.city ?? null,

        province:
          data.province ?? null,

        postalCode:
          data.postalCode ?? null,

        /**
         * ------------------------------------------------------
         * STORE LOCATION / SHIPPING ORIGIN
         * ------------------------------------------------------
         */

        latitude:
          data.latitude ?? null,

        longitude:
          data.longitude ?? null,

        /**
         * ------------------------------------------------------
         * INTERNAL SHIPPING CONFIGURATION
         * ------------------------------------------------------
         */

        internalShippingEnabled:
          data.internalShippingEnabled ?? true,

        internalShippingName:
          data.internalShippingName ??
          "Kurir Internal",

        internalShippingBaseFee:
          data.internalShippingBaseFee ?? 0,

        internalShippingPerKmFee:
          data.internalShippingPerKmFee ?? 0,

        /**
         * Minimum gross shipping fee sebelum subsidi.
         */
        internalShippingMinFee:
          data.internalShippingMinFee ?? 0,

        internalShippingMaxDistance:
          data.internalShippingMaxDistance ?? 10,

        /**
         * Minimum subtotal untuk mendapatkan subsidi.
         */
        internalShippingFreeThreshold:
          data.internalShippingFreeThreshold ?? null,

        /**
         * Maksimum subsidi ongkir yang ditanggung toko.
         */
        internalShippingFreeMaxDiscount:
          data.internalShippingFreeMaxDiscount ?? 0,

        /**
         * ------------------------------------------------------
         * OPERATIONAL
         * ------------------------------------------------------
         */

        openingTime:
          data.openingTime ?? null,

        closingTime:
          data.closingTime ?? null,

        /**
         * ------------------------------------------------------
         * ORDER SETTINGS
         * ------------------------------------------------------
         */

        paymentTimeoutHours:
          data.paymentTimeoutHours ?? 24,
      },
    });
  }
}

/**
 * ============================================================
 * SINGLETON INSTANCE
 * ============================================================
 */

const settingsRepository =
  new SettingsRepository();

export default settingsRepository;
