import { NextResponse } from "next/server";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import CartService from "@/services/cart/cart.service";

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
    const user =
      await requireMobileAuth(
        request
      );

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

    const input =
      parseBody(body);

    if (!input) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST_BODY",
          message:
            "Data request tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (!input.productId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PRODUCT",
          message:
            "Produk tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        input.quantity
      ) ||
      input.quantity <= 0
    ) {
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

await CartService.addItem({
  userId: user.id,

  productId:
    input.productId,

  skuId:
    input.skuId,

  quantity:
    input.quantity,

  customerNote:
    input.customerNote,
});

const cart =
  await CartService.getCart(
    user.id
  );

return NextResponse.json(
  {
    success: true,
    data: {
      cart:
        serializeCart(cart),
    },
  },
  {
    status: 201,
  }
);
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

    const message =
      error instanceof Error
        ? error.message
        : "Gagal menambahkan produk ke keranjang.";

    /**
     * Business validation errors dari
     * CartService.
     *
     * Kita belum membuat custom CartError,
     * jadi untuk sementara mapping berdasarkan
     * message yang memang sudah menjadi contract
     * CartService.
     */
    const badRequestMessages = [
      "Produk tidak valid.",
      "Customer tidak valid.",
      "Customer tidak ditemukan atau tidak aktif.",
      "Produk tidak ditemukan atau tidak tersedia.",
      "Silakan pilih varian produk terlebih dahulu.",
      "SKU produk tidak ditemukan atau sudah tidak tersedia.",
    ];

    const isBadRequest =
      badRequestMessages.includes(
        message
      ) ||
      message.startsWith(
        "Jumlah melebihi stok tersedia."
      ) ||
      message.startsWith(
        "Stok "
      ) ||
      message.startsWith(
        "Kuota "
      ) ||
      message.startsWith(
        "Batas pembelian "
      );

    if (isBadRequest) {
      return NextResponse.json(
        {
          success: false,
          code: "CART_ITEM_ADD_FAILED",
          message,
        },
        {
          status: 400,
        }
      );
    }

    console.error(
      "[MOBILE_CART_ITEM_POST_ERROR]",
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
