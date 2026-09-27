import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),

  phone: z
    .string()
    .trim()
    .max(30, "Nomor WhatsApp terlalu panjang.")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<
  typeof updateProfileSchema
>;