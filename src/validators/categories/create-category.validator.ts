import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama kategori minimal 3 karakter.")
    .max(100, "Nama kategori maksimal 100 karakter."),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug minimal 3 karakter.")
    .max(120, "Slug maksimal 120 karakter.")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug hanya boleh huruf kecil, angka, dan tanda -."
    ),

  description: z
    .string()
    .trim()
    .max(500, "Deskripsi maksimal 500 karakter.")
    .optional()
    .nullable(),

  image: z
    .string()
    .trim()
    .optional()
    .nullable(),

  sortOrder: z.coerce
  .number()
  .int()
  .min(0)
  .default(0),

isActive: z.coerce
  .boolean()
  .default(true),
});

export type CreateCategoryInput =
  z.infer<typeof createCategorySchema>;