import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface OrderFilters {
  search?: string;

  status?: OrderStatus;

  paymentStatus?: PaymentStatus;

  userId?: string;

  skip?: number;

  take?: number;

  orderBy?:
    | "createdAt"
    | "orderNumber"
    | "total";

  order?: "asc" | "desc";
}

const DEFAULT_INCLUDE = {
  user: true,

  address: true,

  items: {
    include: {
      product: true,
    },
  },

  paymentProof: true,

  paymentChannel: true,
} as const;

export class OrderRepository {
  /**
   * Total seluruh order.
   */
  static async getTotalOrders() {
  return prisma.order.count({
    where: {
      deletedAt: null,
    },
  });
}

  /**
 * Total order yang berada di Trash.
 */
static async getDeletedTotal() {
  return prisma.order.count({
    where: {
      deletedAt: {
        not: null,
      },
    },
  });
}

  /**
   * Total pembayaran yang masih menunggu.
   */
  static async getPendingPayments() {
  return prisma.order.count({
    where: {
      deletedAt: null,

      paymentStatus:
        PaymentStatus.PENDING,
    },
  });
}

  /**
   * Total order berdasarkan status.
   */
  static async getTotalByStatus(
  status: OrderStatus
) {
  return prisma.order.count({
    where: {
      deletedAt: null,

      status,
    },
  });
}

  /**
   * Order terbaru.
   */
  static async findLatest(limit = 5) {
    return prisma.order.findMany({
      take: limit,

      orderBy: {
        createdAt: "desc",
      },

      include: DEFAULT_INCLUDE,
    });
  }

  static async findMany(
  filters: OrderFilters = {}
) {
  const {
    search,
    status,
    paymentStatus,
    userId,
    skip = 0,
    take = 20,
    orderBy = "createdAt",
    order = "desc",
  } = filters;

  return prisma.order.findMany({
    where: {
      deletedAt: null,

      ...(search
        ? {
            OR: [
              {
                orderNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                user: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),

      ...(status
        ? {
            status,
          }
        : {}),

      ...(paymentStatus
        ? {
            paymentStatus,
          }
        : {}),

      ...(userId
        ? {
            userId,
          }
        : {}),
    },

    include: DEFAULT_INCLUDE,

    skip,

    take,

    orderBy: {
      [orderBy]: order,
    },
  });
}

static async findDeleted() {
  return prisma.order.findMany({
    where: {
      deletedAt: {
        not: null,
      },
    },

    include: DEFAULT_INCLUDE,

    orderBy: {
      deletedAt: "desc",
    },
  });
}

static async softDelete(id: string) {
  return prisma.order.update({
    where: {
      id,
    },

    data: {
      deletedAt: new Date(),
    },
  });
}

static async restore(id: string) {
  return prisma.order.update({
    where: {
      id,
    },

    data: {
      deletedAt: null,
    },
  });
}

static async forceDelete(id: string) {
  return prisma.order.delete({
    where: {
      id,
    },
  });
}

  /**
   * Cari order berdasarkan ID.
   */
  static async findById(id: string) {
    return prisma.order.findUnique({
  where: {
    id,
  },

  include: {
    user: true,

    address: true,

    items: {
      include: {
        product: true,
      },
    },

    paymentProof: true,

    paymentChannel: true,
  },
});
  }

  /**
   * Cari order berdasarkan nomor order.
   */
  static async findByOrderNumber(
    orderNumber: string
  ) {
    return prisma.order.findUnique({
      where: {
        orderNumber,
      },

      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
          },
        },
        paymentProof: true,
        paymentChannel: true,
      },
    });
  }

  /**
   * Seluruh order milik user.
   */
  static async findByUserId(
    userId: string
  ) {
    return prisma.order.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        items: {
          include: {
            product: true,
          },
        },
        paymentProof: true,
        paymentChannel: true,
      },
    });
  }

  /**
   * Membuat order baru.
   */
  static async create(
    data: Parameters<
      typeof prisma.order.create
    >[0]["data"]
  ) {
    return prisma.order.create({
      data,

      include: {
        user: true,
        address: true,
        items: true,
      },
    });
  }

  /**
   * Update order.
   */
  static async update(
    id: string,
    data: Parameters<
      typeof prisma.order.update
    >[0]["data"]
  ) {
    return prisma.order.update({
      where: {
        id,
      },

      data,
    });
  }

  /**
   * Update status order.
   */
  /**
 * Update status order secara concurrency-safe.
 *
 * expectedStatus digunakan untuk memastikan
 * status order di database masih sama dengan
 * status yang sebelumnya divalidasi oleh Service.
 *
 * Jika status sudah berubah karena request lain,
 * update akan gagal.
 */
static async updateStatus(
  id: string,
  status: OrderStatus,
  expectedStatus?: OrderStatus
) {
  if (
    expectedStatus === undefined
  ) {
    return prisma.order.update({
      where: {
        id,
      },

      data: {
        status,
      },
    });
  }

  const result =
    await prisma.order.updateMany({
      where: {
        id,

        status:
          expectedStatus,

        deletedAt: null,
      },

      data: {
        status,
      },
    });

  if (result.count !== 1) {
    throw new Error(
      "Order berubah sebelum proses selesai. Silakan refresh halaman dan coba lagi."
    );
  }

  return prisma.order.findUnique({
  where: {
    id,
  },

  include: {
    user: true,

    address: true,

    items: {
      include: {
        product: true,
      },
    },

    paymentProof: true,

    paymentChannel: true,
  },
});
}

  /**
   * Update status pembayaran.
   */
  static async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus
  ) {
    return prisma.order.update({
      where: {
        id,
      },

      data: {
        paymentStatus,
      },
    });
  }

  /**
   * Menandai order telah dibayar.
   */
  static async markAsPaid(id: string) {
    return prisma.order.update({
      where: {
        id,
      },

      data: {
        paymentStatus: PaymentStatus.VERIFIED,
        paidAt: new Date(),
      },
    });
  }

  /**
   * Menandai order selesai.
   */
  static async markAsCompleted(
    id: string
  ) {
    return prisma.order.update({
      where: {
        id,
      },

      data: {
        status: OrderStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }
}

export default OrderRepository;