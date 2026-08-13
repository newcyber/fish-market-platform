"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import WishlistService from "@/services/wishlist/wishlist.service";

export async function toggleWishlistAction(
  productId: string
) {
  try {
    /**
     * ============================================================
     * AUTHENTICATION
     * ============================================================
     */
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        action: null,
        message: "Silakan login terlebih dahulu.",
      };
    }

    /**
     * ============================================================
     * VALIDASI INPUT
     * ============================================================
     */
    if (
      typeof productId !== "string" ||
      productId.trim().length === 0
    ) {
      return {
        success: false,
        action: null,
        message: "Produk tidak valid.",
      };
    }

    /**
     * ============================================================
     * TOGGLE WISHLIST
     * ============================================================
     */
    const result =
      await WishlistService.toggleItem({
        userId: session.user.id,
        productId: productId.trim(),
      });

    /**
     * ============================================================
     * REVALIDATE
     * ============================================================
     */
    revalidatePath("/customer/wishlist");
    revalidatePath("/customer/products");
    revalidatePath(`/customer/products`);

    return {
      success: true,
      action: result.action,
      message: result.message,
    };
  } catch (error) {
    console.error(
      "[TOGGLE_WISHLIST_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      action: null,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui wishlist.",
    };
  }
}