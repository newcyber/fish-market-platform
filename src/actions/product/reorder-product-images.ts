"use server";

import { revalidatePath } from "next/cache";

import ProductImageService from "@/services/product/product-image.service";

export async function reorderProductImagesAction(
  productId: string,
  imageIds: string[]
): Promise<void> {
  if (
    typeof productId !== "string" ||
    !productId
  ) {
    throw new Error(
      "Produk tidak valid."
    );
  }

  if (
    !Array.isArray(imageIds) ||
    imageIds.length === 0
  ) {
    throw new Error(
      "Urutan gambar tidak valid."
    );
  }

  await ProductImageService.reorder(
    productId,
    imageIds
  );

  revalidatePath(
    `/admin/products/${productId}/edit`
  );
}