import "./globals.css";

import type {
  Metadata,
} from "next";

import {
  Geist,
} from "next/font/google";

import {
  Toaster,
} from "sonner";

import {
  cn,
} from "@/lib/utils";

import MobileBottomNavigation from
  "@/components/layout/MobileBottomNavigation";

import SessionProvider from
  "@/components/providers/SessionProvider";

import FloatingCustomerService from
  "@/components/customer/FloatingCustomerService";

import settingsService from
  "@/services/settings/settings.service";

/**
 * ==========================================================
 * FONT
 * ==========================================================
 */

const geist =
  Geist({
    subsets: [
      "latin",
    ],

    variable:
      "--font-sans",
  });

/**
 * ==========================================================
 * METADATA
 * ==========================================================
 */

export const metadata:
  Metadata = {
    title: {
      default:
        "Pisjo Market Platform",

      template:
        "%s | Pisjo Market Platform",
    },

    description:
      "Modern Pisjo Marketplace",
  };

/**
 * ==========================================================
 * ROOT LAYOUT
 * ==========================================================
 */

export default async function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  const settings =
    await settingsService.getSettings();

  return (
    <html
      lang="id"
      className={cn(
        "font-sans",
        geist.variable
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