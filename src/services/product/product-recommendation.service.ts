import ProductRecommendationRepository from "@/repositories/product/ProductRecommendationRepository";

export class ProductRecommendationService {
  static async getFrequentlyBoughtTogether(
    productId: string,
    limit = 8
  ) {
    return ProductRecommendationRepository
      .findFrequentlyBoughtTogether(
        productId,
        limit
      );
  }

  static async getRelatedProducts(
    productId: string,
    categoryId: string,
    limit = 8
  ) {
    return ProductRecommendationRepository
      .findRelatedProducts(
        productId,
        categoryId,
        limit
      );
  }
}

export default ProductRecommendationService;
