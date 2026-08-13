import { prisma } from "@/lib/prisma";

export class OrderRepository {
  /**
   * ============================================================
   * CREATE ORDER
   * ============================================================
   */

  static async create(data: {
    orderNumber: string;
    userId: string;
    addressId: string;
    paymentMethod: "BANK_TRANSFER";
    subtotal: number;
    shippingCost: number;
    total: number;
    notes?: string | null;

    items: Array<{
      productId: string;
      productName: string;
      price: number;
      quantity: number;
      subtotal: number;
    }>;
  }) {
    return prisma.order.create({
      data: {
        orderNumber: data.orderNumber,
        userId: data.userId,
        addressId: data.addressId,
        paymentMethod: data.paymentMethod,
        subtotal: data.subtotal,
        shippingCost: data.shippingCost,
        total: data.total,
        notes: data.notes ?? null,

        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
        },
      },

      include: {
        items: true,
      },
    });
  }

  /**
   * ============================================================
   * FIND ORDER BY ID
   * ============================================================
   */

  static async findById(orderId: string) {
    return prisma.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        user: true,

        address: true,

        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        },

        paymentProof: true,
      },
    });
  }

  /**
   * ============================================================
   * FIND ORDER BY ORDER NUMBER
   * ============================================================
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

        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        },

        address: true,

        paymentProof: true,
      },
    });
  }

  /**
   * ============================================================
   * FIND ORDERS BY USER ID
   * ============================================================
   */

  static async findByUserId(
    userId: string
  ) {
    return prisma.order.findMany({
      where: {
        userId,

        deletedAt: null,
      },

      include: {
        address: true,

        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        },

        paymentProof: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * ============================================================
   * UPDATE ORDER STATUS
   * ============================================================
   */

  static async updateStatus(
    orderId: string,
    status:
      | "PENDING"
      | "WAITING_PAYMENT"
      | "WAITING_VERIFICATION"
      | "PROCESSING"
      | "SHIPPING"
      | "COMPLETED"
      | "CANCELLED"
  ) {
    return prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        status,
      },
    });
  }

  /**
   * ============================================================
   * UPDATE PAYMENT STATUS
   * ============================================================
   */

  static async updatePaymentStatus(
    orderId: string,
    paymentStatus:
      | "PENDING"
      | "VERIFIED"
      | "REJECTED"
  ) {
    return prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        paymentStatus,
      },
    });
  }

  /**
   * ============================================================
   * SOFT DELETE ORDER
   * ============================================================
   */

  static async softDelete(
    orderId: string
  ) {
    return prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * ============================================================
   * RESTORE ORDER
   * ============================================================
   */

  static async restore(
    orderId: string
  ) {
    return prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        deletedAt: null,
      },
    });
  }
}

export default OrderRepository;