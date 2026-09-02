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

export interface CustomerOrderCursor {
  createdAt: Date;
  id: string;
}

export interface CustomerOrderPaginationOptions {
  limit: number;
  cursor?: CustomerOrderCursor;
  status?: OrderStatus;
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
   * ==========================================================
   * CUSTOMER ORDER SUMMARY
   * ==========================================================
   *
   * Mengambil ringkasan order milik satu customer.
   *
   * Digunakan oleh Customer Account Dashboard.
   *
   * Hanya order aktif yang dihitung:
   *
   * deletedAt = null
   *
   * Order milik customer lain tidak akan ikut terhitung
   * karena userId menjadi authorization scope.
   *
   * Grouping dilakukan langsung di database berdasarkan
   * OrderStatus agar tidak perlu mengambil seluruh Order
   * beserta relasinya.
   */
  static async getCustomerOrderSummary(
    userId: string
  ) {
    const rows =
      await prisma.order.groupBy({
        by: ["status"],

        where: {
          userId,

          deletedAt: null,
        },

        _count: {
          _all: true,
        },
      });

    const summary = {
      totalOrders: 0,

      pending: 0,

      waitingPayment: 0,

      waitingVerification: 0,

      processing: 0,

      shipping: 0,

      completed: 0,

      cancelled: 0,
    };

    for (const row of rows) {
      const count =
        row._count._all;

      summary.totalOrders +=
        count;

      switch (row.status) {
        case OrderStatus.PENDING:
          summary.pending = count;
          break;

        case OrderStatus.WAITING_PAYMENT:
          summary.waitingPayment = count;
          break;

        case OrderStatus.WAITING_VERIFICATION:
          summary.waitingVerification =
            count;
          break;

        case OrderStatus.PROCESSING:
          summary.processing = count;
          break;

        case OrderStatus.SHIPPING:
          summary.shipping = count;
          break;

        case OrderStatus.COMPLETED:
          summary.completed = count;
          break;

        case OrderStatus.CANCELLED:
          summary.cancelled = count;
          break;
      }
    }

    return summary;
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

  static async findByIdAndUserId(
  id: string,
  userId: string
) {
  return prisma.order.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    },

    include: {
      user: true,
      address: true,
      items: {
        include: {
          product: true,
          sku: true,
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
  userId: string,
  statuses?: OrderStatus[]
) {
  return prisma.order.findMany({
where: {
  userId,
  deletedAt: null,

  ...(statuses && statuses.length > 0
    ? {
        status: {
          in: statuses,
        },
      }
    : {}),
},

    orderBy: {
      createdAt: "desc",
    },

    include: {
      items: {
        include: {
          product: true,
          sku: true,
        },
      },

      paymentProof: true,

      paymentChannel: true,
    },
  });
}

  /**
   * ==========================================================
   * CUSTOMER MOBILE ORDER LIST
   * ==========================================================
   *
   * Cursor pagination dengan ordering deterministik:
   *
   * createdAt DESC
   * id        DESC
   *
   * Method ini sengaja dipisahkan dari findByUserId()
   * agar customer web tidak terkena perubahan contract.
   */
  static async findByUserIdPaginated(
    userId: string,
    options: CustomerOrderPaginationOptions
  ) {
    const { limit, cursor, status } = options;

    const orders = await prisma.order.findMany({
      where: {
        userId,
        deletedAt: null,

        ...(status
          ? {
              status,
            }
          : {}),

        ...(cursor
          ? {
              OR: [
                {
                  createdAt: {
                    lt: cursor.createdAt,
                  },
                },
                {
                  createdAt: cursor.createdAt,
                  id: {
                    lt: cursor.id,
                  },
                },
              ],
            }
          : {}),
      },

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      take: limit + 1,

      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,

        subtotal: true,
        voucherDiscount: true,
        shippingCost: true,
        total: true,

        createdAt: true,
        updatedAt: true,

        paymentChannel: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            icon: true,
          },
        },

        paymentProof: {
          select: {
            id: true,
            status: true,
            rejectionReason: true,
          },
        },

        items: {
          select: {
            id: true,
            productId: true,
            skuId: true,
            productName: true,
            productVariant: true,
            productWeight: true,
            weightSku: true,
            customerNote: true,
            price: true,
            quantity: true,
            subtotal: true,
          },
        },
      },
    });

    const hasNextPage = orders.length > limit;

    if (hasNextPage) {
      orders.pop();
    }

    const lastOrder = orders[orders.length - 1];

    const nextCursor =
      hasNextPage && lastOrder
        ? {
            createdAt: lastOrder.createdAt,
            id: lastOrder.id,
          }
        : null;

    return {
      orders,
      hasNextPage,
      nextCursor,
    };
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
}

export default OrderRepository;
