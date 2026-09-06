import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";

import rewardPointSettingsService from "@/services/reward-point/reward-point-settings.service";

/**
 * ============================================================
 * GET /api/admin/reward-points
 * ============================================================
 *
 * Mengambil konfigurasi Reward Point Calculator.
 *
 * Akses:
 * SUPER ADMIN ONLY
 *
 * Response:
 *
 * {
 *   "success": true,
 *   "data": {
 *     "pointsPerKg": 10
 *   }
 * }
 */

export async function GET() {
  try {
    await requireSuperAdmin();

    const settings =
      await rewardPointSettingsService.getSettings();

    return NextResponse.json({
      success: true,

      data: {
        pointsPerKg:
          settings.pointsPerKg,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_POINTS_GET]",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengambil pengaturan reward point.";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          message: "Anda harus login.",
        },
        {
          status: 401,
        },
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
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * ============================================================
 * PATCH /api/admin/reward-points
 * ============================================================
 *
 * Mengubah konfigurasi Reward Point Calculator.
 *
 * Body:
 *
 * {
 *   "pointsPerKg": 15
 * }
 *
 * Akses:
 * SUPER ADMIN ONLY
 *
 * Validation business rule berada di:
 *
 * RewardPointSettingsService.updateSettings()
 *
 * Saat ini:
 *
 * - harus integer
 * - harus > 0
 * - maksimum 1000
 */

export async function PATCH(
  request: Request,
) {
  try {
    await requireSuperAdmin();

    const body =
      await request.json();

    const pointsPerKg =
      Number(body?.pointsPerKg);

    const settings =
      await rewardPointSettingsService.updateSettings(
        pointsPerKg,
      );

    return NextResponse.json({
      success: true,

      data: {
        pointsPerKg:
          settings.pointsPerKg,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_POINTS_UPDATE]",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Gagal memperbarui pengaturan reward point.";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          message: "Anda harus login.",
        },
        {
          status: 401,
        },
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
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 400,
      },
    );
  }
}
