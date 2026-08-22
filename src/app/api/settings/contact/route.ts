import {
  NextResponse,
} from "next/server";

import settingsService from
  "@/services/settings/settings.service";

/**
 * ============================================================
 * PUBLIC STORE CONTACT SETTINGS API
 * ============================================================
 *
 * Endpoint public untuk mengambil informasi kontak
 * yang memang ditampilkan kepada customer.
 *
 * Saat ini digunakan oleh:
 *
 * - MobileBottomNavigation
 *
 * GET /api/settings/contact
 * ============================================================
 */

export async function GET() {
  try {
    const settings =
      await settingsService.getSettings();

    return NextResponse.json(
      {
        success: true,

        whatsapp:
          settings.whatsapp ??
          null,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "[GET_PUBLIC_CONTACT_SETTINGS_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        whatsapp: null,

        message:
          "Gagal mengambil informasi kontak.",
      },
      {
        status: 500,
      }
    );
  }
}