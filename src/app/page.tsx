import type { Metadata } from "next";
import { headers } from "next/headers";

import DynamicSiteFooter from "@/components/layout/DynamicSiteFooter";
import DynamicSiteHeader from "@/components/layout/DynamicSiteHeader";
import SharedHomePage from "@/components/customer/home/SharedHomePage";
import PisjoLandingPage from "@/components/landing/PisjoLandingPage";

import settingsService from "@/services/settings/settings.service";
import landingPageService from "@/repositories/landing-page/landing-page.service";

import {
  buildSeoMetadata,
  type SeoSettings,
} from "@/lib/seo/seo-metadata";

import { getSiteUrls } from "@/services/site/site-url.service";

/**
 * ==========================================================
 * REQUEST HOST
 * ==========================================================
 *
 * Cloudflare -> Nginx -> Next.js
 *
 * Nginx meneruskan Host asli menggunakan:
 *
 * proxy_set_header Host $host;
 *
 * Host digunakan untuk menentukan apakah request berasal dari:
 *
 * pusatikansegar.com / www.pusatikansegar.com
 * atau
 * app.pusatikansegar.com
 *
 * Host landing tidak lagi hardcoded.
 * Nilainya berasal dari Site URL Settings.
 *
 * ==========================================================
 */
async function getRequestHost(): Promise<string> {
  const requestHeaders = await headers();

  return (
    requestHeaders
      .get("host")
      ?.split(":")[0]
      .trim()
      .toLowerCase() || ""
  );
}

/**
 * ==========================================================
 * FORCE DYNAMIC
 * ==========================================================
 *
 * Root "/" memiliki dua fungsi berdasarkan hostname:
 *
 * Landing host
 * -> Landing Page
 *
 * Storefront host
 * -> Storefront
 *
 * Selain itu URL domain dan status Landing Page
 * berasal dari database.
 *
 * Jangan prerender "/" saat build.
 *
 * ==========================================================
 */
export const dynamic = "force-dynamic";

/**
 * ==========================================================
 * METADATA
 * ==========================================================
 *
 * Global SEO Settings menjadi sumber utama:
 *
 * SEO Title
 * SEO Description
 * SEO OG Title
 * SEO OG Description
 * SEO OG Image
 *
 * Landing Page Settings hanya mengatur metadata khusus
 * yang memang bersifat visual/content landing.
 *
 * Hero Title tetap digunakan sebagai H1 di landing page,
 * bukan sebagai <title> SEO.
 *
 * ==========================================================
 */
export async function generateMetadata(): Promise<Metadata> {
  const siteUrls = await getSiteUrls();
  const host = await getRequestHost();

  const landingHosts = new Set(siteUrls.landingHosts);
  const isLandingHost = landingHosts.has(host);

  const [settings, landingPage] = await Promise.all([
    settingsService.getSettings(),
    isLandingHost
      ? landingPageService.getLandingPage()
      : Promise.resolve(null),
  ]);

  const storeName =
    settings.storeName?.trim() || "Pisjo Market";

  const storeDescription =
    settings.storeDescription?.trim() || "Fresh Seafood";

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
    storeName,
    storeDescription,
  };

  /**
   * ========================================================
   * LANDING PAGE METADATA
   * ========================================================
   *
   * Landing menggunakan Global SEO sebagai sumber utama
   * untuk title dan description.
   *
   * Landing image dapat menggunakan ogImage khusus dari
   * Landing Page Settings, dengan fallback ke Global SEO.
   *
   * ========================================================
   */
  if (isLandingHost && landingPage) {
    const config = landingPage.config;
    const images = config.images ?? {};

    const title =
      seoSettings.seoTitle?.trim() ||
      `${storeName} - Seafood Segar dan Pilihan`;

    const description =
      seoSettings.seoDescription?.trim() ||
      storeDescription;

    const ogTitle =
      seoSettings.seoOgTitle?.trim() ||
      title;

    const ogDescription =
      seoSettings.seoOgDescription?.trim() ||
      description;

    const ogImage =
      images.ogImage?.trim() ||
      seoSettings.seoOgImage?.trim() ||
      null;

    return buildSeoMetadata(
      seoSettings,
      {
        baseUrl: siteUrls.landingPageUrl,
        pathname: "/",
        title,
        description,
        ogTitle,
        ogDescription,
        image: ogImage,
      },
    );
  }

  /**
   * ========================================================
   * STOREFRONT METADATA
   * ========================================================
   *
   * Storefront menggunakan Storefront URL dari Admin Settings.
   *
   * Jangan menggunakan Landing Page URL untuk canonical
   * storefront.
   *
   * ========================================================
   */
  return buildSeoMetadata(
    seoSettings,
    {
      baseUrl: siteUrls.storefrontUrl,
      pathname: "/",
    },
  );
}

/**
 * ==========================================================
 * HOME
 * ==========================================================
 *
 * Landing host
 * -> PisjoLandingPage
 *
 * Storefront host
 * -> SharedHomePage
 *
 * Host ditentukan dari Site URL Settings.
 *
 * ==========================================================
 */
export default async function Home() {
  const siteUrls = await getSiteUrls();
  const host = await getRequestHost();

  const landingHosts = new Set(siteUrls.landingHosts);

  if (landingHosts.has(host)) {
    return <PisjoLandingPage />;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <DynamicSiteHeader activePage="home" />
      <SharedHomePage mode="guest" />
      <DynamicSiteFooter />
    </main>
  );
}