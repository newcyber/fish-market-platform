import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import { whatsappService } from "@/services/whatsapp/whatsapp.service";

export async function GET() {
  try {
    await requireSuperAdmin();

    const status = await whatsappService.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        state: status.state,
        connected: status.connected,
        hasQR: status.hasQR,
        phone: status.phone ?? null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve WhatsApp status.";

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