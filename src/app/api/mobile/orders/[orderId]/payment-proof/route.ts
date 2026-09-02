import { NextResponse } from "next/server";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import OrderService from "@/services/order/order.service";
import { serializeOrder } from "@/services/order/order.serializer";

function getMobilePaymentProofAuthMessage(code: string) {
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

function getPaymentProofBusinessError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("bukti pembayaran wajib dipilih")
  ) {
    return {
      status: 400,
      code: "PAYMENT_PROOF_REQUIRED",
    };
  }

  if (
    normalized.includes("file bukti pembayaran tidak valid")
  ) {
    return {
      status: 400,
      code: "PAYMENT_PROOF_INVALID_FILE",
    };
  }

  if (
    normalized.includes(
      "format bukti pembayaran harus berupa"
    )
  ) {
    return {
      status: 400,
      code: "PAYMENT_PROOF_INVALID_FILE",
    };
  }

  if (
    normalized.includes(
      "ukuran bukti pembayaran maksimal"
    )
  ) {
    return {
      status: 400,
      code: "PAYMENT_PROOF_FILE_TOO_LARGE",
    };
  }

  if (
    normalized.includes(
      "pesanan tidak ditemukan"
    ) ||
    normalized.includes(
      "tidak memiliki akses"
    )
  ) {
    return {
      status: 404,
      code: "ORDER_NOT_FOUND",
    };
  }

  if (
    normalized.includes(
      "bukti pembayaran tidak dapat dikirim"
    )
  ) {
    return {
      status: 400,
      code: "PAYMENT_PROOF_NOT_ALLOWED",
    };
  }

  if (
    normalized.includes(
      "sudah diverifikasi"
    )
  ) {
    return {
      status: 400,
      code: "PAYMENT_ALREADY_VERIFIED",
    };
  }

  return {
    status: 400,
    code: "PAYMENT_PROOF_FAILED",
  };
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      orderId: string;
    }>;
  }
) {
  try {
    const user = await requireMobileAuth(request);

    const { orderId } = await context.params;

    if (
      typeof orderId !== "string" ||
      !orderId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_ORDER_ID",
          message: "ID pesanan tidak valid.",
        },
        { status: 400 }
      );
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_FORM_DATA",
          message: "Format multipart/form-data tidak valid.",
        },
        { status: 400 }
      );
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          code: "PAYMENT_PROOF_REQUIRED",
          message: "Bukti pembayaran wajib dipilih.",
        },
        { status: 400 }
      );
    }

    const bankNameValue = formData.get("bankName");
    const accountNameValue = formData.get("accountName");
    const accountNumberValue = formData.get("accountNumber");

    if (
      bankNameValue !== null &&
      typeof bankNameValue !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PAYMENT_PROOF_DATA",
          message: "Nama bank tidak valid.",
        },
        { status: 400 }
      );
    }

    if (
      accountNameValue !== null &&
      typeof accountNameValue !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PAYMENT_PROOF_DATA",
          message: "Nama rekening tidak valid.",
        },
        { status: 400 }
      );
    }

    if (
      accountNumberValue !== null &&
      typeof accountNumberValue !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PAYMENT_PROOF_DATA",
          message: "Nomor rekening tidak valid.",
        },
        { status: 400 }
      );
    }

    const result =
      await OrderService.submitPaymentProof(
        user.id,
        {
          orderId: orderId.trim(),
          file,
          bankName:
            typeof bankNameValue === "string"
              ? bankNameValue
              : null,
          accountName:
            typeof accountNameValue === "string"
              ? accountNameValue
              : null,
          accountNumber:
            typeof accountNumberValue === "string"
              ? accountNumberValue
              : null,
        }
      );

    if (!result.success) {
      const error =
        getPaymentProofBusinessError(
          result.message
        );

      return NextResponse.json(
        {
          success: false,
          code: error.code,
          message: result.message,
        },
        { status: error.status }
      );
    }

    /*
     * submitPaymentProof() mengembalikan PaymentProof,
     * bukan Order lengkap setelah status Order berubah.
     *
     * Karena itu fetch ulang order milik user agar response
     * Mobile menggunakan canonical Order serializer.
     */
    const order =
      await OrderService.getOrderByIdForUser(
        orderId.trim(),
        user.id
      );

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: {
          order: serializeOrder(order),
        },
      },
      { status: 200 }
    );
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
          message:
            getMobilePaymentProofAuthMessage(code),
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

    console.error(
      "[MOBILE_PAYMENT_PROOF_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
