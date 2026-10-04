import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import { WapiCustomerDeliveryAnalyticsService } from "@/services/notification/wapi-customer-delivery-analytics.service";

export async function GET() {
  try {
    await requireSuperAdmin();

    const data = await WapiCustomerDeliveryAnalyticsService.getOverview();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengambil analytics WAPI customer.";

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
