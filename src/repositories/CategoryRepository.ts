import { prisma } from "@/lib/prisma";

export interface CategoryFilters {
  search?: string;
  active?: boolean;
  deleted?: boolean;
}

export class CategoryRepository {
  private static buildWhere(filters: CategoryFilters = {}) {
    const { search, active, deleted } = filters;

    return {
      deletedAt:
        deleted === true
          ? { not: null }
          : null,
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
            ],
          }
        : {}),
      ...(active !== undefined
        ? {
            isActive: active,
          }
        : {}),
    };
  }

  static async count() {
    return prisma.category.count({
      where: {
        deletedAt: null,
      },
    });
  }

  static async getActiveTotal() {
    return prisma.category.count({
      where: {
        deletedAt: null,
        isActive: true,
      },
    });
  }

  static async findMany(filters: CategoryFilters = {}) {
    return prisma.category.findMany({
      where: this.buildWhere(filters),
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

  static async findManyPaginated(
    filters: CategoryFilters = {},
    page = 1,
    limit = 20,
  ) {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(
      50,
      Math.max(1, Math.floor(limit)),
    );
    const skip = (safePage - 1) * safeLimit;
    const where = this.buildWhere(filters);

    const [items, total] = await prisma.$transaction([
      prisma.category.findMany({
        where,
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
        skip,
        take: safeLimit,
      }),
      prisma.category.count({
        where,
      }),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(
        1,
        Math.ceil(total / safeLimit),
      ),
    };
  }

  static async findById(id: string) {
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

  static async findBySlug(slug: string) {
    return prisma.category.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    });
  }

  static async existsBySlug(
  slug: string,
  ignoreId?: string,
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
        name: true,
        deletedAt: true,
      },
    });

  return Boolean(category);
}

  static async create(
    data: Parameters<
      typeof prisma.category.create
    >[0]["data"],
  ) {
    return prisma.category.create({
      data,
    });
  }

  static async update(
    id: string,
    data: Parameters<
      typeof prisma.category.update
    >[0]["data"],
  ) {
    return prisma.category.update({
      where: {
        id,
      },
      data,
    });
  }

  static async activate(id: string) {
    return prisma.category.update({
      where: {
        id,
      },
      data: {
        isActive: true,
      },
    });
  }

  static async deactivate(id: string) {
    return prisma.category.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  }

  static async findIdsByFilter(
    filters: CategoryFilters = {},
    excludedIds: string[] = [],
    limit = 5001,
  ) {
    const safeLimit = Math.min(5001, Math.max(1, Math.floor(limit)));

    return prisma.category.findMany({
      where: {
        ...this.buildWhere(filters),
        ...(excludedIds.length > 0
          ? {
              id: {
                notIn: excludedIds,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
        { id: "asc" },
      ],
      take: safeLimit,
    });
  }

  static async findManyWithProducts(
    options: {
      ids?: string[];
      filters?: CategoryFilters;
      excludedIds?: string[];
    } = {},
  ) {
    const ids = options.ids ?? [];
    const excludedIds =
      options.excludedIds ?? [];
    const filters = options.filters ?? {};

    return prisma.category.findMany({
      where: {
        ...this.buildWhere(filters),

        ...(ids.length > 0
          ? {
              id: {
                in: ids,
              },
            }
          : {}),

        ...(excludedIds.length > 0
          ? {
              id: {
                notIn: excludedIds,
              },
            }
          : {}),

        products: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  static async softDelete(id: string) {
    return prisma.category.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  static async restore(id: string) {
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
 * FIND DELETED CATEGORY BY ID
 * ==========================================================
 */
static async findDeletedById(
  id: string,
) {
  return prisma.category.findFirst({
    where: {
      id,
      deletedAt: {
        not: null,
      },
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
 * FIND DELETED CATEGORIES BY IDS
 * ==========================================================
 */
static async findDeletedByIds(ids: string[]) {
  if (ids.length === 0) return [];

  return prisma.category.findMany({
    where: {
      id: { in: ids },
      deletedAt: { not: null },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      deletedAt: true,
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
 * FIND SLUG IN ANY STATE
 * ==========================================================
 */
static async findBySlugAnyState(
  slug: string,
  ignoreId?: string,
) {
  return prisma.category.findFirst({
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
      name: true,
      slug: true,
      deletedAt: true,
    },
  });
}

/**
 * ==========================================================
 * PERMANENT DELETE
 * ==========================================================
 *
 * Hanya boleh menghapus kategori yang sudah soft-deleted.
 */
static async permanentDelete(
  id: string,
) {
  return prisma.category.deleteMany({
    where: {
      id,
      deletedAt: {
        not: null,
      },
    },
  });
}

  static async bulkUpdate(
    ids: string[],
    data: Parameters<
      typeof prisma.category.updateMany
    >[0]["data"],
  ) {
    if (ids.length === 0) {
      return {
        count: 0,
      };
    }

    return prisma.category.updateMany({
      where: {
        id: {
          in: ids,
        },
        deletedAt: null,
      },
      data,
    });
  }

  static async bulkUpdateByFilter(
    filters: CategoryFilters,
    excludedIds: string[],
    data: Parameters<
      typeof prisma.category.updateMany
    >[0]["data"],
  ) {
    return prisma.category.updateMany({
      where: {
        ...this.buildWhere(filters),

        ...(excludedIds.length > 0
          ? {
              id: {
                notIn: excludedIds,
              },
            }
          : {}),
      },
      data,
    });
  }

  static async move(
    id: string,
    direction: "up" | "down",
  ) {
    const current =
      await prisma.category.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: {
          id: true,
          sortOrder: true,
        },
      });

    if (!current) {
      throw new Error(
        "Kategori tidak ditemukan.",
      );
    }

    const neighbor =
      await prisma.category.findFirst({
        where:
          direction === "up"
            ? {
                deletedAt: null,
                sortOrder: {
                  lt: current.sortOrder,
                },
              }
            : {
                deletedAt: null,
                sortOrder: {
                  gt: current.sortOrder,
                },
              },
        select: {
          id: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder:
            direction === "up"
              ? "desc"
              : "asc",
        },
      });

    if (!neighbor) {
      return current;
    }

    return prisma.$transaction([
      prisma.category.update({
        where: {
          id: current.id,
        },
        data: {
          sortOrder:
            neighbor.sortOrder,
        },
      }),

      prisma.category.update({
        where: {
          id: neighbor.id,
        },
        data: {
          sortOrder:
            current.sortOrder,
        },
      }),
    ]);
  }
    static async setSortOrder(
    id: string,
    requestedSortOrder: number,
  ) {
    if (
      !Number.isInteger(
        requestedSortOrder,
      ) ||
      requestedSortOrder < 0
    ) {
      throw new Error(
        "Urutan kategori harus berupa bilangan bulat >= 0.",
      );
    }

    const categories =
      await prisma.category.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          sortOrder: true,
          name: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            name: "asc",
          },
          {
            id: "asc",
          },
        ],
      });

    const currentIndex =
      categories.findIndex(
        (category) =>
          category.id === id,
      );

    if (currentIndex === -1) {
      throw new Error(
        "Kategori tidak ditemukan.",
      );
    }

    const current =
      categories[currentIndex];

    const remaining =
      categories.filter(
        (category) =>
          category.id !== id,
      );

    const targetIndex = Math.min(
      requestedSortOrder,
      remaining.length,
    );

    remaining.splice(
      targetIndex,
      0,
      current,
    );

    return prisma.$transaction(
      async (tx) => {
        /*
         * Tahap 1:
         * Berikan temporary sortOrder negatif
         * agar tidak terjadi konflik apabila
         * ada nilai sortOrder yang sama.
         */
        await Promise.all(
          remaining.map(
            (category, index) =>
              tx.category.update({
                where: {
                  id: category.id,
                },
                data: {
                  sortOrder:
                    -(index + 1),
                },
              }),
          ),
        );

        /*
         * Tahap 2:
         * Normalisasi kembali menjadi:
         *
         * 0, 1, 2, 3, ...
         */
        await Promise.all(
          remaining.map(
            (category, index) =>
              tx.category.update({
                where: {
                  id: category.id,
                },
                data: {
                  sortOrder: index,
                },
              }),
          ),
        );

        return tx.category.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            sortOrder: true,
          },
        });
      },
    );
  }
}

export default CategoryRepository;