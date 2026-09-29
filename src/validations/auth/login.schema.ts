import { z } from "zod";

/**
 * ============================================================
 * LOGIN SCHEMA
 * ============================================================
 *
 * Customer dapat login menggunakan:
 *
 * - Email
 * - Nomor WhatsApp / nomor HP
 *
 * Identifier tidak langsung dipaksa menjadi email karena
 * backend akan menentukan apakah input merupakan email
 * atau nomor HP.
 * ============================================================
 */

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(
      1,
      "Email atau nomor WhatsApp wajib diisi.",
    )
    .max(
      150,
      "Email atau nomor WhatsApp terlalu panjang.",
    ),

  password: z
    .string()
    .min(
      1,
      "Password wajib diisi.",
    )
    .max(100),
});

export type LoginInput =
  z.infer<typeof LoginSchema>;