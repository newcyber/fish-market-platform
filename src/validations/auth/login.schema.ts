import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .email("Format email tidak valid.")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(1, "Password wajib diisi.")
    .max(100),
});

export type LoginInput = z.infer<typeof LoginSchema>;