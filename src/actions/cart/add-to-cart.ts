"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import CartService from "@/services/cart/cart.service";

/**
 * ============================================================
 * ADD TO CART INPUT
 * ============================================================
 *
 * SKU adalah identitas produk yang benar-benar dijual.
 *
 * productVariant / productWeight TIDAK lagi digunakan
 * sebagai sumber identitas CartItem.
 */
interface AddToCartActionInput {
  productId: string;

  /**
   * Canonical sellable SKU.
   */
  skuId: string;

  quantity: number;

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
        message: "Silakan login terlebih dahulu.",
      };
    }

    /**
     * ==========================================================
     * PRODUCT VALIDATION
     * ==========================================================
     */
    const productId =
      typeof input.productId === "string"
        ? input.productId.trim()
        : "";

    if (!productId) {
      return {
        success: false,
        message: "Produk tidak valid.",
      };
    }

    /**
     * ==========================================================
     * SKU VALIDATION
     * ==========================================================
     */
    const skuId =
      typeof input.skuId === "string"
        ? input.skuId.trim()
        : "";

    if (!skuId) {
      return {
        success: false,
        message:
          "Silakan pilih varian produk terlebih dahulu.",
      };
    }

    /**
     * ==========================================================
     * QUANTITY VALIDATION
     * ==========================================================
     */
    if (
      !Number.isInteger(input.quantity) ||
      input.quantity < 1
    ) {
      return {
        success: false,
        message: "Jumlah produk tidak valid.",
      };
    }

    /**
     * ==========================================================
     * CUSTOMER NOTE
     * ==========================================================
     */
    const customerNote =
      typeof input.customerNote === "string"
        ? input.customerNote.trim() || null
        : null;

    /**
     * ==========================================================
     * ADD TO CART
     * ==========================================================
     *
     * CartService sekarang menggunakan skuId sebagai
     * canonical product identity.
     */
    await CartService.addItem({
      userId: session.user.id,
      productId,
      skuId,
      quantity: input.quantity,
      customerNote,
    });

    /**
     * ==========================================================
     * REVALIDATE
     * ==========================================================
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