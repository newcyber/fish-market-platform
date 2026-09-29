import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

import { ProductImageService } from "@/services/product/product-image.service";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_FILES = 5;
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
]);

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session = await auth();
    const role = session?.user?.role;

    if (
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak memiliki akses.",
        },
        { status: 403 },
      );
    }

    const { id: productId } = await context.params;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Produk tidak valid.",
        },
        { status: 400 },
      );
    }

    const formData = await request.formData();

    const files = formData
      .getAll("videos")
      .filter(
        (value): value is File =>
          value instanceof File &&
          value.size > 0,
      );

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Pilih minimal satu video.",
        },
        { status: 400 },
      );
    }

    if (files.length > MAX_VIDEO_FILES) {
      return NextResponse.json(
        {
          success: false,
          message: `Maksimal ${MAX_VIDEO_FILES} video sekaligus.`,
        },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            success: false,
            message: `${file.name}: format video harus MP4 atau WebM.`,
          },
          { status: 400 },
        );
      }

      if (file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message: `${file.name}: ukuran video maksimal 50 MB.`,
          },
          { status: 400 },
        );
      }
    }

    const videos =
      await ProductImageService.uploadVideos(
        productId,
        files,
      );

    revalidatePath(
      `/admin/products/${productId}/edit`,
    );
    revalidatePath(
      `/products`,
    );

    return NextResponse.json({
      success: true,
      message: `${videos.length} video berhasil diupload.`,
      videos,
    });
  } catch (error) {
    console.error(
      "[PRODUCT_VIDEO_UPLOAD]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat upload video.",
      },
      { status: 500 },
    );
  }
}
