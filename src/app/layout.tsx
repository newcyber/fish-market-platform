import "./globals.css";

import type { Metadata } from "next";

import { headers } from "next/headers";

import { Geist } from "next/font/google";

import { Toaster } from "sonner";

import { cn } from "@/lib/utils";

import MobileBottomNavigation from "@/components/layout/MobileBottomNavigation";

import SessionProvider from "@/components/providers/SessionProvider";

import OneSignalProvider from "@/components/providers/OneSignalProvider";

import FloatingCustomerService from "@/components/customer/FloatingCustomerService";

import settingsService from "@/services/settings/settings.service";

import { getSiteUrls } from "@/services/site/site-url.service";

import {
  buildSeoMetadata,
  type SeoSettings,
} from "@/lib/seo/seo-metadata";

/**
 * ==========================================================
 * FONT
 * ==========================================================
 */

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

/**
 * ==========================================================
 * METADATA
 * ==========================================================
 */

export async function generateMetadata(): Promise<Metadata> {
  const settings =
    await settingsService.getSettings();

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
    storeName: settings.storeName,
    storeDescription:
      settings.storeDescription,
  };

  return buildSeoMetadata(
    seoSettings,
    {
      pathname: "/",
    },
  );
}

/**
 * ==========================================================
 * ROOT LAYOUT
 * ==========================================================
 */

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * ========================================================
   * LOAD SETTINGS
   * ========================================================
   *
   * Store settings digunakan oleh:
   *
   * - FloatingCustomerService
   * - Site URL detection
   * - Mobile Bottom Navigation
   *
   * ========================================================
   */

  const settings =
    await settingsService.getSettings();

  /**
   * ========================================================
   * DETECT CURRENT HOST
   * ========================================================
   *
   * Pisjo Market memiliki dua konteks utama:
   *
   * 1. Landing Page
   *    https://pusatikansegar.com
   *
   * 2. Storefront / aplikasi
   *    https://app.pusatikansegar.com
   *
   * Keduanya dapat menggunakan pathname "/".
   *
   * Karena itu pathname saja TIDAK cukup untuk menentukan
   * apakah bottom navigation harus ditampilkan.
   *
   * ========================================================
   */

  const requestHeaders =
    await headers();

  const requestHost =
    requestHeaders
      .get("host")
      ?.split(":")[0]
      .trim()
      .toLowerCase() || "";

  /**
   * ========================================================
   * SITE URL CONFIGURATION
   * ========================================================
   */

  const siteUrls =
    await getSiteUrls();

  /**
   * ========================================================
   * LANDING HOST DETECTION
   * ========================================================
   *
   * Hanya homepage pada landing host yang tidak memakai
   * Mobile Bottom Navigation.
   *
   * Homepage storefront tetap memakai navigation.
   *
   * ========================================================
   */

  const isLandingHost =
    siteUrls.landingHosts.includes(
      requestHost,
    );

  return (
    <html
      lang="id"
      className={cn(
        "font-sans",
        geist.variable,
      )}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <SessionProvider>
          <OneSignalProvider />

          {children}

          <FloatingCustomerService
            whatsapp={settings.whatsapp}
          />

          <MobileBottomNavigation
            isLandingHost={isLandingHost}
          />

          <Toaster
            position="top-right"
            richColors
            expand
            closeButton
            duration={3000}
            visibleToasts={5}
          />
        </SessionProvider>
      </body>
    </html>
  );
}