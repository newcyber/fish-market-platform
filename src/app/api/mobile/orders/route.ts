import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import OrderService from "@/services/order/order.service";
import { serializeOrderListItem } from "@/services/order/order.serializer";

export async function GET(request: Request) {
  try {
    const user = await requireMobileAuth(request);

    const { searchParams } = new URL(request.url);

    const rawLimit = searchParams.get("limit");
    const cursor = searchParams.get("cursor");
    const rawStatus = searchParams.get("status");

    const limit = rawLimit === null
      ? 20
      : Number(rawLimit);

    let status: OrderStatus | undefined;

    if (rawStatus !== null) {
      if (
        !Object.values(OrderStatus).includes(
          rawStatus as OrderStatus
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_ORDER_STATUS",
            message: "Status order tidak valid.",
          },
          { status: 400 }
        );
      }

      status = rawStatus as OrderStatus;
    }

    const result =
      await OrderService.getOrdersByUserIdPaginated(
        user.id,
        {
          limit,
          cursor,
          status,
        }
      );

    return NextResponse.json({
      success: true,
      data: {
        orders: result.orders.map(
          serializeOrderListItem
        ),
        pagination: result.pagination,
      },
    });
  } catch (error) {
    const code =
      error instanceof MobileAuthError
        ? error.code
        : error instanceof Error
          ? error.message
          : "INTERNAL_SERVER_ERROR";

    const authCodes = new Set([
      "MISSING_AUTHORIZATION",
      "INVALID_AUTHORIZATION",
      "INVALID_ACCESS_TOKEN",
      "SESSION_INVALIDATED",
    ]);

    const forbiddenCodes = new Set([
      "ACCOUNT_INACTIVE",
      "EMAIL_NOT_VERIFIED",
    ]);

    if (authCodes.has(code)) {
      return NextResponse.json(
        {
          success: false,
          code,
          message: getMobileOrderAuthMessage(code),
        },
        { status: 401 }
      );
    }

    if (forbiddenCodes.has(code)) {
      return NextResponse.json(
        {
          success: false,
          code,
          message:
            code === "ACCOUNT_INACTIVE"
              ? "Akun tidak aktif."
              : "Email belum diverifikasi.",
        },
        { status: 403 }
      );
    }

    if (
      code === "INVALID_ORDER_LIMIT" ||
      code === "INVALID_ORDER_CURSOR"
    ) {
      return NextResponse.json(
        {
          success: false,
          code,
          message:
            code === "INVALID_ORDER_LIMIT"
              ? "Limit order tidak valid. Gunakan angka 1 sampai 50."
              : "Cursor order tidak valid.",
        },
        { status: 400 }
      );
    }

    console.error(
      "[MOBILE_ORDER_LIST_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

function getMobileOrderAuthMessage(code: string) {
  switch (code) {
    case "MISSING_AUTHORIZATION":
      return "Authorization header wajib diisi.";

    case "INVALID_AUTHORIZATION":
      return "Authorization header tidak valid.";

    case "INVALID_ACCESS_TOKEN":
      return "Access token tidak valid.";

    case "SESSION_INVALIDATED":
      return "Sesi Anda sudah tidak berlaku.";

    default:
      return "Autentikasi gagal.";
  }
}
