import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { getSiteUrls } from "@/services/site/site-url.service";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrls = await getSiteUrls();
  const requestHeaders = await headers();
  const requestHost =
    requestHeaders.get("host")?.split(":")[0].trim().toLowerCase() || "";
  const isLandingHost = siteUrls.landingHosts.includes(requestHost);
  const baseUrl = (
    isLandingHost ? siteUrls.landingPageUrl : siteUrls.storefrontUrl
  ).replace(/\/+$/, "");

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
