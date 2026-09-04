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
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CART_ITEM",
          message:
            "Item keranjang tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST_BODY",
          message:
            "Format request tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const quantity =
      parseQuantity(body);

    if (quantity === null) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_QUANTITY",
          message:
            "Jumlah produk tidak valid.",
        },
        {
          status: 400,
        }
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

return NextResponse.json({
  success: true,
  data: {
    cart:
      serializeCart(cart),
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

    console.error(
      "[MOBILE_CART_ITEM_PATCH_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Terjadi kesalahan pada server.",
      },
      {
        status: 500,
      }
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
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CART_ITEM",
          message:
            "Item keranjang tidak valid.",
        },
        {
          status: 400,
        }
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

return NextResponse.json({
  success: true,
  data: {
    cart:
      serializeCart(cart),
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

    console.error(
      "[MOBILE_CART_ITEM_DELETE_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Terjadi kesalahan pada server.",
      },
      {
        status: 500,
      }
    );
  }
}
