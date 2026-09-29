import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import ProductReviewService from "@/services/product-review/product-review.service";
import { ProductReviewCreateSchema } from "@/validators/product-review/product-review.schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function errorResponse(
  code: string,
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      success: false,
      code,
      message,
    },
    { status },
  );
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    if (!id.trim()) {
      return errorResponse(
        "INVALID_PRODUCT_ID",
        "ID produk tidak valid.",
        400,
      );
    }

    const summary =
      await ProductReviewService.getPublicSummary(id);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return errorResponse(
        "PRODUCT_NOT_FOUND",
        "Produk tidak ditemukan.",
        404,
      );
    }

    console.error("[PRODUCT_REVIEW_GET_ERROR]", error);

    return errorResponse(
      "INTERNAL_ERROR",
      "Gagal mengambil review produk.",
      500,
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = ProductReviewCreateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Data review tidak valid.",
        400,
      );
    }

    // Guest tetap diperbolehkan. Jika user sudah login, review dapat
    // dikaitkan ke user tanpa mengubah alur guest review.
    const session = await auth();

    const review = await ProductReviewService.submitGuestReview(
      id,
      parsed.data,
      session?.user?.id ?? null,
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: review.id,
          status: review.status,
          message:
            "Terima kasih sudah berbagi pengalaman. Penilaian Anda sangat berarti bagi kami.",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PRODUCT_NOT_FOUND") {
        return errorResponse(
          "PRODUCT_NOT_FOUND",
          "Produk tidak ditemukan.",
          404,
        );
      }

      if (error.message === "DUPLICATE_REVIEW") {
        return errorResponse(
          "DUPLICATE_REVIEW",
          "Anda sudah mengirim penilaian untuk produk ini. Silakan tunggu proses moderasi.",
          409,
        );
      }

      if (error.message === "REVIEW_RATE_LIMIT") {
        return errorResponse(
          "REVIEW_RATE_LIMIT",
          "Terlalu banyak penilaian dari email ini. Silakan coba lagi nanti.",
          429,
        );
      }
    }

    console.error("[PRODUCT_REVIEW_POST_ERROR]", error);

    return errorResponse(
      "INTERNAL_ERROR",
      "Gagal mengirim penilaian produk.",
      500,
    );
  }
}
