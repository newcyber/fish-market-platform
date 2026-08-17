import {
  PaymentStatus,
  Role,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * DASHBOARD REPOSITORY
 * ============================================================
 */

export class DashboardRepository {
  /**
   * ==========================================================
   * TOTAL PRODUCTS
   * ==========================================================
   */

  static async countProducts() {
    return prisma.product.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
   * ==========================================================
   * TOTAL CUSTOMERS
   * ==========================================================
   */

  static async countCustomers() {
    return prisma.user.count({
      where: {
        role: Role.CUSTOMER,
        deletedAt: null,
      },
    });
  }

  /**
   * ==========================================================
   * TOTAL ORDERS
   * ==========================================================
   */

  static async countOrders() {
    return prisma.order.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
   * ==========================================================
   * PENDING PAYMENT VERIFICATION
   * ==========================================================
   *
   * Hanya menghitung customer yang:
   *
   * - Sudah upload bukti pembayaran
   * - Bukti pembayaran masih berstatus PENDING
   * - Bukti pembayaran belum dihapus
   *
   * Sumber utama:
   *
   * PaymentProof.status = PENDING
   *
   * ==========================================================
   */

  static async countPendingPayments() {
    return prisma.paymentProof.count({
      where: {
        deletedAt: null,

        status:
          PaymentStatus.PENDING,
      },
    });
  }

  /**
   * ==========================================================
   * RECENT ORDERS
   * ==========================================================
   */

  static async findRecentOrders(
    limit = 5
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
        user: true,
        paymentProof: true,
      },
    });
  }

  /**
   * ==========================================================
   * RECENT CUSTOMERS
   * ==========================================================
   */

  static async findRecentCustomers(
    limit = 5
  ) {
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
}

export default DashboardRepository;