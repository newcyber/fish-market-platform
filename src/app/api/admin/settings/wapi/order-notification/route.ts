import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import settingsRepository from "@/repositories/settings/settings.repository";
import {
  DEFAULT_ORDER_NOTIFICATION_TEMPLATE,
  ORDER_NOTIFICATION_TEMPLATE_MAX_LENGTH,
  ORDER_NOTIFICATION_TEMPLATE_PLACEHOLDERS,
  getOrderNotificationTemplate,
  getUnknownOrderNotificationPlaceholders,
} from "@/services/notification/order-notification-template";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan pada pengaturan notifikasi WhatsApp.";
}

export async function GET() {
  try {
    await requireSuperAdmin();

    const settings =
      await settingsRepository.getWapiOrderNotificationSettings();

    return NextResponse.json({
      success: true,
      data: {
        enabled: settings.enabled,
        template: getOrderNotificationTemplate(settings.template),
        defaultTemplate: DEFAULT_ORDER_NOTIFICATION_TEMPLATE,
        placeholders: ORDER_NOTIFICATION_TEMPLATE_PLACEHOLDERS,
        maxLength: ORDER_NOTIFICATION_TEMPLATE_MAX_LENGTH,
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;

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
    await requireSuperAdmin();

    const body = await request.json();

    if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Field enabled harus berupa boolean.",
        },
        { status: 400 },
      );
    }

    let template: string | null | undefined;

    if (body.template !== undefined) {
      if (body.template !== null && typeof body.template !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "Field template harus berupa string atau null.",
          },
          { status: 400 },
        );
      }

      template =
        typeof body.template === "string" ? body.template.trim() : null;

      if (
        template &&
        template.length > ORDER_NOTIFICATION_TEMPLATE_MAX_LENGTH
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Template maksimal ${ORDER_NOTIFICATION_TEMPLATE_MAX_LENGTH} karakter.`,
          },
          { status: 400 },
        );
      }

      if (template) {
        const unknownPlaceholders =
          getUnknownOrderNotificationPlaceholders(template);

        if (unknownPlaceholders.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: "Template memiliki placeholder yang tidak didukung.",
              unknownPlaceholders,
              supportedPlaceholders: ORDER_NOTIFICATION_TEMPLATE_PLACEHOLDERS,
            },
            { status: 400 },
          );
        }
      }
    }

    if (body.enabled === undefined && body.template === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Tidak ada perubahan yang dikirim.",
        },
        { status: 400 },
      );
    }

    const updated =
      await settingsRepository.updateWapiOrderNotificationSettings({
        ...(body.enabled !== undefined && {
          wapiOrderNotificationEnabled: body.enabled,
        }),
        ...(body.template !== undefined && {
          wapiOrderNotificationTemplate: template || null,
        }),
      });

    return NextResponse.json({
      success: true,
      message: "Pengaturan notifikasi WhatsApp berhasil diperbarui.",
      data: {
        enabled: updated.wapiOrderNotificationEnabled,
        template: getOrderNotificationTemplate(
          updated.wapiOrderNotificationTemplate,
        ),
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
