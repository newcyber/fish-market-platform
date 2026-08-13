"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import CartService from "@/services/cart/cart.service";

export async function addToCartAction(
  productId: string,
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

    if (!productId) {
      return {
        success: false,
        message: "Produk tidak valid.",
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
     * ADD TO CART
     * ============================================================
     *
     * CartService dapat mengembalikan Prisma object
     * yang berisi Decimal.
     *
     * Jangan return object tersebut langsung ke client.
     */
    await CartService.addItem({
      userId: session.user.id,
      productId,
      quantity,
    });

    /**
     * Refresh halaman terkait.
     */
    revalidatePath("/customer/cart");
    revalidatePath("/customer/products");

    return {
      success: true,
      message:
        "Produk berhasil ditambahkan ke keranjang.",
    };
  } catch (error) {
    console.error(
      "[ADD_TO_CART_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menambahkan produk ke keranjang.",
    };
  }
}