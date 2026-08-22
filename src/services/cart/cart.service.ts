import {
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import CartRepository from "@/repositories/cart/cart.repository";

import ProductPricingService from "@/services/pricing/product-pricing.service";

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
   * VALIDATE USER ID
   * ============================================================
   */

  private static validateUserId(
    userId: string
  ) {
    if (!userId) {
      throw new Error(
        "Customer tidak valid."
      );
    }
  }

  /**
   * ============================================================
   * VALIDATE CART ITEM ID
   * ============================================================
   */

  private static validateCartItemId(
    cartItemId: string
  ) {
    if (!cartItemId) {
      throw new Error(
        "Item keranjang tidak valid."
      );
    }
  }

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

    return normalized || null;
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

    return normalized || null;
  }

  /**
   * ============================================================
   * GET CART
   * ============================================================
   */

  static async getCart(
    userId: string
  ) {
    this.validateUserId(
      userId
    );

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
    this.validateUserId(
      userId
    );

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
   * VALIDATE PRODUCT OPTIONS
   * ============================================================
   */

  private static async validateProductOptions(
    tx: Prisma.TransactionClient,
    input: {
      productId: string;

      productVariant?: string | null;

      productWeight?: string | null;
    }
  ) {
    const {
      productId,
      productVariant,
      productWeight,
    } = input;

    if (productVariant) {
      const variantOption =
        await tx.productVariantOption.findFirst({
          where: {
            productId,

            label:
              productVariant,

            isActive:
              true,
          },

          select: {
            id: true,
          },
        });

      if (!variantOption) {
        throw new Error(
          "Varian produk yang dipilih tidak valid atau sudah tidak tersedia."
        );
      }
    }

    if (productWeight) {
      const weightOption =
        await tx.productWeightOption.findFirst({
          where: {
            productId,

            label:
              productWeight,

            isActive:
              true,
          },

          select: {
            id: true,
          },
        });

      if (!weightOption) {
        throw new Error(
          "Pilihan berat produk tidak valid atau sudah tidak tersedia."
        );
      }
    }
  }

  /**
   * ============================================================
   * VALIDATE PRODUCT AVAILABILITY
   * ============================================================
   */

  private static async getAvailableProduct(
    productId: string
  ) {
    const product =
      await prisma.product.findFirst({
        where: {
          id:
            productId,

          deletedAt:
            null,

          isPublished:
            true,
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

    return product;
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
    this.validateUserId(
      userId
    );

    if (!productId) {
      throw new Error(
        "Produk tidak valid."
      );
    }

    this.validateQuantity(
      quantity
    );

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

    const user =
      await prisma.user.findFirst({
        where: {
          id:
            userId,

          deletedAt:
            null,

          isActive:
            true,
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

    const product =
      await this.getAvailableProduct(
        productId
      );

    if (
      product.stock <= 0
    ) {
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

        return prisma.$transaction(
      async (tx) => {
        const currentProduct =
          await tx.product.findFirst({
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

        if (!currentProduct) {
          throw new Error(
            "Produk tidak ditemukan atau tidak tersedia."
          );
        }

        if (
          currentProduct.stock <= 0
        ) {
          throw new Error(
            `Stok ${currentProduct.name} sedang habis.`
          );
        }

        /**
         * ==========================================================
         * FLASH SALE SERVER-SIDE PROTECTION
         * ==========================================================
         *
         * Priority:
         *
         * 1. Flash Sale khusus weight yang dipilih
         * 2. Flash Sale product-wide
         *
         * Backend wajib melakukan validasi ulang agar request dari
         * client tidak dapat melewati quota Flash Sale.
         */

        /**
         * ==========================================================
         * GET SELECTED WEIGHT OPTION
         * ==========================================================
         */

        const selectedWeightOption =
          normalizedWeight
            ? await tx.productWeightOption.findFirst({
                where: {
                  productId:
                    currentProduct.id,

                  label:
                    normalizedWeight,

                  isActive:
                    true,
                },

                select: {
                  id: true,
                },
              })
            : null;

        /**
         * ==========================================================
         * CURRENT TIME
         * ==========================================================
         */

        const now =
          new Date();

        /**
         * ==========================================================
         * FIND WEIGHT-SPECIFIC FLASH SALE
         * ==========================================================
         */

        const weightFlashSaleItem =
          selectedWeightOption
            ? await tx.flashSaleItem.findFirst({
                where: {
                  productId:
                    currentProduct.id,

                  weightOptionId:
                    selectedWeightOption.id,

                  isActive:
                    true,

                  stockLimit: {
                    gt:
                      0,
                  },

                  flashSale: {
                    status:
                      "ACTIVE",

                    startAt: {
                      lte:
                        now,
                    },

                    endAt: {
                      gt:
                        now,
                    },
                  },
                },

                select: {
                  id: true,

                  stockLimit: true,

                  soldQuantity: true,

                  perUserLimit: true,
                },

                orderBy: {
                  sortOrder:
                    "asc",
                },
              })
            : null;

        /**
         * ==========================================================
         * FIND PRODUCT-WIDE FLASH SALE
         * ==========================================================
         */

        const productFlashSaleItem =
          await tx.flashSaleItem.findFirst({
            where: {
              productId:
                currentProduct.id,

              weightOptionId:
                null,

              isActive:
                true,

              stockLimit: {
                gt:
                  0,
              },

              flashSale: {
                status:
                  "ACTIVE",

                startAt: {
                  lte:
                    now,
                },

                endAt: {
                  gt:
                    now,
                },
              },
            },

            select: {
              id: true,

              stockLimit: true,

              soldQuantity: true,

              perUserLimit: true,
            },

            orderBy: {
              sortOrder:
                "asc",
            },
          });

        /**
         * ==========================================================
         * RESOLVE ACTIVE FLASH SALE
         * ==========================================================
         *
         * Weight-specific memiliki prioritas dibanding
         * product-wide.
         */

        const activeFlashSaleItem =
          weightFlashSaleItem ??
          productFlashSaleItem;

        /**
         * ==========================================================
         * VALIDATE FLASH SALE QUOTA
         * ==========================================================
         */

        if (activeFlashSaleItem) {
          const remainingQuota =
            Math.max(
              0,
              activeFlashSaleItem.stockLimit -
                activeFlashSaleItem.soldQuantity
            );

          if (
            remainingQuota <= 0
          ) {
            throw new Error(
              "Maaf, kuota Flash Sale untuk produk ini sudah habis."
            );
          }

          if (
            quantity >
            remainingQuota
          ) {
            throw new Error(
              `Kuota Flash Sale tidak mencukupi. Sisa kuota: ${remainingQuota}.`
            );
          }

          /**
           * ========================================================
           * VALIDATE PER USER LIMIT
           * ========================================================
           */

          if (
            activeFlashSaleItem.perUserLimit !== null &&
            quantity >
              activeFlashSaleItem.perUserLimit
          ) {
            throw new Error(
              `Batas pembelian Flash Sale untuk satu customer adalah ${activeFlashSaleItem.perUserLimit} produk.`
            );
          }
        }


        /**
         * ==========================================================
         * PRODUCT PRICING
         * ==========================================================
         */

        const pricing =
          await ProductPricingService.resolve(
            tx,
            {
              productId:
                currentProduct.id,

              productVariant:
                normalizedVariant,

              productWeight:
                normalizedWeight,

              fallbackPrice:
                currentProduct.price,
            }
          );

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

        const existingItem =
          await tx.cartItem.findFirst({
            where: {
              cartId:
                cart.id,

              productId:
                currentProduct.id,

              productVariant:
                normalizedVariant,

              productWeight:
                normalizedWeight,

              customerNote:
                normalizedCustomerNote,
            },
          });

        if (existingItem) {
          /**
           * ========================================================
           * CALCULATE NEW QUANTITY
           * ========================================================
           */

          const newQuantity =
            existingItem.quantity +
            quantity;


          /**
           * ========================================================
           * VALIDATE PRODUCT STOCK
           * ========================================================
           */

          if (
            newQuantity >
            currentProduct.stock
          ) {
            throw new Error(
              `Jumlah di keranjang melebihi stok tersedia. Stok ${currentProduct.name} hanya ${currentProduct.stock}.`
            );
          }


          /**
           * ========================================================
           * VALIDATE FLASH SALE QUOTA
           * ========================================================
           *
           * Quantity existing item +
           * quantity baru
           * tidak boleh melebihi
           * sisa quota Flash Sale.
           */

          if (activeFlashSaleItem) {
            const remainingQuota =
              Math.max(
                0,
                activeFlashSaleItem.stockLimit -
                activeFlashSaleItem.soldQuantity
              );

            if (
              newQuantity >
              remainingQuota
            ) {
              throw new Error(
                `Kuota Flash Sale tidak mencukupi. Sisa kuota: ${remainingQuota}.`
              );
            }


            /**
             * ======================================================
             * PER USER LIMIT
             * ======================================================
             */

            if (
              activeFlashSaleItem.perUserLimit !== null &&
              newQuantity >
              activeFlashSaleItem.perUserLimit
            ) {
              throw new Error(
                `Batas pembelian Flash Sale untuk satu customer adalah ${activeFlashSaleItem.perUserLimit} produk.`
              );
            }
          }


          /**
         * ========================================================
         * UPDATE CART ITEM
         * ========================================================
         */

          await tx.cartItem.update({
            where: {
              id: existingItem.id,
            },

            data: {
              quantity: newQuantity,

              price:
                pricing.finalPrice,

              isFlashSaleApplied:
                pricing.isFlashSaleApplied,

              flashSaleId:
                pricing.flashSaleId,

              flashSaleItemId:
                pricing.flashSaleItemId,
            },
          });
        } else {

          /**
 * ========================================================
 * PER USER LIMIT
 * ========================================================
 */

          if (
            activeFlashSaleItem &&
            activeFlashSaleItem.perUserLimit !== null &&
            quantity >
            activeFlashSaleItem.perUserLimit
          ) {
            throw new Error(
              `Batas pembelian Flash Sale untuk satu customer adalah ${activeFlashSaleItem.perUserLimit} produk.`
            );
          }

          /**
            * ========================================================
            * CREATE CART ITEM
            * ========================================================
            */

          await tx.cartItem.create({
            data: {
              cartId:
                cart.id,

              productId:
                currentProduct.id,

              productVariant:
                normalizedVariant,

              productWeight:
                normalizedWeight,

              customerNote:
                normalizedCustomerNote,

              quantity,

              price:
                pricing.finalPrice,

              /**
* ========================================================
* FLASH SALE SNAPSHOT
* ========================================================
*/

              isFlashSaleApplied:
                pricing.isFlashSaleApplied,

              flashSaleId:
                pricing.flashSaleId,

              flashSaleItemId:
                pricing.flashSaleItemId,
            },
          });
        }

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
                    category:
                      true,

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
  this.validateUserId(
    userId
  );

  this.validateCartItemId(
    cartItemId
  );

  this.validateQuantity(
    quantity
  );

  const cartItem =
    await CartRepository.findItemById(
      cartItemId
    );

  if (!cartItem) {
    throw new Error(
      "Item keranjang tidak ditemukan."
    );
  }

  if (
    cartItem.cart.userId !==
    userId
  ) {
    throw new Error(
      "Anda tidak memiliki akses ke item keranjang ini."
    );
  }

  if (
    cartItem.product.deletedAt ||
    !cartItem.product.isPublished
  ) {
    throw new Error(
      "Produk sudah tidak tersedia."
    );
  }

  if (
    cartItem.product.stock <= 0
  ) {
    throw new Error(
      `Stok ${cartItem.product.name} sedang habis.`
    );
  }

  if (
    quantity >
    cartItem.product.stock
  ) {
    throw new Error(
      `Jumlah melebihi stok tersedia. Stok ${cartItem.product.name} hanya ${cartItem.product.stock}.`
    );
  }

  await prisma.$transaction(
    async (tx) => {
      /**
       * ========================================================
       * NORMALIZE PRODUCT OPTIONS
       * ========================================================
       */

      const normalizedVariant =
        this.normalizeOption(
          cartItem.productVariant
        );

      const normalizedWeight =
        this.normalizeOption(
          cartItem.productWeight
        );

      /**
       * ========================================================
       * GET CURRENT PRODUCT
       * ========================================================
       */

      const currentProduct =
        await tx.product.findUnique({
          where: {
            id:
              cartItem.productId,
          },

          select: {
            id: true,

            name: true,

            price: true,

            stock: true,

            deletedAt: true,

            isPublished: true,
          },
        });

      if (
        !currentProduct ||
        currentProduct.deletedAt ||
        !currentProduct.isPublished
      ) {
        throw new Error(
          "Produk sudah tidak tersedia."
        );
      }

      /**
       * ========================================================
       * VALIDATE CURRENT STOCK
       * ========================================================
       */

      if (
        currentProduct.stock <= 0
      ) {
        throw new Error(
          `Stok ${currentProduct.name} sedang habis.`
        );
      }

      if (
        quantity >
        currentProduct.stock
      ) {
        throw new Error(
          `Jumlah melebihi stok tersedia. Stok ${currentProduct.name} hanya ${currentProduct.stock}.`
        );
      }

      /**
       * ========================================================
       * GET SELECTED WEIGHT OPTION
       * ========================================================
       */

      const selectedWeightOption =
        normalizedWeight
          ? await tx.productWeightOption.findFirst({
              where: {
                productId:
                  currentProduct.id,

                label:
                  normalizedWeight,

                isActive:
                  true,
              },

              select: {
                id: true,
              },
            })
          : null;

      /**
       * ========================================================
       * CURRENT TIME
       * ========================================================
       */

      const now =
        new Date();

      /**
       * ========================================================
       * FIND WEIGHT-SPECIFIC FLASH SALE
       * ========================================================
       */

      const weightFlashSaleItem =
        selectedWeightOption
          ? await tx.flashSaleItem.findFirst({
              where: {
                productId:
                  currentProduct.id,

                weightOptionId:
                  selectedWeightOption.id,

                isActive:
                  true,

                stockLimit: {
                  gt:
                    0,
                },

                flashSale: {
                  status:
                    "ACTIVE",

                  startAt: {
                    lte:
                      now,
                  },

                  endAt: {
                    gt:
                      now,
                  },
                },
              },

              select: {
                id: true,

                stockLimit: true,

                soldQuantity: true,

                perUserLimit: true,
              },

              orderBy: {
                sortOrder:
                  "asc",
              },
            })
          : null;

      /**
       * ========================================================
       * FIND PRODUCT-WIDE FLASH SALE
       * ========================================================
       */

      const productFlashSaleItem =
        await tx.flashSaleItem.findFirst({
          where: {
            productId:
              currentProduct.id,

            weightOptionId:
              null,

            isActive:
              true,

            stockLimit: {
              gt:
                0,
            },

            flashSale: {
              status:
                "ACTIVE",

              startAt: {
                lte:
                  now,
              },

              endAt: {
                gt:
                  now,
              },
            },
          },

          select: {
            id: true,

            stockLimit: true,

            soldQuantity: true,

            perUserLimit: true,
          },

          orderBy: {
            sortOrder:
              "asc",
          },
        });

      /**
       * ========================================================
       * RESOLVE ACTIVE FLASH SALE
       * ========================================================
       *
       * Weight-specific memiliki prioritas
       * dibanding product-wide.
       */

      const activeFlashSaleItem =
        weightFlashSaleItem ??
        productFlashSaleItem;

      /**
       * ========================================================
       * VALIDATE FLASH SALE QUOTA
       * ========================================================
       *
       * IMPORTANT:
       *
       * `quantity` di updateItem() adalah
       * FINAL QUANTITY.
       *
       * Jangan menggunakan:
       *
       * existingItem.quantity + quantity
       *
       * karena UI mengirim quantity akhir.
       */

      if (activeFlashSaleItem) {
        const remainingQuota =
          Math.max(
            0,
            activeFlashSaleItem.stockLimit -
              activeFlashSaleItem.soldQuantity
          );

        if (
          remainingQuota <= 0
        ) {
          throw new Error(
            "Maaf, kuota Flash Sale untuk produk ini sudah habis."
          );
        }

        if (
          quantity >
          remainingQuota
        ) {
          throw new Error(
            `Kuota Flash Sale tidak mencukupi. Sisa kuota: ${remainingQuota}.`
          );
        }

        /**
         * ======================================================
         * VALIDATE PER USER LIMIT
         * ======================================================
         */

        if (
          activeFlashSaleItem.perUserLimit !== null &&
          quantity >
            activeFlashSaleItem.perUserLimit
        ) {
          throw new Error(
            `Batas pembelian Flash Sale untuk satu customer adalah ${activeFlashSaleItem.perUserLimit} produk.`
          );
        }
      }

      /**
       * ========================================================
       * PRODUCT PRICING
       * ========================================================
       *
       * Harga tetap dihitung ulang oleh pricing engine.
       */

      const pricing =
        await ProductPricingService.resolve(
          tx,
          {
            productId:
              currentProduct.id,

            productVariant:
              normalizedVariant,

            productWeight:
              normalizedWeight,

            fallbackPrice:
              currentProduct.price,
          }
        );

      /**
       * ========================================================
       * UPDATE CART ITEM
       * ========================================================
       */

      await tx.cartItem.update({
        where: {
          id:
            cartItemId,
        },

        data: {
          /**
           * ======================================================
           * QUANTITY
           * ======================================================
           */

          quantity,

          /**
           * ======================================================
           * PRICE SNAPSHOT
           * ======================================================
           */

          price:
            pricing.finalPrice,

          /**
           * ======================================================
           * FLASH SALE SNAPSHOT
           * ======================================================
           */

          isFlashSaleApplied:
            pricing.isFlashSaleApplied,

          flashSaleId:
            pricing.flashSaleId,

          flashSaleItemId:
            pricing.flashSaleItemId,
        },
      });
    }
  );

  return this.getCart(
    userId
  );
}

  /**
   * ============================================================
   * UPDATE ITEM QUANTITY
   * ============================================================
   */

  static async updateItemQuantity(
    userId: string,
    cartItemId: string,
    quantity: number
  ) {
    try {
      await this.updateItem({
        userId,
        cartItemId,
        quantity,
      });

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
          error instanceof Error
            ? error.message
            : "Gagal memperbarui jumlah produk.",
      };
    }
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
    this.validateUserId(
      userId
    );

    this.validateCartItemId(
      cartItemId
    );

    const cartItem =
      await CartRepository.findItemById(
        cartItemId
      );

    if (!cartItem) {
      throw new Error(
        "Item keranjang tidak ditemukan."
      );
    }

    if (
      cartItem.cart.userId !==
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
   * DELETE CART ITEM
   * ============================================================
   */

  static async deleteItem(
    userId: string,
    cartItemId: string
  ) {
    try {
      await this.removeItem({
        userId,
        cartItemId,
      });

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
          error instanceof Error
            ? error.message
            : "Gagal menghapus produk dari keranjang.",
      };
    }
  }

  /**
   * ============================================================
   * CLEAR CART
   * ============================================================
   */

  static async clearCart(
    userId: string
  ) {
    this.validateUserId(
      userId
    );

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

          price:
          Prisma.Decimal;
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
      new Prisma.Decimal(
        0
      )
    );
  }
}