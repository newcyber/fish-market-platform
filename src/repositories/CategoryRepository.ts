import { prisma } from "@/lib/prisma";

export interface CategoryFilters {
  search?: string;
  active?: boolean;
}

export class CategoryRepository {
  /**
   * Total kategori aktif.
   */
  static async count() {
    return prisma.category.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
   * Total kategori yang aktif.
   */
  static async getActiveTotal() {
    return prisma.category.count({
      where: {
        deletedAt: null,
        isActive: true,
      },
    });
  }

  /**
   * Daftar kategori.
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
              ],
            }
          : {}),

        ...(active !== undefined
          ? {
              isActive: active,
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
   * Cari kategori berdasarkan ID.
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
   * Cari kategori berdasarkan slug.
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
   * Cek apakah slug sudah digunakan.
   */
  static async existsBySlug(
    slug: string,
    ignoreId?: string
  ) {
    const category =
      await prisma.category.findFirst({
        where: {
          slug,
          deletedAt: null,
        },

        select: {
          id: true,
        },
      });

    return !!(
      category &&
      category.id !== ignoreId
    );
  }

  /**
   * Membuat kategori.
   */
  static async create(
    data: Parameters<
      typeof prisma.category.create
    >[0]["data"]
  ) {
    return prisma.category.create({
      data,
    });
  }

  /**
   * Update kategori.
   */
  static async update(
    id: string,
    data: Parameters<
      typeof prisma.category.update
    >[0]["data"]
  ) {
    return prisma.category.update({
      where: {
        id,
      },

      data,
    });
  }

  /**
   * Mengaktifkan kategori.
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
   * Menonaktifkan kategori.
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
   * Soft delete kategori.
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
   * Restore kategori.
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
}

export default CategoryRepository;