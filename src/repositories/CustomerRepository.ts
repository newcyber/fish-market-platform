import { prisma } from "@/lib/prisma";

import { OrderStatus, PaymentStatus, Role } from "@prisma/client";

export type CustomerSegmentFilter =
  | "BARU"
  | "REPEAT"
  | "LOYAL"
  | "VIP"
  | "AKTIF"
  | "DORMANT";

export interface CustomerFilters {
  search?: string;
  role?: Role;
  isActive?: boolean;

  segment?: CustomerSegmentFilter;
  area?: string;

  page?: number;
  limit?: number;

  skip?: number;
  take?: number;

  orderBy?: "createdAt" | "name" | "email";
  order?: "asc" | "desc";
}

const successfulOrderWhere = {
  paymentStatus: PaymentStatus.VERIFIED,
  status: OrderStatus.COMPLETED,
  deletedAt: null,
};

export class CustomerRepository {
  /**
   * Total customer aktif di sistem.
   *
   * Hanya role CUSTOMER dan belum soft-delete.
   */
  static async getTotal() {
    return prisma.user.count({
      where: {
        role: Role.CUSTOMER,
        deletedAt: null,
      },
    });
  }

  /**
   * Total customer yang status akunnya aktif.
   */
  static async getActiveTotal() {
    return prisma.user.count({
      where: {
        role: Role.CUSTOMER,
        deletedAt: null,
        isActive: true,
      },
    });
  }

  /**
   * Total customer baru bulan berjalan.
   */
  static async getNewCustomersThisMonth(startOfMonth: Date) {
    return prisma.user.count({
      where: {
        role: Role.CUSTOMER,
        deletedAt: null,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });
  }

  /**
   * Total customer yang melakukan pembelian berhasil
   * dalam 30 hari terakhir.
   */
static async getActiveCustomers30Days(since: Date) {
  const result = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      ...successfulOrderWhere,
      createdAt: {
        gte: since,
      },
    },
  });

  return result.length;
}

