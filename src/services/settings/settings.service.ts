import settingsRepository, {
  type UpdateSettingsPayload,
} from "@/repositories/settings/settings.repository";

/**
 * ============================================================
 * STORE SETTINGS SERVICE
 * ============================================================
 *
 * Menangani business logic Store Settings.
 *
 * Flow:
 *
 * Admin Action
 *      ↓
 * Settings Service
 *      ↓
 * Settings Repository
 *      ↓
 * Prisma / Database
 *
 * ============================================================
 */

export interface UpdateStoreSettingsPayload {
  /**
   * ==========================================================
   * STORE INFORMATION
   * ==========================================================
   */

  storeName: string;

  storeDescription?: string;

  footerDescription?: string;

  /**
   * URL atau path logo situs.
   */
  siteLogo?: string | null;

  email?: string;

  whatsapp?: string;

  /**
   * ==========================================================
   * STORE ADDRESS
   * ==========================================================
   */

  address?: string;

  city?: string;

  province?: string;

  postalCode?: string;

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

  openingTime?: string;

  closingTime?: string;
}

/**
 * ============================================================
 * SETTINGS SERVICE
 * ============================================================
 */

class SettingsService {
  /**
   * ==========================================================
   * GET SETTINGS
   * ==========================================================
   */

  async getSettings() {
    return settingsRepository.getOrCreate();
  }

  /**
   * ==========================================================
   * UPDATE SETTINGS
   * ==========================================================
   */

  async updateSettings(
    payload: UpdateStoreSettingsPayload
  ) {
    /**
     * --------------------------------------------------------
     * VALIDASI STORE NAME
     * --------------------------------------------------------
     */

    const storeName =
      payload.storeName?.trim();

    if (!storeName) {
      throw new Error(
        "Nama toko wajib diisi."
      );
    }

    /**
     * --------------------------------------------------------
     * NORMALIZE STRING
     * --------------------------------------------------------
     *
     * String kosong akan disimpan sebagai null.
     */

    const normalize = (
      value?: string | null
    ): string | null => {
      const trimmed =
        value?.trim();

      return trimmed
        ? trimmed
        : null;
    };

    /**
     * --------------------------------------------------------
     * NORMALIZE COORDINATE
     * --------------------------------------------------------
     */

    const normalizeCoordinate = (
      value?: number | null
    ): number | null => {
      if (
        value === null ||
        value === undefined ||
        !Number.isFinite(value)
      ) {
        return null;
      }

      return value;
    };

    const latitude =
      normalizeCoordinate(
        payload.latitude
      );

    const longitude =
      normalizeCoordinate(
        payload.longitude
      );

    /**
     * --------------------------------------------------------
     * VALIDASI GPS
     * --------------------------------------------------------
     */

    if (
      latitude !== null &&
      (
        latitude < -90 ||
        latitude > 90
      )
    ) {
      throw new Error(
        "Latitude lokasi toko tidak valid."
      );
    }

    if (
      longitude !== null &&
      (
        longitude < -180 ||
        longitude > 180
      )
    ) {
      throw new Error(
        "Longitude lokasi toko tidak valid."
      );
    }

    /**
     * --------------------------------------------------------
     * EMAIL VALIDATION
     * --------------------------------------------------------
     */

    const email =
      normalize(payload.email);

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      throw new Error(
        "Format email tidak valid."
      );
    }

    /**
     * ========================================================
     * INTERNAL SHIPPING CONFIGURATION
     * ========================================================
     */

    const internalShippingEnabled =
      payload.internalShippingEnabled ?? true;

    const internalShippingName =
      normalize(
        payload.internalShippingName
      );

    /**
     * --------------------------------------------------------
     * NORMALIZE NUMBER
     * --------------------------------------------------------
     *
     * Digunakan untuk biaya dan jarak.
     */

    const normalizeNumber = (
      value: number | null | undefined,
      fallback: number
    ): number => {
      if (
        value === null ||
        value === undefined
      ) {
        return fallback;
      }

      if (!Number.isFinite(value)) {
        throw new Error(
          "Nilai konfigurasi pengiriman tidak valid."
        );
      }

      return value;
    };

    /**
     * --------------------------------------------------------
     * BIAYA DASAR
     * --------------------------------------------------------
     */

