import { prisma } from "@/lib/prisma";

export class CartRepository {
  /**
   * ============================================================
   * GET CART BY USER
   * ============================================================
   */

  static async findByUserId(
    userId: string
  ) {
    return prisma.cart.findUnique({
      where: {
        userId,
      },

      include: {
        items: {
          orderBy: {
            createdAt: "asc",
          },

          include: {
            product: {
              include: {
                category: true,

                images: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * GET CART ITEM COUNT
   * ============================================================
   */

  static async countItems(
    userId: string
  ) {
    const cart =
      await prisma.cart.findUnique({
        where: {
          userId,
        },

        select: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      });

    return cart?._count.items ?? 0;
  }

  /**
   * ============================================================
   * CREATE CART
   * ============================================================
   */

  static async create(
    userId: string
  ) {
    return prisma.cart.create({
      data: {
        userId,
      },
    });
  }

  /**
   * ============================================================
   * FIND CART ITEM
   * ============================================================
   *
   * Satu produk dapat memiliki item cart berbeda
   * berdasarkan variant dan weight.
   *
   * Contoh:
   *
   * Ikan A
   * - Utuh / 500gr
   * - Dibersihkan / 500gr
   * - Dibersihkan / 1kg
   *
   * Semuanya dianggap sebagai cart item berbeda.
   *
   */

  static async findItem(
    cartId: string,
    productId: string,
    productVariant?: string | null,
    productWeight?: string | null
  ) {
    return prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,

        productVariant:
          productVariant ?? null,

        productWeight:
          productWeight ?? null,
      },

      include: {
        product: true,
      },
    });
  }

  /**
   * ============================================================
   * FIND ITEM BY ID
   * ============================================================
   */

  static async findItemById(
    itemId: string
  ) {
    return prisma.cartItem.findUnique({
      where: {
        id: itemId,
      },

      include: {
        cart: true,

        product: true,
      },
    });
  }

  /**
   * ============================================================
   * CREATE ITEM
   * ============================================================
   */

  static async createItem(
    data: {
      cartId: string;
      productId: string;

      productVariant?: string | null;
      productWeight?: string | null;

      customerNote?: string | null;

      quantity: number;
      price: number;
    }
  ) {
    return prisma.cartItem.create({
      data: {
        cartId:
          data.cartId,

        productId:
          data.productId,

        productVariant:
          data.productVariant ?? null,

        productWeight:
          data.productWeight ?? null,

        customerNote:
          data.customerNote ?? null,

        quantity:
          data.quantity,

        price:
          data.price,
      },
    });
  }

  /**
   * ============================================================
   * UPDATE ITEM
   * ============================================================
   */

  static async updateItem(
    itemId: string,
    data: {
      quantity: number;

      price?: number;

      productVariant?: string | null;

      productWeight?: string | null;

      customerNote?: string | null;
    }
  ) {
    return prisma.cartItem.update({
      where: {
        id: itemId,
      },

      data: {
        quantity:
          data.quantity,

        ...(data.price !== undefined
          ? {
              price:
                data.price,
            }
          : {}),

        ...(data.productVariant !==
        undefined
          ? {
              productVariant:
                data.productVariant,
            }
          : {}),

        ...(data.productWeight !==
        undefined
          ? {
              productWeight:
                data.productWeight,
            }
          : {}),

        ...(data.customerNote !==
        undefined
          ? {
              customerNote:
                data.customerNote,
            }
          : {}),
      },
    });
  }

  /**
   * ============================================================
   * UPDATE CART ITEM QUANTITY
   * ============================================================
   */

  static async updateItemQuantity(
    cartItemId: string,
    quantity: number
  ) {
    return prisma.cartItem.update({
      where: {
        id: cartItemId,
      },

      data: {
        quantity,
      },
    });
  }

  /**
   * ============================================================
   * DELETE ITEM
   * ============================================================
   */

  static async deleteItem(
    itemId: string
  ) {
    return prisma.cartItem.delete({
      where: {
        id: itemId,
      },
    });
  }

  /**
   * ============================================================
   * CLEAR CART
   * ============================================================
   */

  static async clear(
    cartId: string
  ) {
    return prisma.cartItem.deleteMany({
      where: {
        cartId,
      },
    });
  }
}

export default CartRepository;