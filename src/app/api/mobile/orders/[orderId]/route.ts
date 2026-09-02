import { NextResponse } from "next/server";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";
import OrderService from "@/services/order/order.service";
import { serializeOrder } from "@/services/order/order.serializer";

interface MobileOrderDetailRouteContext {
  params: Promise<{
    orderId: string;
  }>;
}

export async function GET(
  request: Request,
  context: MobileOrderDetailRouteContext
) {
  try {
    const user = await requireMobileAuth(request);

    const { orderId } =
      await context.params;

    if (
      !orderId ||
      typeof orderId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_ORDER_ID",
          message: "ID order tidak valid.",
        },
        { status: 400 }
      );
    }

    const order =
      await OrderService.getOrderByIdForUser(
        orderId,
        user.id
      );

    return NextResponse.json({
      success: true,
      data: {
        order: serializeOrder(order),
      },
    });
  } catch (error) {
const authCode =
  error instanceof MobileAuthError
    ? error.code
    : null;

const message =
  error instanceof Error
    ? error.message
    : "";

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

    if (authCode && authCodes.has(authCode)) {
      return NextResponse.json(
        {
          success: false,
          code: authCode,
          message:
            getMobileOrderAuthMessage(authCode),
        },
        { status: 401 }
      );
    }

    if (forbiddenCodes.has(message)) {
      return NextResponse.json(
        {
          success: false,
          code: message,
          message:
            message === "ACCOUNT_INACTIVE"
              ? "Akun tidak aktif."
              : "Email belum diverifikasi.",
        },
        { status: 403 }
      );
    }

    if (
      message === "Order tidak ditemukan." ||
      message === "Order ID wajib diisi."
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "ORDER_NOT_FOUND",
          message: "Order tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    console.error(
      "[MOBILE_ORDER_DETAIL_ERROR]",
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
