import { prisma } from "@/lib/prisma";

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  published?: boolean;
  featured?: boolean;
}

export class ProductRepository {
  /**
   * Total produk aktif (belum dihapus).
   */
  static async getTotal() {
    return prisma.product.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
   * Total produk yang dipublikasikan.
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
   * Total produk unggulan.
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
   * Daftar produk (Admin).
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

      include: {
        category: true,

        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Mengambil produk terbaru.
   */
  static async findLatest(limit = 10) {
    return prisma.product.findMany({
      take: limit,

      where: {
        deletedAt: null,
      },

      include: {
        category: true,

        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Mengambil produk unggulan.
   */
  static async findFeatured(limit = 8) {
    return prisma.product.findMany({
      take: limit,

      where: {
        deletedAt: null,
        isPublished: true,
        featured: true,
      },

      include: {
        category: true,

        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Mengambil produk berdasarkan slug.
   */
  static async findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: {
        slug,
        deletedAt: null,
      },

      include: {
        category: true,

        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });
  }

  /**
   * Mengecek slug sudah digunakan.
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
   * Mengecek SKU sudah digunakan.
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
   * Mengambil produk berdasarkan ID.
   */
  static async findById(id: string) {
    return prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      include: {
        category: true,

        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });
  }

  /**
   * Membuat produk baru.
   */
  static async create(
    data: Parameters<
      typeof prisma.product.create
    >[0]["data"]
  ) {
    return prisma.product.create({
      data,
    });
  }

  /**
   * Update produk.
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
    });
  }

  /**
   * Soft delete produk.
   */
  static async softDelete(
    id: string
  ) {
    return prisma.product.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Restore produk.
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