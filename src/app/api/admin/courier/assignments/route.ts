import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { CourierService } from "@/services/courier/courier.service";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json(
      {
        code: "UNAUTHORIZED",
        message: "Anda harus login.",
      },
      { status: 401 },
    );
  }

  if (
    session.user.role !== Role.ADMIN &&
    session.user.role !== Role.SUPER_ADMIN
  ) {
    return NextResponse.json(
      {
        code: "FORBIDDEN",
        message: "Akses admin diperlukan.",
      },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      orderId?: string;
      courierId?: string;
    };

    const orderId = body.orderId?.trim();
    const courierId = body.courierId?.trim();

    if (!orderId || !courierId) {
      return NextResponse.json(
        {
          code: "INVALID_ASSIGNMENT_INPUT",
          message: "orderId dan courierId wajib diisi.",
        },
        { status: 400 },
      );
    }

    const assignment = await CourierService.assignOrder(
      session.user.id,
      orderId,
      courierId,
    );

    return NextResponse.json(
      {
        data: assignment,
      },
      { status: 201 },
    );
  } catch (error) {
    const code =
      error instanceof Error
        ? error.message
        : "INTERNAL_SERVER_ERROR";

    const statusMap: Record<string, number> = {
      ORDER_NOT_FOUND: 404,
      COURIER_NOT_FOUND: 404,

      ORDER_PAYMENT_NOT_VERIFIED: 409,
      ORDER_NOT_READY_FOR_COURIER: 409,
      ORDER_ALREADY_ASSIGNED: 409,

      INVALID_COURIER_SLA_SETTINGS: 409,

      INVALID_ASSIGNMENT_INPUT: 400,
    };

    let message = "Gagal membuat assignment kurir.";

    switch (code) {
      case "ORDER_ALREADY_ASSIGNED":
        message = "Pesanan sudah memiliki kurir aktif.";
        break;

      case "COURIER_NOT_FOUND":
        message = "Kurir tidak ditemukan atau tidak aktif.";
        break;

      case "ORDER_NOT_FOUND":
        message = "Pesanan tidak ditemukan.";
        break;

      case "ORDER_PAYMENT_NOT_VERIFIED":
        message = "Pesanan belum memiliki pembayaran terverifikasi.";
        break;

      case "ORDER_NOT_READY_FOR_COURIER":
        message = "Status pesanan belum siap untuk dikirim.";
        break;

      case "INVALID_COURIER_SLA_SETTINGS":
        message =
          "Konfigurasi SLA kurir tidak valid. Periksa pengaturan SLA terlebih dahulu.";
        break;

      case "INVALID_ASSIGNMENT_INPUT":
        message = "orderId dan courierId wajib diisi.";
        break;

      default:
        message = "Gagal membuat assignment kurir.";
        break;
    }

    console.error("[ADMIN_COURIER_ASSIGNMENT_ERROR]", {
      code,
      error,
    });

    return NextResponse.json(
      {
        code,
        message,
      },
      {
        status: statusMap[code] ?? 500,
      },
    );
  }
}