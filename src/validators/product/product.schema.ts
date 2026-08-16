import { z } from "zod";

const ProductOptionSchema = z
  .string()
  .trim()
  .min(1)
  .max(100);

export const ProductSchema = z.object({
  /**
   * ============================================================
   * BASIC INFORMATION
   * ============================================================
   */

  categoryId: z
    .string()
    .min(1, "Kategori wajib dipilih."),

  name: z
    .string()
    .trim()
    .min(
      3,
      "Nama produk minimal 3 karakter."
    )
    .max(150),

  slug: z
    .string()
    .trim()
    .min(3)
    .max(150)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug hanya boleh huruf kecil, angka dan tanda -"
    ),

  description: z
    .string()
    .optional()
    .default(""),

  sku: z
    .string()
    .optional()
    .default(""),

  /**
   * ============================================================
   * PRICE
   * ============================================================
   */

  price: z
    .coerce
    .number()
    .positive(
      "Harga harus lebih dari 0."
    ),

  /**
   * ============================================================
   * STOCK
   * ============================================================
   */

  stock: z
    .coerce
    .number()
    .int(
      "Stok harus berupa angka bulat."
    )
    .min(
      0,
      "Stok tidak boleh kurang dari 0."
    ),

  /**
   * ============================================================
   * PRODUCT VARIANTS
   * ============================================================
   *
   * Contoh:
   * - Utuh
   * - Dibersihkan
   * - Fillet
   *
   */

  variantOptions: z
    .array(ProductOptionSchema)
    .default([]),

  /**
   * ============================================================
   * PRODUCT WEIGHTS
   * ============================================================
   *
   * Contoh:
   * - 250gr
   * - 500gr
   * - 1kg
   *
   */

  weightOptions: z
    .array(ProductOptionSchema)
    .default([]),

  /**
   * ============================================================
   * STATUS
   * ============================================================
   */

  isPublished: z
    .coerce
    .boolean()
    .default(true),

  featured: z
    .coerce
    .boolean()
    .default(false),
});

export type ProductInput =
  z.infer<typeof ProductSchema>;