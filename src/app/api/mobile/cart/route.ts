import { NextResponse } from "next/server";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import CartService from "@/services/cart/cart.service";

import { CartError } from "@/services/cart/cart.error";

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
    return NextResponse.json({
      success: true,
      data: {
        cart:
          serializeCart(cart),
      },
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
          return NextResponse.json(
            {
              success: false,
              code: error.code,
              message:
                error.message,
            },
            {
              status: 401,
            }
          );

        case "ACCOUNT_INACTIVE":
        case "EMAIL_NOT_VERIFIED":
          return NextResponse.json(
            {
              success: false,
              code: error.code,
              message:
                error.message,
            },
            {
              status: 403,
            }
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
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          message: error.message,
        },
        {
          status: 400,
        }
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

    return NextResponse.json(
      {
        success: false,
        code:
          "INTERNAL_SERVER_ERROR",
        message:
          "Terjadi kesalahan pada server.",
      },
      {
        status: 500,
      }
    );
  }
}