    const internalShippingBaseFee =
      normalizeNumber(
        payload.internalShippingBaseFee,
        0
      );

    if (
      internalShippingBaseFee < 0
    ) {
      throw new Error(
        "Biaya dasar pengiriman tidak boleh kurang dari 0."
      );
    }

    /**
     * --------------------------------------------------------
     * BIAYA PER KM
     * --------------------------------------------------------
     */

    const internalShippingPerKmFee =
      normalizeNumber(
        payload.internalShippingPerKmFee,
        0
      );

    if (
      internalShippingPerKmFee < 0
    ) {
      throw new Error(
        "Biaya pengiriman per KM tidak boleh kurang dari 0."
      );
    }

    /**
     * --------------------------------------------------------
     * MAKSIMUM JARAK
     * --------------------------------------------------------
     */

    const internalShippingMaxDistance =
      normalizeNumber(
        payload.internalShippingMaxDistance,
        10
      );

    if (
      internalShippingMaxDistance <= 0
    ) {
      throw new Error(
        "Jarak maksimum pengiriman harus lebih dari 0 KM."
      );
    }

    /**
     * --------------------------------------------------------
     * GRATIS ONGKIR THRESHOLD
     * --------------------------------------------------------
     *
     * null = fitur gratis ongkir tidak aktif.
     */

    let internalShippingFreeThreshold:
      | number
      | null = null;

    if (
      payload.internalShippingFreeThreshold !==
        null &&
      payload.internalShippingFreeThreshold !==
        undefined
    ) {
      if (
        !Number.isFinite(
          payload.internalShippingFreeThreshold
        )
      ) {
        throw new Error(
          "Minimum belanja gratis ongkir tidak valid."
        );
      }

      if (
        payload.internalShippingFreeThreshold < 0
      ) {
        throw new Error(
          "Minimum belanja gratis ongkir tidak boleh kurang dari 0."
        );
      }

      internalShippingFreeThreshold =
        payload.internalShippingFreeThreshold;
    }

    /**
     * --------------------------------------------------------
     * VALIDASI NAMA LAYANAN
     * --------------------------------------------------------
     */

    if (
      internalShippingEnabled &&
      !internalShippingName
    ) {
      throw new Error(
        "Nama layanan kurir internal wajib diisi."
      );
    }

    /**
     * ========================================================
     * REPOSITORY PAYLOAD
     * ========================================================
     */

    const data: UpdateSettingsPayload = {
      /**
       * ------------------------------------------------------
       * STORE INFORMATION
       * ------------------------------------------------------
       */

      storeName,

      storeDescription:
        normalize(
          payload.storeDescription
        ),

      footerDescription:
        normalize(
          payload.footerDescription
        ),

      siteLogo:
        normalize(
          payload.siteLogo
        ),

      email,

      whatsapp:
        normalize(
          payload.whatsapp
        ),

      /**
       * ------------------------------------------------------
       * STORE ADDRESS
       * ------------------------------------------------------
       */

      address:
        normalize(
          payload.address
        ),

      city:
        normalize(
          payload.city
        ),

      province:
        normalize(
          payload.province
        ),

      postalCode:
        normalize(
          payload.postalCode
        ),

      /**
       * ------------------------------------------------------
       * STORE GPS / SHIPPING ORIGIN
       * ------------------------------------------------------
       */

      latitude,

      longitude,

      /**
       * ------------------------------------------------------
       * INTERNAL SHIPPING CONFIGURATION
       * ------------------------------------------------------
       */

      internalShippingEnabled,

      internalShippingName,

      internalShippingBaseFee,

      internalShippingPerKmFee,

      internalShippingMaxDistance,

      internalShippingFreeThreshold,

      /**
       * ------------------------------------------------------
       * OPERATIONAL
       * ------------------------------------------------------
       */

      openingTime:
        normalize(
          payload.openingTime
        ),

      closingTime:
        normalize(
          payload.closingTime
        ),
    };

    /**
     * --------------------------------------------------------
     * UPDATE DATABASE
     * --------------------------------------------------------
     */

    return settingsRepository.update(
      data
    );
  }
}

/**
 * ============================================================
 * SINGLETON INSTANCE
 * ============================================================
 */

const settingsService =
  new SettingsService();

export default settingsService;