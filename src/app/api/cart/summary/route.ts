import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import CartService from "@/services/cart/cart.service";

/**
 * ============================================================
 * GET CART SUMMARY
 * ============================================================
 *
 * Sumber kebenaran:
 * - CartService
 * - CartItem.price
 * - CartItem.quantity
 *
 * Mendukung:
 * - Customer login
 * - Guest dengan guestCartId cookie
 *
 * Response:
 * {
 *   success: true,
 *   itemCount: number,
 *   total: number
 * }
 * ============================================================
 */

export async function GET() {
  try {
    const session = await auth();

    /**
     * --------------------------------------------------------
     * CUSTOMER
     * --------------------------------------------------------
     */
    if (session?.user?.id) {
      const cart = await CartService.getCart({
        type: "customer",
        userId: session.user.id,
      });

      const itemCount =
        cart?.items.reduce(
          (total, item) => total + item.quantity,
          0
        ) ?? 0;

      const total =
        CartService.calculateTotal(cart).toNumber();

      return NextResponse.json({
        success: true,
        itemCount,
        total,
      });
    }

    /**
     * --------------------------------------------------------
     * GUEST
     * --------------------------------------------------------
     */
    const cookieStore = await cookies();

    const guestCartId =
      cookieStore.get("guestCartId")?.value;

    if (!guestCartId) {
      return NextResponse.json({
        success: true,
        itemCount: 0,
        total: 0,
      });
    }

    const cart = await CartService.getCart({
      type: "guest",
      guestCartId,
    });

    const itemCount =
      cart?.items.reduce(
        (total, item) => total + item.quantity,
        0
      ) ?? 0;

    const total =
      CartService.calculateTotal(cart).toNumber();

    return NextResponse.json({
      success: true,
      itemCount,
      total,
    });
  } catch (error) {
    console.error(
      "[GET_CART_SUMMARY_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        itemCount: 0,
        total: 0,
        message:
          "Gagal mengambil ringkasan keranjang.",
      },
      {
        status: 500,
      }
    );
  }
}
