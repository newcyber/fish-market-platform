import { NextResponse } from "next/server";

import { auth } from "@/auth";

import CartService from "@/services/cart/cart.service";

/**
 * ============================================================
 * GET CART COUNT
 * ============================================================
 *
 * Endpoint ringan untuk mengambil jumlah item keranjang
 * yang digunakan oleh komponen global seperti:
 *
 * - MobileBottomNavigation
 * - Header
 * - Floating cart button
 *
 * Jika user belum login, endpoint mengembalikan count 0.
 * ============================================================
 */

export async function GET() {
  try {
    const session = await auth();

    const userId =
      session?.user?.id;

    /**
     * --------------------------------------------------------
     * GUEST / NOT LOGGED IN
     * --------------------------------------------------------
     */

    if (!userId) {
      return NextResponse.json({
        success: true,
        count: 0,
      });
    }

    /**
     * --------------------------------------------------------
     * GET CART ITEM COUNT
     * --------------------------------------------------------
     */

    const count =
      await CartService.getItemCount(
        userId
      );

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(
      "[GET_CART_COUNT_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        count: 0,
        message:
          "Gagal mengambil jumlah keranjang.",
      },
      {
        status: 500,
      }
    );
  }
}