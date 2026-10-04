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
    if (!id || !courierId) return NextResponse.json({ code: "INVALID_REASSIGNMENT_INPUT", message: "courierId wajib diisi." }, { status: 400 });

    const assignment = await CourierService.reassignOrder(session.user.id, id, courierId);
    return NextResponse.json({ data: assignment });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";
    const statusMap: Record<string, number> = {
      INVALID_REASSIGNMENT_INPUT: 400,
      COURIER_ASSIGNMENT_NOT_FOUND: 404,
      COURIER_NOT_FOUND: 404,
      COURIER_ALREADY_ASSIGNED: 409,
      REASSIGNMENT_NOT_ALLOWED: 409,
      ORDER_ALREADY_ASSIGNED: 409,
      COURIER_ASSIGNMENT_CONFLICT: 409,
    };
    const messages: Record<string, string> = {
      INVALID_REASSIGNMENT_INPUT: "Data penggantian kurir tidak lengkap.",
      COURIER_ASSIGNMENT_NOT_FOUND: "Assignment aktif tidak ditemukan.",
      COURIER_NOT_FOUND: "Kurir baru tidak ditemukan atau tidak aktif.",
      COURIER_ALREADY_ASSIGNED: "Kurir tersebut sudah menjadi kurir pesanan ini.",
      REASSIGNMENT_NOT_ALLOWED: "Kurir hanya dapat diganti saat tugas masih berstatus Ditugaskan.",
      ORDER_ALREADY_ASSIGNED: "Pesanan sudah memiliki assignment aktif lain.",
      COURIER_ASSIGNMENT_CONFLICT: "Assignment baru saja berubah. Muat ulang halaman.",
    };
    console.error("[ADMIN_COURIER_REASSIGN_ERROR]", error);
    return NextResponse.json({ code, message: messages[code] ?? "Gagal mengganti kurir." }, { status: statusMap[code] ?? 500 });
  }
}
