import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import PromotionRepository from "@/repositories/promotion/promotion.repository";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";
    const ids = request.nextUrl.searchParams.get("ids")?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];
    const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.trunc(limitRaw), 1), 50)
      : 20;

    const products = await PromotionRepository.findProductsForSkuSelector({
      search,
      take: limit,
      ids,
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("[ADMIN_PROMOTION_PRODUCTS_GET]", error);

    const message = error instanceof Error ? error.message : "Gagal mengambil produk promotion.";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;

    return NextResponse.json(
      { success: false, message },
      { status }
    );
  }
}
