import { NextRequest, NextResponse } from "next/server";
import { ProductReviewStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/admin";
import ProductReviewService from "@/services/product-review/product-review.service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status")?.trim() || undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "25");

    const status = statusParam
      ? Object.values(ProductReviewStatus).includes(
          statusParam as ProductReviewStatus,
        )
        ? (statusParam as ProductReviewStatus)
        : undefined
      : undefined;

    if (statusParam && !status) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_STATUS",
          message: "Status review tidak valid.",
        },
        { status: 400 },
      );
    }

    const result = await ProductReviewService.getAdminReviews({
      status,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 25,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", message: "Unauthorized." },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, code: "FORBIDDEN", message: "Forbidden." },
        { status: 403 },
      );
    }

    console.error("[ADMIN_PRODUCT_REVIEW_GET_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "Gagal mengambil review.",
      },
      { status: 500 },
    );
  }
}
