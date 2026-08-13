import { z } from "zod";

import {
  createCustomerSchema,
} from "./create-customer.validator";

export const updateCustomerSchema =
  createCustomerSchema
    .omit({
      password: true,
    })
    .extend({
      password: z
        .string()
        .min(
          8,
          "Password minimal 8 karakter."
        )
        .optional()
        .or(z.literal("")),
    });

export type UpdateCustomerInput =
  z.infer<typeof updateCustomerSchema>;