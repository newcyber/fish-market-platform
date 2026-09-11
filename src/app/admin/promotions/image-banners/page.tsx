import { requireSuperAdmin } from "@/lib/auth/admin";

import ImageBannerSettingsForm from "@/components/admin/promotions/ImageBannerSettingsForm";
import settingsService from "@/services/settings/settings.service";

/**
 * ============================================================
 * ADMIN IMAGE BANNER SETTINGS PAGE
 * ============================================================
 *
 * /admin/promotions/image-banners
 *       ↓
 * requireSuperAdmin()
 *       ↓
 * SettingsService
 *       ↓
 * ImageBannerSettingsForm
 *
 * Halaman ini hanya menangani pengaturan Image Banner.
 * Tidak mengirim Store Settings lainnya ke client form.
 *
 * ============================================================
 */

export default async function ImageBannerSettingsPage() {
  /**
   * ==========================================================
   * AUTHORIZATION
   * ==========================================================
   */

  await requireSuperAdmin();

  /**
   * ==========================================================
   * GET SETTINGS
   * ==========================================================
   */

  const settings =
    await settingsService.getSettings();

  /**
   * ==========================================================
   * SERIALIZE IMAGE BANNER SETTINGS
   * ==========================================================
   *
   * Hanya field Image Banner yang dikirim
   * ke Client Component.
   */

  const imageBannerSettings = {
    heroSlide1Image:
      settings.heroSlide1Image,
    heroSlide1Eyebrow:
      settings.heroSlide1Eyebrow,
    heroSlide1Title:
      settings.heroSlide1Title,
    heroSlide1Highlight:
      settings.heroSlide1Highlight,
    heroSlide1Description:
      settings.heroSlide1Description,
    heroSlide1Button:
      settings.heroSlide1Button,

    heroSlide2Image:
      settings.heroSlide2Image,
    heroSlide2Eyebrow:
      settings.heroSlide2Eyebrow,
    heroSlide2Title:
      settings.heroSlide2Title,
    heroSlide2Highlight:
      settings.heroSlide2Highlight,
    heroSlide2Description:
      settings.heroSlide2Description,
    heroSlide2Button:
      settings.heroSlide2Button,

    heroSlide3Image:
      settings.heroSlide3Image,
    heroSlide3Eyebrow:
      settings.heroSlide3Eyebrow,
    heroSlide3Title:
      settings.heroSlide3Title,
    heroSlide3Highlight:
      settings.heroSlide3Highlight,
    heroSlide3Description:
      settings.heroSlide3Description,
    heroSlide3Button:
      settings.heroSlide3Button,

    loginSlide1Image:
      settings.loginSlide1Image,
    loginSlide2Image:
      settings.loginSlide2Image,
    loginSlide3Image:
      settings.loginSlide3Image,
    loginSlide4Image:
      settings.loginSlide4Image,

    flashSaleBannerImage:
      settings.flashSaleBannerImage,
    flashSaleBannerLabel:
      settings.flashSaleBannerLabel,
    flashSaleBannerTitle:
      settings.flashSaleBannerTitle,
    flashSaleBannerHighlight:
      settings.flashSaleBannerHighlight,
    flashSaleBannerDescription:
      settings.flashSaleBannerDescription,

    promoSectionLabel:
      settings.promoSectionLabel,
    promoSectionTitle:
      settings.promoSectionTitle,
    promoSectionLinkLabel:
      settings.promoSectionLinkLabel,
    promoSectionLinkHref:
      settings.promoSectionLinkHref,

    promoCard1Image:
      settings.promoCard1Image,
    promoCard1Eyebrow:
      settings.promoCard1Eyebrow,
    promoCard1Title:
      settings.promoCard1Title,
    promoCard1Description:
      settings.promoCard1Description,
    promoCard1Button:
      settings.promoCard1Button,
    promoCard1Href:
      settings.promoCard1Href,

    promoCard2Image:
      settings.promoCard2Image,
    promoCard2Eyebrow:
      settings.promoCard2Eyebrow,
    promoCard2Title:
      settings.promoCard2Title,
    promoCard2Description:
      settings.promoCard2Description,
    promoCard2Button:
      settings.promoCard2Button,
    promoCard2Href:
      settings.promoCard2Href,
  };

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* ====================================================
          PAGE HEADER
          ==================================================== */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Image Banner
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Kelola Hero Slider, Mobile Login Slider,
          Banner Flash Sale, dan Promo Pilihan.
        </p>
      </div>

      {/* ====================================================
          IMAGE BANNER FORM
          ==================================================== */}

      <ImageBannerSettingsForm
        settings={imageBannerSettings}
      />
    </div>
  );
}