import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import WishlistRepository from "@/repositories/wishlist/wishlist.repository";

export interface WishlistInput {
  userId: string;
  productId: string;
}

export default class WishlistService {
  /**
   * ============================================================
   * GET WISHLIST
   * ============================================================
   */
  static async getWishlist(userId: string) {
    if (!userId) {
      throw new Error(
        "Customer tidak valid."
      );
    }

    return WishlistRepository.findByUserId(
      userId
    );
  }

  /**
   * ============================================================
   * GET OR CREATE WISHLIST
   * ============================================================
   */
  static async getOrCreateWishlist(
    userId: string
  ) {
    if (!userId) {
      throw new Error(
        "Customer tidak valid."
      );
    }

    const existingWishlist =
      await WishlistRepository.findByUserId(
        userId
      );

    if (existingWishlist) {
      return existingWishlist;
    }

    /**
     * Unique constraint pada userId menjaga
     * agar setiap customer hanya memiliki
     * satu wishlist.
     */
    try {
      return await WishlistRepository.create(
        userId
      );
    } catch (error) {
      /**
       * Race condition:
       * request lain mungkin membuat wishlist
       * pada waktu yang sama.
       */
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const wishlist =
          await WishlistRepository.findByUserId(
            userId
          );

        if (wishlist) {
          return wishlist;
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

    return WishlistRepository.countItems(
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
  }: WishlistInput) {
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

    /**
     * Pastikan user aktif.
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
     * Pastikan produk masih valid dan published.
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
        },
      });

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan atau tidak tersedia."
      );
    }

    /**
     * Transaction menjaga proses create wishlist
     * dan create wishlist item tetap konsisten.
     */
    return prisma.$transaction(
      async (tx) => {
        let wishlist =
          await tx.wishlist.findUnique({
            where: {
              userId,
            },
          });

        if (!wishlist) {
          try {
            wishlist =
              await tx.wishlist.create({
                data: {
                  userId,
                },
              });
          } catch (error) {
            /**
             * Tangani race condition.
             */
            if (
              error instanceof
                Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            ) {
              wishlist =
                await tx.wishlist.findUnique({
                  where: {
                    userId,
                  },
                });
            }

            if (!wishlist) {
              throw error;
            }
          }
        }

        /**
         * Unique constraint:
         *
         * @@unique([wishlistId, productId])
         *
         * membuat produk tidak dapat masuk dua kali
         * ke wishlist yang sama.
         */
        const existingItem =
          await tx.wishlistItem.findUnique({
            where: {
              wishlistId_productId: {
                wishlistId: wishlist.id,
                productId,
              },
            },
          });

        /**
         * Idempotent:
         * Jika item sudah ada, jangan membuat duplicate.
         */
        if (!existingItem) {
          await tx.wishlistItem.create({
            data: {
              wishlistId: wishlist.id,
              productId,
            },
          });
        }

        return tx.wishlist.findUnique({
          where: {
            id: wishlist.id,
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
    );
  }

  /**
   * ============================================================
   * REMOVE ITEM
   * ============================================================
   */
  static async removeItem({
    userId,
    productId,
  }: WishlistInput) {
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

    const wishlist =
      await prisma.wishlist.findUnique({
        where: {
          userId,
        },
      });

    /**
     * Idempotent remove:
     * wishlist/item tidak ada bukan error fatal.
     */
    if (!wishlist) {
      return null;
    }

    const item =
      await prisma.wishlistItem.findUnique({
        where: {
          wishlistId_productId: {
            wishlistId: wishlist.id,
            productId,
          },
        },
      });

    if (!item) {
      return this.getWishlist(
        userId
      );
    }

    await prisma.wishlistItem.delete({
      where: {
        id: item.id,
      },
    });

    return this.getWishlist(
      userId
    );
  }

  /**
   * ============================================================
   * CHECK PRODUCT IN WISHLIST
   * ============================================================
   */
  static async isInWishlist(
    userId: string,
    productId: string
  ) {
    if (!userId || !productId) {
      return false;
    }

    const wishlist =
      await prisma.wishlist.findUnique({
        where: {
          userId,
        },

        select: {
          id: true,
        },
      });

    if (!wishlist) {
      return false;
    }

    const item =
      await prisma.wishlistItem.findUnique({
        where: {
          wishlistId_productId: {
            wishlistId: wishlist.id,
            productId,
          },
        },

        select: {
          id: true,
        },
      });

    return Boolean(item);
  }

  /**
   * ============================================================
   * TOGGLE WISHLIST
   * ============================================================
   */
  static async toggleItem({
    userId,
    productId,
  }: WishlistInput) {
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

    const wishlist =
      await this.getWishlist(
        userId
      );

    const existingItem =
      wishlist?.items.find(
        (item) =>
          item.productId === productId
      );

    if (existingItem) {
      await this.removeItem({
        userId,
        productId,
      });

      return {
        success: true,
        action: "removed" as const,
        message:
          "Produk dihapus dari wishlist.",
      };
    }

    await this.addItem({
      userId,
      productId,
    });

    return {
      success: true,
      action: "added" as const,
      message:
        "Produk ditambahkan ke wishlist.",
    };
  }
}