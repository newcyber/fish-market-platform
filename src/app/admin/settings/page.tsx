import { requireSuperAdmin } from "@/lib/auth/admin";

import SettingsForm from "@/components/admin/settings/SettingsForm";
import settingsService from "@/services/settings/settings.service";

/**
 * ============================================================
 * ADMIN STORE SETTINGS PAGE
 * ============================================================
 *
 * Flow:
 *
 * /admin/settings
 *       ↓
 * requireSuperAdmin()
 *       ↓
 * Authorization
 *       ↓
 * SettingsService
 *       ↓
 * Serialize Prisma Data
 *       ↓
 * SettingsForm
 *
 * ============================================================
 */

export default async function AdminSettingsPage() {
  /**
   * ==========================================================
   * AUTHORIZATION
   * ==========================================================
   *
   * Hanya SUPER_ADMIN yang boleh mengakses
   * Store Settings.
   *
   * Authentication dan authorization ditangani
   * oleh centralized auth helper.
   */

  await requireSuperAdmin();

  /**
   * ==========================================================
   * GET SETTINGS
   * ==========================================================
   *
   * getSettings() mengambil StoreSettings dari database.
   *
   * Prisma Decimal tidak dapat langsung dikirim dari Server
   * Component ke Client Component, sehingga latitude dan
   * longitude harus dikonversi menjadi number.
   */

  const settings =
    await settingsService.getSettings();

  /**
   * ==========================================================
   * SERIALIZE SETTINGS FOR CLIENT COMPONENT
   * ==========================================================
   */

  const serializedSettings = {
    ...settings,

    /**
     * ========================================================
     * STORE LOCATION
     * ========================================================
     */

    latitude:
      settings.latitude !== null
        ? Number(settings.latitude)
        : null,

    longitude:
      settings.longitude !== null
        ? Number(settings.longitude)
        : null,

    /**
     * ========================================================
     * INTERNAL SHIPPING
     * ========================================================
     */

    internalShippingBaseFee:
      Number(settings.internalShippingBaseFee),

    internalShippingPerKmFee:
      Number(settings.internalShippingPerKmFee),

    internalShippingMaxDistance:
      Number(settings.internalShippingMaxDistance),

    internalShippingFreeThreshold:
      settings.internalShippingFreeThreshold !== null
        ? Number(
            settings.internalShippingFreeThreshold
          )
        : null,
  };

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* ==================================================== */}
      {/* PAGE HEADER */}
      {/* ==================================================== */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan Toko
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Kelola informasi, kontak, alamat, dan jam operasional
          Pisjo Market.
        </p>
      </div>

      {/* ==================================================== */}
      {/* SETTINGS FORM */}
      {/* ==================================================== */}

      <SettingsForm
        settings={serializedSettings}
      />
    </div>
  );
}
