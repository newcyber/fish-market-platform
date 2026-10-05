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

    return ProductReviewRepository.create({
      productId,
      userId,
      username: input.username,
      rating: input.rating,
      review: input.review,
    });
  }

  static async getAdminSummary() {
    return ProductReviewRepository.getAdminSummary();
  }

  static async getAdminReviews(input: {
    status?: ProductReviewStatus;
    rating?: number;
    search?: string;
    sort?: "newest" | "oldest" | "highest-rating" | "lowest-rating";
    page?: number;
    limit?: number;
  }) {
    return ProductReviewRepository.findAdminMany({
      status: input.status,
      rating: input.rating,
      search: input.search,
      sort: input.sort,
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