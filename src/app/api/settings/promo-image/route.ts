import { NextResponse } from "next/server";

import { auth } from "@/auth";
import StorageService from "@/services/storage/storage.service";

/**
 * ============================================================
 * PROMO IMAGE UPLOAD API
 * ============================================================
 *
 * POST /api/settings/promo-image
 *
 * Digunakan untuk upload gambar Promo Pilihan.
 *
 * Hanya:
 * - ADMIN
 * - SUPER_ADMIN
 *
 * Target:
 * - card1
 * - card2
 *
 * Format:
 * - PNG
 * - WEBP
 * - GIF
 *
 * Maksimum:
 * - 5 MB
 * ============================================================
 */

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_CARDS = [
  "card1",
  "card2",
] as const;

type PromoCardKey =
  (typeof ALLOWED_CARDS)[number];

export async function POST(
  request: Request
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const role = session.user.role;

    const isAdmin =
      role === "ADMIN" ||
      role === "SUPER_ADMIN";

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki izin untuk mengupload gambar Promo.",
        },
        { status: 403 }
      );
    }

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const card =
      formData.get("card");

    if (
      typeof card !== "string" ||
      !ALLOWED_CARDS.includes(
        card as PromoCardKey
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Target Promo tidak valid.",
        },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "File gambar wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "File gambar tidak valid.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ukuran gambar maksimal 5 MB.",
        },
        { status: 400 }
      );
    }

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
        { status: 400 }
      );
    }

    const imagePath =
      await StorageService.savePromoImage(
        file
      );

    return NextResponse.json({
      success: true,
      url: imagePath,
      card,
    });
  } catch (error) {
    console.error(
      "[PROMO_IMAGE_UPLOAD_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal mengupload gambar Promo.",
      },
      { status: 500 }
    );
  }
}
