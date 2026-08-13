"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import WishlistService from "@/services/wishlist/wishlist.service";

export async function removeFromWishlistAction(
  productId: string
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Silakan login terlebih dahulu.",
      };
    }

    if (
      typeof productId !== "string" ||
      productId.trim().length === 0
    ) {
      return {
        success: false,
        message: "Produk tidak valid.",
      };
    }

    await WishlistService.removeItem({
      userId: session.user.id,
      productId: productId.trim(),
    });

    revalidatePath("/customer/wishlist");
    revalidatePath("/customer/products");

    return {
      success: true,
      message: "Produk berhasil dihapus dari wishlist.",
    };
  } catch (error) {
    console.error(
      "[REMOVE_FROM_WISHLIST_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menghapus produk dari wishlist.",
    };
  }
}