import { NextResponse } from "next/server";

import { webPushConfig } from "@/services/notification/push/push.config";

/**
 * ============================================================
 * GET VAPID PUBLIC KEY
 * ============================================================
 *
 * Public key memang boleh dikirim ke browser.
 *
 * PRIVATE KEY TIDAK PERNAH dikirim ke client.
 *
 * ============================================================
 */

export async function GET() {
  return NextResponse.json({
    publicKey:
      webPushConfig.publicKey,
  });
}
