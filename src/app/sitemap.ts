import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import ProductService from "@/services/product/product.service";
import PromotionService from "@/services/promotion/promotion.service";
import FlashSaleService from "@/services/flash-sale/flash-sale.service";
import { getSiteUrls } from "@/services/site/site-url.service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrls = await getSiteUrls();
  const requestHeaders = await headers();
  const requestHost =
    requestHeaders.get("host")?.split(":")[0].trim().toLowerCase() || "";
  const isLandingHost = siteUrls.landingHosts.includes(requestHost);
  const baseUrl = (
    isLandingHost ? siteUrls.landingPageUrl : siteUrls.storefrontUrl
  ).replace(/\/+$/, "");

  if (isLandingHost) {
    return [
      { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
      {
        url: `${baseUrl}/tentang-kami`,
        changeFrequency: "monthly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/kontak-kami`,
        changeFrequency: "monthly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/privacy-policy`,
        changeFrequency: "yearly",
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms-and-conditions`,
        changeFrequency: "yearly",
        priority: 0.3,
      },
    ];
  }

  const [products, promotions, flashSales] = await Promise.all([
    ProductService.getPublishedProductsForSitemap(),
    PromotionService.getActiveForCustomer(),
    FlashSaleService.getActiveForCustomer(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/flash-sale`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/promotions`, changeFrequency: "daily", priority: 0.8 },
    {
      url: `${baseUrl}/tentang-kami`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kontak-kami`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${baseUrl}/help`, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${baseUrl}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return [
    ...staticPages,
    ...products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...promotions.map((promotion) => ({
      url: `${baseUrl}/promotions/${promotion.slug}`,
      lastModified: promotion.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...flashSales.map((flashSale) => ({
      url: `${baseUrl}/flash-sale/${flashSale.slug}`,
      lastModified: flashSale.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
