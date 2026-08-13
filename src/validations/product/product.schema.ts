import { z } from "zod";

export const ProductSchema = z.object({
  categoryId: z.uuid(),

  name: z
    .string()
    .trim()
    .min(3)
    .max(200),

  description: z
    .string()
    .trim()
    .optional(),

  sku: z
    .string()
    .trim()
    .optional(),

  unit: z
    .string()
    .trim()
    .min(1),

  price: z.coerce
    .number()
    .positive(),

  stock: z.coerce
    .number()
    .int()
    .min(0),

  weight: z.coerce
    .number()
    .positive(),

  featured: z.boolean().default(false),

  isPublished: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof ProductSchema>;