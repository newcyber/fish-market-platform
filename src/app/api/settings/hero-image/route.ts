import { NextResponse } from "next/server";

import { auth } from "@/auth";

import StorageService from
  "@/services/storage/storage.service";

/**
 * ============================================================
 * HERO IMAGE UPLOAD API
 * ============================================================
 *
 * POST /api/settings/hero-image
 *
 * Digunakan untuk upload gambar visual Hero Slider.
 *
 * Hanya:
 *
 * - ADMIN
 * - SUPER_ADMIN
 *
 * Format:
 *
 * - PNG
 * - WEBP
 * - GIF
 *
 * Maksimum:
 *
 * - 5 MB
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
            "Anda tidak memiliki izin untuk mengupload gambar Hero.",
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

    if (
      file.size <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "File gambar tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

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
            "Format gambar harus PNG, WEBP, atau GIF.",
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
     * Menggunakan folder Settings yang sudah tersedia.
     */

    const imagePath =
      await StorageService.saveSettingsLogo(
        file
      );

    /**
     * ========================================================
     * SUCCESS
     * ========================================================
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Gambar Hero berhasil diupload.",

        data: {
          path: imagePath,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "[HERO_IMAGE_UPLOAD_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Terjadi kesalahan saat mengupload gambar Hero.",
      },
      {
        status: 500,
      }
    );
  }
}