import { NextRequest } from "next/server";

import {
  MobileAuthError,
  requireMobileCustomer,
} from "@/lib/auth/mobile-auth";
import { mobileError, mobileSuccess } from "@/lib/api/mobile-response";
import { VoucherClaimService } from "@/services/voucher/voucher-claim.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireMobileCustomer(request);
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

    if (error instanceof MobileAuthError) {
      if (error.code === "ROLE_NOT_ALLOWED") {
        return mobileError(
          "ROLE_NOT_ALLOWED",
          error.message,
          403
        );
      }

      if (
        error.code === "MISSING_AUTHORIZATION" ||
        error.code === "INVALID_AUTHORIZATION" ||
        error.code === "INVALID_ACCESS_TOKEN" ||
        error.code === "SESSION_INVALIDATED"
      ) {
        return mobileError(
          error.code,
          error.message,
          401
        );
      }

      if (
        error.code === "ACCOUNT_INACTIVE" ||
        error.code === "EMAIL_NOT_VERIFIED"
      ) {
        return mobileError(
          error.code,
          error.message,
          403
        );
      }
    }

    return mobileError("VOUCHER_CLAIM_FAILED", message, 400);
  }
}
