import { OrderStatus } from "@prisma/client";

import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import OrderService from "@/services/order/order.service";

import {
  serializeOrderListItem,
} from "@/services/order/order.serializer";

export async function GET(
  request: Request
) {
  try {
    const user =
      await requireMobileAuth(
        request
      );

    const { searchParams } =
      new URL(request.url);

    const rawLimit =
      searchParams.get("limit");

    const cursor =
      searchParams.get("cursor");

    const rawStatus =
      searchParams.get("status");

    const limit =
      rawLimit === null
        ? 20
        : Number(rawLimit);

    let status:
      | OrderStatus
      | undefined;

    if (rawStatus !== null) {
      if (
        !Object.values(
          OrderStatus
        ).includes(
          rawStatus as OrderStatus
        )
      ) {
        return mobileError(
          "INVALID_ORDER_STATUS",
          "Status order tidak valid.",
          400
        );
      }

      status =
        rawStatus as OrderStatus;
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

    return mobileSuccess({
      orders:
        result.orders.map(
          serializeOrderListItem
        ),

      pagination:
        result.pagination,
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
      return mobileError(
        code,
        getMobileOrderAuthMessage(
          code
        ),
        401
      );
    }

    if (
      forbiddenCodes.has(code)
    ) {
      return mobileError(
        code,
        code ===
          "ACCOUNT_INACTIVE"
          ? "Akun tidak aktif."
          : "Email belum diverifikasi.",
        403
      );
    }

    if (
      code ===
        "INVALID_ORDER_LIMIT" ||
      code ===
        "INVALID_ORDER_CURSOR"
    ) {
      return mobileError(
        code,
        code ===
          "INVALID_ORDER_LIMIT"
          ? "Limit order tidak valid. Gunakan angka 1 sampai 50."
          : "Cursor order tidak valid.",
        400
      );
    }

    console.error(
      "[MOBILE_ORDER_LIST_ERROR]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}

function getMobileOrderAuthMessage(
  code: string
) {
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
