import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { ProductInventoryAvailabilityService } from "@/services/product/product-inventory-availability.service";

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

  /**
   * Admin stock filter:
   * - available = stock > 5
   * - low = stock 1..5
   * - out = stock = 0
   */
  stock?: "available" | "low" | "out";
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

    inventoryPools: {
      select: {
        id: true,
        sizeVariantOptionId: true,
        stockGrams: true,
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
   * FIND ALL CATEGORIES
   * ============================================================
   *
   * Digunakan oleh admin product filter.
   * Hanya mengambil kategori yang masih digunakan oleh produk aktif.
   */
  static async findAllCategories() {
    return prisma.category.findMany({
      where: {
        products: {
          some: {
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

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
    stock,
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

  const stockFilter =
    stock === "available"
      ? { stock: { gt: 5 } }
      : stock === "low"
        ? { stock: { gt: 0, lte: 5 } }
        : stock === "out"
          ? { stock: 0 }
          : {};

  return prisma.product.findMany({
    where: {
      deletedAt: null,

      ...stockFilter,

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
   * BUILD FILTERED WHERE FOR ADMIN OPERATIONS
   * ============================================================
   */
  private static buildFilteredWhere(
    filters: ProductFilters = {},
    extraWhere: Prisma.ProductWhereInput = {}
  ): Prisma.ProductWhereInput {
    const {
      search,
      categoryId,
      categoryIds,
      discounted,
      published,
      featured,
      stock,
    } = filters;

    const categoryFilter: Prisma.ProductWhereInput =
      categoryIds && categoryIds.length > 0
        ? { categoryId: { in: categoryIds } }
        : categoryId
          ? { categoryId }
          : {};

    const discountFilter: Prisma.ProductWhereInput = discounted
      ? {
          isDiscountActive: true,
          AND: [
            {
              OR: [
                { discountStartAt: null },
                { discountStartAt: { lte: new Date() } },
              ],
            },
            {
              OR: [
                { discountEndAt: null },
                { discountEndAt: { gte: new Date() } },
              ],
            },
          ],
        }
      : {};

    const stockFilter: Prisma.ProductWhereInput =
      stock === "available"
        ? { stock: { gt: 5 } }
        : stock === "low"
          ? { stock: { gt: 0, lte: 5 } }
          : stock === "out"
            ? { stock: 0 }
            : {};

    return {
      deletedAt: null,
      ...stockFilter,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
              {
                skus: {
                  some: {
                    sku: { contains: search, mode: "insensitive" },
                    isActive: true,
                  },
                },
              },
            ],
          }
        : {}),
      ...categoryFilter,
      ...discountFilter,
      ...(published !== undefined ? { isPublished: published } : {}),
      ...(featured !== undefined ? { featured } : {}),
      ...extraWhere,
    };
  }

  /**
   * ============================================================
   * FIND MANY ADMIN PAGINATED
   * ============================================================
   *
   * Admin membutuhkan include lengkap karena tabel menampilkan
   * gambar, SKU, variant options, harga, dan stok.
   */
  /**
   * ============================================================
   * FIND PRODUCT IDS BY ADMIN STOCK AVAILABILITY
   * ============================================================
   *
   * Stock filter tidak boleh menggunakan Product.stock untuk
   * pool-backed product karena physical inventory adalah source
   * of truth.
   *
   * Availability dihitung melalui service canonical agar aturan
   * legacy vs physical pool tetap identik dengan customer flow.
   *
   * Product-level semantics:
   * - legacy      = jumlah availability seluruh active SKU
   * - pool-backed = availability maksimum dari SKU yang memakai
   *                 pool, karena beberapa weight SKU dapat berbagi
   *                 physical pool dan tidak boleh dijumlahkan ganda.
   */
  private static async findProductIdsByAdminStockAvailability(
    stock: NonNullable<ProductFilters["stock"]>,
  ): Promise<string[]> {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        skus: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
          },
        },
      },
    });

    const skuIds = products.flatMap((product) =>
      product.skus.map((sku) => sku.id),
    );

    const availabilities =
      await ProductInventoryAvailabilityService.getSkuAvailabilities(
        skuIds,
      );

    const byProduct = new Map<
      string,
      typeof availabilities
    >();

    for (const availability of availabilities) {
      const current =
        byProduct.get(availability.productId) ?? [];

      current.push(availability);
      byProduct.set(
        availability.productId,
        current,
      );
    }

    const matches: string[] = [];

    for (const product of products) {
      const productAvailabilities =
        byProduct.get(product.id) ?? [];

      const usesPhysicalPool =
        productAvailabilities.some(
          (item) => item.usesPhysicalPool,
        );

      const availableQuantity = usesPhysicalPool
        ? productAvailabilities.reduce(
            (max, item) =>
              Math.max(
                max,
                item.availableQuantity,
              ),
            0,
          )
        : productAvailabilities.reduce(
            (sum, item) =>
              sum + item.availableQuantity,
            0,
          );

      const matchesStock =
        stock === "available"
          ? availableQuantity > 5
          : stock === "low"
            ? availableQuantity > 0 &&
              availableQuantity <= 5
            : availableQuantity === 0;

      if (matchesStock) {
        matches.push(product.id);
      }
    }

    return matches;
  }

  static async findManyAdminPaginated(
    filters: ProductFilters = {},
    page = 1,
    limit = 20
  ) {
    const stockMatchedIds =
      filters.stock
        ? await this.findProductIdsByAdminStockAvailability(
            filters.stock,
          )
        : null;

    const where = this.buildFilteredWhere(
      {
        ...filters,
        stock: undefined,
      },
      stockMatchedIds
        ? {
            id: {
              in: stockMatchedIds,
            },
          }
        : {},
    );

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: this.productInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * ============================================================
   * BULK ACTION BY IDS
   * ============================================================
   */
  static async bulkActionByIds(
    ids: string[],
    action: "publish" | "unpublish" | "delete"
  ) {
    const normalizedIds = [
      ...new Set(
        ids
          .filter((id): id is string => typeof id === "string")
          .map((id) => id.trim())
          .filter(Boolean)
      ),
    ];

    if (normalizedIds.length === 0) {
      return { count: 0 };
    }

    const where: Prisma.ProductWhereInput = {
      id: { in: normalizedIds },
      deletedAt: null,
    };

    if (action === "delete") {
      return prisma.product.updateMany({
        where,
        data: { deletedAt: new Date() },
      });
    }

    return prisma.product.updateMany({
      where,
      data: { isPublished: action === "publish" },
    });
  }

  /**
   * ============================================================
   * BULK ACTION BY FILTER
   * ============================================================
   *
   * Digunakan saat admin memilih seluruh hasil filter lintas halaman.
   * Operasi dilakukan langsung di database sehingga tidak perlu
   * mengirim seluruh ID produk ke browser/server action.
   */
  static async bulkActionByFilter(
    filters: ProductFilters,
    action: "publish" | "unpublish" | "delete",
    excludedIds: string[] = []
  ) {
    const normalizedExcludedIds = [
      ...new Set(
        excludedIds
          .filter((id): id is string => typeof id === "string")
          .map((id) => id.trim())
          .filter(Boolean)
      ),
    ];

    const stockMatchedIds =
      filters.stock
        ? await this.findProductIdsByAdminStockAvailability(
            filters.stock,
          )
        : null;

    const where = this.buildFilteredWhere(
      {
        ...filters,
        stock: undefined,
      },
      normalizedExcludedIds.length > 0
        ? {
            id: {
              ...(stockMatchedIds
                ? {
                    in: stockMatchedIds,
                  }
                : {}),
              notIn: normalizedExcludedIds,
            },
          }
        : stockMatchedIds
          ? {
              id: {
                in: stockMatchedIds,
              },
            }
          : {},
    );

    if (action === "delete") {
      return prisma.product.updateMany({
        where,
        data: { deletedAt: new Date() },
      });
    }

    return prisma.product.updateMany({
      where,
      data: {
        isPublished: action === "publish",
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
      stock,
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

    const stockFilter =
      stock === "available"
        ? { stock: { gt: 5 } }
        : stock === "low"
          ? { stock: { gt: 0, lte: 5 } }
          : stock === "out"
            ? { stock: 0 }
            : {};

    const where = {
      deletedAt: null,

      ...stockFilter,

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

  skus: {
    where: {
      isActive: true,
    },

    select: {
      id: true,
      price: true,
      stock: true,
    },

    orderBy: {
      price: "asc",
    },
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
   * FIND PUBLISHED PRODUCTS FOR SITEMAP
   * ============================================================
   *
   * Digunakan khusus oleh sitemap publik.
   *
   * Hanya mengambil field yang dibutuhkan sitemap:
   * - slug
   * - updatedAt
   *
   * Tidak menggunakan productInclude agar query tetap ringan.
   *
   * Hanya product yang:
   * - belum dihapus
   * - sudah dipublish
   *
   * ============================================================
   */
  static async findPublishedForSitemap() {
    return prisma.product.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
      },
      select: {
        slug: true,
        updatedAt: true,
        images: {
          orderBy: [
            { isThumbnail: "desc" },
            { sortOrder: "asc" },
          ],
          take: 1,
          select: {
            image: true,
            mediaType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
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