static async getRepeatCustomers() {
  const result = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      ...successfulOrderWhere,
    },
    _count: {
      _all: true,
    },
    having: {
      userId: {
        _count: {
          gte: 2,
        },
      },
    },
  });

  return result.length;
}

  /**
   * Statistik customer lengkap.
   */
  static async getStats() {
    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const [
      totalCustomers,
      newCustomersThisMonth,
      activeCustomers30Days,
      repeatCustomers,
    ] = await Promise.all([
      this.getTotal(),
      this.getNewCustomersThisMonth(startOfMonth),
      this.getActiveCustomers30Days(thirtyDaysAgo),
      this.getRepeatCustomers(),
    ]);

    return {
      totalCustomers,
      newCustomersThisMonth,
      activeCustomers30Days,
      repeatCustomers,
    };
  }

    /**
   * Mengambil daftar area customer yang tersedia.
   *
   * Area filter menggunakan city dari alamat aktif customer.
   * Hanya customer aktif secara record (belum soft-delete)
   * yang diperhitungkan.
   */
  static async getCustomerAreas(): Promise<string[]> {
    const addresses =
      await prisma.address.findMany({
        where: {
          deletedAt: null,
          user: {
            role: Role.CUSTOMER,
            deletedAt: null,
          },
          city: {
            not: "",
          },
        },
        select: {
          city: true,
        },
        distinct: ["city"],
        orderBy: {
          city: "asc",
        },
      });

    return addresses
      .map((address) => address.city.trim())
      .filter(Boolean);
  }

  /**
   * Daftar customer dasar.
   */
  static async findMany(
    filters: CustomerFilters = {}
  ) {
    const {
      search,
      role = Role.CUSTOMER,
      isActive,
      skip = 0,
      take = 20,
      orderBy = "createdAt",
      order = "desc",
    } = filters;

    return prisma.user.findMany({
      where: {
        deletedAt: null,
        role,

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

        ...(isActive !== undefined
          ? {
              isActive,
            }
          : {}),
      },

      include: {
        addresses: {
          where: {
            deletedAt: null,
          },
          orderBy: [
            {
              isDefault: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
        },
      },

      skip,
      take,

      orderBy: {
        [orderBy]: order,
      },
    });
  }

  /**
   * Daftar customer untuk halaman utama Customer.
   *
   * Mengambil transaksi berhasil agar service dapat menghitung:
   * - total order
   * - total belanja
   * - terakhir belanja
   */
  static async findManyWithMetrics(
    filters: CustomerFilters = {}
  ) {
    const {
      search,
      role = Role.CUSTOMER,
      isActive,
      skip = 0,
      take = 20,
      orderBy = "createdAt",
      order = "desc",
    } = filters;

    return prisma.user.findMany({
      where: {
        deletedAt: null,
        role,

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

        ...(isActive !== undefined
          ? {
              isActive,
            }
          : {}),
      },

      include: {
        addresses: {
          where: {
            deletedAt: null,
          },
          orderBy: [
            {
              isDefault: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
        },

        orders: {
          where: successfulOrderWhere,
          select: {
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },

      skip,
      take,

      orderBy: {
        [orderBy]: order,
      },
    });
  }

  static async paginateWithMetrics(
  filters: CustomerFilters = {}
) {
  const {
    search,
    role = Role.CUSTOMER,
    isActive,
    skip = 0,
    take = 10,
    orderBy = "createdAt",
    order = "desc",
  } = filters;

  const where = {
    deletedAt: null,
    role,

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
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),

    ...(isActive !== undefined
      ? {
          isActive,
        }
      : {}),

    ...(filters.area
      ? {
          addresses: {
            some: {
              deletedAt: null,
              OR: [
                {
                  province: {
                    contains: filters.area,
                    mode: "insensitive" as const,
                  },
                },
                {
                  city: {
                    contains: filters.area,
                    mode: "insensitive" as const,
                  },
                },
                {
                  district: {
                    contains: filters.area,
                    mode: "insensitive" as const,
                  },
                },
                {
                  village: {
                    contains: filters.area,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          },
        }
      : {}),
  };

  const [items, total] =
    await prisma.$transaction([
      prisma.user.findMany({
        where,

        include: {
          addresses: {
            where: {
              deletedAt: null,
            },

            orderBy: [
              {
                isDefault: "desc",
              },
              {
                createdAt: "desc",
              },
            ],
          },

          orders: {
            where: successfulOrderWhere,

            select: {
              total: true,
              createdAt: true,
            },

            orderBy: {
              createdAt: "desc",
            },
          },
        },

        skip,
        take,

        orderBy: {
          [orderBy]: order,
        },
      }),

      prisma.user.count({
        where,
      }),
    ]);

  return {
    items,
    total,
    skip,
    take,
  };
}

  /**
   * Mengambil customer beserta metric pembelian teragregasi.
   *
   * Segment customer dihitung di service setelah metric diperoleh.
   * Karena itu method ini tidak melakukan skip/take.
   */
  static async findCustomersWithAggregatedMetrics(
    filters: Omit<CustomerFilters, "segment" | "skip" | "take"> = {},
  ) {
    const {
      search,
      role = Role.CUSTOMER,
      isActive,
      area,
      orderBy = "createdAt",
      order = "desc",
    } = filters;

    const where = {
      role,
      deletedAt: null,
      ...(isActive !== undefined ? { isActive } : {}),
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
                email: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                phone: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
      ...(area
        ? {
            addresses: {
              some: {
                deletedAt: null,
                OR: [
                  {
                    province: {
                      contains: area,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    city: {
                      contains: area,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    district: {
                      contains: area,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    village: {
                      contains: area,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            },
          }
        : {}),
    };

    const customers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        rewardPointsBalance: true,
        addresses: {
          where: {
            deletedAt: null,
          },
          orderBy: [
            {
              isDefault: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          select: {
            province: true,
            city: true,
            district: true,
            village: true,
            isDefault: true,
          },
        },
      },
      orderBy: {
        [orderBy]: order,
      },
    });

    if (customers.length === 0) {
      return [];
    }

    const customerIds = customers.map((customer) => customer.id);

    const orderMetrics = await prisma.order.groupBy({
      by: ["userId"],
      where: {
        ...successfulOrderWhere,
        userId: {
          in: customerIds,
        },
      },
      _count: {
        _all: true,
      },
      _sum: {
        total: true,
      },
      _max: {
        createdAt: true,
      },
    });

    const metricsByUserId = new Map(
      orderMetrics.map((metric) => [
        metric.userId,
        {
          totalOrders: metric._count._all,
          totalSpent: Number(metric._sum.total ?? 0),
          lastOrderAt: metric._max.createdAt,
        },
      ]),
    );

    return customers.map((customer) => {
      const metrics = metricsByUserId.get(customer.id);

      return {
        ...customer,
        totalOrders: metrics?.totalOrders ?? 0,
        totalSpent: metrics?.totalSpent ?? 0,
        lastOrderAt: metrics?.lastOrderAt ?? null,
      };
    });
  }

  /**
   * Customer yang sudah dihapus.
   */
  static async findDeleted() {
    return prisma.user.findMany({
      where: {
        role: Role.CUSTOMER,
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
      role: Role.CUSTOMER,
      deletedAt: null,
    },

    include: {
      addresses: {
        where: {
          deletedAt: null,
        },
        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },

      orders: {
        where: successfulOrderWhere,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          items: true,
        },
      },

      userVouchers: {
        orderBy: {
          redeemedAt: "desc",
        },
        include: {
          voucher: {
            include: {
              usages: {
                where: {
                  userId: id,
                },
                orderBy: {
                  usedAt: "desc",
                },
                take: 1,
                select: {
                  id: true,
                  orderId: true,
                  discountAmount: true,
                  usedAt: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Ringkasan customer untuk Customer Home.
 *
 * Hanya mengambil data yang diperlukan oleh header Home:
 * - nama customer
 * - saldo reward point
 * - alamat aktif/default
 *
 * Tidak mengambil orders, items, atau userVouchers.
 */
static async findHomeSummary(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      role: Role.CUSTOMER,
      deletedAt: null,
    },

    select: {
      id: true,
      name: true,
      rewardPointsBalance: true,

      addresses: {
        where: {
          deletedAt: null,
        },

        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "desc",
          },
        ],

        take: 1,

        select: {
          id: true,
          label: true,
          receiverName: true,
          receiverPhone: true,
          province: true,
          city: true,
          district: true,
          village: true,
          postalCode: true,
          fullAddress: true,
          isDefault: true,
        },
      },
    },
  });
}

  /**
   * Customer berdasarkan email.
   */
  static async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
      },
    });
  }

  /**
   * Customer berdasarkan nomor telepon.
   */
  static async findByPhone(phone: string) {
    return prisma.user.findFirst({
      where: {
        phone,
      },
    });
  }

  /**
   * Mengecek email sudah digunakan.
   */
  static async existsByEmail(email: string) {
    const count = await prisma.user.count({
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
 * Restore customer.
 *
 * Restore hanya diperbolehkan untuk customer
 * yang memang sudah soft-delete.
 */
static async restore(id: string) {
  const customer = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      role: true,
      deletedAt: true,
    },
  });

  if (!customer) {
    throw new Error("Customer tidak ditemukan.");
  }

  if (customer.role !== Role.CUSTOMER) {
    throw new Error(
      "Hanya customer yang dapat dipulihkan."
    );
  }

  if (!customer.deletedAt) {
    throw new Error(
      "Customer masih aktif dan tidak perlu dipulihkan."
    );
  }

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
   *
   * Permanent delete hanya diperbolehkan untuk customer
   * yang sudah soft-delete dan belum memiliki history bisnis.
   */
  static async forceDelete(id: string) {
    const customer = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
        deletedAt: true,
      },
    });

    if (!customer) {
      throw new Error("Customer tidak ditemukan.");
    }

    if (customer.role !== Role.CUSTOMER) {
      throw new Error(
        "Hanya customer yang dapat dihapus permanen."
      );
    }

    if (!customer.deletedAt) {
      throw new Error(
        "Customer aktif tidak dapat dihapus permanen. Hapus sementara terlebih dahulu."
      );
    }

    const [
      orderCount,
      rewardPointTransactionCount,
      rewardClaimCount,
      userVoucherCount,
      voucherUsageCount,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          userId: id,
        },
      }),
      prisma.rewardPointTransaction.count({
        where: {
          userId: id,
        },
      }),
      prisma.rewardClaim.count({
        where: {
          userId: id,
        },
      }),
      prisma.userVoucher.count({
        where: {
          userId: id,
        },
      }),
      prisma.voucherUsage.count({
        where: {
          userId: id,
        },
      }),
    ]);

    const hasHistory =
      orderCount > 0 ||
      rewardPointTransactionCount > 0 ||
      rewardClaimCount > 0 ||
      userVoucherCount > 0 ||
      voucherUsageCount > 0;

    if (hasHistory) {
      throw new Error(
        "Customer tidak dapat dihapus permanen karena memiliki riwayat transaksi atau reward. Gunakan hapus sementara untuk mempertahankan riwayat."
      );
    }

    return prisma.user.delete({
      where: {
        id,
      },
    });
  }
}

export default CustomerRepository;
