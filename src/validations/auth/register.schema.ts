import { z } from "zod";

/**
 * ============================================================
 * REGISTER SCHEMA
 * ============================================================
 *
 * Validasi registrasi customer publik.
 *
 * Nomor HP wajib diisi dan dinormalisasi ke format:
 *
 * 08xxxxxxxxxx
 *
 * sebelum dikirim ke server.
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

    phone: z
      .string()
      .trim()
      .min(
        10,
        "Nomor HP minimal 10 digit."
      )
      .max(
        15,
        "Nomor HP maksimal 15 digit."
      )
      .transform((value) => {
        const digits =
          value.replace(/\D/g, "");

        if (
          digits.startsWith("62")
        ) {
          return `0${digits.slice(2)}`;
        }

        if (
          digits.startsWith("8")
        ) {
          return `0${digits}`;
        }

        return digits;
      })
      .refine(
        (value) =>
          /^08\d{8,13}$/.test(
            value
          ),
        {
          message:
            "Nomor HP Indonesia tidak valid.",
        }
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