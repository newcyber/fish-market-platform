import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import { WapiCourierDeliveryAdminService } from "@/services/notification/wapi-courier-delivery-admin.service";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 20)));

    const result = await WapiCourierDeliveryAdminService.getList({
      search: url.searchParams.get("search") || undefined,
      status: WapiCourierDeliveryAdminService.parseStatus(
        url.searchParams.get("status") || undefined,
      ),
      eventType: url.searchParams.get("eventType") || undefined,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 20,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengambil riwayat WAPI courier.";

    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;

    return NextResponse.json({ success: false, message }, { status });
  }
}
