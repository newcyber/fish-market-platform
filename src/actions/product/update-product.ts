"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ProductService } from "@/services/product/product.service";

import {
  ProductSchema,
} from "@/validators/product/product.schema";

import type {
  ActionResult,
} from "@/types/action-result";

export async function updateProductAction(
  id: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed =
    ProductSchema.safeParse({
      categoryId: formData.get("categoryId"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      sku: formData.get("sku"),
      unit: formData.get("unit"),
      price: formData.get("price"),
      stock: formData.get("stock"),
      weight: formData.get("weight"),
      isPublished: formData.get("isPublished"),
      featured: formData.get("featured"),
    });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validasi gagal.",
      errors:
        parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await ProductService.updateProduct(
      id,
      parsed.data
    );

    revalidatePath("/admin/products");
    revalidatePath(
      `/admin/products/${id}/edit`
    );

    redirect("/admin/products");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan.",
    };
  }
}