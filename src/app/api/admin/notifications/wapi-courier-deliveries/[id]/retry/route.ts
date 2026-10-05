import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import { WapiCourierDeliveryAdminService } from "@/services/notification/wapi-courier-delivery-admin.service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();

    const { id } = await context.params;
    const result = await WapiCourierDeliveryAdminService.retryFailedDelivery(id);

    const success =
      result.status === "SENT" ||
      result.status === "ALREADY_SENT" ||
      result.status === "IN_PROGRESS";

    const status =
      result.status === "SENT" || result.status === "ALREADY_SENT"
        ? 200
        : result.status === "IN_PROGRESS"
          ? 409
          : 422;

    return NextResponse.json(
      {
        success,
        message:
          result.status === "SENT"
            ? "WAPI courier berhasil dikirim ulang."
            : result.status === "ALREADY_SENT"
              ? "WAPI courier sudah pernah terkirim."
              : result.status === "IN_PROGRESS"
                ? "WAPI courier sedang diproses."
                : result.errorMessage || "Retry WAPI courier tidak dapat dilakukan.",
        data: result,
      },
      { status },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal melakukan retry WAPI courier.";

    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : message === "WAPI_COURIER_DELIVERY_NOT_FOUND"
            ? 404
            : 500;

    return NextResponse.json({ success: false, message }, { status });
  }
}
