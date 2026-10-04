import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import WapiCustomerAuditService from "@/services/notification/wapi-customer-audit.service";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();

    const url = new URL(request.url);
    const parsedLimit = Number(url.searchParams.get("limit") || 20);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 20;

    const data = await WapiCustomerAuditService.getRecent(limit);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengambil audit log WAPI customer.";

    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : 500;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status },
    );
  }
}
