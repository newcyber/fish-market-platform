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

const LANDING_PAGE_URL =
  "https://pusatikansegar.com";

const STORE_URL =
  "https://app.pusatikansegar.com";

const LANDING_HOSTS = new Set([
  "pusatikansegar.com",
  "www.pusatikansegar.com",
]);

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
 * Karena itu host request dapat digunakan untuk
 * menentukan apakah request berasal dari:
 *
 * pusatikansegar.com
 * atau
 * app.pusatikansegar.com
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

function isLandingHost(
  host: string,
): boolean {
  return LANDING_HOSTS.has(host);
}

/**
 * ==========================================================
 * FORCE DYNAMIC
 * ==========================================================
 *
 * Root "/" memiliki dua fungsi berdasarkan hostname:
 *
 * pusatikansegar.com
 * -> Landing Page
 *
 * app.pusatikansegar.com
 * -> Storefront
 *
 * Selain itu status Landing Page berasal dari database.
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
 */
export async function generateMetadata(): Promise<Metadata> {
  const host = await getRequestHost();

  const [
    settings,
    landingPage,
  ] = await Promise.all([
    settingsService.getSettings(),
    isLandingHost(host)
      ? landingPageService.getLandingPage()
      : Promise.resolve(null),
  ]);

  const storeName =
    settings.storeName?.trim() ||
    "Pisjo Market";

  const storeDescription =
    settings.storeDescription?.trim() ||
    "Fresh Seafood";

  const seoSettings: SeoSettings = {
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    seoKeywords: settings.seoKeywords,
    seoCanonicalUrl:
      settings.seoCanonicalUrl,
    seoOgTitle: settings.seoOgTitle,
    seoOgDescription:
      settings.seoOgDescription,
    seoOgImage: settings.seoOgImage,
    seoTwitterCard:
      settings.seoTwitterCard,
    seoRobotsIndex:
      settings.seoRobotsIndex,
    seoRobotsFollow:
      settings.seoRobotsFollow,
    seoGoogleVerification:
      settings.seoGoogleVerification,
    seoAiEnabled:
      settings.seoAiEnabled,
    storeName,
    storeDescription,
  };

  /**
   * ========================================================
   * LANDING PAGE METADATA
   * ========================================================
   */
  if (
    isLandingHost(host) &&
    landingPage
  ) {
    const config =
      landingPage.config;

    const hero =
      config.hero ?? {};

    const images =
      config.images ?? {};

    const title =
      hero.title?.trim() ||
      `${storeName} - Seafood Segar dan Pilihan`;

    const description =
      hero.description?.trim() ||
      storeDescription;

    const ogTitle =
      hero.title?.trim() ||
      title;

    const ogDescription =
      hero.description?.trim() ||
      description;

    const ogImage =
      images.ogImage?.trim() ||
      null;

    return buildSeoMetadata(
      seoSettings,
      {
        baseUrl:
          LANDING_PAGE_URL,
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
   * Jangan gunakan canonical Landing Page untuk
   * app.pusatikansegar.com.
   */
  return buildSeoMetadata(
    seoSettings,
    {
      baseUrl: STORE_URL,
      pathname: "/",
    },
  );
}

/**
 * ==========================================================
 * HOME
 * ==========================================================
 *
 * pusatikansegar.com
 * -> PisjoLandingPage
 *
 * app.pusatikansegar.com
 * -> SharedHomePage
 *
 * ==========================================================
 */
export default async function Home() {
  const host =
    await getRequestHost();

  /**
   * ========================================================
   * LANDING DOMAIN
   * ========================================================
   */
  if (
    isLandingHost(host)
  ) {
    return (
      <PisjoLandingPage />
    );
  }

  /**
   * ========================================================
   * STOREFRONT DOMAIN
   * ========================================================
   *
   * app.pusatikansegar.com
   */
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <DynamicSiteHeader
        activePage="home"
      />

      <SharedHomePage
        mode="guest"
      />

      <DynamicSiteFooter />
    </main>
  );
}