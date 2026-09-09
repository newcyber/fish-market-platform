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
  serializeOrder,
} from "@/services/order/order.serializer";

import type {
  ShippingProviderCode,
} from "@/services/shipping/shipping.types";

type CheckoutBody = {
  addressId?: unknown;
  paymentChannelId?: unknown;
  notes?: unknown;
  shippingProvider?: unknown;
  voucherCode?: unknown;
};

type CheckoutInput = {
  addressId: string;
  paymentChannelId: string;
  notes?: string | null;
  shippingProvider: ShippingProviderCode;
  voucherCode?: string | null;
};

const VALID_SHIPPING_PROVIDERS = [
  "INTERNAL",
  "JNE",
  "JNT",
  "SICEPAT",
  "ANTERAJA",
  "POS",
] as const satisfies readonly ShippingProviderCode[];

function isShippingProviderCode(
  value: string
): value is ShippingProviderCode {
  return (
    VALID_SHIPPING_PROVIDERS as readonly string[]
  ).includes(value);
}

function parseBody(
  body: unknown
): CheckoutInput | null {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return null;
  }

  const value =
    body as CheckoutBody;

  const addressId =
    typeof value.addressId === "string"
      ? value.addressId.trim()
      : "";

  const paymentChannelId =
    typeof value.paymentChannelId === "string"
      ? value.paymentChannelId.trim()
      : "";

  let notes:
    | string
    | null
    | undefined;

  if (
    value.notes === undefined
  ) {
    notes = undefined;
  } else if (
    value.notes === null
  ) {
    notes = null;
  } else if (
    typeof value.notes === "string"
  ) {
    notes = value.notes;
  } else {
    return null;
  }

  let shippingProvider: ShippingProviderCode =
    "INTERNAL";

  if (
    value.shippingProvider !==
      undefined &&
    value.shippingProvider !==
      null
  ) {
    if (
      typeof value.shippingProvider !==
      "string"
    ) {
      return null;
    }

    const normalizedShippingProvider =
      value.shippingProvider
        .trim()
        .toUpperCase();

    if (
      !isShippingProviderCode(
        normalizedShippingProvider
      )
    ) {
      return null;
    }

    shippingProvider =
      normalizedShippingProvider;
  }

  let voucherCode:
    | string
    | null
    | undefined;

  if (
    value.voucherCode === undefined
  ) {
    voucherCode = undefined;
  } else if (
    value.voucherCode === null
  ) {
    voucherCode = null;
  } else if (
    typeof value.voucherCode === "string"
  ) {
    voucherCode =
      value.voucherCode.trim() ||
      null;
  } else {
    return null;
  }

  return {
    addressId,
    paymentChannelId,
    notes,
    shippingProvider,
    voucherCode,
  };
}

function getMobileCheckoutAuthMessage(
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

function getCheckoutBusinessError(
  message: string
) {
  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      "keranjang belanja anda kosong"
    )
  ) {
    return {
      status: 400,
      code: "CART_EMPTY",
    };
  }

  if (
    normalized.includes(
      "alamat pengiriman tidak ditemukan"
    )
  ) {
    return {
      status: 404,
      code: "ADDRESS_NOT_FOUND",
    };
  }

  if (
    normalized.includes(
      "alamat pengiriman tidak valid"
    )
  ) {
    return {
      status: 400,
      code: "INVALID_ADDRESS",
    };
  }

  if (
    normalized.includes(
      "metode pembayaran tidak tersedia"
    )
  ) {
    return {
      status: 400,
      code: "PAYMENT_CHANNEL_UNAVAILABLE",
    };
  }

  if (
    normalized.includes(
      "metode pembayaran tidak valid"
    )
  ) {
    return {
      status: 400,
      code: "INVALID_PAYMENT_CHANNEL",
    };
  }

  if (
    normalized.includes(
      "metode pengiriman tidak valid"
    )
  ) {
    return {
      status: 400,
      code: "INVALID_SHIPPING_PROVIDER",
    };
  }

  if (
    normalized.includes(
      "provider pengiriman tidak tersedia"
    )
  ) {
    return {
      status: 400,
      code: "SHIPPING_PROVIDER_UNAVAILABLE",
    };
  }

  if (
    normalized.includes(
      "stok sku"
    ) &&
    normalized.includes(
      "tidak mencukupi"
    )
  ) {
    return {
      status: 400,
      code: "INSUFFICIENT_STOCK",
    };
  }

  if (
    normalized.includes(
      "sku"
    ) &&
    normalized.includes(
      "tidak aktif"
    )
  ) {
    return {
      status: 400,
      code: "SKU_NOT_AVAILABLE",
    };
  }

  if (
    normalized.includes(
      "voucher"
    )
  ) {
    return {
      status: 400,
      code: "VOUCHER_INVALID",
    };
  }

  if (
    normalized.includes(
      "pengiriman tidak tersedia"
    )
  ) {
    return {
      status: 400,
      code: "SHIPPING_UNAVAILABLE",
    };
  }

  return {
    status: 400,
    code: "CHECKOUT_FAILED",
  };
}

