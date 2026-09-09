import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import CartService from "@/services/cart/cart.service";
import { CartError } from "@/services/cart/cart.error";

import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import {
  serializeCart,
} from "@/services/cart/cart.serializer";

type AddCartItemBody = {
  productId?: unknown;
  skuId?: unknown;
  quantity?: unknown;
  customerNote?: unknown;
};

function parseBody(
  body: unknown
) {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return null;
  }

  const value =
    body as AddCartItemBody;

  const productId =
    typeof value.productId === "string"
      ? value.productId.trim()
      : "";

  const skuId =
    typeof value.skuId === "string"
      ? value.skuId.trim()
      : null;

  const quantity =
    typeof value.quantity === "number"
      ? value.quantity
      : NaN;

  let customerNote:
    | string
    | null
    | undefined;

  if (
    value.customerNote ===
    undefined
  ) {
    customerNote = undefined;
  } else if (
    value.customerNote === null
  ) {
    customerNote = null;
  } else if (
    typeof value.customerNote ===
    "string"
  ) {
    customerNote =
      value.customerNote;
  } else {
    return null;
  }

  return {
    productId,
    skuId,
    quantity,
    customerNote,
  };
}

/**
 * POST /api/mobile/cart/items
 *
 * Authorization:
 *   Bearer <accessToken>
 *
 * Body:
 * {
 *   productId: string,
 *   skuId?: string | null,
 *   quantity: number,
 *   customerNote?: string | null
 * }
 *
 * userId TIDAK boleh berasal dari body.
 * Identity customer selalu berasal dari
 * Mobile Access Token.
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
     * PARSE REQUEST BODY
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
    if (!input.productId) {
      return mobileError(
      "INVALID_PRODUCT",
      "Produk tidak valid.",
      400
    );
    }

    if (
      !Number.isInteger(
        input.quantity
      ) ||
      input.quantity <= 0
    ) {
      return mobileError(
      "INVALID_QUANTITY",
      "Jumlah produk tidak valid.",
      400
    );
    }

    /**
     * ==========================================================
     * ADD ITEM
     * ==========================================================
     *
     * CartService.addItem() mengembalikan CartItem,
     * bukan Cart.
     *
     * Karena response API membutuhkan state Cart terbaru,
     * ambil Cart kembali setelah addItem() selesai.
     */
await CartService.addItem({
  owner: {
    type: "customer",
    userId: user.id,
  },
  productId: input.productId,
  skuId: input.skuId,
  quantity: input.quantity,
  customerNote:
    input.customerNote,
});

const cart =
  await CartService.getCart({
    type: "customer",
    userId: user.id,
  });

    /**
     * ==========================================================
     * SUCCESS RESPONSE
     * ==========================================================
     */
    return mobileSuccess(
      {
        cart: serializeCart(cart),
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
      }
    }

    /**
     * ==========================================================
     * CART BUSINESS ERROR
     * ==========================================================
     *
     * CartService sekarang menggunakan CartError.code
     * sebagai contract error, bukan parsing message.
     */
    if (
      error instanceof CartError
    ) {
      return mobileError(
      error.code,
      error.message,
      400
    );
    }

    /**
     * ==========================================================
     * UNEXPECTED SERVER ERROR
     * ==========================================================
     */
    console.error(
      "[MOBILE_CART_ITEM_POST_ERROR]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}
