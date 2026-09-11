"use server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import {
  generateAiSeoRecommendation,
} from "@/lib/seo/ai-seo.service";
import type {
  AiSeoRecommendation,
  AiSeoRecommendationInput,
} from "@/lib/seo/ai-seo";
import { analyzeProductSeo } from "@/lib/seo/product-seo-analyzer";
import settingsService from "@/services/settings/settings.service";
import ProductService from "@/services/product/product.service";

export interface GenerateProductSeoRecommendationActionResult {
  success: boolean;
  message: string;
  data?: AiSeoRecommendation;
}

export async function generateProductSeoRecommendationAction(
  productId: string,
): Promise<GenerateProductSeoRecommendationActionResult> {
  try {
    await requireSuperAdmin();

    const normalizedProductId =
      productId.trim();

    if (!normalizedProductId) {
      return {
        success: false,
        message: "Product ID wajib diisi.",
      };
    }

    const settings =
      await settingsService.getSettings();

    if (!settings.seoAiEnabled) {
      return {
        success: false,
        message:
          "AI SEO sedang dinonaktifkan. Aktifkan AI SEO terlebih dahulu.",
      };
    }

    const product =
      await ProductService.getProductById(
        normalizedProductId,
      );

    if (!product) {
      return {
        success: false,
        message: "Produk tidak ditemukan.",
      };
    }

    const productAnalysis =
      await analyzeProductSeo(
        normalizedProductId,
      );

    if (!productAnalysis) {
      return {
        success: false,
        message:
          "Analisis SEO produk tidak dapat dilakukan.",
      };
    }

    const input: AiSeoRecommendationInput = {
      entityType: "product",
      entityId: product.id,
      name: product.name,
      description:
        product.description,
      slug: product.slug,
      currentMetadata: {
        title: null,
        description:
          product.description,
        canonicalUrl: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
      },
      analysis:
        productAnalysis.analysis,
    };

    const recommendation =
      await generateAiSeoRecommendation(
        input,
      );

    return {
      success: true,
      message:
        "Rekomendasi SEO dari AI berhasil dibuat.",
      data: recommendation,
    };
  } catch (error) {
    console.error(
      "[GENERATE_PRODUCT_SEO_RECOMMENDATION_ERROR]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal membuat rekomendasi SEO dengan AI.",
    };
  }
}