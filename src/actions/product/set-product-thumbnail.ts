"use server";

import { revalidatePath } from "next/cache";

import ProductImageService from "@/services/product/product-image.service";

export async function setProductThumbnailAction(
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
      "Data thumbnail tidak valid."
    );
  }

  await ProductImageService.setThumbnail(
    imageId
  );

  revalidatePath(
    `/admin/products/${productId}/edit`
  );
}