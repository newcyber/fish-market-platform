import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import { AdminVoucherService } from "@/services/voucher/admin-voucher.service";

export async function POST(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const voucher = await AdminVoucherService.restore(id);

    return NextResponse.json({
      success: true,
      message: "Voucher berhasil dipulihkan.",
      data: voucher,
    });
  } catch (error) {
    console.error("[ADMIN_VOUCHER_RESTORE_ERROR]", error);

    const message =
      error instanceof Error
        ? error.message
        : "Voucher gagal dipulihkan.";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "Anda tidak memiliki akses admin." },
        { status: 403 }
      );
    }

    const status =
      message === "Voucher tidak ditemukan." ? 404 : 400;

    return NextResponse.json(
      { success: false, message },
      { status }
    );
  }
}
