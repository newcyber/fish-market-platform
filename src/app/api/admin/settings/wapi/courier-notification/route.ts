import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import settingsRepository from "@/repositories/settings/settings.repository";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan pada pengaturan notifikasi WhatsApp courier.";
}

export async function GET() {
  try {
    await requireSuperAdmin();

    const settings =
      await settingsRepository.getWapiCourierNotificationSettings();

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
    await requireSuperAdmin();

    const body = await request.json();

    const booleanFields = ["enabled", "assignment"] as const;

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

    if (body.enabled === undefined && body.assignment === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Tidak ada perubahan yang dikirim.",
        },
        { status: 400 },
      );
    }

    const updated =
      await settingsRepository.updateWapiCourierNotificationSettings({
        ...(body.enabled !== undefined && {
          wapiCourierNotificationEnabled: body.enabled,
        }),
        ...(body.assignment !== undefined && {
          wapiCourierAssignmentEnabled: body.assignment,
        }),
      });

    return NextResponse.json({
      success: true,
      message: "Pengaturan notifikasi WhatsApp courier berhasil disimpan.",
      data: {
        enabled: updated.wapiCourierNotificationEnabled,
        events: {
          ASSIGNMENT: updated.wapiCourierAssignmentEnabled,
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
