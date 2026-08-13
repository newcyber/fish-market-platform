import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * REPORT REPOSITORY
 * ============================================================
 *
 * Repository untuk mengambil data laporan dari database.
 *
 * ============================================================
 */

export class ReportRepository {
  /**
   * ==========================================================
   * DASHBOARD SUMMARY
   * ==========================================================
   */

  static async getSummary() {
    const [
      totalOrders,
      pendingOrders,
      waitingPaymentOrders,
      waitingVerificationOrders,
      processingOrders,
      shippingOrders,
      completedOrders,
      cancelledOrders,
      verifiedRevenue,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.order.count({
        where: {
          deletedAt: null,
          status: OrderStatus.PENDING,
        },
      }),

      prisma.order.count({
        where: {
          deletedAt: null,
          status: OrderStatus.WAITING_PAYMENT,
        },
      }),

      prisma.order.count({
        where: {
          deletedAt: null,
          status:
            OrderStatus.WAITING_VERIFICATION,
        },
      }),

      prisma.order.count({
        where: {
          deletedAt: null,
          status: OrderStatus.PROCESSING,
        },
      }),

      prisma.order.count({
        where: {
          deletedAt: null,
          status: OrderStatus.SHIPPING,
        },
      }),

      prisma.order.count({
        where: {
          deletedAt: null,
          status: OrderStatus.COMPLETED,
        },
      }),

      prisma.order.count({
        where: {
          deletedAt: null,
          status: OrderStatus.CANCELLED,
        },
      }),

      prisma.order.aggregate({
        _sum: {
          total: true,
        },

        where: {
          deletedAt: null,
          paymentStatus:
            PaymentStatus.VERIFIED,
        },
      }),
    ]);

    return {
      totalOrders,

      pendingOrders,

      waitingPaymentOrders,

      waitingVerificationOrders,

      processingOrders,

      shippingOrders,

      completedOrders,

      cancelledOrders,

      totalRevenue:
        Number(
          verifiedRevenue._sum.total ?? 0
        ),
    };
  }

  /**
   * ==========================================================
   * RECENT ORDERS
   * ==========================================================
   */

  static async findRecentOrders(
    limit = 10
  ) {
    return prisma.order.findMany({
      take: limit,

      where: {
        deletedAt: null,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

export default ReportRepository;