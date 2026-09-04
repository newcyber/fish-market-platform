"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import CartService, {
  CartOwner,
} from "@/services/cart/cart.service";

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
     * RESOLVE CART OWNER
     * ==========================================================
     *
     * Customer:
     *   session.user.id
     *
     * Guest:
     *   httpOnly cookie guestCartId
     *
     * guestCartId TIDAK pernah dipercaya dari request body.
     */
    const session = await auth();

    let owner: CartOwner;

    if (session?.user?.id) {
      /**
       * ========================================================
       * AUTHENTICATED CUSTOMER
       * ========================================================
       */
      owner = {
        type: "customer",
        userId: session.user.id,
      };
    } else {
      /**
       * ========================================================
       * GUEST CART
       * ========================================================
       */
      const cookieStore =
        await cookies();

      let guestCartId =
        cookieStore.get(
          "guestCartId"
        )?.value;

      /**
       * Buat identity guest baru jika belum ada.
       */
      if (!guestCartId) {
        guestCartId =
          randomUUID();

        cookieStore.set(
          "guestCartId",
          guestCartId,
          {
            httpOnly: true,

            secure:
              process.env.NODE_ENV ===
              "production",

            sameSite: "lax",

            path: "/",

            /**
             * Cookie guest berlaku 30 hari.
             *
             * Ini hanya lifetime cookie.
             * Retention Cart database akan diatur
             * secara terpisah.
             */
            maxAge:
              60 *
              60 *
              24 *
              30,
          }
        );
      }

      owner = {
        type: "guest",
        guestCartId,
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
     * CUSTOMER NOTE
     * ==========================================================
     */
    const customerNote =
      typeof input.customerNote ===
      "string"
        ? input.customerNote.trim() ||
          null
        : null;

    /**
     * ==========================================================
     * ADD TO CART
     * ==========================================================
     *
     * CartService menggunakan CartOwner sehingga
     * customer dan guest menggunakan business logic
     * Cart yang sama.
     */
    await CartService.addItem({
      owner,
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
