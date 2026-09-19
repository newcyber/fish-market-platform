import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import { whatsappService } from "@/services/whatsapp/whatsapp.service";

export async function POST() {
  try {
    await requireSuperAdmin();

    await whatsappService.logout();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to disconnect WhatsApp.";

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