import {
  FlashSaleStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * FLASH SALE REPOSITORY
 * ============================================================
 *
 * Repository untuk seluruh query Flash Sale.
 *
 * Mendukung:
 *
 * - Pricing
 * - Cart
 * - Checkout
 * - Homepage Flash Sale
 * - Admin Flash Sale Campaign Management
 * - Admin Flash Sale Item Management
 *
 * Method checkout menggunakan Prisma.TransactionClient agar
 * dapat digunakan dengan aman di dalam transaction.
 */

/**
 * ============================================================
 * FIND ACTIVE FLASH SALE ITEM INPUT
 * ============================================================
 */

export interface FindActiveFlashSaleItemInput {
  productId: string;

  skuId?: string | null;

  now?: Date;
}

/**
 * ============================================================
 * ADMIN FIND MANY INPUT
 * ============================================================
 */

export interface FindManyFlashSalesInput {
  skip?: number;

  take?: number;

  status?: FlashSaleStatus;

  search?: string;
}

/**
 * ============================================================
 * FLASH SALE REPOSITORY
 * ============================================================
 */

export default class FlashSaleRepository {
  /**
   * ============================================================
   * FIND ACTIVE FLASH SALE ITEM
   * ============================================================
   *
   * Priority:
   *
   * 1. Flash Sale khusus weight option
   * 2. Flash Sale seluruh product
   */

  static async findActiveItem(
    tx: Prisma.TransactionClient,
    {
      productId,
      skuId,
      now = new Date(),
    }: FindActiveFlashSaleItemInput
  ) {
    const commonWhere = {
      productId,
      isActive: true,
      stockLimit: {
        gt: 0,
      },
      flashSale: {
        status: FlashSaleStatus.ACTIVE,
        deletedAt: null,
        startAt: {
          lte: now,
        },
        endAt: {
          gt: now,
        },
      },
    };

    /**
     * ==========================================================
     * PRIORITY 1
     * SKU-SPECIFIC FLASH SALE
     * ==========================================================
     */
    if (skuId) {
      const skuSpecificItem =
        await tx.flashSaleItem.findFirst({
          where: {
            ...commonWhere,
            skuId,
          },

          include: {
            flashSale: {
              select: {
                id: true,
                name: true,
                slug: true,
                startAt: true,
                endAt: true,
                status: true,
              },
            },
            sku: {
              include: {
                skuOptions: {
                  include: {
                    variantOption: true,
                  },
                },
              },
            },
          },

          orderBy: [
            {
              sortOrder: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        });

      if (skuSpecificItem) {
        return skuSpecificItem;
      }
    }

    /**
     * ==========================================================
     * PRIORITY 2
     * PRODUCT-WIDE LEGACY FLASH SALE
     * ==========================================================
     *
     * Tetap dipertahankan sementara untuk compatibility dengan
     * data lama selama proses migration.
     */
    return tx.flashSaleItem.findFirst({
      where: {
        ...commonWhere,
        skuId: null,
        weightOptionId: null,
      },

      include: {
        flashSale: {
          select: {
            id: true,
            name: true,
            slug: true,
            startAt: true,
            endAt: true,
            status: true,
          },
        },
        sku: true,
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  /**
   * ============================================================
   * FIND ACTIVE FLASH SALE FOR HOMEPAGE
   * ============================================================
   *
   * Read-only query khusus homepage.
   *
   * Mengambil satu Flash Sale yang:
   *
   * - ACTIVE
   * - Belum dihapus
   * - Sudah dimulai
   * - Belum berakhir
   * - Memiliki item aktif
   *
   * Tidak mengubah:
   *
   * - stock
   * - sold quantity
   * - pricing
   * - cart
   * - checkout
   */

  static async findActiveForHomepage() {
    const now =
      new Date();

    return prisma.flashSale.findFirst({
      where: {
        status:
          FlashSaleStatus.ACTIVE,

        deletedAt:
          null,

        startAt: {
          lte:
            now,
        },

        endAt: {
          gt:
            now,
        },

        items: {
          some: {
            isActive:
              true,

            stockLimit: {
              gt:
                0,
            },
          },
        },
      },

      orderBy: [
        {
          sortOrder:
            "asc",
        },

        {
          startAt:
            "asc",
        },
      ],

      include: {
        items: {
          where: {
            isActive:
              true,

            stockLimit: {
              gt:
                0,
            },
          },

          orderBy: [
            {
              sortOrder:
                "asc",
            },

            {
              createdAt:
                "asc",
            },
          ],

          include: {
  product: {
    include: {
      images: {
        orderBy: [
          {
            isThumbnail: "desc",
          },
          {
            sortOrder: "asc",
          },
        ],
      },
    },
  },

  sku: true,

  _count: {
    select: {
      purchases: true,
    },
  },
},
        },
      },
    });
  }

  /**
   * ============================================================
   * ADMIN - FIND MANY FLASH SALES
   * ============================================================
   */

  static async findMany({
    skip = 0,
    take = 20,
    status,
    search,
  }: FindManyFlashSalesInput) {
    const where: Prisma.FlashSaleWhereInput = {
      deletedAt:
        null,
    };

    if (status) {
      where.status =
        status;
    }

    if (search?.trim()) {
      const keyword =
        search.trim();

      where.OR = [
        {
          name: {
            contains:
              keyword,

            mode:
              "insensitive",
          },
        },

        {
          slug: {
            contains:
              keyword,

            mode:
              "insensitive",
          },
        },
      ];
    }

    return prisma.flashSale.findMany({
      where,

      skip,

      take,

      orderBy: [
        {
          startAt:
            "desc",
        },

        {
          createdAt:
            "desc",
        },
      ],

      include: {
        _count: {
          select: {
            items:
              true,
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * ADMIN - COUNT FLASH SALES
   * ============================================================
   */

  static async count(
    {
      status,
      search,
    }: Omit<
      FindManyFlashSalesInput,
      "skip" | "take"
    > = {}
  ) {
    const where: Prisma.FlashSaleWhereInput = {
      deletedAt:
        null,
    };

    if (status) {
      where.status =
        status;
    }

    if (search?.trim()) {
      const keyword =
        search.trim();

      where.OR = [
        {
          name: {
            contains:
              keyword,

            mode:
              "insensitive",
          },
        },

        {
          slug: {
            contains:
              keyword,

            mode:
              "insensitive",
          },
        },
      ];
    }

    return prisma.flashSale.count({
      where,
    });
  }

  /**
 * ============================================================
 * ADMIN - FIND FLASH SALE BY ID
 * ============================================================
 */

static async findById(
  id: string
) {
  return prisma.flashSale.findFirst({
    where: {
      id,

      deletedAt:
        null,
    },

    include: {
      items: {
        orderBy: [
          {
            sortOrder:
              "asc",
          },

          {
            createdAt:
              "asc",
          },
        ],

        include: {
          product:
            true,

          sku: {
            include: {
              skuOptions: {
                include: {
                  variantOption: {
                    include: {
                      group:
                        true,
                    },
                  },
                },
              },
            },
          },

          _count: {
            select: {
              purchases:
                true,
            },
          },
        },
      },
    },
  });
}
  /**
   * ============================================================
   * ADMIN - FIND FLASH SALE BY SLUG
   * ============================================================
   */

  static async findBySlug(
    slug: string
  ) {
    return prisma.flashSale.findFirst({
      where: {
        slug,

        deletedAt:
          null,
      },
    });
  }

  /**
   * ============================================================
   * ADMIN - CREATE FLASH SALE
   * ============================================================
   */

  static async create(
    data: Prisma.FlashSaleCreateInput
  ) {
    return prisma.flashSale.create({
      data,
    });
  }

  /**
   * ============================================================
   * ADMIN - UPDATE FLASH SALE
   * ============================================================
   */

  static async update(
    id: string,
    data: Prisma.FlashSaleUpdateInput
  ) {
    return prisma.flashSale.update({
      where: {
        id,
      },

      data,
    });
  }

 /**
 * ============================================================
 * ADMIN - SOFT DELETE FLASH SALE
 * ============================================================
 *
 * Soft delete campaign sekaligus menonaktifkan seluruh item.
 *
 * Rules:
 * - Campaign menjadi CANCELLED
 * - Campaign diberi deletedAt
 * - Semua FlashSaleItem menjadi isActive=false
 *
 * Menggunakan transaction agar campaign dan item
 * tidak pernah berada dalam kondisi setengah berubah.
 */
static async softDelete(
  id: string
) {
  return prisma.$transaction(
    async (tx) => {
      const flashSale =
        await tx.flashSale.findFirst({
          where: {
            id,
            deletedAt: null,
          },

          select: {
            id: true,
          },
        });

      if (!flashSale) {
        throw new Error(
          "Flash Sale tidak ditemukan."
        );
      }

            /**
       * ========================================================
       * RELEASE FLASH SALE QUOTA
       * ========================================================
       *
       * Jika order menggunakan Flash Sale:
       *
       * - soldQuantity dikembalikan
       * - FlashSalePurchase dihapus
       * - perUserLimit otomatis kembali tersedia
       *
       * Semuanya masih berada dalam transaction yang sama.
       */

      await FlashSaleRepository.releasePurchasesByOrderId(
        tx,
        id
      );

      /**
        * --------------------------------------------------------
       * DEACTIVATE ALL ITEMS
       * --------------------------------------------------------
       */
      await tx.flashSaleItem.updateMany({
        where: {
          flashSaleId: id,
          isActive: true,
        },

        data: {
          isActive: false,
        },
      });

      /**
       * --------------------------------------------------------
       * CANCEL + SOFT DELETE CAMPAIGN
       * --------------------------------------------------------
       */

      return tx.flashSale.update({
        where: {
          id,
        },

        data: {
          status:
            FlashSaleStatus.CANCELLED,

          deletedAt: new Date(),
        },
      });
    }
  );
}

  /**
   * ============================================================
   * FLASH SALE ITEM - FIND MANY
   * ============================================================
   *
   * Mengambil seluruh item dalam satu campaign.
   */

  static async findItemsByFlashSaleId(
    flashSaleId: string
  ) {
    return prisma.flashSaleItem.findMany({
      where: {
        flashSaleId,
      },

      orderBy: [
        {
          sortOrder:
            "asc",
        },

        {
          createdAt:
            "asc",
        },
      ],

      include: {
        product:
          true,

        sku:
          true,

        _count: {
          select: {
            purchases:
              true,
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * FLASH SALE ITEM - FIND BY ID
   * ============================================================
   *
   * Mengambil satu item berdasarkan ID dan memastikan item
   * tersebut memang milik Flash Sale yang diminta.
   */

  static async findItemById(
    flashSaleId: string,
    itemId: string
  ) {
    return prisma.flashSaleItem.findFirst({
      where: {
        id:
          itemId,

        flashSaleId,
      },

      include: {
        flashSale:
          true,

        product:
          true,

        sku:
          true,

        _count: {
          select: {
            purchases:
              true,
          },
        },
      },
    });
  }

/**
 * ============================================================
 * FLASH SALE ITEM - FIND DUPLICATE
 * ============================================================
 *
 * Canonical uniqueness:
 *
 *   flashSaleId + skuId
 *
 * ProductId tetap digunakan sebagai filter tambahan untuk
 * memastikan SKU berasal dari product yang benar.
 *
 * Legacy weightOptionId sudah tidak digunakan dalam
 * duplicate protection.
 */
static async findDuplicateItem({
  flashSaleId,
  productId,
  skuId,
  excludeItemId,
}: {
  flashSaleId: string;
  productId: string;
  skuId: string;
  excludeItemId?: string;
}) {
  return prisma.flashSaleItem.findFirst({
    where: {
      flashSaleId,

      productId,

      skuId,

      ...(excludeItemId
        ? {
            id: {
              not: excludeItemId,
            },
          }
        : {}),
    },
  });
}

  /**
   * ============================================================
   * FLASH SALE ITEM - CREATE
   * ============================================================
   */

  static async createItem(
    data: Prisma.FlashSaleItemCreateInput
  ) {
    return prisma.flashSaleItem.create({
      data,

      include: {
        product:
          true,

        sku:
          true,
      },
    });
  }

  /**
   * ============================================================
   * FLASH SALE ITEM - UPDATE
   * ============================================================
   */

  static async updateItem(
    flashSaleId: string,
    itemId: string,
    data: Prisma.FlashSaleItemUpdateInput
  ) {
    return prisma.flashSaleItem.update({
      where: {
        id:
          itemId,
      },

      data,

      include: {
        product:
          true,

        sku:
          true,
      },
    });
  }

    /**
   * ============================================================
   * FLASH SALE PURCHASE - RELEASE BY ORDER
   * ============================================================
   *
   * Dipanggil ketika Order dibatalkan.
   *
   * Tujuan:
   *
   * 1. Mengembalikan quota Flash Sale.
   * 2. Menghapus reservation FlashSalePurchase.
   * 3. Membebaskan per-user limit.
   *
   * WAJIB menggunakan TransactionClient karena method ini
   * harus menjadi bagian dari transaction Order cancellation.
   *
   * Semua operasi bersifat atomic.
   */

  static async releasePurchasesByOrderId(
    tx: Prisma.TransactionClient,
    orderId: string
  ) {
    if (!orderId) {
      throw new Error(
        "Order ID wajib diisi."
      );
    }

    /**
     * ----------------------------------------------------------
     * FIND FLASH SALE PURCHASES
     * ----------------------------------------------------------
     */

    const purchases =
      await tx.flashSalePurchase.findMany({
        where: {
          orderId,
        },

        select: {
          id: true,

          flashSaleItemId: true,

          quantity: true,
        },
      });

    /**
     * ----------------------------------------------------------
     * NOTHING TO RELEASE
     * ----------------------------------------------------------
     */

    if (
      purchases.length === 0
    ) {
      return {
        releasedPurchases: 0,

        releasedQuantity: 0,
      };
    }

    let releasedQuantity = 0;

    /**
     * ----------------------------------------------------------
     * RELEASE EACH FLASH SALE PURCHASE
     * ----------------------------------------------------------
     */

    for (
      const purchase of purchases
    ) {
      if (
        purchase.quantity <= 0
      ) {
        throw new Error(
          "Quantity Flash Sale tidak valid."
        );
      }

      /**
       * --------------------------------------------------------
       * GUARDED SOLD QUANTITY DECREMENT
       * --------------------------------------------------------
       *
       * Jangan pernah membiarkan soldQuantity menjadi negatif.
       *
       * Karena operasi berada di transaction yang sama dengan
       * cancellation, kegagalan di sini akan menyebabkan seluruh
       * cancellation rollback.
       */

      const updated =
        await tx.flashSaleItem.updateMany({
          where: {
            id:
              purchase.flashSaleItemId,

            soldQuantity: {
              gte:
                purchase.quantity,
            },
          },

          data: {
            soldQuantity: {
              decrement:
                purchase.quantity,
            },
          },
        });

      if (
        updated.count !== 1
      ) {
        throw new Error(
          "Quota Flash Sale tidak dapat dikembalikan karena data sold quantity tidak konsisten."
        );
      }

      releasedQuantity +=
        purchase.quantity;
    }

    /**
     * ----------------------------------------------------------
     * DELETE FLASH SALE PURCHASE RESERVATIONS
     * ----------------------------------------------------------
     *
     * Order tetap menjadi histori transaksi.
     *
     * Yang dihapus hanya record konsumsi/reservasi Flash Sale
     * karena order sudah dibatalkan.
     */

    await tx.flashSalePurchase.deleteMany({
      where: {
        orderId,
      },
    });

    return {
      releasedPurchases:
        purchases.length,

      releasedQuantity,
    };
  }

  /**
   * ============================================================
   * FLASH SALE ITEM - DELETE
   * ============================================================
   *
   * Item dihapus dari campaign.
   *
   * FlashSalePurchase tetap aman karena item seharusnya sudah
   * tervalidasi sebelum proses delete dilakukan oleh service.
   */

  static async deleteItem(
    flashSaleId: string,
    itemId: string
  ) {
    return prisma.flashSaleItem.delete({
      where: {
        id:
          itemId,
      },
    });
  }
}
