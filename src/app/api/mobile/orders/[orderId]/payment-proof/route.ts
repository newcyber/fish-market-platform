import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

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
      return mobileError(
        "INVALID_ORDER_ID",
        "ID pesanan tidak valid.",
        400
      );
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return mobileError(
        "INVALID_FORM_DATA",
        "Format multipart/form-data tidak valid.",
        400
      );
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return mobileError(
        "PAYMENT_PROOF_REQUIRED",
        "Bukti pembayaran wajib dipilih.",
        400
      );
    }

    const bankNameValue = formData.get("bankName");
    const accountNameValue = formData.get("accountName");
    const accountNumberValue = formData.get("accountNumber");

    if (
      bankNameValue !== null &&
      typeof bankNameValue !== "string"
    ) {
      return mobileError(
        "INVALID_PAYMENT_PROOF_DATA",
        "Nama bank tidak valid.",
        400
      );
    }

    if (
      accountNameValue !== null &&
      typeof accountNameValue !== "string"
    ) {
      return mobileError(
        "INVALID_PAYMENT_PROOF_DATA",
        "Nama rekening tidak valid.",
        400
      );
    }

    if (
      accountNumberValue !== null &&
      typeof accountNumberValue !== "string"
    ) {
      return mobileError(
        "INVALID_PAYMENT_PROOF_DATA",
        "Nomor rekening tidak valid.",
        400
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

      return mobileError(
        error.code,
        result.message,
        error.status
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

    return mobileSuccess(
      {
        order: serializeOrder(order),
      },
      200
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
      return mobileError(
        code,
        getMobilePaymentProofAuthMessage(code),
        401
      );
    }

    if (forbiddenCodes.has(code)) {
      return mobileError(
        code,
        code === "ACCOUNT_INACTIVE"
          ? "Akun tidak aktif."
          : "Email belum diverifikasi.",
        403
      );
    }

    console.error(
      "[MOBILE_PAYMENT_PROOF_ERROR]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}
