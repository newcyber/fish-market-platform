import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { StorageService } from "@/services/storage/storage.service";
import landingPageService from "@/repositories/landing-page/landing-page.service";

const MAX_APK_SIZE =
  100 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/vnd.android.package-archive",
  "application/octet-stream",
  "application/x-apk",
]);

export async function POST(
  request: Request,
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
        {
          status: 403,
        },
      );
    }

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "File APK wajib diupload.",
        },
        {
          status: 400,
        },
      );
    }

    const fileName =
      file.name?.trim() ?? "";

    if (
      !fileName ||
      !fileName
        .toLowerCase()
        .endsWith(".apk")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "File harus menggunakan ekstensi .apk.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "File APK kosong.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > MAX_APK_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ukuran APK maksimal 100 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const mimeType =
      file.type
        ?.trim()
        .toLowerCase() ?? "";

    if (
      mimeType &&
      !ALLOWED_MIME_TYPES.has(mimeType)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format MIME APK tidak didukung.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await landingPageService.uploadAndroidApk(
        file,
      );

    return NextResponse.json({
      success: true,
      message:
        "APK berhasil diupload.",
      data: {
        fileName: result.fileName,
        fileUrl: result.fileUrl,
        mimeType: result.mimeType,
        fileSize: result.fileSize,
        sha256: result.sha256,
      },
    });
  } catch (error) {
    console.error(
      "Landing Android APK upload error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengupload APK.",
      },
      {
        status: 500,
      },
    );
  }
}