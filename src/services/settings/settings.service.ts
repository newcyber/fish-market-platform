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
  storeName: string;

  storeDescription?: string;
  footerDescription?: string;

  email?: string;
  whatsapp?: string;

  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;

  openingTime?: string;
  closingTime?: string;
}

class SettingsService {
  /**
   * ==========================================================
   * GET SETTINGS
   * ==========================================================
   *
   * Mengambil konfigurasi global toko.
   *
   * Jika belum ada record, repository akan otomatis membuat
   * StoreSettings default.
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
     * NORMALIZE INPUT
     * --------------------------------------------------------
     *
     * String kosong akan disimpan sebagai null
     * agar database tetap bersih dan konsisten.
     */
    const normalize = (
      value?: string
    ): string | null => {
      const trimmed =
        value?.trim();

      return trimmed
        ? trimmed
        : null;
    };

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
     * --------------------------------------------------------
     * REPOSITORY PAYLOAD
     * --------------------------------------------------------
     *
     * Data sudah dinormalisasi sebelum dikirim
     * ke repository.
     */
    const data: UpdateSettingsPayload = {
      storeName,

      storeDescription:
        normalize(
          payload.storeDescription
        ),

      footerDescription:
        normalize(
          payload.footerDescription
        ),

      email,

      whatsapp:
        normalize(
          payload.whatsapp
        ),

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