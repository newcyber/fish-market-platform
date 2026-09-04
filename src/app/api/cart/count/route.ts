import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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
 * Mendukung:
 *
 * - Customer yang sudah login
 * - Guest yang memiliki guestCartId cookie
 *
 * guestCartId hanya dibaca dari httpOnly cookie.
 * Tidak menerima guestCartId dari request.
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
      const count =
        await CartService.getItemCount({
          type: "customer",
          userId: session.user.id,
        });

      return NextResponse.json({
        success: true,
        count,
      });
    }

    /**
     * --------------------------------------------------------
     * GUEST
     * --------------------------------------------------------
     */
    const cookieStore =
      await cookies();

    const guestCartId =
      cookieStore.get(
        "guestCartId"
      )?.value;

    /**
     * Belum mempunyai guest cart.
     */
    if (!guestCartId) {
      return NextResponse.json({
        success: true,
        count: 0,
      });
    }

    const count =
      await CartService.getItemCount({
        type: "guest",
        guestCartId,
      });

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
