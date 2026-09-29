import { ProductReviewStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface ProductRatingSummary {
  averageRating: number | null;
  reviewCount: number;
}

/**
 * Ambil rating approved untuk banyak produk dalam satu query.
 *
 * Dipakai oleh product listing/homepage agar tidak terjadi
 * N+1 query ketika setiap product card membutuhkan rating.
 */
export async function getProductRatings(
  productIds: string[],
): Promise<Map<string, ProductRatingSummary>> {
  const ids = [...new Set(productIds)].filter(Boolean);

  if (ids.length === 0) {
    return new Map();
  }

  const rows = await prisma.productReview.groupBy({
    by: ["productId"],
    where: {
      productId: {
        in: ids,
      },
      status: ProductReviewStatus.APPROVED,
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });

  return new Map(
    rows.map((row) => [
      row.productId,
      {
        averageRating:
          row._avg.rating != null
            ? Number(row._avg.rating.toFixed(1))
            : null,
        reviewCount: row._count._all,
      },
    ]),
  );
}
