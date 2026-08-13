"use server";

import { revalidatePath } from "next/cache";

import ProductImageService from "@/services/product/product-image.service";

export async function deleteProductImageAction(
  formData: FormData
): Promise<void> {
  const imageId =
    formData.get("imageId");

  const productId =
    formData.get("productId");

  if (
    typeof imageId !== "string" ||
    typeof productId !== "string"
  ) {
    throw new Error(
      "Data gambar tidak valid."
    );
  }

  await ProductImageService.delete(
    imageId
  );

  revalidatePath(
    `/admin/products/${productId}/edit`
  );
}