import { z } from "zod";

/**
 * ============================================================
 * FORGOT PASSWORD VALIDATION
 * ============================================================
 */

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Format email tidak valid."),
});

export type ForgotPasswordInput =
  z.infer<typeof ForgotPasswordSchema>;