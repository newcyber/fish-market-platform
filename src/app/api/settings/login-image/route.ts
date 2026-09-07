import { NextResponse } from "next/server";

import { auth } from "@/auth";

import StorageService from
  "@/services/storage/storage.service";

/**
 * ============================================================
 * MOBILE LOGIN SLIDER IMAGE UPLOAD API
 * ============================================================
 *
 * POST /api/settings/login-image
 *
 * Digunakan untuk upload gambar slider pada
 * mobile login landing page.
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
 * Slide:
 *
 * - slide1
 * - slide2
 * - slide3
 * - slide4
 *
 * ============================================================
 */

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const ALLOWED_SLIDES = [
  "slide1",
  "slide2",
  "slide3",
  "slide4",
] as const;

type LoginSlideKey =
  (typeof ALLOWED_SLIDES)[number];

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

    if (!session?.user?.id) {
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
            "Anda tidak memiliki izin untuk mengupload gambar Login.",
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

    const slide =
      formData.get("slide");

    /**
     * ========================================================
     * VALIDATE SLIDE
     * ========================================================
     */

    if (
      typeof slide !== "string" ||
      !ALLOWED_SLIDES.includes(
        slide as LoginSlideKey
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Slide Login tidak valid. Gunakan slide1 sampai slide4.",
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
        file.type as
          | "image/png"
          | "image/webp"
          | "image/gif"
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
     */

    const imagePath =
      await StorageService.saveLoginImage(
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
          "Gambar Login berhasil diupload.",
        data: {
          path: imagePath,
          slide,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "[LOGIN_IMAGE_UPLOAD_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengupload gambar Login.",
      },
      {
        status: 500,
      }
    );
  }
}
