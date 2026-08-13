import { z } from "zod";

/**
 * ============================================================
 * CUSTOMER PROFILE SCHEMA
 * ============================================================
 */

export const CustomerProfileSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Nama minimal terdiri dari 2 karakter."
      )
      .max(
        100,
        "Nama maksimal terdiri dari 100 karakter."
      ),

    phone: z
      .string()
      .trim()
      .max(
        30,
        "Nomor telepon maksimal terdiri dari 30 karakter."
      )
      .optional()
      .or(z.literal("")),
  });

export type CustomerProfileInput =
  z.infer<
    typeof CustomerProfileSchema
  >;