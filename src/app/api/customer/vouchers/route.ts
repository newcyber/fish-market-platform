import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { VoucherClaimService } from "@/services/voucher/voucher-claim.service";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    if (session.user.role !== Role.CUSTOMER) {
      return NextResponse.json(
        { success: false, message: "Akses customer diperlukan." },
        { status: 403 },
      );
    }

    const [available, mine] = await Promise.all([
      VoucherClaimService.listAvailable(userId),
      VoucherClaimService.listMine(userId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        available,
        mine,
      },
    });
  } catch (error) {
    console.error("[CUSTOMER_VOUCHERS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data voucher." },
      { status: 500 },
    );
  }
}
