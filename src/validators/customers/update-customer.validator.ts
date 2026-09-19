import { z } from "zod";

export const updateCustomerSchema = z.object({
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
    .optional()
    .refine(
      (value) =>
        !value || value.length >= 8,
      "Password minimal 8 karakter."
    ),

  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }

      return value;
    }),

  role: z.enum(["CUSTOMER", "ADMIN"]),

  isActive: z
    .enum(["true", "false"])
    .transform(
      (value) => value === "true"
    ),
});

export type UpdateCustomerInput =
  z.infer<typeof updateCustomerSchema>;