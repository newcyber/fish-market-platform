"use server";

import { revalidatePath } from "next/cache";

import ProductService from "@/services/product/product.service";

export async function toggleProductPublishAction(
  id: string
) {
  await ProductService.togglePublish(id);

  revalidatePath("/admin/products");

  return {
    success: true,
  };
}