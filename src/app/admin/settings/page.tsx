import { requireSuperAdmin } from "@/lib/auth/admin";
import SettingsForm from "@/components/admin/settings/SettingsForm";
import settingsService from "@/services/settings/settings.service";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  /**
   * ============================================================
   * AUTHORIZATION
   * ============================================================
   *
   * Pengaturan toko adalah konfigurasi sensitif.
   *
   * Hanya SUPER_ADMIN yang boleh membuka halaman ini.
   * ADMIN biasa tetap dapat mengakses area /admin lainnya,
   * tetapi tidak boleh masuk ke /admin/settings.
   */
  await requireSuperAdmin();

  /**
   * ============================================================
   * LOAD CURRENT STORE SETTINGS
   * ============================================================
   */
  const rawSettings = await settingsService.getSettings();

  /**
   * SettingsForm menggunakan number untuk field konfigurasi
   * shipping/order. Prisma dapat mengembalikan Decimal pada
   * beberapa versi schema/client, sehingga normalisasi dilakukan
   * di boundary page agar component menerima tipe yang konsisten.
   */
  const settings = {
    storeName: rawSettings.storeName,
    storeDescription: rawSettings.storeDescription,
    footerDescription: rawSettings.footerDescription,
    tierSystemEnabled: rawSettings.tierSystemEnabled,

    landingPageUrl: rawSettings.landingPageUrl,
    storefrontUrl: rawSettings.storefrontUrl,

    seoTitle: rawSettings.seoTitle,
    seoDescription: rawSettings.seoDescription,
    seoKeywords: rawSettings.seoKeywords,
    seoCanonicalUrl: rawSettings.seoCanonicalUrl,
    seoOgTitle: rawSettings.seoOgTitle,
    seoOgDescription: rawSettings.seoOgDescription,
    seoOgImage: rawSettings.seoOgImage,
    seoTwitterCard: rawSettings.seoTwitterCard,
    seoRobotsIndex: rawSettings.seoRobotsIndex,
    seoRobotsFollow: rawSettings.seoRobotsFollow,
    seoGoogleVerification: rawSettings.seoGoogleVerification,
    seoAiEnabled: rawSettings.seoAiEnabled,

    siteLogo: rawSettings.siteLogo,

    email: rawSettings.email,
    whatsapp: rawSettings.whatsapp,

    address: rawSettings.address,
    city: rawSettings.city,
    province: rawSettings.province,
    postalCode: rawSettings.postalCode,

    latitude:
      rawSettings.latitude === null
        ? null
        : Number(rawSettings.latitude),
    longitude:
      rawSettings.longitude === null
        ? null
        : Number(rawSettings.longitude),

    internalShippingEnabled:
      rawSettings.internalShippingEnabled,
    internalShippingName:
      rawSettings.internalShippingName,
    internalShippingBaseFee:
      Number(rawSettings.internalShippingBaseFee),
    internalShippingPerKmFee:
      Number(rawSettings.internalShippingPerKmFee),
    internalShippingMinFee:
      Number(rawSettings.internalShippingMinFee),
    internalShippingMaxDistance:
      Number(rawSettings.internalShippingMaxDistance),
    internalShippingFreeThreshold:
      rawSettings.internalShippingFreeThreshold === null
        ? null
        : Number(rawSettings.internalShippingFreeThreshold),
    internalShippingFreeMaxDiscount:
      Number(rawSettings.internalShippingFreeMaxDiscount),

    openingTime: rawSettings.openingTime,
    closingTime: rawSettings.closingTime,

    paymentTimeoutHours:
      Number(rawSettings.paymentTimeoutHours),
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan Toko
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Kelola informasi toko, SEO, kontak, lokasi toko,
          pengiriman internal, jam operasional, dan konfigurasi
          pesanan.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
