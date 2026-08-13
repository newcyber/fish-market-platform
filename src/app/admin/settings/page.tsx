import { redirect } from "next/navigation";

import { auth } from "@/auth";

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
 * Authentication
 *       ↓
 * Authorization
 *       ↓
 * SettingsService
 *       ↓
 * SettingsForm
 *
 * ============================================================
 */

export default async function AdminSettingsPage() {
  /**
   * ==========================================================
   * AUTHENTICATION
   * ==========================================================
   */
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  /**
   * ==========================================================
   * AUTHORIZATION
   * ==========================================================
   */
  const role = session.user.role;

const isAdmin =
  role === "ADMIN" ||
  role === "SUPER_ADMIN";

if (!isAdmin) {
  redirect("/admin");
}

  /**
   * ==========================================================
   * GET SETTINGS
   * ==========================================================
   *
   * getSettings() akan mengambil StoreSettings.
   *
   * Jika record belum ada, repository akan otomatis membuat
   * konfigurasi default Fish Market.
   */
  const settings =
    await settingsService.getSettings();

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
          Fish Market.
        </p>
      </div>

      {/* ==================================================== */}
      {/* SETTINGS FORM */}
      {/* ==================================================== */}

      <SettingsForm settings={settings} />
    </div>
  );
}