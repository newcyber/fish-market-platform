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
  storeName: string;

  storeDescription?: string | null;

  footerDescription?: string | null;

  email?: string | null;

  whatsapp?: string | null;

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

  internalShippingEnabled?: boolean;

  internalShippingName?: string | null;

  internalShippingBaseFee?: number;

  internalShippingPerKmFee?: number;

  internalShippingMaxDistance?: number;

  internalShippingFreeThreshold?: number | null;

  /**
   * ==========================================================
   * OPERASIONAL
   * ==========================================================
   */

  openingTime?: string | null;

  closingTime?: string | null;
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
         * Explicit default di sini membuat konfigurasi awal
         * konsisten jika StoreSettings belum pernah dibuat.
         */

        internalShippingEnabled: true,

        internalShippingName:
          "Kurir Internal",

        internalShippingBaseFee: 0,

        internalShippingPerKmFee: 0,

        internalShippingMaxDistance: 10,

        internalShippingFreeThreshold: null,

        /**
         * ------------------------------------------------------
         * OPERATIONAL
         * ------------------------------------------------------
         */

        openingTime: null,
        closingTime: null,
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

        storeName: data.storeName,

        storeDescription:
          data.storeDescription ?? null,

        footerDescription:
          data.footerDescription ?? null,

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

        internalShippingMaxDistance:
          data.internalShippingMaxDistance ?? 10,

        internalShippingFreeThreshold:
          data.internalShippingFreeThreshold ?? null,

        /**
         * ------------------------------------------------------
         * OPERATIONAL
         * ------------------------------------------------------
         */

        openingTime:
          data.openingTime ?? null,

        closingTime:
          data.closingTime ?? null,
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