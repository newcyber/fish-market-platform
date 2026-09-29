import { NextRequest } from "next/server";

import { requireMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileError, mobileSuccess } from "@/lib/api/mobile-response";
import { VoucherClaimService } from "@/services/voucher/voucher-claim.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);

    const [available, mine] = await Promise.all([
      VoucherClaimService.listAvailable(user.id),
      VoucherClaimService.listMine(user.id),
    ]);

    return mobileSuccess({ available, mine });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengambil voucher.";

    if (message === "UNAUTHORIZED" || message === "SESSION_INVALIDATED") {
      return mobileError("UNAUTHORIZED", "Sesi mobile tidak valid.", 401);
    }

    return mobileError("VOUCHER_LIST_FAILED", message, 400);
  }
}
