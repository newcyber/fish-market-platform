"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { auth } from "@/auth";

import CartService, {
  CartOwner,
} from "@/services/cart/cart.service";

/**
 * ============================================================
 * UPDATE CART ITEM ACTION
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

export async function updateCartItemAction(
  cartItemId: string,
  quantity: number
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
     * VALIDASI QUANTITY
     * ============================================================
     */

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return {
        success: false,
        message: "Jumlah produk tidak valid.",
      };
    }

    /**
     * ============================================================
     * UPDATE CART ITEM
     * ============================================================
     *
     * CartService.updateItem() mengembalikan:
     *
     *   Cart | null
     *
     * Bukan object { success, message }.
     *
     * Karena itu keberhasilan ditentukan dari ada/tidaknya
     * Cart yang dikembalikan oleh service.
     */

    const result =
      await CartService.updateItem({
        owner,
        cartItemId: cartItemId.trim(),
        quantity,
      });

    /**
     * ============================================================
     * CART TIDAK DITEMUKAN
     * ============================================================
     *
     * Jika service mengembalikan null, item/cart tidak berhasil
     * diperbarui.
     */

    if (!result) {
      return {
        success: false,
        message:
          "Item keranjang tidak ditemukan atau gagal diperbarui.",
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
        "Jumlah produk berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "[UPDATE_CART_ITEM_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui jumlah produk.",
    };
  }
}
