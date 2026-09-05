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
         * BRANDING
         * ------------------------------------------------------
         */

        siteLogo:
          data.siteLogo ?? null,

        /**
         * ------------------------------------------------------
         * HERO SLIDER IMAGES
         * ------------------------------------------------------
         */

        heroSlide1Image:
          data.heroSlide1Image ?? null,

        heroSlide2Image:
          data.heroSlide2Image ?? null,

        heroSlide3Image:
          data.heroSlide3Image ?? null,

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
