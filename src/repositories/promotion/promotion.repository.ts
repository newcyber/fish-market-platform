import {
  Prisma,
  PromotionStatus,
  PromotionType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface FindManyPromotionsInput {
  skip?: number;
  take?: number;
  status?: PromotionStatus;
  search?: string;
}

export interface CreatePromotionInput {
  name: string;
  slug: string;
  description?: string | null;
  banner?: string | null;
  status?: PromotionStatus;
  startAt?: Date | null;
  endAt?: Date | null;
  type: Prisma.PromotionCreateInput["type"];
  discountType?: Prisma.PromotionCreateInput["discountType"];
  discountValue?: Prisma.PromotionCreateInput["discountValue"];
  sortOrder?: number;
  isFeatured?: boolean;
}

export interface UpdatePromotionInput {
  name?: string;
  slug?: string;
  description?: string | null;
  banner?: string | null;
  status?: PromotionStatus;
  startAt?: Date | null;
  endAt?: Date | null;
  type?: Prisma.PromotionUpdateInput["type"];
  discountType?: Prisma.PromotionUpdateInput["discountType"];
  discountValue?: Prisma.PromotionUpdateInput["discountValue"];
  sortOrder?: number;
  isFeatured?: boolean;
}

export default class PromotionRepository {
  /**
   * ============================================================
   * PROMOTION INCLUDE
   * ============================================================
   *
   * SKU menjadi canonical target Promotion.
   */
  private static readonly promotionInclude = {
    items: {
      include: {
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
      orderBy: {
        createdAt: "asc" as const,
      },
    },
  };

  /**
   * ============================================================
   * FIND MANY
   * ============================================================
   */
  static async findMany({
    skip = 0,
    take = 20,
    status,
    search,
  }: FindManyPromotionsInput = {}) {
    const where: Prisma.PromotionWhereInput = {
      deletedAt: null,

      ...(status ? { status } : {}),

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                slug: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        skip,
        take,
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
        include: this.promotionInclude,
      }),

      prisma.promotion.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  /**
   * ============================================================
   * FIND BY ID
   * ============================================================
   */
  static async findById(id: string) {
    return prisma.promotion.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: this.promotionInclude,
    });
  }

  /**
   * ============================================================
   * FIND BY SLUG
   * ============================================================
   */
  static async findBySlug(slug: string) {
    return prisma.promotion.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: this.promotionInclude,
    });
  }

  /**
   * ============================================================
   * FIND ACTIVE
   * ============================================================
   *
   * Active secara bisnis:
   *
   * - status ACTIVE
   * - belum soft deleted
   * - startAt null atau sudah dimulai
   * - endAt null atau belum berakhir
   */
  static async findActive(now = new Date()) {
    return prisma.promotion.findMany({
      where: {
        status: PromotionStatus.ACTIVE,
        deletedAt: null,

        AND: [
          {
            OR: [
              {
                startAt: null,
              },
              {
                startAt: {
                  lte: now,
                },
              },
            ],
          },

          {
            OR: [
              {
                endAt: null,
              },
              {
                endAt: {
                  gt: now,
                },
              },
            ],
          },
        ],
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          isFeatured: "desc",
        },
        {
          startAt: "desc",
        },
      ],

      include: this.promotionInclude,
    });
  }

    /**
   * ============================================================
   * ASSERT NO PRICE DISCOUNT CONFLICT
   * ============================================================
   *
   * Memastikan SKU tidak digunakan oleh promotion
   * PRICE_DISCOUNT lain pada periode yang overlap.
   *
   * Hanya PRICE_DISCOUNT yang diperiksa.
   * MARKETING tidak mempengaruhi harga sehingga tidak conflict.
   */
  private static async assertNoPriceDiscountConflict(
    promotionId: string,
    skuIds: string[],
    startAt: Date | null,
    endAt: Date | null
  ) {
    if (
      skuIds.length === 0
    ) {
      return;
    }

    /**
     * Conflict hanya relevan untuk PRICE_DISCOUNT.
     *
     * Promotion ID digunakan untuk mengambil promotion
     * yang sedang diperiksa.
     */
    const promotion =
      await PromotionRepository.findById(
        promotionId
      );

    if (!promotion) {
      throw new Error(
        "Promotion tidak ditemukan."
      );
    }

    if (
      promotion.type !==
      PromotionType.PRICE_DISCOUNT
    ) {
      return;
    }

    /**
     * Hilangkan duplicate SKU agar query
     * tidak dilakukan berulang.
     */
    const uniqueSkuIds = [
      ...new Set(skuIds),
    ];

    for (
      const skuId of uniqueSkuIds
    ) {
      const conflicts =
        await PromotionRepository.findPriceDiscountConflictsForSku(
          skuId,
          startAt,
          endAt,
          promotionId
        );

      if (
        conflicts.length > 0
      ) {
        const conflict =
          conflicts[0];

        throw new Error(
          `SKU ${skuId} sudah digunakan oleh promotion PRICE_DISCOUNT "${conflict.name}" pada periode yang beririsan.`
        );
      }
    }
  }

  /**
   * ============================================================
   * CREATE
   * ============================================================
   */
  static async create(
    data: CreatePromotionInput,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;

    return client.promotion.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        banner: data.banner ?? null,
        status:
          data.status ?? PromotionStatus.DRAFT,
        startAt: data.startAt ?? null,
        endAt: data.endAt ?? null,
        type: data.type,
        discountType:
          data.discountType ?? null,
        discountValue:
          data.discountValue ?? null,
        sortOrder:
          data.sortOrder ?? 0,
        isFeatured:
          data.isFeatured ?? false,
      },

      include: this.promotionInclude,
    });
  }

  /**
   * ============================================================
   * UPDATE
   * ============================================================
   */
  static async update(
    id: string,
    data: UpdatePromotionInput,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;

    return client.promotion.update({
      where: {
        id,
      },

      data: {
        ...(data.name !== undefined
          ? { name: data.name }
          : {}),

        ...(data.slug !== undefined
          ? { slug: data.slug }
          : {}),

        ...(data.description !== undefined
          ? {
              description:
                data.description,
            }
          : {}),

        ...(data.banner !== undefined
          ? { banner: data.banner }
          : {}),

        ...(data.status !== undefined
          ? { status: data.status }
          : {}),

        ...(data.startAt !== undefined
          ? {
              startAt: data.startAt,
            }
          : {}),

        ...(data.endAt !== undefined
          ? {
              endAt: data.endAt,
            }
          : {}),

        ...(data.type !== undefined
          ? { type: data.type }
          : {}),

        ...(data.discountType !== undefined
          ? {
              discountType:
                data.discountType,
            }
          : {}),

        ...(data.discountValue !== undefined
          ? {
              discountValue:
                data.discountValue,
            }
          : {}),

        ...(data.sortOrder !== undefined
          ? {
              sortOrder:
                data.sortOrder,
            }
          : {}),

        ...(data.isFeatured !== undefined
          ? {
              isFeatured:
                data.isFeatured,
            }
          : {}),
      },

      include: this.promotionInclude,
    });
  }

  /**
   * ============================================================
   * SOFT DELETE
   * ============================================================
   */
  static async softDelete(
    id: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;

    return client.promotion.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
        status: PromotionStatus.CANCELLED,
      },
    });
  }

  /**
   * ============================================================
   * FIND PRICE DISCOUNT CONFLICTS FOR SKU
   * ============================================================
   *
   * Mencari PRICE_DISCOUNT lain yang:
   *
   * - belum soft deleted
   * - status SCHEDULED atau ACTIVE
   * - memiliki SKU yang sama
   * - periodenya overlap
   *
   * MARKETING tidak dianggap conflict karena tidak mengubah harga.
   */
  static async findPriceDiscountConflictsForSku(
    skuId: string,
    startAt: Date | null,
    endAt: Date | null,
    excludePromotionId?: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;

    return client.promotion.findMany({
      where: {
        deletedAt: null,

        type: PromotionType.PRICE_DISCOUNT,

        status: {
          in: [
            PromotionStatus.SCHEDULED,
            PromotionStatus.ACTIVE,
          ],
        },

        items: {
          some: {
            skuId,
          },
        },

        ...(excludePromotionId
          ? {
              id: {
                not: excludePromotionId,
              },
            }
          : {}),

        AND: [
          /**
           * Existing promotion harus dimulai
           * sebelum proposed promotion berakhir.
           *
           * Jika proposed endAt null,
           * tidak ada batas akhir.
           */
          ...(endAt !== null
            ? [
                {
                  OR: [
                    {
                      startAt: null,
                    },
                    {
                      startAt: {
                        lt: endAt,
                      },
                    },
                  ],
                },
              ]
            : []),

          /**
           * Existing promotion harus berakhir
           * setelah proposed promotion dimulai.
           *
           * Jika existing endAt null,
           * dianggap tidak terbatas.
           */
          ...(startAt !== null
            ? [
                {
                  OR: [
                    {
                      endAt: null,
                    },
                    {
                      endAt: {
                        gt: startAt,
                      },
                    },
                  ],
                },
              ]
            : []),
        ],
      },

      orderBy: [
        {
          startAt: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

   /**
   * ============================================================
   * ADD SKU
   * ============================================================
   */
  static async addSku(
    promotionId: string,
    skuId: string,
    tx?: Prisma.TransactionClient
  ): Promise<
    Prisma.PromotionItemGetPayload<{
      include: {
        sku: true;
      };
    }>
  > {
    const client = tx ?? prisma;

    return client.promotionItem.create({
      data: {
        promotionId,
        skuId,
      },
      include: {
        sku: true,
      },
    });
  }

  /**
   * ============================================================
   * REMOVE SKU
   * ============================================================
   */
  static async removeSku(
    promotionId: string,
    skuId: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;

    return client.promotionItem.delete({
      where: {
        promotionId_skuId: {
          promotionId,
          skuId,
        },
      },
    });
  }
}