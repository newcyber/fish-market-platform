import { DashboardRepository } from "@/repositories/dashboard/dashboard.repository";

export class DashboardService {
  static async getDashboard() {
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      totalSales,
      totalRewardPoints,
      pendingPayments,
      todayOrders,
      todaySales,
      salesLast7Days,
      orderStatusSummary,
      salesByCategory,
      lowStockSkus,
      recentActivities,
      recentOrders,
      recentCustomers,
    ] = await Promise.all([
      DashboardRepository.countProducts(),
      DashboardRepository.countCustomers(),
      DashboardRepository.countOrders(),
      DashboardRepository.sumTotalSales(),
      DashboardRepository.sumCustomerRewardPoints(),
      DashboardRepository.countPendingPayments(),
      DashboardRepository.countTodayOrders(),
      DashboardRepository.sumTodaySales(),
      DashboardRepository.findSalesLast7Days(),
      DashboardRepository.countOrdersByStatus(),
      DashboardRepository.findSalesByCategory(),
      DashboardRepository.findLowStockSkus(5, 10),
      DashboardRepository.findRecentActivities(8),
      DashboardRepository.findRecentOrders(5),
      DashboardRepository.findRecentCustomers(5),
    ]);

    return {
      stats: {
        totalProducts,
        totalCustomers,
        totalOrders,
        totalSales,
        totalRewardPoints,
        pendingPayments,
      },

      today: {
        orders: todayOrders,
        sales: todaySales,
      },

      salesLast7Days,

      orderStatusSummary,

      salesByCategory,

      lowStockSkus,

      recentActivities,

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
