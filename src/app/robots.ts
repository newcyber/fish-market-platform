import type { MetadataRoute } from "next";

import { getSiteUrls } from "@/services/site/site-url.service";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrls = await getSiteUrls();

  const baseUrl = siteUrls.storefrontUrl.replace(/\/+$/, "");

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
