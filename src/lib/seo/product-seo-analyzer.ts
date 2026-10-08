import ProductService from "@/services/product/product.service";
import settingsService from "@/services/settings/settings.service";
import { getSiteUrls } from "@/services/site/site-url.service";
import { buildProductSeoContent, resolveSeoImageUrl } from "./seo.utils";

import {
  analyzeSeoMetadata,
  type SeoAnalysisResult,
} from "./seo-analyzer";

export type ProductSeoAnalysis = {
  productId: string;
  name: string;
  slug: string;
  analysis: SeoAnalysisResult;
};

export async function analyzeProductSeo(
  productId: string,
): Promise<ProductSeoAnalysis | null> {
  const product =
    await ProductService.getProductById(productId);

  if (!product) {
    return null;
  }

  const [settings, siteUrls] = await Promise.all([
    settingsService.getSettings(),
    getSiteUrls(),
  ]);

  const storeName =
    settings.storeName?.trim() || "Pisjo Market";
  const seoContent = buildProductSeoContent({
    productName: product.name,
    categoryName: product.category?.name,
    description: product.description,
    storeName,
    locationLabel: "Jogja",
  });

  const canonicalUrl = new URL(
    `/products/${encodeURIComponent(product.slug)}`,
    `${siteUrls.storefrontUrl.replace(/\/+$/, "")}/`,
  ).toString();

  const productImage = product.images?.find(
    (image) =>
      (!image.mediaType || image.mediaType === "IMAGE") &&
      Boolean(image.image?.trim()),
  )?.image;

  const ogImage = productImage
    ? resolveSeoImageUrl(productImage, siteUrls.storefrontUrl)
    : settings.seoOgImage;

  const analysis = analyzeSeoMetadata({
    entityType: "product",

    name: product.name,
    slug: product.slug,

    // Analyze the metadata actually emitted by the public product page.
    title: seoContent.title,
    description: seoContent.description,
    canonicalUrl,
    ogTitle: seoContent.title,
    ogDescription: seoContent.description,
    ogImage,

    categoryName:
      product.category?.name ?? null,

    categorySlug:
      product.category?.slug ?? null,

    ingredients: product.ingredients,

    nutritionInformation:
      product.nutritionInformation,

    storageInstructions:
      product.storageInstructions,

    usageInstructions:
      product.usageInstructions,
  });

  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    analysis,
  };
}