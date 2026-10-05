import { NextRequest, NextResponse } from "next/server";
import { ProductReviewStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/admin";
import ProductReviewService from "@/services/product-review/product-review.service";
import { ProductReviewStatusSchema } from "@/validators/product-review/product-review.schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const review = await ProductReviewService.getAdminReview(id);

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          code: "REVIEW_NOT_FOUND",
          message: "Review tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
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

    console.error("[ADMIN_PRODUCT_REVIEW_DETAIL_GET_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "Gagal mengambil detail review.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await request.json();
    const parsed = ProductReviewStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Status tidak valid.",
        },
        { status: 400 },
      );
    }

    const status = parsed.data.status as ProductReviewStatus;
    const updated = await ProductReviewService.updateStatus(id, status);

    return NextResponse.json({
      success: true,
      data: updated,
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

    if (error instanceof Error && error.message === "REVIEW_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          code: "REVIEW_NOT_FOUND",
          message: "Review tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    console.error("[ADMIN_PRODUCT_REVIEW_PATCH_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "Gagal memperbarui status review.",
      },
      { status: 500 },
    );
  }
}
