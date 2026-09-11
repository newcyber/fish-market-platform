import ProductService from "@/services/product/product.service";

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

  const analysis = analyzeSeoMetadata({
    entityType: "product",

    name: product.name,
    slug: product.slug,

    description: product.description,

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