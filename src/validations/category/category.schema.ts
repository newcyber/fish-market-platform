import { z } from "zod";

export const CategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kategori minimal 2 karakter.")
    .max(100),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  image: z.string().optional(),

  sortOrder: z.coerce.number().default(0),

  isActive: z.coerce.boolean().default(true),
});

export type CategoryInput = z.infer<typeof CategorySchema>;