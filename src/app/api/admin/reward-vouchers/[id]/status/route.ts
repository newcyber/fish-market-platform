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
 * PATCH /api/admin/reward-vouchers/:id/status
 * ============================================================
 *
 * Mengaktifkan / menonaktifkan Reward Voucher.
 *
 * Body:
 *
 * {
 *   "isActive": true
 * }
 *
 * atau:
 *
 * {
 *   "isActive": false
 * }
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

    /**
     * --------------------------------------------------------
     * VALIDATE REQUEST BODY
     * --------------------------------------------------------
     */

    if (
      typeof body?.isActive !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "isActive harus berupa boolean.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * UPDATE STATUS
     * --------------------------------------------------------
     */

    const reward =
      await AdminRewardVoucherService.setActive(
        id,
        body.isActive
      );

    return NextResponse.json({
      success: true,
      data: reward,
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_VOUCHER_STATUS]",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengubah status reward voucher.";

    if (
      message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda harus login.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      message ===
      "FORBIDDEN"
    ) {
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