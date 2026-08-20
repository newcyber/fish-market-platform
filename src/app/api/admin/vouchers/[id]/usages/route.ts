import {
  NextRequest,
  NextResponse,
} from "next/server";

import { requireAdmin } from "@/lib/auth/admin";

import {
  AdminVoucherService,
} from "@/services/voucher/admin-voucher.service";

/**
 * ============================================================
 * ADMIN VOUCHER USAGE HISTORY API
 * ============================================================
 *
 * GET /api/admin/vouchers/:id/usages
 *
 * Query:
 *
 * ?page=1
 * ?limit=20
 */

function getPositiveInteger(
  value: string | null,
  fallback: number
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return parsed;
}

function getErrorResponse(
  error: unknown
) {
  if (
    error instanceof Error &&
    error.message === "UNAUTHORIZED"
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

  if (
    error instanceof Error &&
    error.message === "FORBIDDEN"
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Anda tidak memiliki akses ke halaman admin.",
      },
      {
        status: 403,
      }
    );
  }

  if (
    error instanceof Error &&
    error.message ===
      "Voucher tidak ditemukan."
  ) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 404,
      }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 400,
      }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message:
        "Terjadi kesalahan internal.",
    },
    {
      status: 500,
    }
  );
}

/**
 * ============================================================
 * GET
 * ============================================================
 */

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    await requireAdmin();

    const { id } =
      await context.params;

    const searchParams =
      request.nextUrl.searchParams;

    const page =
      getPositiveInteger(
        searchParams.get("page"),
        1
      );

    const requestedLimit =
      getPositiveInteger(
        searchParams.get("limit"),
        20
      );

    /**
     * Batasi limit agar endpoint
     * tidak digunakan untuk mengambil
     * data terlalu besar.
     */
    const limit =
      Math.min(
        requestedLimit,
        100
      );

    /**
     * Pastikan voucher benar-benar ada.
     */
    await AdminVoucherService.getById(
      id
    );

    const result =
      await AdminVoucherService.getUsageHistory(
        id,
        {
          page,
          limit,
        }
      );

    return NextResponse.json({
      success: true,
      message:
        "Riwayat penggunaan voucher berhasil diambil.",
      data: result,
    });
  } catch (error) {
    console.error(
      "[ADMIN_VOUCHER_USAGE_HISTORY_ERROR]",
      error
    );

    return getErrorResponse(error);
  }
}