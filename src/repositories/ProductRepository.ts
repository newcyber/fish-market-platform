import { prisma } from "@/lib/prisma";

import { Prisma } from "@prisma/client";

export interface ProductFilters {
  search?: string;

  categoryId?: string;

  published?: boolean;

  featured?: boolean;
}

export class ProductRepository {
  /**
   * ============================================================
   * TOTAL PRODUCTS
   * ============================================================
   */

  static async getTotal() {
    return prisma.product.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
   * ============================================================
   * TOTAL PUBLISHED PRODUCTS
   * ============================================================
   */

  static async getPublishedTotal() {
    return prisma.product.count({
      where: {
        deletedAt: null,

        isPublished: true,
      },
    });
  }

  /**
   * ============================================================
   * TOTAL FEATURED PRODUCTS
   * ============================================================
   */

  static async getFeaturedTotal() {
    return prisma.product.count({
      where: {
        deletedAt: null,

        featured: true,
      },
    });
  }

  /**
   * ============================================================
   * PRODUCT INCLUDE
   * ============================================================
   */

  private static readonly productInclude = {
  category: true,

  images: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },

  variantOptions: {
    where: {
      isActive: true,
    },

    orderBy: {
      sortOrder: "asc" as const,
    },
  },

  weightOptions: {
    where: {
      isActive: true,
    },

    orderBy: {
      sortOrder: "asc" as const,
    },
  },

  weightVariantPrices: {
    include: {
      weightOption: {
        select: {
          id: true,
          label: true,
        },
      },

      variantOption: {
        select: {
          id: true,
          label: true,
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

  static async findMany(
    filters: ProductFilters = {}
  ) {
    const {
      search,
      categoryId,
      published,
      featured,
    } = filters;

    return prisma.product.findMany({
      where: {
        deletedAt: null,

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

                {
                  sku: {
                    contains: search,

                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),

        ...(categoryId
          ? {
              categoryId,
            }
          : {}),

        ...(published !== undefined
          ? {
              isPublished: published,
            }
          : {}),

        ...(featured !== undefined
          ? {
              featured,
            }
          : {}),
      },

      include:
        this.productInclude,

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * ============================================================
   * FIND LATEST
   * ============================================================
   */

  static async findLatest(
    limit = 10
  ) {
    return prisma.product.findMany({
      take: limit,

      where: {
        deletedAt: null,
      },

      include:
        this.productInclude,

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * ============================================================
   * FIND FEATURED
   * ============================================================
   */

  static async findFeatured(
    limit = 8
  ) {
    return prisma.product.findMany({
      take: limit,

      where: {
        deletedAt: null,

        isPublished: true,

        featured: true,
      },

      include:
        this.productInclude,

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * ============================================================
   * FIND BY SLUG
   * ============================================================
   */

  static async findBySlug(
    slug: string
  ) {
    return prisma.product.findFirst({
      where: {
        slug,

        deletedAt: null,
      },

      include:
        this.productInclude,
    });
  }

  /**
   * ============================================================
   * CHECK SLUG
   * ============================================================
   */

  static async existsBySlug(
    slug: string
  ) {
    const count =
      await prisma.product.count({
        where: {
          slug,

          deletedAt: null,
        },
      });

    return count > 0;
  }

  /**
   * ============================================================
   * CHECK SKU
   * ============================================================
   */

  static async existsBySku(
    sku: string
  ) {
    if (!sku) {
      return false;
    }

    const count =
      await prisma.product.count({
        where: {
          sku,

          deletedAt: null,
        },
      });

    return count > 0;
  }

  /**
   * ============================================================
   * FIND BY ID
   * ============================================================
   */

  static async findById(
    id: string
  ) {
    return prisma.product.findFirst({
      where: {
        id,

        deletedAt: null,
      },

      include:
        this.productInclude,
    });
  }

  /**
   * ============================================================
   * CREATE PRODUCT
   * ============================================================
   */

  static async create(
    data: Parameters<
      typeof prisma.product.create
    >[0]["data"]
  ) {
    return prisma.product.create({
      data,

      include:
        this.productInclude,
    });
  }

  /**
   * ============================================================
   * UPDATE PRODUCT
   * ============================================================
   */

  static async update(
    id: string,

    data: Parameters<
      typeof prisma.product.update
    >[0]["data"]
  ) {
    return prisma.product.update({
      where: {
        id,
      },

      data,

      include:
        this.productInclude,
    });
  }

  /**
   * ============================================================
   * TRANSACTION
   * ============================================================
   */

  static async transaction<T>(
    callback: (
      tx: Prisma.TransactionClient
    ) => Promise<T>
  ) {
    return prisma.$transaction(callback);
  }

  /**
   * ============================================================
   * SOFT DELETE PRODUCT
   * ============================================================
   */

  static async softDelete(
    id: string
  ) {
    return prisma.product.update({
      where: {
        id,
      },

      data: {
        deletedAt:
          new Date(),
      },
    });
  }

  /**
   * ============================================================
   * RESTORE PRODUCT
   * ============================================================
   */

  static async restore(
    id: string
  ) {
    return prisma.product.update({
      where: {
        id,
      },

      data: {
        deletedAt: null,
      },
    });
  }
}

export default ProductRepository;