import { NextResponse } from "next/server";

import { auth } from "@/auth";
import StorageService from "@/services/storage/storage.service";

/**
 * ============================================================
 * SETTINGS LOGO UPLOAD API
 * ============================================================
 *
 * POST /api/settings/logo
 *
 * Hanya dapat diakses oleh:
 *
 * - ADMIN
 * - SUPER_ADMIN
 *
 * File yang diizinkan:
 *
 * - image/png
 * - image/jpeg
 * - image/webp
 *
 * Maksimum ukuran:
 *
 * - 2 MB
 *
 * ============================================================
 */

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

/**
 * ============================================================
 * POST
 * ============================================================
 */

export async function POST(request: Request) {
  try {
    /**
     * --------------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------------
     */

    const session = await auth();

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
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     */

    const role = session.user.role;

    const isAdmin =
      role === "ADMIN" ||
      role === "SUPER_ADMIN";

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki izin untuk mengupload logo situs.",
        },
        {
          status: 403,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * PARSE FORM DATA
     * --------------------------------------------------------
     */

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    /**
     * --------------------------------------------------------
     * VALIDATE FILE EXISTENCE
     * --------------------------------------------------------
     */

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "File logo wajib dipilih.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * VALIDATE FILE SIZE
     * --------------------------------------------------------
     */

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "File logo tidak valid.",
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
            "Ukuran logo maksimal 2 MB.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * VALIDATE MIME TYPE
     * --------------------------------------------------------
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
            "Format logo harus PNG, JPG, JPEG, atau WEBP.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * SAVE LOGO
     * --------------------------------------------------------
     */

    const url =
      await StorageService.saveSettingsLogo(
        file
      );

    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,
        message:
          "Logo berhasil diupload.",
        url,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[SETTINGS_LOGO_UPLOAD]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengupload logo.",
      },
      {
        status: 500,
      }
    );
  }
}