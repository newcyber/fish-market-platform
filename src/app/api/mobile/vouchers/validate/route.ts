import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import {
  VoucherService,
} from "@/services/voucher/voucher.service";

type ValidateVoucherBody = {
  code: string;
  subtotal: number;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function parseJsonBody(
  request: Request
): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(
  request: Request
) {
  try {
    const user =
      await requireMobileAuth(request);

    const rawBody =
      await parseJsonBody(request);

    if (!isRecord(rawBody)) {
      return mobileError(
        "INVALID_BODY",
        "Body request tidak valid.",
        400
      );
    }

    const code =
      rawBody.code;

    const subtotal =
      rawBody.subtotal;

    if (
      typeof code !== "string" ||
      !code.trim()
    ) {
      return mobileError(
        "INVALID_VOUCHER_CODE",
        "Kode voucher wajib diisi.",
        400
      );
    }

    if (
      typeof subtotal !== "number" ||
      !Number.isFinite(subtotal) ||
      subtotal <= 0
    ) {
      return mobileError(
        "INVALID_SUBTOTAL",
        "Subtotal harus lebih dari 0.",
        400
      );
    }

    const body:
      ValidateVoucherBody = {
      code:
        code.trim(),
      subtotal,
    };

    const result =
      await VoucherService.validateAndCalculate(
        {
          code:
            body.code,

          userId:
            user.id,

          subtotal:
            body.subtotal,
        }
      );

    return mobileSuccess(
      {
        voucher: {
          id:
            result.voucher.id,

          code:
            result.voucher.code,

          name:
            result.voucher.name,

          discountType:
            result.voucher.discountType,

          discountValue:
            result.voucher.discountValue
              .toNumber(),

          minimumPurchase:
            result.voucher.minimumPurchase
              ? result.voucher
                  .minimumPurchase
                  .toNumber()
              : null,

          maximumDiscount:
            result.voucher.maximumDiscount
              ? result.voucher
                  .maximumDiscount
                  .toNumber()
              : null,

          startAt:
            result.voucher.startAt
              ? result.voucher.startAt
                  .toISOString()
              : null,

          endAt:
            result.voucher.endAt
              ? result.voucher.endAt
                  .toISOString()
              : null,
        },

        subtotal:
          result.subtotal.toNumber(),

        discountAmount:
          result.discountAmount
            .toNumber(),

        finalSubtotal:
          result.finalSubtotal
            .toNumber(),
      },
      200
    );
  } catch (error) {
        if (
      error instanceof
      MobileAuthError
    ) {
      switch (error.code) {
        case "MISSING_AUTHORIZATION":
        case "INVALID_AUTHORIZATION":
        case "INVALID_ACCESS_TOKEN":
          return mobileError(
            error.code,
            error.message,
            401
          );

        case "ACCOUNT_INACTIVE":
        case "EMAIL_NOT_VERIFIED":
          return mobileError(
            error.code,
            error.message,
            403
          );

        case "SESSION_INVALIDATED":
          return mobileError(
            "SESSION_INVALIDATED",
            "Sesi aplikasi tidak berlaku karena password telah diubah. Silakan login kembali.",
            401
          );
      }
    }

    if (error instanceof Error) {
      const message =
        error.message;

      if (
        message ===
        "Kode voucher wajib diisi."
      ) {
        return mobileError(
          "INVALID_VOUCHER_CODE",
          message,
          400
        );
      }

      if (
        message ===
        "User tidak valid."
      ) {
        return mobileError(
          "INVALID_USER",
          message,
          400
        );
      }

      if (
        message ===
        "Subtotal harus lebih dari 0."
      ) {
        return mobileError(
          "INVALID_SUBTOTAL",
          message,
          400
        );
      }

      if (
        message ===
        "Voucher tidak ditemukan."
      ) {
        return mobileError(
          "VOUCHER_NOT_FOUND",
          message,
          404
        );
      }

      if (
        message ===
        "Voucher reward ini bukan milik Anda."
      ) {
        return mobileError(
          "VOUCHER_NOT_OWNED",
          message,
          403
        );
      }

      if (
        message ===
        "Voucher sedang tidak aktif."
      ) {
        return mobileError(
          "VOUCHER_INACTIVE",
          message,
          409
        );
      }

      if (
        message ===
        "Voucher belum dapat digunakan."
      ) {
        return mobileError(
          "VOUCHER_NOT_STARTED",
          message,
          409
        );
      }

      if (
        message ===
        "Voucher sudah berakhir."
      ) {
        return mobileError(
          "VOUCHER_EXPIRED",
          message,
          409
        );
      }

      if (
        message ===
        "Voucher sudah mencapai batas penggunaan."
      ) {
        return mobileError(
          "VOUCHER_USAGE_LIMIT_REACHED",
          message,
          409
        );
      }

      if (
        message ===
        "Anda sudah mencapai batas penggunaan voucher ini."
      ) {
        return mobileError(
          "VOUCHER_USER_LIMIT_REACHED",
          message,
          409
        );
      }

      if (
        message.startsWith(
          "Minimum pembelian untuk voucher ini adalah"
        )
      ) {
        return mobileError(
          "MINIMUM_PURCHASE_NOT_MET",
          message,
          400
        );
      }
    }

    console.error(
      "[MOBILE_VOUCHER_VALIDATE]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Gagal memvalidasi voucher.",
      500
    );
  }
}
