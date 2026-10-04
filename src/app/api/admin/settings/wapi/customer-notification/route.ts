import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import settingsRepository from "@/repositories/settings/settings.repository";
import WapiCustomerAuditService from "@/services/notification/wapi-customer-audit.service";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan pada pengaturan notifikasi WhatsApp customer.";
}

export async function GET() {
  try {
    await requireSuperAdmin();

    const settings =
      await settingsRepository.getWapiCustomerNotificationSettings();

    return NextResponse.json({
      success: true,
      data: {
        enabled: settings.enabled,
        events: settings.events,
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);

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

export async function PATCH(request: Request) {
  try {
    const session = await requireSuperAdmin();

    const body = await request.json();

    const booleanFields = [
      "enabled",
      "orderCreated",
      "orderStatus",
      "paymentVerified",
      "paymentRejected",
      "rewardPoints",
    ] as const;

    for (const field of booleanFields) {
      if (body[field] !== undefined && typeof body[field] !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            error: `Field ${field} harus berupa boolean.`,
          },
          { status: 400 },
        );
      }
    }

    const before = await settingsRepository.getWapiCustomerNotificationSettings();

    const updated =
      await settingsRepository.updateWapiCustomerNotificationSettings({
        ...(body.enabled !== undefined && {
          wapiCustomerNotificationEnabled: body.enabled,
        }),
        ...(body.orderCreated !== undefined && {
          wapiCustomerOrderCreatedEnabled: body.orderCreated,
        }),
        ...(body.orderStatus !== undefined && {
          wapiCustomerOrderStatusEnabled: body.orderStatus,
        }),
        ...(body.paymentVerified !== undefined && {
          wapiCustomerPaymentVerifiedEnabled: body.paymentVerified,
        }),
        ...(body.paymentRejected !== undefined && {
          wapiCustomerPaymentRejectedEnabled: body.paymentRejected,
        }),
        ...(body.rewardPoints !== undefined && {
          wapiCustomerRewardPointsEnabled: body.rewardPoints,
        }),
      });

    const auditChanges = [
      ["wapiCustomerNotificationEnabled", before.enabled, updated.wapiCustomerNotificationEnabled],
      ["wapiCustomerOrderCreatedEnabled", before.events.ORDER_CREATED, updated.wapiCustomerOrderCreatedEnabled],
      ["wapiCustomerOrderStatusEnabled", before.events.ORDER_STATUS, updated.wapiCustomerOrderStatusEnabled],
      ["wapiCustomerPaymentVerifiedEnabled", before.events.PAYMENT_VERIFIED, updated.wapiCustomerPaymentVerifiedEnabled],
      ["wapiCustomerPaymentRejectedEnabled", before.events.PAYMENT_REJECTED, updated.wapiCustomerPaymentRejectedEnabled],
      ["wapiCustomerRewardPointsEnabled", before.events.REWARD_POINTS, updated.wapiCustomerRewardPointsEnabled],
    ] as const;

    try {
      await Promise.all(
        auditChanges
          .filter(([, previousValue, newValue]) => previousValue !== newValue)
          .map(([settingKey, previousValue, newValue]) =>
            WapiCustomerAuditService.logSettingsChange({
              actorId: session.user.id,
              settingKey,
              previousValue,
              newValue,
            }),
          ),
      );
    } catch (auditError) {
      console.error("[WAPI_CUSTOMER_SETTINGS_AUDIT_ERROR]", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Pengaturan notifikasi WhatsApp customer berhasil disimpan.",
      data: {
        enabled: updated.wapiCustomerNotificationEnabled,
        events: {
          ORDER_CREATED: updated.wapiCustomerOrderCreatedEnabled,
          ORDER_STATUS: updated.wapiCustomerOrderStatusEnabled,
          PAYMENT_VERIFIED: updated.wapiCustomerPaymentVerifiedEnabled,
          PAYMENT_REJECTED: updated.wapiCustomerPaymentRejectedEnabled,
          REWARD_POINTS: updated.wapiCustomerRewardPointsEnabled,
        },
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);

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
