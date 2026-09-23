import { NextRequest, NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import { WapiDeliveryAdminService } from "@/services/notification/wapi-delivery-admin.service";

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || undefined;

    const statusParam = searchParams.get("status")?.trim() || undefined;

    const page = parsePositiveInteger(searchParams.get("page"), 1);

    const limit = Math.min(
      100,
      parsePositiveInteger(searchParams.get("limit"), 20),
    );

    const validStatuses = [
      "PENDING",
      "PROCESSING",
      "SENT",
      "FAILED",
      "SKIPPED",
    ] as const;

    if (
      statusParam &&
      !validStatuses.includes(statusParam as (typeof validStatuses)[number])
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Status WAPI delivery tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    const status = WapiDeliveryAdminService.parseStatus(statusParam);

    const result = await WapiDeliveryAdminService.getDeliveryList({
      search,
      status,
      page,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Data WAPI delivery berhasil diambil.",
        data: result.items,
        pagination: result.pagination,
        statusCounts: result.statusCounts,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("[ADMIN_WAPI_DELIVERIES_GET]", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengambil data WAPI delivery.",
      },
      {
        status: 500,
      },
    );
  }
}
