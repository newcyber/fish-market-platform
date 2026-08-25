/**
 * ============================================================
 * HOMEPAGE CATEGORY SHORTCUTS
 * ============================================================
 *
 * Logical category yang digunakan oleh homepage.
 *
 * Category homepage tidak selalu sama dengan satu category
 * database.
 *
 * Contoh:
 *
 * Ikan Segar
 *   -> ikan-laut
 *   -> ikan-air-tawar
 *
 * Seafood
 *   -> kepiting
 *   -> cumi
 *   -> kerang
 *
 * ============================================================
 */

export type HomeCategorySlug =
  | "ikan-segar"
  | "udang"
  | "seafood"
  | "frozen"
  | "paket-hemat"
  | "promo";

/**
 * ============================================================
 * DATABASE CATEGORY SLUG
 * ============================================================
 */

export const HOME_CATEGORY_DATABASE_SLUGS: Record<
  HomeCategorySlug,
  string[]
> = {
  /**
   * ----------------------------------------------------------
   * IKAN SEGAR
   * ----------------------------------------------------------
   */

  "ikan-segar": [
    "ikan-laut",
    "ikan-air-tawar",
  ],

  /**
   * ----------------------------------------------------------
   * UDANG
   * ----------------------------------------------------------
   */

  udang: [
    "udang",
  ],

  /**
   * ----------------------------------------------------------
   * SEAFOOD
   * ----------------------------------------------------------
   */

  seafood: [
    "kepiting",
    "cumi",
    "kerang",
  ],

  /**
   * ----------------------------------------------------------
   * FROZEN
   * ----------------------------------------------------------
   */

  frozen: [
    "frozen-food",
  ],

  /**
   * ----------------------------------------------------------
   * PAKET HEMAT
   * ----------------------------------------------------------
   *
   * Belum memiliki category database khusus.
   *
   * Jangan mengarang category ID.
   *
   * Untuk sementara akan menghasilkan empty category filter.
   */

  "paket-hemat": [],

  /**
   * ----------------------------------------------------------
   * PROMO
   * ----------------------------------------------------------
   *
   * Promo tidak menggunakan category database.
   *
   * Filter promo akan diproses menggunakan:
   *
   * Product.isDiscountActive
   */

  promo: [],
};