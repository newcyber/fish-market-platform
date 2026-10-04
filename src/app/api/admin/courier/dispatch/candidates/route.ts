import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierDispatchService } from "@/services/courier/courier-dispatch.service";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Anda harus login." },
      { status: 401 },
    );
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN) {
    return NextResponse.json(
      { code: "FORBIDDEN", message: "Akses admin diperlukan." },
      { status: 403 },
    );
  }

  const orderId = new URL(request.url).searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json(
      { code: "INVALID_DISPATCH_ORDER", message: "orderId wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const data = await CourierDispatchService.getCandidates(orderId);
    return NextResponse.json({ data });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";
    const known = new Set([
      "ORDER_NOT_FOUND",
      "ORDER_PAYMENT_NOT_VERIFIED",
      "ORDER_NOT_READY_FOR_COURIER",
      "ORDER_ALREADY_ASSIGNED",
      "INVALID_DISPATCH_ORDER",
    ]);

    if (known.has(code)) {
      const status = code === "ORDER_NOT_FOUND" ? 404 : 409;
      return NextResponse.json(
        { code, message: code.replaceAll("_", " ") },
        { status },
      );
    }

    console.error("[ADMIN_COURIER_DISPATCH_CANDIDATES_ERROR]", error);
    return NextResponse.json(
      { code: "INTERNAL_SERVER_ERROR", message: "Gagal menghitung rekomendasi kurir." },
      { status: 500 },
    );
  }
}
