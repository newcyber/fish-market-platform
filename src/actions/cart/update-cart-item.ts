"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import CartService from "@/services/cart/cart.service";

export async function updateCartItemAction(
  cartItemId: string,
  quantity: number
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Silakan login terlebih dahulu.",
      };
    }

    if (!cartItemId) {
      return {
        success: false,
        message: "Item keranjang tidak valid.",
      };
    }

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
     * Jangan return object Prisma/cart ke Client Component.
     *
     * Cart bisa memiliki Decimal pada:
     * - price
     * - product.price
     *
     * Next.js tidak dapat mengirim Prisma.Decimal
     * langsung ke Client Component.
     */
    const result =
      await CartService.updateItemQuantity(
        session.user.id,
        cartItemId,
        quantity
      );

    if (!result.success) {
      return {
        success: false,
        message:
          result.message ??
          "Gagal memperbarui jumlah produk.",
      };
    }

    /**
     * Refresh halaman cart.
     */
    revalidatePath("/customer/cart");

    return {
      success: true,
      message:
        result.message ??
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