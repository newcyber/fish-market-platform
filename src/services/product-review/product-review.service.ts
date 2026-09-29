import { ProductReviewStatus } from "@prisma/client";

import ProductReviewRepository from "@/repositories/product-review/product-review.repository";
import type { ProductReviewCreateInput } from "@/validators/product-review/product-review.schema";

export class ProductReviewService {
  static async getPublicSummary(productId: string) {
    const product =
      await ProductReviewRepository.findPublishedProduct(productId);

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    return ProductReviewRepository.getApprovedSummary(productId);
  }

  static async submitGuestReview(
    productId: string,
    input: ProductReviewCreateInput,
    userId?: string | null,
  ) {
    const product =
      await ProductReviewRepository.findPublishedProduct(productId);

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const now = new Date();
    const duplicateWindow = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000,
    );

    const duplicate =
      await ProductReviewRepository.findRecentDuplicate(
        productId,
        input.email,
        duplicateWindow,
      );

    if (duplicate) {
      throw new Error("DUPLICATE_REVIEW");
    }

    const dailyWindow = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    );

    const dailyCount =
      await ProductReviewRepository.countByEmailSince(
        input.email,
        dailyWindow,
      );

    if (dailyCount >= 5) {
      throw new Error("REVIEW_RATE_LIMIT");
    }

    return ProductReviewRepository.create({
      productId,
      userId,
      username: input.username,
      email: input.email,
      rating: input.rating,
      review: input.review,
    });
  }

  static async getAdminReviews(input: {
    status?: ProductReviewStatus;
    page?: number;
    limit?: number;
  }) {
    return ProductReviewRepository.findAdminMany({
      status: input.status,
      page: Math.max(input.page ?? 1, 1),
      limit: Math.min(Math.max(input.limit ?? 25, 1), 100),
    });
  }

  static async getAdminReview(id: string) {
    return ProductReviewRepository.findAdminById(id);
  }

  static async updateStatus(
    id: string,
    status: ProductReviewStatus,
  ) {
    const review = await ProductReviewRepository.findAdminById(id);

    if (!review) {
      throw new Error("REVIEW_NOT_FOUND");
    }

    return ProductReviewRepository.updateStatus(id, status);
  }
}

export default ProductReviewService;
