import { z } from "zod";

/**
 * ============================================================
 * REGISTER SCHEMA
 * ============================================================
 *
 * Validasi registrasi customer publik.
 *
 * ============================================================
 */

export const RegisterSchema = z
  .object({
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
      .string()
      .trim()
      .email(
        "Format email tidak valid."
      )
      .max(
        255,
        "Email terlalu panjang."
      )
      .transform((value) =>
        value.toLowerCase()
      ),

    password: z
      .string()
      .min(
        6,
        "Password minimal 6 karakter."
      )
      .max(
        100,
        "Password maksimal 100 karakter."
      ),

    confirmPassword: z
      .string()
      .min(
        1,
        "Konfirmasi password wajib diisi."
      ),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message:
        "Konfirmasi password tidak cocok.",
      path: [
        "confirmPassword",
      ],
    }
  );

export type RegisterInput =
  z.infer<typeof RegisterSchema>;