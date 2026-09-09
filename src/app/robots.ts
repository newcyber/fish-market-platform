import type { MetadataRoute } from "next";

import settingsService from "@/services/settings/settings.service";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings =
    await settingsService.getSettings();

  const canonicalBase =
    settings.seoCanonicalUrl?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000";

  const baseUrl =
    canonicalBase.replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/customer",
        "/customer/",
        "/cart",
        "/cart/",
        "/api",
        "/api/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/login-required",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
