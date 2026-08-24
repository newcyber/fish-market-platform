import { NextResponse } from "next/server";

import { auth } from "@/auth";

import StorageService from "@/services/storage/storage.service";

/**
 * ============================================================
 * QRIS IMAGE UPLOAD API
 * ============================================================
 *
 * POST /api/settings/qris
 *
 * Digunakan untuk upload gambar QRIS
 * dari halaman admin payment channels.
 *
 * Authorization:
 * - ADMIN
 * - SUPER_ADMIN
 *
 * Allowed:
 * - PNG
 * - JPG
 * - JPEG
 * - WEBP
 *
 * Maximum:
 * - 5 MB
 *
 * Response:
 *
 * {
 *   success: true,
 *   message: "...",
 *   url: "/uploads/..."
 * }
 *
 * ============================================================
 */

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_MIME_TYPES =
  new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);

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
     *
     * Hanya admin yang boleh
     * mengupload gambar QRIS.
     *
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
            "Anda tidak memiliki izin untuk mengupload gambar QRIS.",
        },
        {
          status: 403,
        }
      );
    }

    /**
     * ========================================================
     * REQUEST CONTENT TYPE
     * ========================================================
     *
     * Pastikan request memang
     * menggunakan multipart/form-data.
     *
     */

    const contentType =
      request.headers.get(
        "content-type"
      ) ?? "";

    if (
      !contentType
        .toLowerCase()
        .startsWith(
          "multipart/form-data"
        )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Request upload QRIS harus menggunakan multipart/form-data.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * PARSE FORM DATA
     * ========================================================
     */

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    /**
     * ========================================================
     * FILE EXISTENCE VALIDATION
     * ========================================================
     */

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "File QRIS wajib dipilih.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * FILE SIZE VALIDATION
     * ========================================================
     */

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "File QRIS tidak valid atau kosong.",
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
            "Ukuran gambar QRIS maksimal 5 MB.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * MIME TYPE VALIDATION
     * ========================================================
     */

    if (
      !ALLOWED_MIME_TYPES.has(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format QRIS harus PNG, JPG, JPEG, atau WEBP.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * FILE NAME VALIDATION
     * ========================================================
     *
     * Browser biasanya selalu memberikan
     * nama file.
     *
     * Kita tetap melakukan validasi
     * untuk mencegah input kosong.
     *
     */

    const originalFileName =
      file.name?.trim();

    if (
      !originalFileName
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nama file QRIS tidak valid.",
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
     * StorageService bertanggung jawab
     * untuk:
     *
     * - generate nama file
     * - menentukan folder storage
     * - menulis file
     * - mengembalikan URL/path
     *
     */

    const url =
      await StorageService.savePaymentQris(
        file
      );

    /**
     * ========================================================
     * STORAGE RESULT VALIDATION
     * ========================================================
     */

    if (
      !url ||
      typeof url !== "string" ||
      !url.trim()
    ) {
      console.error(
        "[QRIS_UPLOAD_STORAGE_INVALID_RESULT]",
        {
          fileName:
            originalFileName,
          fileSize:
            file.size,
          mimeType:
            file.type,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gambar QRIS gagal disimpan oleh storage.",
        },
        {
          status: 500,
        }
      );
    }

    /**
     * ========================================================
     * SUCCESS
     * ========================================================
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Gambar QRIS berhasil diupload.",

        url:
          url.trim(),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    /**
     * ========================================================
     * ERROR LOG
     * ========================================================
     */

    console.error(
      "[QRIS_UPLOAD_ERROR]",
      error
    );

    /**
     * ========================================================
     * ERROR RESPONSE
     * ========================================================
     */

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengupload gambar QRIS.",
      },
      {
        status: 500,
      }
    );
  }
}