import { z } from "zod";

export const ProductSchema = z.object({
  categoryId: z
    .string()
    .min(1, "Kategori wajib dipilih."),

  name: z
    .string()
    .trim()
    .min(3, "Nama produk minimal 3 karakter.")
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

  unit: z
    .string()
    .trim()
    .min(1, "Unit wajib diisi."),

  price: z
    .coerce
    .number()
    .positive("Harga harus lebih dari 0."),

  stock: z
    .coerce
    .number()
    .int()
    .min(0),

  weight: z
    .coerce
    .number()
    .min(0),

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