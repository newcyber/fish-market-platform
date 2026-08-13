"use server";

import { revalidatePath } from "next/cache";

import { ProductService } from "@/services/product/product.service";

export async function deleteProductAction(
  formData: FormData
): Promise<void> {
  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    throw new Error("ID produk tidak valid.");
  }

  await ProductService.deleteProduct(id);

  revalidatePath("/admin/products");
}