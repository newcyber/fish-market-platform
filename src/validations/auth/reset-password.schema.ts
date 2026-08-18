import { z } from "zod";

/**
 * ============================================================
 * RESET PASSWORD VALIDATION
 * ============================================================
 */

export const ResetPasswordSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(1, "Token reset password wajib diisi."),

    password: z
      .string()
      .min(
        8,
        "Password minimal harus terdiri dari 8 karakter."
      )
      .max(
        128,
        "Password terlalu panjang."
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
      path: ["confirmPassword"],
    }
  );

export type ResetPasswordInput =
  z.infer<typeof ResetPasswordSchema>;