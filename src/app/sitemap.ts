import type { MetadataRoute } from "next";

import ProductService from "@/services/product/product.service";
import PromotionService from "@/services/promotion/promotion.service";
import FlashSaleService from "@/services/flash-sale/flash-sale.service";
import settingsService from "@/services/settings/settings.service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, products, promotions, flashSales] =
    await Promise.all([
      settingsService.getSettings(),
      ProductService.getPublishedProductsForSitemap(),
      PromotionService.getActiveForCustomer(),
      FlashSaleService.getActiveForCustomer(),
    ]);

  const canonicalBase =
    settings.seoCanonicalUrl?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000";

  const baseUrl = canonicalBase.replace(/\/+$/, "");

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/flash-sale`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/promotions`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/help`,
      changeFrequency: "monthly",
      priority: 0.5,
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

  const productPages: MetadataRoute.Sitemap = products.map(
    (product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  const promotionPages: MetadataRoute.Sitemap =
    promotions.map((promotion) => ({
      url: `${baseUrl}/promotions/${promotion.slug}`,
      lastModified: promotion.updatedAt,
      changeFrequency: "daily",
      priority: 0.7,
    }));

  const flashSalePages: MetadataRoute.Sitemap =
    flashSales.map((flashSale) => ({
      url: `${baseUrl}/flash-sale/${flashSale.slug}`,
      lastModified: flashSale.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  return [
    ...staticPages,
    ...productPages,
    ...promotionPages,
    ...flashSalePages,
  ];
}
