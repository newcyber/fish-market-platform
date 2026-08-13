import { prisma } from "@/lib/prisma";

export class CartRepository {
  /**
   * ============================================================
   * GET CART BY USER
   * ============================================================
   */
  static async findByUserId(userId: string) {
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
  static async countItems(userId: string) {
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
   */
  static async findItem(
    cartId: string,
    productId: string
  ) {
    return prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
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
      quantity: number;
      price: number;
    }
  ) {
    return prisma.cartItem.create({
      data: {
        cartId: data.cartId,
        productId: data.productId,
        quantity: data.quantity,
        price: data.price,
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
    }
  ) {
    return prisma.cartItem.update({
      where: {
        id: itemId,
      },

      data: {
        quantity: data.quantity,

        ...(data.price !== undefined
          ? {
              price: data.price,
            }
          : {}),
      },
    });
  }

  /**
 * ==========================================================
 * UPDATE CART ITEM QUANTITY
 * ==========================================================
 */
async updateItemQuantity(
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