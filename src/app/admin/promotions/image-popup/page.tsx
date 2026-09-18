import { requireSuperAdmin } from "@/lib/auth/admin";

import PromoPopupSettingsForm from "@/components/admin/promotions/PromoPopupSettingsForm";

import settingsService from "@/services/settings/settings.service";

/**
 * ============================================================
 * ADMIN IMAGE POPUP SETTINGS PAGE
 * ============================================================
 *
 * /admin/promotions/image-popup
 * ============================================================
 */

export default async function ImagePopupSettingsPage() {
  await requireSuperAdmin();

  const settings =
    await settingsService.getSettings();

  const promoPopupSettings = {
    promoPopupEnabled:
      settings.promoPopupEnabled ?? false,

    promoPopupImage:
      settings.promoPopupImage ?? null,

    promoPopupAlt:
      settings.promoPopupAlt ?? null,

    promoPopupHref:
      settings.promoPopupHref ?? null,

    promoPopupDelay:
      settings.promoPopupDelay ?? 1200,

    promoPopupVersion:
      settings.promoPopupVersion ?? null,

    promoPopupRememberClose:
      settings.promoPopupRememberClose ?? true,
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* ====================================================
          PAGE HEADER
          ==================================================== */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Image Popup
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Kelola popup promosi yang ditampilkan otomatis
          pada homepage Pisjo Market.
        </p>
      </div>

      <PromoPopupSettingsForm
        settings={promoPopupSettings}
      />
    </div>
  );
}