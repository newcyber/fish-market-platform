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

type RouteContext = {
  params: Promise<{
    cartItemId: string;
  }>;
};

type UpdateCartItemBody = {
  quantity?: unknown;
};

function parseQuantity(
  body: unknown
) {
  if (
    typeof body !== "object" ||
    body === null ||
    !("quantity" in body)
  ) {
    return null;
  }

  const quantity =
    (body as UpdateCartItemBody)
      .quantity;

  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return null;
  }

  return quantity;
}

/**
 * PATCH /api/mobile/cart/items/[cartItemId]
 *
 * Update quantity.
 *
 * Identity user selalu berasal dari
 * Mobile Access Token.
 */
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const user =
      await requireMobileAuth(
        request
      );

    const { cartItemId } =
      await context.params;

    if (!cartItemId?.trim()) {
      return mobileError(
      "INVALID_CART_ITEM",
      "Item keranjang tidak valid.",
      400
    );
    }

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

    const quantity =
      parseQuantity(body);

    if (quantity === null) {
      return mobileError(
      "INVALID_QUANTITY",
      "Jumlah produk tidak valid.",
      400
    );
    }

const cart =
  await CartService.updateItem({
    owner: {
      type: "customer",
      userId: user.id,
    },
    cartItemId,
    quantity,
  });

return mobileSuccess({
      cart: serializeCart(cart),
    });
  } catch (error) {
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

    if (
      error instanceof CartError
    ) {
      return mobileError(
      error.code,
      error.message,
      400
    );
    }

    console.error(
      "[MOBILE_CART_ITEM_PATCH_ERROR]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}

/**
 * DELETE /api/mobile/cart/items/[cartItemId]
 *
 * Remove one cart item.
 */
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const user =
      await requireMobileAuth(
        request
      );

    const { cartItemId } =
      await context.params;

    if (!cartItemId?.trim()) {
      return mobileError(
      "INVALID_CART_ITEM",
      "Item keranjang tidak valid.",
      400
    );
    }

const cart =
  await CartService.removeItem({
    owner: {
      type: "customer",
      userId: user.id,
    },
    cartItemId,
  });

return mobileSuccess({
      cart: serializeCart(cart),
    });
  } catch (error) {
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

    if (
      error instanceof CartError
    ) {
      return mobileError(
      error.code,
      error.message,
      400
    );
    }

    console.error(
      "[MOBILE_CART_ITEM_DELETE_ERROR]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}
