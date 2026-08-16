import {
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import CartRepository from "@/repositories/cart/cart.repository";

/**
 * ============================================================
 * ADD CART ITEM INPUT
 * ============================================================
 */

export interface AddCartItemInput {
  userId: string;

  productId: string;

  quantity: number;

  productVariant?: string | null;

  productWeight?: string | null;

  customerNote?: string | null;
}

/**
 * ============================================================
 * UPDATE CART ITEM INPUT
 * ============================================================
 */

export interface UpdateCartItemInput {
  userId: string;

  cartItemId: string;

  quantity: number;
}

/**
 * ============================================================
 * REMOVE CART ITEM INPUT
 * ============================================================
 */

export interface RemoveCartItemInput {
  userId: string;

  cartItemId: string;
}

/**
 * ============================================================
 * CART SERVICE
 * ============================================================
 */

export default class CartService {
  /**
   * ============================================================
   * VALIDATE QUANTITY
   * ============================================================
   */

  private static validateQuantity(
    quantity: number
  ) {
    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error(
        "Jumlah produk minimal 1."
      );
    }
  }

  /**
   * ============================================================
   * NORMALIZE OPTION
   * ============================================================
   */

  private static normalizeOption(
    value?: string | null
  ) {
    const normalized =
      value?.trim();

    return normalized
      ? normalized
      : null;
  }

  /**
   * ============================================================
   * NORMALIZE CUSTOMER NOTE
   * ============================================================
   */

  private static normalizeCustomerNote(
    value?: string | null
  ) {
    const normalized =
      value?.trim();

    return normalized
      ? normalized
      : null;
  }

  /**
   * ============================================================
   * GET CART
   * ============================================================
   */

  static async getCart(
    userId: string
  ) {
    if (!userId) {
      throw new Error(
        "Customer tidak valid."
      );
    }

    return CartRepository.findByUserId(
      userId
    );
  }

  /**
   * ============================================================
   * GET OR CREATE CART
   * ============================================================
   */

  static async getOrCreateCart(
    userId: string
  ) {
    if (!userId) {
      throw new Error(
        "Customer tidak valid."
      );
    }

    const existingCart =
      await CartRepository.findByUserId(
        userId
      );

    if (existingCart) {
      return existingCart;
    }

    try {
      return await CartRepository.create(
        userId
      );
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const cart =
          await CartRepository.findByUserId(
            userId
          );

        if (cart) {
          return cart;
        }
      }

      throw error;
    }
  }

  /**
   * ============================================================
   * GET ITEM COUNT
   * ============================================================
   */

  static async getItemCount(
    userId: string
  ) {
    if (!userId) {
      return 0;
    }

    return CartRepository.countItems(
      userId
    );
  }

  /**
   * ============================================================
   * ADD ITEM
   * ============================================================
   */

  static async addItem({
    userId,
    productId,
    quantity,
    productVariant,
    productWeight,
    customerNote,
  }: AddCartItemInput) {
    /**
     * ==========================================================
     * BASIC VALIDATION
     * ==========================================================
     */

    if (!userId) {
      throw new Error(
        "Customer tidak valid."
      );
    }

    if (!productId) {
      throw new Error(
        "Produk tidak valid."
      );
    }

    this.validateQuantity(
      quantity
    );

    /**
     * ==========================================================
     * NORMALIZE OPTIONS
     * ==========================================================
     */

    const normalizedVariant =
      this.normalizeOption(
        productVariant
      );

    const normalizedWeight =
      this.normalizeOption(
        productWeight
      );

    const normalizedCustomerNote =
      this.normalizeCustomerNote(
        customerNote
      );

    /**
     * ==========================================================
     * USER VALIDATION
     * ==========================================================
     */

    const user =
      await prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
          isActive: true,
        },

        select: {
          id: true,
        },
      });

    if (!user) {
      throw new Error(
        "Customer tidak ditemukan atau tidak aktif."
      );
    }

    /**
     * ==========================================================
     * PRODUCT VALIDATION
     * ==========================================================
     */

    const product =
      await prisma.product.findFirst({
        where: {
          id: productId,
          deletedAt: null,
          isPublished: true,
        },

        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
        },
      });

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan atau tidak tersedia."
      );
    }

    /**
     * ==========================================================
     * STOCK VALIDATION
     * ==========================================================
     */

    if (product.stock <= 0) {
      throw new Error(
        `Stok ${product.name} sedang habis.`
      );
    }

    if (
      quantity >
      product.stock
    ) {
      throw new Error(
        `Jumlah melebihi stok tersedia. Stok ${product.name} hanya ${product.stock}.`
      );
    }

    /**
     * ==========================================================
     * TRANSACTION
     * ==========================================================
     */

    return prisma.$transaction(
      async (tx) => {
        /**
         * ========================================================
         * GET OR CREATE CART
         * ========================================================
         */

        let cart =
          await tx.cart.findUnique({
            where: {
              userId,
            },
          });

        if (!cart) {
          try {
            cart =
              await tx.cart.create({
                data: {
                  userId,
                },
              });
          } catch (error) {
            if (
              error instanceof
                Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            ) {
              cart =
                await tx.cart.findUnique({
                  where: {
                    userId,
                  },
                });
            }

            if (!cart) {
              throw error;
            }
          }
        }

        /**
         * ========================================================
         * FIND EXISTING ITEM
         * ========================================================
         *
         * Produk yang sama dapat menjadi
         * item berbeda berdasarkan:
         *
         * - productVariant
         * - productWeight
         */

        const existingItem =
          await tx.cartItem.findFirst({
            where: {
              cartId:
                cart.id,

              productId,

              productVariant:
                normalizedVariant,

              productWeight:
                normalizedWeight,
            },
          });

        /**
         * ========================================================
         * UPDATE EXISTING ITEM
         * ========================================================
         */

        if (existingItem) {
          const newQuantity =
            existingItem.quantity +
            quantity;

          if (
            newQuantity >
            product.stock
          ) {
            throw new Error(
              `Jumlah di keranjang melebihi stok tersedia. Stok ${product.name} hanya ${product.stock}.`
            );
          }

          await tx.cartItem.update({
            where: {
              id:
                existingItem.id,
            },

            data: {
              quantity:
                newQuantity,

              /**
               * Snapshot harga terbaru.
               */

              price:
                product.price,

              /**
               * Catatan terbaru dari customer.
               */

              customerNote:
                normalizedCustomerNote,
            },
          });
        } else {
          /**
           * ======================================================
           * CREATE NEW ITEM
           * ======================================================
           */

          await tx.cartItem.create({
            data: {
              cartId:
                cart.id,

              productId:
                product.id,

              productVariant:
                normalizedVariant,

              productWeight:
                normalizedWeight,

              customerNote:
                normalizedCustomerNote,

              quantity,

              price:
                product.price,
            },
          });
        }

        /**
         * ========================================================
         * RETURN UPDATED CART
         * ========================================================
         */

        return tx.cart.findUnique({
          where: {
            id:
              cart.id,
          },

          include: {
            items: {
              orderBy: {
                createdAt:
                  "asc",
              },

              include: {
                product: {
                  include: {
                    category: true,

                    images: {
                      orderBy: {
                        sortOrder:
                          "asc",
                      },
                    },
                  },
                },
              },
            },
          },
        });
      }
    );
  }

  /**
   * ============================================================
   * UPDATE ITEM
   * ============================================================
   */

  static async updateItem({
    userId,
    cartItemId,
    quantity,
  }: UpdateCartItemInput) {
    if (!userId) {
      throw new Error(
        "Customer tidak valid."
      );
    }

    if (!cartItemId) {
      throw new Error(
        "Item keranjang tidak valid."
      );
    }

    this.validateQuantity(
      quantity
    );

    const item =
      await CartRepository.findItemById(
        cartItemId
      );

    if (!item) {
      throw new Error(
        "Item keranjang tidak ditemukan."
      );
    }

    if (
      item.cart.userId !==
      userId
    ) {
      throw new Error(
        "Anda tidak memiliki akses ke item keranjang ini."
      );
    }

    if (
      item.product.deletedAt ||
      !item.product.isPublished
    ) {
      throw new Error(
        "Produk sudah tidak tersedia."
      );
    }

    if (
      item.product.stock <= 0
    ) {
      throw new Error(
        `Stok ${item.product.name} sedang habis.`
      );
    }

    if (
      quantity >
      item.product.stock
    ) {
      throw new Error(
        `Jumlah melebihi stok tersedia. Stok hanya ${item.product.stock}.`
      );
    }

    await CartRepository.updateItem(
      cartItemId,
      {
        quantity,

        price:
          Number(
            item.product.price
          ),
      }
    );

    return this.getCart(
      userId
    );
  }

  /**
   * ============================================================
   * REMOVE ITEM
   * ============================================================
   */

  static async removeItem({
    userId,
    cartItemId,
  }: RemoveCartItemInput) {
    if (!userId) {
      throw new Error(
        "Customer tidak valid."
      );
    }

    if (!cartItemId) {
      throw new Error(
        "Item keranjang tidak valid."
      );
    }

    const item =
      await CartRepository.findItemById(
        cartItemId
      );

    if (!item) {
      throw new Error(
        "Item keranjang tidak ditemukan."
      );
    }

    if (
      item.cart.userId !==
      userId
    ) {
      throw new Error(
        "Anda tidak memiliki akses ke item keranjang ini."
      );
    }

    await CartRepository.deleteItem(
      cartItemId
    );

    return this.getCart(
      userId
    );
  }

  /**
   * ============================================================
   * CLEAR CART
   * ============================================================
   */

  static async clearCart(
    userId: string
  ) {
    if (!userId) {
      throw new Error(
        "Customer tidak valid."
      );
    }

    const cart =
      await CartRepository.findByUserId(
        userId
      );

    if (!cart) {
      return null;
    }

    await CartRepository.clear(
      cart.id
    );

    return this.getCart(
      userId
    );
  }

  /**
   * ============================================================
   * CALCULATE CART TOTAL
   * ============================================================
   */

  static calculateTotal(
    cart:
      | {
          items: Array<{
            quantity: number;
            price: Prisma.Decimal;
          }>;
        }
      | null
  ) {
    if (!cart) {
      return new Prisma.Decimal(
        0
      );
    }

    return cart.items.reduce(
      (
        total,
        item
      ) => {
        const itemTotal =
          item.price.mul(
            item.quantity
          );

        return total.add(
          itemTotal
        );
      },
      new Prisma.Decimal(0)
    );
  }

  /**
   * ============================================================
   * UPDATE CART ITEM QUANTITY
   * ============================================================
   */

  static async updateItemQuantity(
    userId: string,
    cartItemId: string,
    quantity: number
  ) {
    try {
      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return {
          success: false,

          message:
            "Jumlah produk tidak valid.",
        };
      }

      const cartItem =
        await CartRepository.findItemById(
          cartItemId
        );

      if (!cartItem) {
        return {
          success: false,

          message:
            "Item keranjang tidak ditemukan.",
        };
      }

      if (
        cartItem.cart.userId !==
        userId
      ) {
        return {
          success: false,

          message:
            "Anda tidak memiliki akses ke item keranjang ini.",
        };
      }

      if (
        quantity >
        cartItem.product.stock
      ) {
        return {
          success: false,

          message:
            `Jumlah melebihi stok yang tersedia. Stok ${cartItem.product.name}: ${cartItem.product.stock}.`,
        };
      }

      await CartRepository.updateItem(
        cartItemId,
        {
          quantity,
        }
      );

      return {
        success: true,

        message:
          "Jumlah produk berhasil diperbarui.",
      };
    } catch (error) {
      console.error(
        "[CART_UPDATE_QUANTITY_ERROR]",
        error
      );

      return {
        success: false,

        message:
          "Gagal memperbarui jumlah produk.",
      };
    }
  }

  /**
   * ============================================================
   * DELETE CART ITEM
   * ============================================================
   */

  static async deleteItem(
    userId: string,
    cartItemId: string
  ) {
    try {
      const cartItem =
        await CartRepository.findItemById(
          cartItemId
        );

      if (!cartItem) {
        return {
          success: false,

          message:
            "Item keranjang tidak ditemukan.",
        };
      }

      if (
        cartItem.cart.userId !==
        userId
      ) {
        return {
          success: false,

          message:
            "Anda tidak memiliki akses ke item keranjang ini.",
        };
      }

      await CartRepository.deleteItem(
        cartItemId
      );

      return {
        success: true,

        message:
          "Produk berhasil dihapus dari keranjang.",
      };
    } catch (error) {
      console.error(
        "[CART_DELETE_ITEM_ERROR]",
        error
      );

      return {
        success: false,

        message:
          "Gagal menghapus produk dari keranjang.",
      };
    }
  }
}