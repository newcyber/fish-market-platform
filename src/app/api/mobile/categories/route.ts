import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import CategoryService from "@/services/category/category.service";

/**
 * ============================================================
 * MOBILE CATEGORY API
 * ============================================================
 *
 * GET /api/mobile/categories
 *
 * Digunakan oleh aplikasi Android untuk mengambil daftar
 * kategori produk aktif.
 *
 * Endpoint ini PUBLIC.
 * Tidak membutuhkan access token karena kategori produk
 * dapat dilihat sebelum customer login.
 *
 * ============================================================
 */

export async function GET() {
  try {
    const categories =
      await CategoryService.getCategories({
        active: true,
      });

    const items = categories.map(
      (category) => ({
        id: category.id,

        name: category.name,

        slug: category.slug,

        image: category.image,

        description:
          category.description,

        sortOrder:
          category.sortOrder,
      })
    );

    return mobileSuccess(
      {
        items,
      },
      200
    );
  } catch (error) {
    console.error(
      "[MOBILE_CATEGORIES_GET]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Gagal mengambil kategori produk.",
      500
    );
  }
}
