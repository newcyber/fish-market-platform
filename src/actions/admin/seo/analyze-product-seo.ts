"use server";

import { requireSuperAdmin } from "@/lib/auth/admin";

import { analyzeProductSeo } from "@/lib/seo/product-seo-analyzer";

export interface AnalyzeProductSeoActionResult {
  success: boolean;
  message: string;
  data?: Awaited<
    ReturnType<typeof analyzeProductSeo>
  >;
}

export async function analyzeProductSeoAction(
  productId: string,
): Promise<AnalyzeProductSeoActionResult> {
  try {
    await requireSuperAdmin();

    const normalizedProductId = productId.trim();

    if (!normalizedProductId) {
      return {
        success: false,
        message: "Product ID wajib diisi.",
      };
    }

    const result =
      await analyzeProductSeo(
        normalizedProductId,
      );

    if (!result) {
      return {
        success: false,
        message: "Produk tidak ditemukan.",
      };
    }

    return {
      success: true,
      message: "Analisis SEO produk berhasil.",
      data: result,
    };
  } catch (error) {
    console.error(
      "[ANALYZE_PRODUCT_SEO_ERROR]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal melakukan analisis SEO produk.",
    };
  }
}