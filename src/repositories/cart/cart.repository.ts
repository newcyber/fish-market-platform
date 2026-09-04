import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * ============================================================
 * CART REPOSITORY
 * ============================================================
 *
 * Repository khusus untuk seluruh akses database Cart dan
 * CartItem.
 *
 * ARCHITECTURE:
 *
 * Product
 *   └── ProductSku
 *         ↓
 *      CartItem.skuId
 *
 * skuId adalah canonical identity untuk sellable item.
 *
 * Repository TIDAK:
 *
 * - menghitung harga
 * - menentukan flash sale
 * - menentukan stock
 * - melakukan business validation
 *
 * Semua business logic tersebut berada di CartService.
 *
 * ============================================================
 *
 * LEGACY COMPATIBILITY
 * ============================================================
 *
 * Field berikut masih dipertahankan karena data lama:
 *
 * - productVariant
 * - productWeight
 * - weightSku
 *
 * Field tersebut BUKAN sumber kebenaran inventory.
 *
 * Untuk item baru:
 *
 * - skuId wajib diisi oleh CartService
 * - stock berasal dari ProductSku.stock
 * - harga berasal dari ProductPricingService
 *
 * ============================================================
 */

/**
 * ============================================================
 * CART ITEM DATA TYPES
 * ============================================================
 */

interface CreateCartItemData {
  cartId: string;

  productId: string;

  /**
   * Canonical sellable SKU.
   *
   * Nullable hanya untuk compatibility dengan data lama.
   */
  skuId?: string | null;

  /**
   * Legacy snapshot fields.
   */
  productVariant?: string | null;

  productWeight?: string | null;

  weightSku?: string | null;

  customerNote?: string | null;

  quantity: number;

  /**
   * Harga final snapshot.
   */
  price: number;

  /**
   * Pricing snapshot.
   */
  isFlashSaleApplied?: boolean;

  flashSaleId?: string | null;

  flashSaleItemId?: string | null;
}

interface UpdateCartItemData {
  quantity: number;

  /**
   * Harga final snapshot.
   */
  price?: number;

  /**
   * Canonical SKU.
   */
  skuId?: string | null;

  /**
   * Legacy snapshot fields.
   */
  productVariant?: string | null;

  productWeight?: string | null;

  weightSku?: string | null;

  customerNote?: string | null;

  /**
   * Pricing snapshot.
   */
  isFlashSaleApplied?: boolean;

  flashSaleId?: string | null;

