import { NextRequest } from "next/server";

import { requireMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileError, mobileSuccess } from "@/lib/api/mobile-response";
import { VoucherClaimService } from "@/services/voucher/voucher-claim.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireMobileAuth(request);
    const { id } = await context.params;

    const result = await VoucherClaimService.claim(user.id, id);

    return mobileSuccess(
      {
        id: result.id,
        voucherId: result.voucherId,
        claimedAt: result.claimedAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengklaim voucher.";

    if (message === "UNAUTHORIZED" || message === "SESSION_INVALIDATED") {
      return mobileError("UNAUTHORIZED", "Sesi mobile tidak valid.", 401);
    }

    return mobileError("VOUCHER_CLAIM_FAILED", message, 400);
  }
}
