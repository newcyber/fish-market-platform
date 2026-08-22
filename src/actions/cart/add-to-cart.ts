"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import CartService from "@/services/cart/cart.service";

/**
 * ============================================================
 * ADD TO CART INPUT
 * ============================================================
 */

interface AddToCartActionInput {
  productId: string;

  quantity: number;

  productVariant?: string | null;

  productWeight?: string | null;

  customerNote?: string | null;
}

/**
 * ============================================================
 * ADD TO CART ACTION
 * ============================================================
 */

export async function addToCartAction(
  input: AddToCartActionInput
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
 * PRODUCT VALIDATION
 * ==========================================================
 */

const productId =
  typeof input.productId ===
  "string"
    ? input.productId.trim()
    : "";

if (!productId) {
  return {
    success: false,
    message:
      "Produk tidak valid.",
  };
}

    /**
     * ==========================================================
     * QUANTITY VALIDATION
     * ==========================================================
     */

    if (
      !Number.isInteger(
        input.quantity
      ) ||
      input.quantity < 1
    ) {
      return {
        success: false,
        message:
          "Jumlah produk tidak valid.",
      };
    }

    /**
     * ==========================================================
     * NORMALIZE INPUT
     * ==========================================================
     */

    const productVariant =
      input.productVariant?.trim() ||
      null;

    const productWeight =
      input.productWeight?.trim() ||
      null;

    const customerNote =
      input.customerNote?.trim() ||
      null;

    /**
     * ==========================================================
     * ADD TO CART
     * ==========================================================
     */

    await CartService.addItem({
      userId:
        session.user.id,

      productId,

      quantity:
        input.quantity,

      productVariant,

      productWeight,

      customerNote,
    });

    /**
     * ==========================================================
     * REVALIDATE
     * ==========================================================
     */

    revalidatePath(
      "/customer/cart"
    );

    revalidatePath(
      "/customer/products"
    );

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