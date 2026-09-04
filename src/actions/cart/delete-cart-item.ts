"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import CartService, {
  CartOwner,
} from "@/services/cart/cart.service";

/**
 * ============================================================
 * DELETE CART ITEM ACTION
 * ============================================================
 *
 * Mendukung:
 *
 * - Customer
 *   → session.user.id
 *
 * - Guest
 *   → httpOnly cookie guestCartId
 *
 * guestCartId TIDAK pernah diterima dari request body.
 *
 * Business logic tetap berada di CartService.
 * Action hanya:
 * - resolve owner
 * - validasi input dasar
 * - memanggil service
 * - revalidate cache
 * ============================================================
 */

export async function deleteCartItemAction(
  cartItemId: string
) {
  try {
    /**
     * ============================================================
     * RESOLVE CART OWNER
     * ============================================================
     */

    const session = await auth();

    let owner: CartOwner;

    /**
     * ------------------------------------------------------------
     * CUSTOMER
     * ------------------------------------------------------------
     */

    if (session?.user?.id) {
      owner = {
        type: "customer",
        userId: session.user.id,
      };
    } else {
      /**
       * ----------------------------------------------------------
       * GUEST
       * ----------------------------------------------------------
       */

      const cookieStore = await cookies();

      const guestCartId =
        cookieStore.get("guestCartId")?.value;

      if (!guestCartId) {
        return {
          success: false,
          message: "Keranjang guest tidak ditemukan.",
        };
      }

      owner = {
        type: "guest",
        guestCartId,
      };
    }

    /**
     * ============================================================
     * VALIDASI CART ITEM ID
     * ============================================================
     */

    if (
      typeof cartItemId !== "string" ||
      cartItemId.trim().length === 0
    ) {
      return {
        success: false,
        message: "Item keranjang tidak valid.",
      };
    }

    /**
     * ============================================================
     * DELETE CART ITEM
     * ============================================================
     *
     * CartService.removeItem() mengembalikan:
     *
     *   Cart | null
     *
     * Bukan object { success, message }.
     */

    const result =
      await CartService.removeItem({
        owner,
        cartItemId: cartItemId.trim(),
      });

    /**
     * ============================================================
     * CART / ITEM TIDAK DITEMUKAN
     * ============================================================
     */

    if (!result) {
      return {
        success: false,
        message:
          "Item keranjang tidak ditemukan atau gagal dihapus.",
      };
    }

    /**
     * ============================================================
     * REVALIDATE
     * ============================================================
     */

revalidatePath("/cart");
revalidatePath("/customer");

    /**
     * ============================================================
     * SUCCESS
     * ============================================================
     */

    return {
      success: true,
      message:
        "Produk berhasil dihapus dari keranjang.",
    };
  } catch (error) {
    console.error(
      "[DELETE_CART_ITEM_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus produk.",
    };
  }
}
