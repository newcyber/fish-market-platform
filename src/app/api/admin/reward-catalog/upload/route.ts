import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";

import { StorageService } from "@/services/storage/storage.service";

import {
  ProductImageSchema,
} from "@/validators/product/image.schema";

/**
 * ============================================================
 * POST /api/admin/reward-catalog/upload
 * ============================================================
 *
 * Upload satu gambar reward catalog.
 *
 * Flow:
 *
 * Admin
 *   ↓
 * requireAdmin()
 *   ↓
 * Parse multipart/form-data
 *   ↓
 * Validasi File
 *   ↓
 * ProductImageSchema
 *   ↓
 * StorageService.saveRewardImage()
 *   ↓
 * Return public image URL
 *
 * ============================================================
 *
 * Request:
 *
 * Content-Type:
 * multipart/form-data
 *
 * Field:
 *
 * image: File
 *
 * ============================================================
 */

export async function POST(
  request: Request
) {
  try {
    /**
     * ========================================================
     * AUTHORIZATION
     * ========================================================
     *
     * Hanya administrator yang boleh upload
     * gambar reward.
     */

    await requireAdmin();

    /**
     * ========================================================
     * PARSE FORM DATA
     * ========================================================
     */

    let formData: FormData;

    try {
      formData =
        await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format request tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * GET FILE
     * ========================================================
     *
     * Endpoint reward hanya menerima satu gambar.
     */

    const file =
      formData.get("image");

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "File gambar wajib dipilih.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * VALIDATE FILE
     * ========================================================
     *
     * Menggunakan validator image yang sudah dipakai
     * sistem product.
     *
     * Dengan demikian:
     *
     * - ukuran maksimal 5 MB
     * - JPG
     * - JPEG
     * - PNG
     * - WEBP
     *
     * menggunakan aturan yang sama.
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
     * SAVE REWARD IMAGE
     * ========================================================
     *
     * Storage:
     *
     * public/uploads/rewards
     *
     * Public URL:
     *
     * /uploads/rewards/{filename}
     */

    const image =
      await StorageService.saveRewardImage(
        file
      );

    /**
     * ========================================================
     * SUCCESS RESPONSE
     * ========================================================
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Gambar reward berhasil diupload.",

        image,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    /**
     * ========================================================
     * ERROR HANDLING
     * ========================================================
     */

    console.error(
      "[ADMIN_REWARD_CATALOG_UPLOAD]",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengupload gambar reward.";

    /**
     * ========================================================
     * AUTH ERROR
     * ========================================================
     */

    if (
      message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda harus login.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      message ===
      "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki akses.",
        },
        {
          status: 403,
        }
      );
    }

    /**
     * ========================================================
     * VALIDATION / STORAGE ERROR
     * ========================================================
     */

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 400,
      }
    );
  }
}
