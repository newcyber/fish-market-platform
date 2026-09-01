import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * ============================================================
 * PRODUCT FILTERS
 * ============================================================
 */

export interface ProductFilters {
  search?: string;

  /**
   * ============================================================
   * SINGLE CATEGORY
   * ============================================================
   *
   * Tetap dipertahankan agar compatibility dengan
   * fitur existing tidak rusak.
   */
  categoryId?: string;

  /**
   * ============================================================
   * MULTIPLE CATEGORIES
   * ============================================================
   *
   * Digunakan oleh shortcut kategori homepage.
   *
   * Contoh:
   *
   * Ikan Segar:
   * [
   *   categoryIdIkanLaut,
   *   categoryIdIkanAirTawar
   * ]
   */
  categoryIds?: string[];

  /**
   * ============================================================
   * PRODUCT DISCOUNT
   * ============================================================
   *
   * true = hanya produk yang sedang memiliki discount aktif.
   */
  discounted?: boolean;

  published?: boolean;

  featured?: boolean;
}

/**
 * ============================================================
 *
 * PRODUCT REPOSITORY
 *
 * ============================================================
 */

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
   *
   * Semua relasi product yang dibutuhkan oleh:
   *
   * - Product List
   * - Product Detail
   * - Product Admin
   * - Product Pricing
   *
   * weightVariantPrices penting untuk:
   *
   * Weight × Variant pricing matrix.
   */

  private static readonly productInclude = {
    category: true,

    images: {
      orderBy: {
        sortOrder: "asc" as const,
      },
    },

    variantGroups: {
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc" as const,
      },
      include: {
        options: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: "asc" as const,
          },
        },
      },
    },

    skus: {
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc" as const,
      },
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
  };

  /**
   * ============================================================
   * ADMIN PRODUCT INCLUDE
   * ============================================================
   *
   * Admin Edit Product harus dapat membaca option/SKU yang
   * sudah inactive agar history konfigurasi tidak hilang dari form.
   */

  private static readonly productAdminInclude = {
    category: true,

    images: {
      orderBy: {
        sortOrder: "asc" as const,
      },
    },

    variantGroups: {
      orderBy: {
        sortOrder: "asc" as const,
      },
      include: {
        options: {
          orderBy: {
            sortOrder: "asc" as const,
          },
        },
      },
    },

    skus: {
      orderBy: {
        createdAt: "asc" as const,
      },
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
  };

  /**
   * ============================================================
   * FIND MANY
   * ============================================================
   */

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
    categoryIds,
    discounted,
    published,
    featured,
  } = filters;

  /**
   * ==========================================================
   * CATEGORY FILTER
   * ==========================================================
   *
   * Priority:
   *
   * 1. categoryIds
   * 2. categoryId
   *
   * categoryIds digunakan untuk logical category homepage
   * seperti:
   *
   * ikan-segar
   * seafood
   */

  const categoryFilter =
    categoryIds &&
    categoryIds.length > 0
      ? {
          categoryId: {
            in: categoryIds,
          },
        }
      : categoryId
        ? {
            categoryId,
          }
        : {};

  /**
   * ==========================================================
   * DISCOUNT FILTER
   * ==========================================================
   *
   * Hanya menampilkan discount yang:
   *
   * - isDiscountActive = true
   * - jika startAt ada, sudah dimulai
   * - jika endAt ada, belum berakhir
   *
   * Waktu menggunakan database query berdasarkan NOW().
   */

  const discountFilter =
    discounted
      ? {
          isDiscountActive: true,

          AND: [
            {
              OR: [
                {
                  discountStartAt: null,
                },
                {
                  discountStartAt: {
                    lte: new Date(),
                  },
                },
              ],
            },

            {
              OR: [
                {
                  discountEndAt: null,
                },
                {
                  discountEndAt: {
                    gte: new Date(),
                  },
                },
              ],
            },
          ],
        }
      : {};

  return prisma.product.findMany({
    where: {
      deletedAt: null,

      /**
       * ========================================================
       * SEARCH
       * ========================================================
       */

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

              {
                skus: {
                  some: {
                    sku: {
                      contains: search,
                      mode: "insensitive",
                    },
                    isActive: true,
                  },
                },
              },
            ],
          }
        : {}),

      /**
       * ========================================================
       * CATEGORY
       * ========================================================
       */

      ...categoryFilter,

      /**
       * ========================================================
       * DISCOUNT
       * ========================================================
       */

      ...discountFilter,

      /**
       * ========================================================
       * PUBLISHED
       * ========================================================
       */

      ...(published !== undefined
        ? {
            isPublished: published,
          }
        : {}),

      /**
       * ========================================================
       * FEATURED
       * ========================================================
       */

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
   * FIND MANY PAGINATED
   * ============================================================
   *
   * Digunakan oleh public/mobile product listing.
   *
   * Berbeda dengan findMany():
   * - mendukung pagination
   * - count menggunakan filter yang sama
   * - tidak menggunakan productInclude lengkap
   *
   * ============================================================
   */
  static async findManyPaginated(
    filters: ProductFilters = {},
    page = 1,
    limit = 20
  ) {
    const {
      search,
      categoryId,
      categoryIds,
      discounted,
      published,
      featured,
    } = filters;

    const categoryFilter =
      categoryIds &&
      categoryIds.length > 0
        ? {
            categoryId: {
              in: categoryIds,
            },
          }
        : categoryId
          ? {
              categoryId,
            }
          : {};

    const discountFilter =
      discounted
        ? {
            isDiscountActive: true,

            AND: [
              {
                OR: [
                  {
                    discountStartAt: null,
                  },
                  {
                    discountStartAt: {
                      lte: new Date(),
                    },
                  },
                ],
              },
              {
                OR: [
                  {
                    discountEndAt: null,
                  },
                  {
                    discountEndAt: {
                      gte: new Date(),
                    },
                  },
                ],
              },
            ],
          }
        : {};

    const where = {
      deletedAt: null,

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                slug: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                sku: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                skus: {
                  some: {
                    sku: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                    isActive: true,
                  },
                },
              },
            ],
          }
        : {}),

      ...categoryFilter,

      ...discountFilter,

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
    };

    const safePage = Math.max(
      1,
      Math.floor(page)
    );

    const safeLimit = Math.min(
      50,
      Math.max(
        1,
        Math.floor(limit)
      )
    );

    const skip =
      (safePage - 1) * safeLimit;

    const [items, total] =
      await prisma.$transaction([
        prisma.product.findMany({
          where,

          include: {
            category: true,

            images: {
              orderBy: {
                sortOrder: "asc",
              },

              take: 1,
            },
          },

          orderBy: {
            createdAt: "desc",
          },

          skip,

          take: safeLimit,
        }),

        prisma.product.count({
          where,
        }),
      ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages:
        Math.ceil(
          total / safeLimit
        ),
    };
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
   *
   * Digunakan Product Detail:
   *
   * /product/[slug]
   *
   * Karena menggunakan productInclude,
   * variantGroups + active SKUs beserta SKU options ikut dikembalikan.
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
   * FIND PUBLISHED PRODUCT BY SLUG
   * ============================================================
   *
   * Digunakan oleh public/mobile product detail.
   *
   * Hanya product yang:
   * - belum dihapus
   * - sudah dipublish
   *
   * ============================================================
   */
  static async findPublishedBySlug(
    slug: string
  ) {
    return prisma.product.findFirst({
      where: {
        slug,
        deletedAt: null,
        isPublished: true,
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

    const count = await prisma.productSku.count({
      where: {
        sku,
        product: {
          deletedAt: null,
        },
      },
    });

    return count > 0;
  }

  /**
   * Check the legacy/product-level code stored on Product.sku.
   *
   * This is kept separately because Product.sku is still present
   * during the migration period, while ProductSku.sku is the
   * canonical inventory/transaction SKU.
   */
  static async existsByProductSku(
    sku: string
  ) {
    if (!sku) {
      return false;
    }

    const count = await prisma.product.count({
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
   * FIND BY ID FOR ADMIN
   * ============================================================
   *
   * Digunakan Edit Product. Tidak memfilter inactive group,
   * option, atau SKU karena data tersebut dapat tetap diperlukan
   * untuk sinkronisasi dan audit konfigurasi.
   */

  static async findByIdForAdmin(
    id: string
  ) {
    return prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      include:
        this.productAdminInclude,
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
    return prisma.$transaction(
      callback
    );
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

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default ProductRepository;
