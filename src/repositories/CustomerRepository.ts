import { prisma } from "@/lib/prisma";

import { Role } from "@prisma/client";

export interface CustomerFilters {
  search?: string;

    role?: Role;

  isActive?: boolean;

  skip?: number;

  take?: number;

  orderBy?: "createdAt" | "name" | "email";

  order?: "asc" | "desc";
}

export class CustomerRepository {
  /**
   * Total customer aktif (belum dihapus).
   */
  static async getTotal() {
    return prisma.user.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
   * Total customer yang aktif.
   */
  static async getActiveTotal() {
    return prisma.user.count({
      where: {
        deletedAt: null,
        isActive: true,
      },
    });
  }

  /**
   * Daftar customer.
   */
  static async findMany(
    filters: CustomerFilters = {}
  ) {
    const {
      search,
      role,
      isActive,
      skip = 0,
      take = 20,
      orderBy = "createdAt",
      order = "desc",
    } = filters;

    return prisma.user.findMany({
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
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  phone: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),

        ...(role
          ? {
              role,
            }
          : {}),

        ...(isActive !== undefined
          ? {
              isActive,
            }
          : {}),
      },

      include: {
        addresses: true,
      },

      skip,

      take,

      orderBy: {
        [orderBy]: order,
      },
    });
  }

  /**
 * Daftar customer yang sudah dihapus.
 */
static async findDeleted() {
  return prisma.user.findMany({
    where: {
      deletedAt: {
        not: null,
      },
    },

    include: {
      addresses: true,
    },

    orderBy: {
      deletedAt: "desc",
    },
  });
}

  /**
   * Customer berdasarkan ID.
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
   * Customer berdasarkan Email.
   */
  static async findByEmail(email: string) {
  return prisma.user.findFirst({
    where: {
      email,
    },
  });
}

  /**
 * Customer berdasarkan Nomor Telepon.
 */
static async findByPhone(
  phone: string
) {
  return prisma.user.findFirst({
    where: {
      phone,
    },
  });
}

  /**
   * Mengecek email sudah digunakan.
   */
  static async existsByEmail(
    email: string
  ) {
    const count =
      await prisma.user.count({
        where: {
          email,
          deletedAt: null,
        },
      });

    return count > 0;
  }

  /**
   * Membuat customer.
   */
  static async create(
    data: Parameters<
      typeof prisma.user.create
    >[0]["data"]
  ) {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Update customer.
   */
  static async update(
    id: string,
    data: Parameters<
      typeof prisma.user.update
    >[0]["data"]
  ) {
    return prisma.user.update({
      where: {
        id,
      },

      data,
    });
  }

  /**
   * Soft delete customer.
   */
  static async softDelete(
    id: string
  ) {
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
   * Restore customer.
   */
  static async restore(
    id: string
  ) {
    return prisma.user.update({
      where: {
        id,
      },

      data: {
        deletedAt: null,
      },
    });
  }

  /**
 * Hapus permanen customer.
 */
static async forceDelete(
  id: string
) {
  return prisma.user.delete({
    where: {
      id,
    },
  });
}

}

export default CustomerRepository;