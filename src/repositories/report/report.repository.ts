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
 * Repository untuk mengambil data laporan.
 *
 * ============================================================
 */

export class ReportRepository {
  /**
   * ==========================================================
   * GET SUMMARY
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
      /**
       * TOTAL ORDERS
       */

      prisma.order.count({
        where: {
          deletedAt: null,
        },
      }),

      /**
       * PENDING ORDERS
       */

      prisma.order.count({
        where: {
          deletedAt: null,

          status:
            OrderStatus.PENDING,
        },
      }),

      /**
       * WAITING PAYMENT
       *
       * Customer belum menyelesaikan proses pembayaran.
       */

      prisma.order.count({
        where: {
          deletedAt: null,

          status:
            OrderStatus.WAITING_PAYMENT,
        },
      }),

      /**
       * WAITING VERIFICATION
       *
       * Hanya menghitung bukti pembayaran yang:
       *
       * - Sudah diupload customer
       * - Status masih PENDING
       * - Belum dihapus
       *
       * Menggunakan PaymentProof sebagai sumber data
       * agar sinkron dengan:
       *
       * - Admin Payments
       * - Admin Dashboard
       */

      prisma.paymentProof.count({
        where: {
          deletedAt: null,

          status:
            PaymentStatus.PENDING,
        },
      }),

      /**
       * PROCESSING ORDERS
       */

      prisma.order.count({
        where: {
          deletedAt: null,

          status:
            OrderStatus.PROCESSING,
        },
      }),

      /**
       * SHIPPING ORDERS
       */

      prisma.order.count({
        where: {
          deletedAt: null,

          status:
            OrderStatus.SHIPPING,
        },
      }),

      /**
       * COMPLETED ORDERS
       */

      prisma.order.count({
        where: {
          deletedAt: null,

          status:
            OrderStatus.COMPLETED,
        },
      }),

      /**
       * CANCELLED ORDERS
       */

      prisma.order.count({
        where: {
          deletedAt: null,

          status:
            OrderStatus.CANCELLED,
        },
      }),

      /**
       * VERIFIED REVENUE
       *
       * Pendapatan hanya berasal dari pembayaran
       * yang sudah diverifikasi.
       */

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