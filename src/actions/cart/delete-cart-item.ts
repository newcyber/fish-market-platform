"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import CartService from "@/services/cart/cart.service";

/**
 * ============================================================
 * DELETE CART ITEM ACTION
 * ============================================================
 */
export async function deleteCartItemAction(
  cartItemId: string
) {
  try {
    /**
     * ==========================================================
     * AUTHENTICATION
     * ==========================================================
     */
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Silakan login terlebih dahulu.",
      };
    }

    /**
     * ==========================================================
     * VALIDASI INPUT
     * ==========================================================
     */
    if (
      typeof cartItemId !== "string" ||
      cartItemId.trim().length === 0
    ) {
      return {
        success: false,
        message:
          "Item keranjang tidak valid.",
      };
    }

    /**
     * ==========================================================
     * DELETE CART ITEM
     * ==========================================================
     */
    const result =
      await CartService.deleteItem(
        session.user.id,
        cartItemId
      );

    if (!result.success) {
      return {
        success: false,
        message:
          result.message ??
          "Gagal menghapus produk dari keranjang.",
      };
    }

    /**
     * ==========================================================
     * REFRESH CART
     * ==========================================================
     */
    revalidatePath("/customer/cart");
    revalidatePath("/customer");

    return {
      success: true,
      message:
        result.message ??
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
        "Terjadi kesalahan saat menghapus produk.",
    };
  }
}