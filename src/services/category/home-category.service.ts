import CategoryService from
  "@/services/category/category.service";

import {
  HOME_CATEGORY_DATABASE_SLUGS,
  type HomeCategorySlug,
} from "@/constants/customer/home-categories";

/**
 * ============================================================
 * HOME CATEGORY SERVICE
 * ============================================================
 *
 * Mengubah logical category homepage menjadi
 * category ID database.
 *
 * ============================================================
 */

export default class HomeCategoryService {
  /**
   * ==========================================================
   * GET CATEGORY IDS
   * ==========================================================
   */

  static async getCategoryIds(
    slug: HomeCategorySlug
  ): Promise<string[]> {
    const databaseSlugs =
      HOME_CATEGORY_DATABASE_SLUGS[
        slug
      ];

    /**
     * --------------------------------------------------------
     * Tidak mempunyai category database.
     * --------------------------------------------------------
     */

    if (
      !databaseSlugs ||
      databaseSlugs.length === 0
    ) {
      return [];
    }

    /**
     * --------------------------------------------------------
     * Ambil seluruh category aktif.
     * --------------------------------------------------------
     */

    const categories =
      await CategoryService.getCategories({
        active: true,
      });

    /**
     * --------------------------------------------------------
     * Mapping slug -> ID
     * --------------------------------------------------------
     */

    const categoryIds =
      categories
        .filter(
          (category) =>
            databaseSlugs.includes(
              category.slug
            )
        )
        .map(
          (category) =>
            category.id
        );

    return categoryIds;
  }
}