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

/**
 * GET /api/mobile/cart
 *
 * User identity selalu berasal dari
 * Mobile Access Token.
 */
export async function GET(
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
     * GET CART
     * ==========================================================
     */
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
    return mobileSuccess({
      cart: serializeCart(cart),
    });
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
     * Diseragamkan dengan endpoint:
     *
     * POST   /api/mobile/cart/items
     * PATCH  /api/mobile/cart/items/[cartItemId]
     * DELETE /api/mobile/cart/items/[cartItemId]
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
      "[MOBILE_CART_GET_ERROR]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}
