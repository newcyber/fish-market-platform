import { NextResponse } from "next/server";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import CartService from "@/services/cart/cart.service";

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
    const user =
      await requireMobileAuth(
        request
      );

    const cart =
      await CartService.getCart(
        user.id
      );

    return NextResponse.json({
      success: true,
      data: {
        cart: serializeCart(cart),
      },
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

    console.error(
      "[MOBILE_CART_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
      },
      {
        status: 500,
      }
    );
  }
}
