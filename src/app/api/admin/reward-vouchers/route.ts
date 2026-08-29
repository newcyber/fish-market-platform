import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import { AdminRewardVoucherService } from "@/services/reward-voucher/admin-reward-voucher.service";

/**
 * ============================================================
 * GET /api/admin/reward-vouchers
 * ============================================================
 */
export async function GET() {
  try {
    await requireAdmin();

    const rewards =
      await AdminRewardVoucherService.getAll();

    return NextResponse.json({
      success: true,
      data: rewards,
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_VOUCHER_GET]",
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

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * ============================================================
 * POST /api/admin/reward-vouchers
 * ============================================================
 */
export async function POST(
  request: Request
) {
  try {
    await requireAdmin();

    const body =
      await request.json();

    const reward =
      await AdminRewardVoucherService.create(
        body
      );

    return NextResponse.json(
      {
        success: true,
        data: reward,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_VOUCHER_CREATE]",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Gagal membuat reward voucher.";

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