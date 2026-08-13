import { OrderStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export class DashboardRepository {
  /**
   * Total Products
   */
  static async countProducts() {
    return prisma.product.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
   * Total Customers
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
   * Total Orders
   */
  static async countOrders() {
    return prisma.order.count();
  }

  /**
   * Pending Verification
   */
  static async countPendingPayments() {
    return prisma.order.count({
      where: {
        status: OrderStatus.WAITING_VERIFICATION,
      },
    });
  }

  /**
   * Recent Orders
   */
  static async findRecentOrders(limit = 5) {
    return prisma.order.findMany({
      take: limit,

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
   * Recent Customers
   */
  static async findRecentCustomers(limit = 5) {
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