import "./globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { Toaster } from "sonner";

import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Pisjo Market Platform",
    template: "%s | Pisjo Market Platform",
  },

  description: "Modern Pisjo Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        {children}

        <Toaster
          position="top-right"
          richColors
          expand
          closeButton
          duration={3000}
          visibleToasts={5}
        />
      </body>
    </html>
  );
}