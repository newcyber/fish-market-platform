import type { Metadata } from "next";

import ContactUsPage from "@/components/customer/contact/ContactUsPage";
import InformationalJsonLd from "@/components/seo/InformationalJsonLd";
import settingsService from "@/services/settings/settings.service";
import { getSiteUrls } from "@/services/site/site-url.service";
import { buildSeoMetadata, type SeoSettings } from "@/lib/seo/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, siteUrls] = await Promise.all([
    settingsService.getSettings(),
    getSiteUrls(),
  ]);

  const seoSettings: SeoSettings = {
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    seoKeywords: settings.seoKeywords,
    seoCanonicalUrl: settings.seoCanonicalUrl,
    seoOgTitle: settings.seoOgTitle,
    seoOgDescription: settings.seoOgDescription,
    seoOgImage: settings.seoOgImage,
    seoTwitterCard: settings.seoTwitterCard,
    seoRobotsIndex: settings.seoRobotsIndex,
    seoRobotsFollow: settings.seoRobotsFollow,
    seoGoogleVerification: settings.seoGoogleVerification,
    seoAiEnabled: settings.seoAiEnabled,
    storeName: settings.storeName,
    storeDescription: settings.storeDescription,
  };

  return buildSeoMetadata(seoSettings, {
    baseUrl: siteUrls.landingPageUrl,
    pathname: "/kontak-kami",
    title: `Kontak Kami | ${settings.storeName?.trim() || "Pisjo Market"}`,
    description:
      "Hubungi Pisjo Market untuk informasi produk, pemesanan, pengiriman, dan layanan pelanggan.",
  });
}

export default async function ContactPage() {
  const [settings, siteUrls] = await Promise.all([
    settingsService.getSettings(),
    getSiteUrls(),
  ]);

  const name = settings.storeName?.trim() || "Pisjo Market";
  const url = `${siteUrls.landingPageUrl}/kontak-kami`;

  return (
    <>
      <InformationalJsonLd
        type="ContactPage"
        name={`Kontak Kami | ${name}`}
        description="Hubungi Pisjo Market untuk informasi produk, pemesanan, pengiriman, dan layanan pelanggan."
        url={url}
        siteUrl={siteUrls.landingPageUrl}
        breadcrumbs={[
          { name: "Beranda", url: `${siteUrls.landingPageUrl}/` },
          { name: "Kontak Kami", url },
        ]}
      />
      <ContactUsPage />
    </>
  );
}
