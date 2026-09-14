import type { Metadata } from "next";

import PisjoLandingPage from "@/components/landing/PisjoLandingPage";

import settingsService from "@/services/settings/settings.service";

import landingPageService from "@/repositories/landing-page/landing-page.service";

import {
  buildSeoMetadata,
  type SeoSettings,
} from "@/lib/seo/seo-metadata";

const LANDING_PAGE_URL = "https://pusatikansegar.com";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, landingPage] = await Promise.all([
    settingsService.getSettings(),
    landingPageService.getLandingPage(),
  ]);

  const config = landingPage.config;

  const hero = config.hero ?? {};
  const images = config.images ?? {};

  const storeName =
    settings.storeName?.trim() || "Pisjo Market";

  const storeDescription =
    settings.storeDescription?.trim() ||
    "Fresh Seafood";

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
    seoGoogleVerification:
      settings.seoGoogleVerification,
    seoAiEnabled: settings.seoAiEnabled,
    storeName,
    storeDescription,
  };

  return buildSeoMetadata(seoSettings, {
    baseUrl: LANDING_PAGE_URL,
    pathname: "/",
    title,
    description,
    ogTitle,
    ogDescription,
    image: ogImage,
  });
}

export default function Home() {
  return <PisjoLandingPage />;
}