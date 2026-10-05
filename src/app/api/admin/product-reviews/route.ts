import { NextRequest, NextResponse } from "next/server";
import { ProductReviewStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/admin";
import ProductReviewService from "@/services/product-review/product-review.service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;

    if (searchParams.get("summary") === "1") {
      const summary = await ProductReviewService.getAdminSummary();

      return NextResponse.json({
        success: true,
        data: summary,
      });
    }

    const statusParam = searchParams.get("status")?.trim() || undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "25");

    const ratingParam = searchParams.get("rating")?.trim() || undefined;
    const search = searchParams.get("search")?.trim() || undefined;
    const sortParam = searchParams.get("sort")?.trim() || "newest";

    /**
     * Validate and parse rating.
     *
     * Keep the value undefined when the filter is not provided.
     * When provided, only integer values from 1 to 5 are accepted.
     */
    let rating: number | undefined;

    if (ratingParam) {
      const parsedRating = Number(ratingParam);

      if (
        !Number.isInteger(parsedRating) ||
        parsedRating < 1 ||
        parsedRating > 5
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_RATING",
            message: "Rating review harus antara 1 sampai 5.",
          },
          { status: 400 },
        );
      }

      rating = parsedRating;
    }

    /**
     * Allowed sorting options.
     */
    const allowedSorts = [
      "newest",
      "oldest",
      "highest-rating",
      "lowest-rating",
    ] as const;

    const sort = allowedSorts.includes(
      sortParam as (typeof allowedSorts)[number],
    )
      ? (sortParam as (typeof allowedSorts)[number])
      : undefined;

    /**
     * Validate review status.
     */
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

    /**
     * Validate sorting option.
     */
    if (!sort) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_SORT",
          message: "Urutan review tidak valid.",
        },
        { status: 400 },
      );
    }

    /**
     * Normalize pagination values.
     *
     * The service/repository remains responsible for its own
     * pagination limits, while this route guarantees finite numbers.
     */
    const normalizedPage =
      Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;

    const normalizedLimit =
      Number.isFinite(limit) && limit >= 1 ? Math.floor(limit) : 25;

    const result = await ProductReviewService.getAdminReviews({
      status,
      rating,
      search,
      sort,
      page: normalizedPage,
      limit: normalizedLimit,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          message: "Forbidden.",
        },
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