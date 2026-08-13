import { z } from "zod";

import { Role } from "@prisma/client";

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama minimal 3 karakter.")
    .max(100, "Nama maksimal 100 karakter."),

  email: z
    .string()
    .trim()
    .email("Format email tidak valid."),

  password: z
    .string()
    .min(8, "Password minimal 8 karakter."),

  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  role: z.nativeEnum(Role),

  isActive: z.coerce
    .boolean()
    .default(true),
});

export type CreateCustomerInput =
  z.infer<typeof createCustomerSchema>;