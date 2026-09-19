import { NextResponse } from "next/server";

import { whatsappService } from "@/services/whatsapp/whatsapp.service";

export async function GET() {
  try {
    const health = await whatsappService.health();
    const status = await whatsappService.getStatus();

    return NextResponse.json(
      {
        success: true,
        data: {
          health,
          status,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "[GET /api/internal/whatsapp-test]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "WhatsApp gateway test failed.",
      },
      {
        status: 500,
      },
    );
  }
}
