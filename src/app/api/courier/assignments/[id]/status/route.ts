import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CourierAssignmentStatus, CourierFailureCode, Role } from "@prisma/client";
import { CourierService } from "@/services/courier/courier.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Anda harus login." },
      { status: 401 },
    );
  }

  if (session.user.role !== Role.COURIER) {
    return NextResponse.json(
      { code: "FORBIDDEN", message: "Akses kurir diperlukan." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      status?: string;
      failureReason?: string | null;
      failureCode?: string | null;
      proofId?: string | null;
    };

    const nextStatus = body.status as CourierAssignmentStatus;

    if (!Object.values(CourierAssignmentStatus).includes(nextStatus)) {
      return NextResponse.json(
        { code: "INVALID_STATUS", message: "Status pengantaran tidak valid." },
        { status: 400 },
      );
    }

    const { id } = await params;

    const failureCode = body.failureCode
      ? (body.failureCode as CourierFailureCode)
      : null;

    const result = await CourierService.transition(
      session.user.id,
      id,
      nextStatus,
      body.failureReason,
      failureCode,
      body.proofId,
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    const status =
      code === "COURIER_ASSIGNMENT_NOT_FOUND"
        ? 404
        : code === "INVALID_COURIER_STATUS_TRANSITION" ||
            code === "FAILURE_REASON_REQUIRED" ||
            code === "DELIVERY_PROOF_REQUIRED" ||
            code === "DELIVERY_PROOF_NOT_FOUND" ||
            code === "DELIVERY_PROOF_CONFLICT" ||
            code === "INVALID_FAILURE_CODE"
          ? 409
          : code === "COURIER_ASSIGNMENT_CONFLICT"
            ? 409
            : 500;

    const messages: Record<string, string> = {
      COURIER_ASSIGNMENT_NOT_FOUND: "Tugas pengantaran tidak ditemukan.",
      INVALID_COURIER_STATUS_TRANSITION: "Perubahan status tidak diperbolehkan dari status saat ini.",
      FAILURE_REASON_REQUIRED: "Alasan gagal antar wajib diisi.",
      INVALID_FAILURE_CODE: "Alasan gagal antar tidak valid.",
      DELIVERY_PROOF_REQUIRED: "Bukti pengiriman wajib dibuat sebelum pesanan ditandai terkirim.",
      DELIVERY_PROOF_NOT_FOUND: "Bukti pengiriman tidak ditemukan atau sudah digunakan.",
      DELIVERY_PROOF_CONFLICT: "Bukti pengiriman baru saja digunakan. Muat ulang halaman.",
      COURIER_ASSIGNMENT_CONFLICT: "Tugas baru saja diperbarui. Muat ulang halaman.",
    };

    console.error("[COURIER_STATUS_ERROR]", error);

    return NextResponse.json(
      {
        code,
        message: messages[code] ?? "Terjadi kesalahan pada server.",
      },
      { status },
    );
  }
}
