import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Fish Market Platform",
    template: "%s | Fish Market Platform",
  },
  description: "Modern Fish Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}