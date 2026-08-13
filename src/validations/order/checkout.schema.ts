import { z } from "zod";

export const CheckoutSchema = z.object({
  addressId: z.uuid(),

  paymentMethod: z.enum([
    "BANK_TRANSFER",
  ]),

  notes: z
    .string()
    .trim()
    .max(500)
    .optional(),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;