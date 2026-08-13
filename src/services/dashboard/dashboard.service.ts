import { DashboardRepository } from "@/repositories/dashboard/dashboard.repository";

export class DashboardService {
  static async getDashboard() {
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      pendingPayments,
      recentOrders,
      recentCustomers,
    ] = await Promise.all([
      DashboardRepository.countProducts(),
      DashboardRepository.countCustomers(),
      DashboardRepository.countOrders(),
      DashboardRepository.countPendingPayments(),
      DashboardRepository.findRecentOrders(5),
      DashboardRepository.findRecentCustomers(5),
    ]);

    return {
      stats: {
        totalProducts,
        totalCustomers,
        totalOrders,
        pendingPayments,
      },

      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.user.name,
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt,
      })),

      recentCustomers: recentCustomers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        joinedAt: customer.createdAt,
      })),
    };
  }
}

export default DashboardService;