/**
 * POST /api/mobile/checkout
 *
 * Authorization:
 *   Bearer <accessToken>
 *
 * Body:
 * {
 *   addressId: string,
 *   paymentChannelId: string,
 *   notes?: string | null,
 *   shippingProvider?: ShippingProviderCode,
 *   voucherCode?: string | null
 * }
 *
 * Harga, subtotal, discount, shipping,
 * total, dan items TIDAK berasal dari client.
 */

export async function POST(
  request: Request
) {
  try {
    /**
     * ==========================================================
     * AUTHENTICATION
     * ==========================================================
     */

    const user =
      await requireMobileAuth(
        request
      );

    /**
     * ==========================================================
     * PARSE BODY
     * ==========================================================
     */

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return mobileError(
        "INVALID_REQUEST_BODY",
        "Format request tidak valid.",
        400
      );
    }

    const input =
      parseBody(body);

    if (!input) {
      return mobileError(
        "INVALID_REQUEST_BODY",
        "Data request tidak valid.",
        400
      );
    }

    /**
     * ==========================================================
     * BASIC VALIDATION
     * ==========================================================
     */

    if (!input.addressId) {
      return mobileError(
        "INVALID_ADDRESS",
        "Alamat pengiriman tidak valid.",
        400
      );
    }

    if (!input.paymentChannelId) {
      return mobileError(
        "INVALID_PAYMENT_CHANNEL",
        "Metode pembayaran tidak valid.",
        400
      );
    }

    /**
     * ==========================================================
     * CREATE CHECKOUT ORDER
     * ==========================================================
     */

    const result =
      await OrderService.createCheckoutOrder(
        user.id,
        input.addressId,
        input.paymentChannelId,
        input.notes,
        input.shippingProvider,
        input.voucherCode
      );

    if (!result.success) {
      const message =
        result.message ||
        "Checkout gagal.";

      const businessError =
        getCheckoutBusinessError(
          message
        );

      return mobileError(
        businessError.code,
        message,
        businessError.status
      );
    }

    if (!result.data) {
      console.error(
        "[MOBILE_CHECKOUT_ERROR] Checkout berhasil tetapi order tidak tersedia."
      );

      return mobileError(
        "CHECKOUT_FAILED",
        "Pesanan berhasil diproses tetapi data pesanan tidak tersedia.",
        500
      );
    }

    /**
     * ==========================================================
     * SUCCESS RESPONSE
     * ==========================================================
     */

    return mobileSuccess(
      {
        order:
          serializeOrder(
            result.data
          ),
      },
      201
    );
  } catch (error) {
    /**
     * ==========================================================
     * MOBILE AUTH ERROR
     * ==========================================================
     */

    if (
      error instanceof MobileAuthError
    ) {
      switch (error.code) {
        case "MISSING_AUTHORIZATION":
        case "INVALID_AUTHORIZATION":
        case "INVALID_ACCESS_TOKEN":
        case "SESSION_INVALIDATED":
          return mobileError(
            error.code,
            getMobileCheckoutAuthMessage(
              error.code
            ),
            401
          );

        case "ACCOUNT_INACTIVE":
          return mobileError(
            error.code,
            "Akun tidak aktif.",
            403
          );

        case "EMAIL_NOT_VERIFIED":
          return mobileError(
            error.code,
            "Email belum diverifikasi.",
            403
          );
      }
    }

    /**
     * ==========================================================
     * UNEXPECTED ERROR
     * ==========================================================
     */

    console.error(
      "[MOBILE_CHECKOUT_ERROR]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}
