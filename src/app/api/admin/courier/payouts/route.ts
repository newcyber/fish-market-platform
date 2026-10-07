import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CourierService } from "@/services/courier/courier.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Anda harus login." }, { status: 401 });
  }
  if (session.user.role !== Role.SUPER_ADMIN) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Akses Super Admin diperlukan." }, { status: 403 });
  }

  const payouts = await prisma.courierPayout.findMany({
    where: { payoutStatus: "UNPAID" },
    orderBy: { createdAt: "asc" },
    include: {
      courier: { select: { id: true, name: true, phone: true } },
      order: {
        select: {
          id: true,
          orderNumber: true,
          address: { select: { receiverName: true } },
        },
      },
    },
  });

  return NextResponse.json({
    data: payouts.map((row) => ({
      id: row.id,
      courierId: row.courierId,
      courierName: row.courier.name,
      orderId: row.orderId,
      orderNumber: row.order.orderNumber,
      customerName: row.order.address.receiverName,
      amount: Number(row.courierPayout),
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Anda harus login." }, { status: 401 });
  }
  if (session.user.role !== Role.SUPER_ADMIN) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Akses Super Admin diperlukan." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      payoutId?: string;
      paymentMethod?: "CASH" | "TRANSFER";
      note?: string | null;
    };

    if (!body.payoutId || !body.paymentMethod) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "Payout dan metode pembayaran wajib diisi." },
        { status: 400 },
      );
    }

    const data = await CourierService.settlePayout(
      session.user.id,
      body.payoutId,
      body.paymentMethod,
      body.note,
    );

    return NextResponse.json({ data });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";
    const status =
      code === "COURIER_PAYOUT_NOT_FOUND" ? 404 :
      code === "COURIER_PAYOUT_ALREADY_PAID" ? 409 : 500;

    return NextResponse.json({
      code,
      message:
        code === "COURIER_PAYOUT_NOT_FOUND"
          ? "Payout tidak ditemukan."
          : code === "COURIER_PAYOUT_ALREADY_PAID"
            ? "Payout sudah dibayar."
            : "Gagal melakukan settlement payout.",
    }, { status });
  }
}
