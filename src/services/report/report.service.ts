import ReportRepository from "@/repositories/report/report.repository";

/**
 * ============================================================
 * REPORT SERVICE
 * ============================================================
 *
 * Service untuk memproses dan menyiapkan data laporan
 * sebelum digunakan oleh halaman Admin Reports.
 *
 * ============================================================
 */

export class ReportService {
  /**
   * ==========================================================
   * GET REPORT DATA
   * ==========================================================
   */

  static async getReport() {
    const [
      summary,
      recentOrders,
    ] = await Promise.all([
      ReportRepository.getSummary(),

      ReportRepository.findRecentOrders(10),
    ]);

    return {
      summary: {
        totalOrders:
          summary.totalOrders,

        pendingOrders:
          summary.pendingOrders,

        waitingPaymentOrders:
          summary.waitingPaymentOrders,

        waitingVerificationOrders:
          summary.waitingVerificationOrders,

        processingOrders:
          summary.processingOrders,

        shippingOrders:
          summary.shippingOrders,

        completedOrders:
          summary.completedOrders,

        cancelledOrders:
          summary.cancelledOrders,

        totalRevenue:
          summary.totalRevenue,
      },

      recentOrders:
        recentOrders.map(
          (order) => ({
            id: order.id,

            orderNumber:
              order.orderNumber,

            customerName:
              order.user.name ??
              "Customer",

            customerEmail:
              order.user.email,

            total:
              Number(order.total),

            status:
              order.status,

            paymentStatus:
              order.paymentStatus,

            createdAt:
              order.createdAt,
          })
        ),
    };
  }
}

export default ReportService;