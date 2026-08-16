import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * CATEGORY FILTERS
 * ============================================================
 */

export interface CategoryFilters {
  search?: string;

  /**
   * true  = kategori aktif
   * false = kategori nonaktif
   */
  active?: boolean;
}

/**
 * ============================================================
 * CATEGORY REPOSITORY
 * ============================================================
 */

export class CategoryRepository {
  /**
   * ==========================================================
   * FIND MANY
   * ==========================================================
   */

  static async findMany(
    filters: CategoryFilters = {}
  ) {
    const {
      search,
      active,
    } = filters;

    return prisma.category.findMany({
      where: {
        /**
         * Soft delete protection
         */
        deletedAt: null,

        /**
         * Status filter
         */
        ...(active !== undefined
          ? {
              isActive: active,
            }
          : {}),

        /**
         * Search filter
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
              ],
            }
          : {}),
      },

      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    });
  }

  /**
   * ==========================================================
   * FIND ALL ACTIVE
   * ==========================================================
   */

  static async findAllActive() {
    return prisma.category.findMany({
      where: {
        deletedAt: null,

        isActive: true,
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    });
  }

  /**
   * ==========================================================
   * FIND BY ID
   * ==========================================================
   */

  static async findById(
    id: string
  ) {
    return prisma.category.findFirst({
      where: {
        id,

        deletedAt: null,
      },

      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  /**
   * ==========================================================
   * FIND BY SLUG
   * ==========================================================
   */

  static async findBySlug(
    slug: string
  ) {
    return prisma.category.findFirst({
      where: {
        slug,

        deletedAt: null,
      },
    });
  }

  /**
   * ==========================================================
   * CREATE
   * ==========================================================
   */

  static async create(
    data: {
      name: string;
      slug: string;
      image?: string | null;
      description?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.category.create({
      data: {
        name: data.name,

        slug: data.slug,

        image:
          data.image ??
          null,

        description:
          data.description ??
          null,

        sortOrder:
          data.sortOrder ??
          0,

        isActive:
          data.isActive ??
          true,
      },
    });
  }

  /**
   * ==========================================================
   * UPDATE
   * ==========================================================
   */

  static async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      image?: string | null;
      description?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.category.update({
      where: {
        id,
      },

      data: {
        ...(data.name !== undefined
          ? {
              name: data.name,
            }
          : {}),

        ...(data.slug !== undefined
          ? {
              slug: data.slug,
            }
          : {}),

        ...(data.image !== undefined
          ? {
              image: data.image,
            }
          : {}),

        ...(data.description !== undefined
          ? {
              description:
                data.description,
            }
          : {}),

        ...(data.sortOrder !== undefined
          ? {
              sortOrder:
                data.sortOrder,
            }
          : {}),

        ...(data.isActive !== undefined
          ? {
              isActive:
                data.isActive,
            }
          : {}),
      },
    });
  }

  /**
 * ==========================================================
 * SOFT DELETE
 * ==========================================================
 */

static async softDelete(
  id: string
) {
  return prisma.category.update({
    where: {
      id,
    },

    data: {
      deletedAt: new Date(),
    },
  });
}

/**
 * ==========================================================
 * RESTORE CATEGORY
 * ==========================================================
 *
 * Mengembalikan kategori yang sebelumnya di-soft delete.
 */

static async restore(
  id: string
) {
  return prisma.category.update({
    where: {
      id,
    },

    data: {
      deletedAt: null,
    },
  });
}

/**
 * ==========================================================
 * ACTIVATE CATEGORY
 * ==========================================================
 */

static async activate(
  id: string
) {
  return prisma.category.update({
    where: {
      id,
    },

    data: {
      isActive: true,
    },
  });
}

/**
 * ==========================================================
 * DEACTIVATE CATEGORY
 * ==========================================================
 */

static async deactivate(
  id: string
) {
  return prisma.category.update({
    where: {
      id,
    },

    data: {
      isActive: false,
    },
  });
}

  /**
   * ==========================================================
   * COUNT
   * ==========================================================
   */

  static async count() {
    return prisma.category.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
 * ==========================================================
 * CHECK SLUG EXISTS
 * ==========================================================
 *
 * Mengecek apakah slug kategori sudah digunakan.
 *
 * ignoreId digunakan saat update kategori agar kategori
 * yang sedang diedit tidak dianggap duplikat dengan dirinya sendiri.
 */

static async existsBySlug(
  slug: string,
  ignoreId?: string
) {
  const category =
    await prisma.category.findFirst({
      where: {
        slug,

        ...(ignoreId
          ? {
              id: {
                not: ignoreId,
              },
            }
          : {}),
      },

      select: {
        id: true,
      },
    });

  return Boolean(category);
}

}

export default CategoryRepository;