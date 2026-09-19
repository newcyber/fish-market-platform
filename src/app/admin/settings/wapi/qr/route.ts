import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import { whatsappService } from "@/services/whatsapp/whatsapp.service";

export async function GET() {
  try {
    await requireSuperAdmin();

    const qr = await whatsappService.getQRCode();

    return NextResponse.json({
      success: true,
      data: {
        qr,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve WhatsApp QR code.";

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