import { z } from "zod";

import {
  createCategorySchema,
} from "./create-category.validator";

export const updateCategorySchema =
  createCategorySchema.partial();

export type UpdateCategoryInput =
  z.infer<typeof updateCategorySchema>;