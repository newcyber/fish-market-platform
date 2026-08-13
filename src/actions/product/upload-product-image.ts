"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

import { StorageService } from "@/services/storage/storage.service";

import {
  ProductImageSchema,
} from "@/validators/product/image.schema";

import type {
  ActionResult,
} from "@/types/action-result";

export async function uploadProductImageAction(
  formData: FormData
): Promise<ActionResult> {
  const productId =
    formData.get("productId");

  const files = formData
    .getAll("images")
    .filter(
      (value): value is File =>
        value instanceof File &&
        value.size > 0
    );

  if (
    typeof productId !== "string" ||
    !productId
  ) {
    return {
      success: false,
      message: "Produk tidak valid.",
    };
  }

  if (files.length === 0) {
    return {
      success: false,
      message:
        "Pilih minimal satu gambar.",
    };
  }

  const product =
    await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });

  if (!product) {
    return {
      success: false,
      message:
        "Produk tidak ditemukan.",
    };
  }

  for (const file of files) {
    const validation =
      ProductImageSchema.safeParse(
        file
      );

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]
            ?.message ??
          "File gambar tidak valid.",
      };
    }
  }

  try {
    const existingImages =
      await prisma.productImage.count({
        where: {
          productId,
        },
      });

    let sortOrder =
      existingImages;

    const hasThumbnail =
      existingImages > 0;

    for (const file of files) {
      const imagePath =
        await StorageService.save(
          file
        );

      await prisma.productImage.create({
        data: {
          productId,

          image: imagePath,

          sortOrder,

          isThumbnail:
            !hasThumbnail &&
            sortOrder === 0,
        },
      });

      sortOrder++;
    }

    revalidatePath(
      "/admin/products"
    );

    revalidatePath(
      `/admin/products/${productId}/edit`
    );

    return {
      success: true,
      message: `${files.length} gambar berhasil diupload.`,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat upload gambar.",
    };
  }
}