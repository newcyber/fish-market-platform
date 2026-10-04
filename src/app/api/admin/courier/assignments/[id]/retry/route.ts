import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { CourierService } from "@/services/courier/courier.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) return NextResponse.json({ code: "UNAUTHORIZED", message: "Anda harus login." }, { status: 401 });
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN) return NextResponse.json({ code: "FORBIDDEN", message: "Akses admin diperlukan." }, { status: 403 });

  try {
    const body = (await request.json()) as { courierId?: string };
    const { id } = await params;
    const courierId = body.courierId?.trim();
    if (!id || !courierId) return NextResponse.json({ code: "INVALID_RETRY_INPUT", message: "courierId wajib diisi." }, { status: 400 });

    const assignment = await CourierService.retryFailedAssignment(session.user.id, id, courierId);
    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";
    const statusMap: Record<string, number> = {
      INVALID_RETRY_INPUT: 400,
      FAILED_ASSIGNMENT_NOT_FOUND: 404,
      COURIER_NOT_FOUND: 404,
      ORDER_NOT_FOUND: 404,
      ORDER_PAYMENT_NOT_VERIFIED: 409,
      ORDER_NOT_READY_FOR_RETRY: 409,
      ORDER_ALREADY_ASSIGNED: 409,
    };
    const messages: Record<string, string> = {
      INVALID_RETRY_INPUT: "Data pengiriman ulang tidak lengkap.",
      FAILED_ASSIGNMENT_NOT_FOUND: "Riwayat gagal antar tidak ditemukan.",
      COURIER_NOT_FOUND: "Kurir tujuan tidak ditemukan atau tidak aktif.",
      ORDER_NOT_FOUND: "Pesanan tidak ditemukan.",
      ORDER_PAYMENT_NOT_VERIFIED: "Pembayaran pesanan belum terverifikasi.",
      ORDER_NOT_READY_FOR_RETRY: "Pesanan belum siap untuk percobaan pengiriman ulang.",
      ORDER_ALREADY_ASSIGNED: "Pesanan sudah memiliki assignment aktif.",
    };
    console.error("[ADMIN_COURIER_RETRY_ERROR]", error);
    return NextResponse.json({ code, message: messages[code] ?? "Gagal membuat pengiriman ulang." }, { status: statusMap[code] ?? 500 });
  }
}
