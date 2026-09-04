"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import CartService, {
  CartOwner,
} from "@/services/cart/cart.service";

/**
 * ============================================================
 * CHANGE CART ITEM SKU INPUT
 * ============================================================
 *
 * Browser hanya mengirim:
 *
 * - cartItemId
 * - skuId tujuan
 *
 * Owner tidak pernah dipercaya dari request.
 *
 * Owner selalu di-resolve dari:
 *
 * Customer:
 *   session.user.id
 *
 * Guest:
 *   httpOnly guestCartId cookie
 */
interface ChangeCartItemSkuActionInput {
  cartItemId: string;
  skuId: string;
}

/**
 * ============================================================
 * CHANGE CART ITEM SKU ACTION
 * ============================================================
 */
export async function changeCartItemSkuAction(
  input: ChangeCartItemSkuActionInput
) {
  try {
    /**
     * ==========================================================
     * RESOLVE CART OWNER
     * ==========================================================
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

      const guestCartId =
        cookieStore.get(
          "guestCartId"
        )?.value;

      /**
       * Untuk perubahan SKU, kita TIDAK membuat guest cart
       * baru secara otomatis.
       *
       * Jika cookie tidak ada, berarti request tidak memiliki
       * identity cart yang valid.
       */

      if (!guestCartId) {
        return {
          success: false,
          message:
            "Keranjang tamu tidak ditemukan.",
        };
      }

      owner = {
        type: "guest",
        guestCartId,
      };
    }

    /**
     * ==========================================================
     * CART ITEM ID VALIDATION
     * ==========================================================
     */

    const cartItemId =
      typeof input?.cartItemId ===
      "string"
        ? input.cartItemId.trim()
        : "";

    if (!cartItemId) {
      return {
        success: false,
        message:
          "Item keranjang tidak valid.",
      };
    }

    /**
     * ==========================================================
     * TARGET SKU VALIDATION
     * ==========================================================
     */

    const skuId =
      typeof input?.skuId ===
      "string"
        ? input.skuId.trim()
        : "";

    if (!skuId) {
      return {
        success: false,
        message:
          "SKU tujuan tidak valid.",
      };
    }

    /**
     * ==========================================================
     * CHANGE SKU
     * ==========================================================
     */

    await CartService.changeItemSku({
      owner,
      cartItemId,
      skuId,
    });

    /**
     * ==========================================================
     * REVALIDATE CART
     * ==========================================================
     */

    revalidatePath(
      "/cart"
    );

    revalidatePath(
      "/customer/cart"
    );

    revalidatePath(
      "/customer/checkout"
    );

    return {
      success: true,
      message:
        "Pilihan produk berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "[CHANGE_CART_ITEM_SKU_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengubah pilihan produk.",
    };
  }
}
