"use server";

import { auth } from "@/auth";
import { cookies } from "next/headers";

import CartService from "@/services/cart/cart.service";
import ProductService from "@/services/product/product.service";

interface GetCartProductVariantsInput {
  cartItemId: string;
}

export async function getCartProductVariants(
  input: GetCartProductVariantsInput
) {
  try {
    const cartItemId =
      input?.cartItemId?.trim();

    if (!cartItemId) {
      return {
        success: false,
        message: "Item keranjang tidak valid.",
      };
    }

    /**
     * ==========================================================
     * RESOLVE CART OWNER
     * ==========================================================
     */

    const session =
      await auth();

    const cookieStore =
      await cookies();

    const guestCartId =
      cookieStore.get(
        "guestCartId"
      )?.value;

    const owner =
      session?.user?.id
        ? {
            type: "customer" as const,
            userId:
              session.user.id,
          }
        : guestCartId
          ? {
              type: "guest" as const,
              guestCartId,
            }
          : null;

    if (!owner) {
      return {
        success: false,
        message:
          "Keranjang tidak ditemukan.",
      };
    }

    /**
     * ==========================================================
     * LOAD OWNER'S CART
     * ==========================================================
     *
     * Penting:
     *
     * CartService.getCart(owner) memastikan kita hanya
     * membaca cart milik requester.
     */

    const cart =
      await CartService.getCart(
        owner
      );

    if (!cart) {
      return {
        success: false,
        message:
          "Keranjang tidak ditemukan.",
      };
    }

    /**
     * ==========================================================
     * FIND CART ITEM
     * ==========================================================
     */

    const cartItem =
      cart.items.find(
        (item) =>
          item.id === cartItemId
      );

    if (!cartItem) {
      return {
        success: false,
        message:
          "Item keranjang tidak ditemukan.",
      };
    }

    /**
     * ==========================================================
     * LOAD PRODUCT CONFIGURATION
     * ==========================================================
     *
     * ProductService menggunakan ProductRepository.findById()
     * yang sudah menggunakan productInclude.
     *
     * Dengan demikian kita mendapatkan:
     *
     * - variantGroups
     * - options
     * - active SKUs
     * - SKU options
     */

    const product =
      await ProductService.getProductById(
        cartItem.product.id
      );

    if (!product) {
      return {
        success: false,
        message:
          "Produk tidak ditemukan.",
      };
    }

    /**
     * ==========================================================
     * SERIALIZE VARIANT GROUPS
     * ==========================================================
     */

    const variantGroups =
      product.variantGroups.map(
        (group) => ({
          id: group.id,
          name: group.name,
          sortOrder:
            group.sortOrder,

          options:
            group.options.map(
              (option) => ({
                id: option.id,
                label: option.label,
                sortOrder:
                  option.sortOrder,
              })
            ),
        })
      );

    /**
     * ==========================================================
     * SERIALIZE ACTIVE SKUs
     * ==========================================================
     */

    const skus =
      product.skus.map(
        (sku) => ({
          id: sku.id,
          sku: sku.sku,
          price:
            Number(sku.price),
          stock: sku.stock,
          isActive:
            sku.isActive,

          options:
            sku.skuOptions.map(
              (skuOption) => ({
                variantOptionId:
                  skuOption.variantOptionId,

                label:
                  skuOption.variantOption
                    .label,

                groupId:
                  skuOption.variantOption
                    .groupId,

                groupName:
                  skuOption.variantOption
                    .group.name,
              })
            ),
        })
      );

    return {
      success: true,

      data: {
        productId:
          product.id,

        productName:
          product.name,

        currentSkuId:
          cartItem.sku?.id ?? null,

        variantGroups,

        skus,
      },
    };
  } catch (error) {
    console.error(
      "[GET_CART_PRODUCT_VARIANTS]",
      error
    );

    return {
      success: false,
      message:
        "Gagal mengambil pilihan varian produk.",
    };
  }
}
