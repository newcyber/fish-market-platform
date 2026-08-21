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

  weightOptionId?: string | null;

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
      weightOptionId,
      now = new Date(),
    }: FindActiveFlashSaleItemInput
  ) {
    const commonWhere = {
      productId,

      isActive: true,

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
     * WEIGHT-SPECIFIC FLASH SALE
     * ==========================================================
     */

    if (weightOptionId) {
      const weightSpecificItem =
        await tx.flashSaleItem.findFirst({
          where: {
            ...commonWhere,

            weightOptionId,
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

      if (weightSpecificItem) {
        return weightSpecificItem;
      }
    }

    /**
     * ==========================================================
     * PRIORITY 2
     * PRODUCT-WIDE FLASH SALE
     * ==========================================================
     */

    return tx.flashSaleItem.findFirst({
      where: {
        ...commonWhere,

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
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search?.trim()) {
      const keyword = search.trim();

      where.OR = [
        {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
        },

        {
          slug: {
            contains: keyword,
            mode: "insensitive",
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
          startAt: "desc",
        },

        {
          createdAt: "desc",
        },
      ],

      include: {
        _count: {
          select: {
            items: true,
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
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search?.trim()) {
      const keyword = search.trim();

      where.OR = [
        {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
        },

        {
          slug: {
            contains: keyword,
            mode: "insensitive",
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

        deletedAt: null,
      },

      include: {
        items: {
          orderBy: [
            {
              sortOrder: "asc",
            },

            {
              createdAt: "asc",
            },
          ],

          include: {
            product: true,

            weightOption: true,

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
   * ADMIN - FIND FLASH SALE BY SLUG
   * ============================================================
   */

  static async findBySlug(
    slug: string
  ) {
    return prisma.flashSale.findFirst({
      where: {
        slug,

        deletedAt: null,
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
   */

  static async softDelete(
    id: string
  ) {
    return prisma.flashSale.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
      },
    });
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
          sortOrder: "asc",
        },

        {
          createdAt: "asc",
        },
      ],

      include: {
        product: true,

        weightOption: true,

        _count: {
          select: {
            purchases: true,
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
        id: itemId,

        flashSaleId,
      },

      include: {
        flashSale: true,

        product: true,

        weightOption: true,

        _count: {
          select: {
            purchases: true,
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
   * Mencegah produk / weight option yang sama dimasukkan
   * lebih dari satu kali ke campaign yang sama.
   */

  static async findDuplicateItem({
    flashSaleId,
    productId,
    weightOptionId,
    excludeItemId,
  }: {
    flashSaleId: string;

    productId: string;

    weightOptionId?: string | null;

    excludeItemId?: string;
  }) {
    return prisma.flashSaleItem.findFirst({
      where: {
        flashSaleId,

        productId,

        weightOptionId:
          weightOptionId ?? null,

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
        product: true,

        weightOption: true,
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
        id: itemId,
      },

      data,

      include: {
        product: true,

        weightOption: true,
      },
    });
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
        id: itemId,
      },
    });
  }
}