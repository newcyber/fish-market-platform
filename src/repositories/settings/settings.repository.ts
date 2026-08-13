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
   *
   * Mengambil konfigurasi global toko.
   *
   * Karena hanya ada satu record StoreSettings,
   * gunakan findFirst().
   */
  async get() {
    return prisma.storeSettings.findFirst();
  }

  /**
   * ==========================================================
   * GET OR CREATE SETTINGS
   * ==========================================================
   *
   * Jika settings belum pernah dibuat,
   * otomatis buat record default.
   */
  async getOrCreate() {
    const existingSettings =
      await prisma.storeSettings.findFirst();

    if (existingSettings) {
      return existingSettings;
    }

    return prisma.storeSettings.create({
      data: {
        storeName: "Fish Market",

        storeDescription: null,
        footerDescription: null,

        email: null,
        whatsapp: null,

        address: null,
        city: null,
        province: null,
        postalCode: null,

        openingTime: null,
        closingTime: null,
      },
    });
  }

  /**
   * ==========================================================
   * UPDATE SETTINGS
   * ==========================================================
   *
   * Flow:
   *
   * getOrCreate()
   *       ↓
   * Settings ditemukan / dibuat
   *       ↓
   * Update berdasarkan ID
   *       ↓
   * Return updated settings
   *
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
        storeName: data.storeName,

        storeDescription:
          data.storeDescription ?? null,

        footerDescription:
          data.footerDescription ?? null,

        email:
          data.email ?? null,

        whatsapp:
          data.whatsapp ?? null,

        address:
          data.address ?? null,

        city:
          data.city ?? null,

        province:
          data.province ?? null,

        postalCode:
          data.postalCode ?? null,

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