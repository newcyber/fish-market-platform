import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import { AdminRewardVoucherService } from "@/services/reward-voucher/admin-reward-voucher.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * ============================================================
 * GET /api/admin/reward-vouchers/:id
 * ============================================================
 */
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAdmin();

    const { id } =
      await context.params;

    const reward =
      await AdminRewardVoucherService.getById(
        id
      );

    return NextResponse.json({
      success: true,
      data: reward,
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_VOUCHER_GET_BY_ID]",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengambil reward voucher.";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          message: "Anda harus login.",
        },
        {
          status: 401,
        }
      );
    }

    if (message === "FORBIDDEN") {
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

    if (
      message ===
      "Reward voucher tidak ditemukan."
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status: 404,
        }
      );
    }

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

/**
 * ============================================================
 * PATCH /api/admin/reward-vouchers/:id
 * ============================================================
 *
 * Update konfigurasi Reward Voucher.
 *
 * Contoh:
 *
 * {
 *   "name": "Voucher Rp10.000",
 *   "requiredPoints": 500,
 *   "discountType": "FIXED_AMOUNT",
 *   "discountValue": 10000,
 *   "minimumPurchase": 50000,
 *   "maximumDiscount": null,
 *   "sortOrder": 1
 * }
 *
 * Field bersifat partial.
 */
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAdmin();

    const { id } =
      await context.params;

    const body =
      await request.json();

    const reward =
      await AdminRewardVoucherService.update(
        id,
        body
      );

    return NextResponse.json({
      success: true,
      data: reward,
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_VOUCHER_UPDATE]",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Gagal memperbarui reward voucher.";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          message: "Anda harus login.",
        },
        {
          status: 401,
        }
      );
    }

    if (message === "FORBIDDEN") {
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

    if (
      message ===
      "Reward voucher tidak ditemukan."
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status: 404,
        }
      );
    }

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