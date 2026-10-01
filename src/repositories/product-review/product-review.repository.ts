import { ProductReviewStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const PUBLIC_REVIEW_SELECT = {
  id: true,
  username: true,
  rating: true,
  review: true,
  isVerifiedPurchase: true,
  createdAt: true,
} satisfies Prisma.ProductReviewSelect;

export class ProductReviewRepository {
  static async findPublishedProduct(productId: string) {
    return prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
        isPublished: true,
      },
      select: { id: true },
    });
  }

  static async findApprovedByProduct(
    productId: string,
    limit = 10,
  ) {
    return prisma.productReview.findMany({
      where: {
        productId,
        status: ProductReviewStatus.APPROVED,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 50),
      select: PUBLIC_REVIEW_SELECT,
    });
  }

  static async getApprovedSummary(productId: string) {
    const [aggregate, grouped, recent] = await Promise.all([
      prisma.productReview.aggregate({
        where: {
          productId,
          status: ProductReviewStatus.APPROVED,
        },
        _avg: { rating: true },
        _count: { _all: true },
      }),

      prisma.productReview.groupBy({
        by: ["rating"],
        where: {
          productId,
          status: ProductReviewStatus.APPROVED,
        },
        _count: { _all: true },
        orderBy: { rating: "desc" },
      }),

      ProductReviewRepository.findApprovedByProduct(productId, 10),
    ]);

    const distribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count:
        grouped.find((item) => item.rating === rating)?._count._all ?? 0,
    }));

    return {
      averageRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count._all,
      distribution,
      reviews: recent,
    };
  }

  static async create(data: {
  productId: string;
  userId?: string | null;
  username: string;
  rating: number;
  review?: string | null;
}) {
  return prisma.productReview.create({
    data: {
      productId: data.productId,
      userId: data.userId ?? null,
      username: data.username,
      email: null,
      rating: data.rating,
      review: data.review ?? null,
      status: ProductReviewStatus.PENDING,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });
  }

  static async findAdminMany(input: {
    status?: ProductReviewStatus;
    page: number;
    limit: number;
  }) {
    const where: Prisma.ProductReviewWhereInput = input.status
      ? { status: input.status }
      : {};

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              isPublished: true,
            },
          },
        },
      }),
      prisma.productReview.count({ where }),
    ]);

    return { reviews, total };
  }

  static async findAdminById(id: string) {
    return prisma.productReview.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  static async updateStatus(
    id: string,
    status: ProductReviewStatus,
  ) {
    return prisma.productReview.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
      },
    });
  }
}

export default ProductReviewRepository;
