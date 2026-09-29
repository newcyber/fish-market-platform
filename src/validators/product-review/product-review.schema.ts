import { z } from "zod";

export const ProductReviewCreateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(50, "Nama maksimal 50 karakter."),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email tidak valid.")
    .max(160, "Email terlalu panjang."),

  rating: z.coerce
    .number()
    .int("Rating harus berupa bilangan bulat.")
    .min(1, "Rating minimal 1 bintang.")
    .max(5, "Rating maksimal 5 bintang."),

  review: z
    .string()
    .trim()
    .max(1000, "Ulasan maksimal 1.000 karakter.")
    .optional()
    .transform((value) => value || null),

  // Honeypot. Field ini sengaja tidak terlihat oleh customer.
  website: z.string().max(0, "Permintaan tidak valid.").optional(),
});

export const ProductReviewStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export type ProductReviewCreateInput = z.infer<
  typeof ProductReviewCreateSchema
>;
