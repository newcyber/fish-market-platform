import { prisma } from "@/lib/prisma";

export default class WishlistRepository {
  /**
   * ============================================================
   * GET WISHLIST BY USER ID
   * ============================================================
   */
  static async findByUserId(userId: string) {
    return prisma.wishlist.findUnique({
      where: {
        userId,
      },

      include: {
        items: {
          orderBy: {
            createdAt: "desc",
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
   * GET OR CREATE WISHLIST
   * ============================================================
   */
  static async create(userId: string) {
    return prisma.wishlist.create({
      data: {
        userId,
      },

      include: {
        items: {
          orderBy: {
            createdAt: "desc",
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
   * FIND WISHLIST ITEM
   * ============================================================
   */
  static async findItem(
    wishlistId: string,
    productId: string
  ) {
    return prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId,
          productId,
        },
      },
    });
  }

  /**
   * ============================================================
   * CREATE WISHLIST ITEM
   * ============================================================
   */
  static async createItem(
    wishlistId: string,
    productId: string
  ) {
    return prisma.wishlistItem.create({
      data: {
        wishlistId,
        productId,
      },
    });
  }

  /**
   * ============================================================
   * DELETE WISHLIST ITEM
   * ============================================================
   */
  static async deleteItem(
    wishlistId: string,
    productId: string
  ) {
    return prisma.wishlistItem.delete({
      where: {
        wishlistId_productId: {
          wishlistId,
          productId,
        },
      },
    });
  }

  /**
   * ============================================================
   * COUNT WISHLIST ITEMS
   * ============================================================
   */
  static async countItems(userId: string) {
    return prisma.wishlistItem.count({
      where: {
        wishlist: {
          userId,
        },
      },
    });
  }
}