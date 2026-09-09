import "./globals.css";

import type { Metadata } from "next";

import { Geist } from "next/font/google";

import { Toaster } from "sonner";

import { cn } from "@/lib/utils";

import MobileBottomNavigation from "@/components/layout/MobileBottomNavigation";

import SessionProvider from "@/components/providers/SessionProvider";

import FloatingCustomerService from "@/components/customer/FloatingCustomerService";

import settingsService from "@/services/settings/settings.service";

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

  const storeName =
    settings.storeName?.trim() ||
    "Pisjo Market Platform";

  const title =
    settings.seoTitle?.trim() ||
    storeName;

  const description =
    settings.seoDescription?.trim() ||
    settings.storeDescription?.trim() ||
    "Modern Pisjo Marketplace";

  const canonicalUrl =
    settings.seoCanonicalUrl?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000";

  const ogTitle =
    settings.seoOgTitle?.trim() ||
    title;

  const ogDescription =
    settings.seoOgDescription?.trim() ||
    description;

  const ogImage =
    settings.seoOgImage?.trim() ||
    undefined;

  const twitterCard =
    settings.seoTwitterCard === "summary"
      ? "summary"
      : "summary_large_image";

  const robotsIndex =
    settings.seoRobotsIndex;

  const robotsFollow =
    settings.seoRobotsFollow;

  const metadata: Metadata = {
    metadataBase: new URL(canonicalUrl),

    title: {
      default: title,
      template: `%s | ${storeName}`,
    },

    description,

    ...(settings.seoKeywords?.trim()
      ? {
          keywords: settings.seoKeywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean),
        }
      : {}),

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      type: "website",
      siteName: storeName,
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      locale: "id_ID",
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
              },
            ],
          }
        : {}),
    },

    twitter: {
      card: twitterCard,
      title: ogTitle,
      description: ogDescription,
      ...(ogImage
        ? {
            images: [ogImage],
          }
        : {}),
    },

    robots: {
      index: robotsIndex,
      follow: robotsFollow,
    },

    ...(settings.seoGoogleVerification?.trim()
      ? {
          verification: {
            google:
              settings.seoGoogleVerification.trim(),
          },
        }
      : {}),
  };

  return metadata;
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
