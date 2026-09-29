import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { VoucherClaimService } from "@/services/voucher/voucher-claim.service";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const result = await VoucherClaimService.claim(userId, id);

    return NextResponse.json(
      {
        success: true,
        message: "Voucher berhasil diklaim.",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengklaim voucher.";

    return NextResponse.json(
      { success: false, message },
      { status: 400 },
    );
  }
}
