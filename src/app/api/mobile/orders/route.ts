import { NextResponse } from "next/server";

  import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";
import OrderService from "@/services/order/order.service";
import { serializeOrderListItem } from "@/services/order/order.serializer";

export async function GET(request: Request) {
  try {
    const user = await requireMobileAuth(request);

    const orders =
      await OrderService.getOrdersByUserId(user.id);

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map(serializeOrderListItem),
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

    console.error("[MOBILE_ORDER_LIST_ERROR]", error);

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
