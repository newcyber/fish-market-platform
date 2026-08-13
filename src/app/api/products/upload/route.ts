import { NextResponse } from "next/server";

import { revalidatePath } from "next/cache";

import {
  ProductImageService,
} from "@/services/product/product-image.service";

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const productId =
      formData.get("productId");

    if (
      typeof productId !== "string" ||
      !productId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Produk tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const files = formData
      .getAll("images")
      .filter(
        (value): value is File =>
          value instanceof File &&
          value.size > 0
      );

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pilih minimal satu gambar.",
        },
        {
          status: 400,
        }
      );
    }

    const images =
      await ProductImageService.upload(
        productId,
        files
      );

    revalidatePath(
      "/admin/products"
    );

    revalidatePath(
      `/admin/products/${productId}/edit`
    );

    return NextResponse.json({
      success: true,

      message: `${images.length} gambar berhasil diupload.`,

      images,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat upload gambar.",
      },
      {
        status: 500,
      }
    );
  }
}