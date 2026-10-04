import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import WapiCustomerDeliveryService from "@/services/notification/wapi-customer-delivery.service";
import WapiCustomerAuditService from "@/services/notification/wapi-customer-audit.service";
import { parseWapiCustomerError } from "@/services/notification/wapi-customer-error";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSuperAdmin();

    const { id } = await context.params;
    const before = await WapiCustomerDeliveryService.getDeliveryById(id);

    const result = await WapiCustomerDeliveryService.retryFailedDelivery(id);

    if (
      before &&
      result.status !== "ALREADY_SENT" &&
      result.status !== "IN_PROGRESS"
    ) {
      try {
        await WapiCustomerAuditService.logDeliveryRetry({
          actorId: session.user.id,
          deliveryId: before.id,
          eventType: before.eventType,
          fromStatus: before.status,
          toStatus: result.status === "SENT" ? "SENT" : result.status,
          attempts: result.attempts ?? before.attempts,
          result: result.errorMessage ?? result.status,
        });
      } catch (auditError) {
        console.error("[WAPI_CUSTOMER_RETRY_AUDIT_ERROR]", auditError);
      }
    }

    const errorClassification = parseWapiCustomerError(result.errorMessage);

    const status =
      result.status === "SENT" || result.status === "ALREADY_SENT"
        ? 200
        : result.status === "IN_PROGRESS"
          ? 409
          : result.status === "BLOCKED"
            ? 422
            : 422;

    return NextResponse.json(
      {
        success:
          result.status === "SENT" ||
          result.status === "ALREADY_SENT" ||
          result.status === "IN_PROGRESS",
        message:
          result.status === "SENT"
            ? "Notifikasi berhasil dikirim ulang."
            : result.status === "ALREADY_SENT"
              ? "Notifikasi sudah pernah terkirim."
              : result.status === "IN_PROGRESS"
                ? "Delivery sedang diproses."
                : result.errorMessage || "Retry tidak dapat dilakukan.",
        data: {
          ...result,
          errorCode: errorClassification?.code ?? null,
          retryable: errorClassification?.retryable ?? null,
        },
      },
      { status },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal melakukan retry WAPI customer.";

    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : message.includes("tidak ditemukan")
            ? 404
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