  flashSaleItemId?: string | null;
}

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

            /**
             * Canonical SKU.
             *
             * Include sku agar CartService / UI dapat
             * mengetahui SKU aktual yang sedang dibeli.
             */
            sku: {
              include: {
                skuOptions: {
                  include: {
                    variantOption: {
                      include: {
                        group: true,
                      },
                    },
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
 * GET CART BY GUEST CART ID
 * ============================================================
 */
static async findByGuestCartId(
  guestCartId: string,
  db: DbClient = prisma
) {
  return db.cart.findUnique({
    where: {
      guestCartId,
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

          sku: {
            include: {
              skuOptions: {
                include: {
                  variantOption: {
                    include: {
                      group: true,
                    },
                  },
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
 * FIND CART ITEMS FOR MERGE
 * ============================================================
 */
static async findItemsForMerge(
  cartId: string,
  db: DbClient = prisma
) {
  return db.cartItem.findMany({
    where: {
      cartId,
    },

    orderBy: {
      createdAt: "asc",
    },

    include: {
      product: true,

      sku: {
        include: {
          skuOptions: {
            include: {
              variantOption: {
                include: {
                  group: true,
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
   *
   * Menghitung jumlah BARIS item dalam cart.
   *
   * Contoh:
   *
   * Ikan A SKU 500gr
   * Ikan A SKU 1kg
   * Ikan B SKU 500gr
   *
   * Hasil = 3
   *
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
   * FIND OR CREATE CART
   * ============================================================
   */

  static async findOrCreate(
    userId: string
  ) {
    const existingCart =
      await this.findByUserId(
        userId
      );

    if (existingCart) {
      return existingCart;
    }

    return this.create(
      userId
    );
  }

  /**
   * ============================================================
   * FIND CART ITEM
   * ============================================================
   *
   * CANONICAL IDENTITY:
   *
   *   cartId + productId + skuId
   *
   * productVariant / productWeight TIDAK lagi digunakan
   * untuk menentukan apakah dua item adalah item yang sama.
   *
   * Contoh:
   *
   * Product A
   *   SKU 500GR
   *   SKU 1KG
   *
   * harus menghasilkan dua CartItem berbeda.
   *
   * ============================================================
   */

  static async findItem(
    cartId: string,
    productId: string,
    skuId?: string | null
  ) {
    return prisma.cartItem.findFirst({
      where: {
        cartId,

        productId,

        /**
         * Untuk item canonical:
         *
         * skuId tertentu harus match.
         *
         * Untuk legacy item:
         * skuId null hanya match dengan null.
         */
        skuId:
          skuId ?? null,
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

        sku: {
          include: {
            skuOptions: {
              include: {
                variantOption: {
                  include: {
                    group: true,
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
   * FIND LEGACY CART ITEM
   * ============================================================
   *
   * Compatibility helper untuk data lama yang belum mempunyai
   * skuId.
   *
   * JANGAN digunakan sebagai canonical lookup untuk item baru.
   *
   * ============================================================
   */

  static async findLegacyItem(
    cartId: string,
    productId: string,
    productVariant?: string | null,
    productWeight?: string | null
  ) {
    return prisma.cartItem.findFirst({
      where: {
        cartId,

        productId,

        skuId: null,

        productVariant:
          productVariant ?? null,

        productWeight:
          productWeight ?? null,
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

        sku: true,
      },
    });
  }

  /**
   * ============================================================
   * FIND CART ITEM BY ID
   * ============================================================
   *
   * Method ini hanya mencari CartItem.
   *
   * Validasi ownership user dilakukan di CartService.
   *
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

        sku: {
          include: {
            skuOptions: {
              include: {
                variantOption: {
                  include: {
                    group: true,
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
   * CREATE CART ITEM
   * ============================================================
   *
   * Repository hanya menyimpan data.
   *
   * Harga final harus sudah dihitung oleh CartService.
   *
   * ============================================================
   */

  static async createItem(
    data: CreateCartItemData
  ) {
    return prisma.cartItem.create({
      data: {
        cartId:
          data.cartId,

        productId:
          data.productId,

        /**
         * Canonical SKU.
         */
        skuId:
          data.skuId ?? null,

        /**
         * Legacy compatibility fields.
         */
        productVariant:
          data.productVariant ??
          null,

        productWeight:
          data.productWeight ??
          null,

        weightSku:
          data.weightSku ??
          null,

        customerNote:
          data.customerNote ??
          null,

        quantity:
          data.quantity,

        /**
         * FINAL PRICE SNAPSHOT
         */
        price:
          data.price,

        /**
         * PRICING SNAPSHOT
         */
        isFlashSaleApplied:
          data.isFlashSaleApplied ??
          false,

        flashSaleId:
          data.flashSaleId ??
          null,

        flashSaleItemId:
          data.flashSaleItemId ??
          null,
      },
    });
  }

  /**
   * ============================================================
   * UPDATE CART ITEM
   * ============================================================
   *
   * Semua field bersifat optional kecuali quantity.
   *
   * Repository tidak melakukan business validation.
   *
   * ============================================================
   */

  static async updateItem(
    itemId: string,
    data: UpdateCartItemData
  ) {
    return prisma.cartItem.update({
      where: {
        id:
          itemId,
      },

      data: {
        quantity:
          data.quantity,

        ...(data.price !==
        undefined
          ? {
              price:
                data.price,
            }
          : {}),

        ...(data.skuId !==
        undefined
          ? {
              skuId:
                data.skuId,
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

        ...(data.weightSku !==
        undefined
          ? {
              weightSku:
                data.weightSku,
            }
          : {}),

        ...(data.customerNote !==
        undefined
          ? {
              customerNote:
                data.customerNote,
            }
          : {}),

        ...(data.isFlashSaleApplied !==
        undefined
          ? {
              isFlashSaleApplied:
                data.isFlashSaleApplied,
            }
          : {}),

        ...(data.flashSaleId !==
        undefined
          ? {
              flashSaleId:
                data.flashSaleId,
            }
          : {}),

        ...(data.flashSaleItemId !==
        undefined
          ? {
              flashSaleItemId:
                data.flashSaleItemId,
            }
          : {}),
      },
    });
  }

  /**
   * ============================================================
   * UPDATE CART ITEM QUANTITY
   * ============================================================
   *
   * Hanya mengubah quantity.
   *
   * Harga snapshot tidak disentuh.
   *
   * Business validation tetap dilakukan oleh CartService.
   *
   * ============================================================
   */

  static async updateItemQuantity(
    cartItemId: string,
    quantity: number
  ) {
    return prisma.cartItem.update({
      where: {
        id:
          cartItemId,
      },

      data: {
        quantity,
      },
    });
  }

  /**
   * ============================================================
   * DELETE CART ITEM
   * ============================================================
   */

  static async deleteItem(
    itemId: string
  ) {
    return prisma.cartItem.delete({
      where: {
        id:
          itemId,
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
