import { z } from "zod";

export const userSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      3,
      "Nama minimal 3 karakter."
    )
    .max(
      100,
      "Nama maksimal 100 karakter."
    ),

  email: z
    .email(
      "Email tidak valid."
    )
    .trim()
    .toLowerCase(),

  phone: z
    .string()
    .trim()
    .min(
      10,
      "Nomor telepon minimal 10 digit."
    )
    .max(
      20,
      "Nomor telepon maksimal 20 digit."
    )
    .optional()
    .nullable(),

  password: z
    .string()
    .min(
      8,
      "Password minimal 8 karakter."
    )
    .max(
      100,
      "Password maksimal 100 karakter."
    ),

    role: z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "CUSTOMER",
    ]),

  isActive:
    z.boolean(),
});

export type UserInput =
  z.infer<
    typeof userSchema
  >;