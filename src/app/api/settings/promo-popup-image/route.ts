import { NextResponse } from "next/server";

import { auth } from "@/auth";

import StorageService from
  "@/services/storage/storage.service";

/**
 * ============================================================
 * PROMO POPUP IMAGE UPLOAD API
 * ============================================================
 *
 * POST /api/settings/promo-popup-image
 *
 * Storage:
 * public/uploads/settings/promo-popup
 *
 * Public URL:
 * /uploads/settings/promo-popup/{filename}
 *
 * ============================================================
 */

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * ============================================================
 * POST
 * ============================================================
 */

export async function POST(
  request: Request
) {
  try {
    /**
     * ========================================================
     * AUTHENTICATION
     * ========================================================
     */

    const session =
      await auth();

    if (
      !session?.user?.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda harus login terlebih dahulu.",
        },
        {
          status: 401,
        }
      );
    }

    /**
     * ========================================================
     * AUTHORIZATION
     * ========================================================
     */

    const role =
      session.user.role;

    const isAdmin =
      role === "ADMIN" ||
      role === "SUPER_ADMIN";

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki izin untuk mengupload gambar Promo Popup.",
        },
        {
          status: 403,
        }
      );
    }

    /**
     * ========================================================
     * FORM DATA
     * ========================================================
     */

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    /**
     * ========================================================
     * VALIDATE FILE
     * ========================================================
     */

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
     * VALIDATE MIME TYPE
     * ========================================================
     */

    if (
      !ALLOWED_MIME_TYPES.includes(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format gambar tidak didukung. Gunakan PNG, WebP, atau GIF.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * VALIDATE FILE SIZE
     * ========================================================
     */

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ukuran gambar maksimal 5 MB.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * SAVE FILE
     * ========================================================
     *
     * Menggunakan StorageService yang sudah digunakan
     * oleh endpoint Settings lainnya.
     */

    const imagePath =
      await StorageService.savePromoPopupImage(
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
        "Gambar Promo Popup berhasil diupload.",
      imageUrl: imagePath,
    });
  } catch (error) {
    console.error(
      "[PROMO_POPUP_IMAGE_UPLOAD_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengupload gambar Promo Popup.",
      },
      {
        status: 500,
      }
    );
  }
}