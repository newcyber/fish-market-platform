import { requireSuperAdmin } from "@/lib/auth/admin";

import ChangelogSettings from "@/components/admin/settings/ChangelogSettings";
import SettingsForm from "@/components/admin/settings/SettingsForm";
import changelogService from "@/services/changelog/changelog.service";
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
   * Component ke Client Component, sehingga field Decimal
   * dikonversi menjadi number.
   */

  const [settings, changelogReleases] =
    await Promise.all([
      settingsService.getSettings(),
      changelogService.getAllReleases(),
    ]);

  /**
   * ==========================================================
   * SERIALIZE SETTINGS FOR CLIENT COMPONENT
   * ==========================================================
   *
   * Prisma Decimal harus dikonversi menjadi number
   * sebelum dikirim ke SettingsForm.
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
     *
     * Semua field Decimal dikonversi ke number.
     */

    internalShippingBaseFee:
      Number(settings.internalShippingBaseFee),

    internalShippingPerKmFee:
      Number(settings.internalShippingPerKmFee),

    internalShippingMinFee:
      Number(settings.internalShippingMinFee),

    internalShippingMaxDistance:
      Number(settings.internalShippingMaxDistance),

    internalShippingFreeThreshold:
      settings.internalShippingFreeThreshold !== null
        ? Number(
            settings.internalShippingFreeThreshold
          )
        : null,

    internalShippingFreeMaxDiscount:
      Number(
        settings.internalShippingFreeMaxDiscount
      ),
  };

  /**
   * ==========================================================
   * SERIALIZE CHANGELOG FOR CLIENT COMPONENT
   * ==========================================================
   *
   * Date dari Prisma harus dikonversi menjadi string
   * sebelum dikirim ke Client Component.
   */

  const serializedChangelogReleases =
    changelogReleases.map((release) => ({
      ...release,
      date: release.date.toISOString(),
      createdAt:
        release.createdAt.toISOString(),
      updatedAt:
        release.updatedAt.toISOString(),
      entries: release.entries.map(
        (entry) => ({
          ...entry,
          createdAt:
            entry.createdAt.toISOString(),
          updatedAt:
            entry.updatedAt.toISOString(),
        }),
      ),
    }));

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

      {/* ==================================================== */}
      {/* CHANGELOG */}
      {/* ==================================================== */}

      <ChangelogSettings
        releases={serializedChangelogReleases}
      />
    </div>
  );
}
