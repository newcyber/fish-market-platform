import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import { WapiCustomerDeliveryAdminService } from "@/services/notification/wapi-customer-delivery-admin.service";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();

    const url = new URL(request.url);

    const page = Math.max(
      1,
      Number(url.searchParams.get("page") || 1),
    );

    const limit = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("limit") || 20)),
    );

    const status = WapiCustomerDeliveryAdminService.parseStatus(
      url.searchParams.get("status") || undefined,
    );

    const result = await WapiCustomerDeliveryAdminService.getList({
      search: url.searchParams.get("search") || undefined,
      status,
      eventType: url.searchParams.get("eventType") || undefined,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 20,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengambil riwayat WhatsApp customer.";

    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
