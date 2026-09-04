import { NextResponse } from "next/server";

import { StorageService } from "@/services/storage/storage.service";

import {
  ProductImageSchema,
} from "@/validators/product/image.schema";

/**
 * ============================================================
 * CATEGORY IMAGE UPLOAD API
 * ============================================================
 *
 * POST /api/admin/categories/upload
 *
 * Storage:
 *
 * public/uploads/categories
 *
 * Public URL:
 *
 * /uploads/categories/{filename}
 *
 * ============================================================
 */

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const file =
      formData.get("image");

    /**
     * ========================================================
     * VALIDATE FILE
     * ========================================================
     */

    if (
      !(file instanceof File) ||
      file.size <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pilih gambar kategori.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * VALIDATE IMAGE
     * ========================================================
     *
     * Gunakan validator image yang sudah dipakai
     * oleh Product dan Reward Catalog.
     */

    const validation =
      ProductImageSchema.safeParse(
        file
      );

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            validation.error.issues[0]
              ?.message ??
            "File gambar tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * SAVE CATEGORY IMAGE
     * ========================================================
     */

    const image =
      await StorageService.saveCategoryImage(
        file
      );

    /**
     * ========================================================
     * SUCCESS
     * ========================================================
     */

    return NextResponse.json({
      success: true,
      message:
        "Gambar kategori berhasil diupload.",
      image,
    });
  } catch (error) {
    console.error(
      "[CATEGORY_IMAGE_UPLOAD_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengupload gambar kategori.",
      },
      {
        status: 500,
      }
    );
  }
}
