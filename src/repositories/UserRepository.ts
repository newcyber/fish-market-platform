import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export class UserRepository {
  /**
   * Total seluruh customer aktif.
   */
  static async getTotalCustomers() {
    return prisma.user.count({
      where: {
        role: Role.CUSTOMER,
        deletedAt: null,
      },
    });
  }

  /**
   * Total seluruh admin.
   */
  static async getTotalAdmins() {
    return prisma.user.count({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPER_ADMIN],
        },
        deletedAt: null,
      },
    });
  }

  /**
   * Mengambil customer terbaru.
   */
  static async findLatestCustomers(limit = 5) {
    return prisma.user.findMany({
      take: limit,

      where: {
        role: Role.CUSTOMER,
        deletedAt: null,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Mengambil seluruh admin.
   */
  static async findAdmins() {
    return prisma.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPER_ADMIN],
        },

        deletedAt: null,
      },

      orderBy: {
        createdAt: "asc",
      },
    });
  }

  /**
   * Cari user berdasarkan ID.
   */
  static async findById(id: string) {
    return prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      include: {
        addresses: true,
      },
    });
  }

  /**
   * Cari user berdasarkan email.
   */
  static async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },

      include: {
        addresses: true,
      },
    });
  }

    /**
   * Mengambil seluruh user aktif.
   */
  static async findMany() {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
      },

      include: {
        addresses: true,

        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

    /**
   * Cari user berdasarkan keyword.
   */
  static async search(
    keyword: string
  ) {
    return prisma.user.findMany({
      where: {
        deletedAt: null,

        OR: [
          {
            name: {
              contains: keyword,
              mode: "insensitive",
            },
          },

          {
            email: {
              contains: keyword,
              mode: "insensitive",
            },
          },

          {
            phone: {
              contains: keyword,
              mode: "insensitive",
            },
          },
        ],
      },

      include: {
        addresses: true,

        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

    /**
   * Pagination user.
   */
  static async paginate(
    page = 1,
    limit = 10
  ) {
    const skip =
      (page - 1) * limit;

    const [
      items,
      total,
    ] = await prisma.$transaction([
      prisma.user.findMany({
        skip,

        take: limit,

        where: {
          deletedAt: null,
        },

        include: {
          addresses: true,

          _count: {
            select: {
              orders: true,
              addresses: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.user.count({
        where: {
          deletedAt: null,
        },
      }),
    ]);

    return {
      items,

      total,

      page,

      limit,

      totalPages: Math.ceil(
        total / limit
      ),
    };
  }
  
  /**
   * Cek apakah email sudah digunakan.
   */
  static async existsByEmail(
    email: string,
    ignoreId?: string
  ) {
    const user =
      await prisma.user.findFirst({
        where: {
          email,
          deletedAt: null,
        },

        select: {
          id: true,
        },
      });

    return !!(
      user &&
      user.id !== ignoreId
    );
  }

  /**
   * Cek apakah nomor telepon sudah digunakan.
   */
  static async existsByPhone(
    phone: string,
    ignoreId?: string
  ) {
    const user =
      await prisma.user.findFirst({
        where: {
          phone,
          deletedAt: null,
        },

        select: {
          id: true,
        },
      });

    return !!(
      user &&
      user.id !== ignoreId
    );
  }

  /**
   * Membuat user baru.
   */
  static async create(
    data: Parameters<typeof prisma.user.create>[0]["data"]
  ) {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Update user.
   */
  static async update(
    id: string,
    data: Parameters<typeof prisma.user.update>[0]["data"]
  ) {
    return prisma.user.update({
      where: {
        id,
      },

      data,
    });
  }

  /**
   * Menonaktifkan user.
   */
  static async deactivate(id: string) {
    return prisma.user.update({
      where: {
        id,
      },

      data: {
        isActive: false,
      },
    });
  }

  /**
   * Mengaktifkan kembali user.
   */
  static async activate(id: string) {
    return prisma.user.update({
      where: {
        id,
      },

      data: {
        isActive: true,
      },
    });
  }

  /**
   * Soft delete user.
   */
  static async softDelete(id: string) {
    return prisma.user.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Restore user.
   */
  static async restore(id: string) {
    return prisma.user.update({
      where: {
        id,
      },

      data: {
        deletedAt: null,
      },
    });
  }
}

export default UserRepository;