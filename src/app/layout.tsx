import "./globals.css";

import type { Metadata } from "next";

import { Geist } from "next/font/google";

import { Toaster } from "sonner";

import { cn } from "@/lib/utils";

import MobileBottomNavigation from "@/components/layout/MobileBottomNavigation";

import SessionProvider from "@/components/providers/SessionProvider";

import FloatingCustomerService from "@/components/customer/FloatingCustomerService";

import settingsService from "@/services/settings/settings.service";

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
  const settings = await settingsService.getSettings();

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
    pathname: "/",
  });
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
  const settings =
    await settingsService.getSettings();

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
          {children}

          <FloatingCustomerService
            whatsapp={settings.whatsapp}
          />

          <MobileBottomNavigation />

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
