import { NextResponse } from "next/server";

import { auth } from "@/auth";
import StorageService from "@/services/storage/storage.service";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

const ALLOWED_SLOTS = [
  "hero",
  "app",
  "ogImage",
] as const;

type LandingImageSlot =
  (typeof ALLOWED_SLOTS)[number];

export async function POST(
  request: Request,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda harus login terlebih dahulu.",
        },
        { status: 401 },
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
            "Anda tidak memiliki izin untuk mengupload gambar Landing Page.",
        },
        { status: 403 },
      );
    }

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const slotValue =
      formData.get("slot");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "File gambar wajib dipilih.",
        },
        { status: 400 },
      );
    }

    if (
      typeof slotValue !== "string" ||
      !ALLOWED_SLOTS.includes(
        slotValue as LandingImageSlot,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Slot gambar Landing Page tidak valid.",
        },
        { status: 400 },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "File gambar tidak valid.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ukuran gambar maksimal 5 MB.",
        },
        { status: 400 },
      );
    }

    if (
      !ALLOWED_MIME_TYPES.includes(
        file.type,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format gambar harus PNG, JPG, WEBP, atau GIF.",
        },
        { status: 400 },
      );
    }

    const imagePath =
      await StorageService.saveLandingImage(
        file,
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Gambar Landing Page berhasil diupload.",
        data: {
          slot: slotValue,
          path: imagePath,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "[LANDING_IMAGE_UPLOAD_ERROR]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengupload gambar Landing Page.",
      },
      { status: 500 },
    );
  }
}