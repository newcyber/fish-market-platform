import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import OrderService from "@/services/order/order.service";

/**
 * ============================================================
 * ORDER EXPIRATION SERVICE
 * ============================================================
 *
 * Menangani order yang melewati batas waktu pembayaran.
 *
 * Production flow:
 *
 * ORDER CREATED
 *      ↓
 * PAYMENT PENDING
 *      ↓
 * MELEWATI PAYMENT TIMEOUT
 *      ↓
 * expirePendingOrders()
 *      ↓
 * OrderService.cancelOrder()
 *
 * Targeted test / manual flow:
 *
 * ORDER ID
 *      ↓
 * expireOrderById()
 *      ↓
 * Validasi eligibility
 *      ↓
 * OrderService.cancelOrder()
 *
 * ============================================================
 *
 * IMPORTANT
 *
 * Service ini TIDAK melakukan secara langsung:
 *
 * - restore stock
 * - create stock ledger
 * - delete VoucherUsage
 * - decrement voucher usageCount
 * - update order menjadi CANCELLED
 *
 * Semua lifecycle cancellation tetap dipusatkan melalui:
 *
 * OrderService.cancelOrder()
 *
 * agar business rule tidak terduplikasi.
 * ============================================================
 */

export interface ExpireOrdersResult {
  success: boolean;

  message: string;

  totalFound: number;

  totalExpired: number;

  totalFailed: number;

  expiredOrderIds: string[];

  failedOrders: Array<{
    orderId: string;

    orderNumber: string;

    error: string;
  }>;
}

export interface ExpireOrderByIdResult {
  success: boolean;

  message: string;

  orderId: string;

  orderNumber?: string;

  expired: boolean;

  previousStatus?: OrderStatus;

  paymentStatus?: PaymentStatus;
}

export class OrderExpirationService {
  /**
   * ==========================================================
   * DEFAULT PAYMENT TIMEOUT
   * ==========================================================
   *
   * Default:
   *
   * 24 jam sejak order dibuat.
   *
   * Nantinya nilai ini dapat dipindahkan ke Store Settings.
   * ==========================================================
   */

  static readonly DEFAULT_TIMEOUT_HOURS =
    24;

  /**
   * ==========================================================
   * CALCULATE EXPIRATION DATE
   * ==========================================================
   */

  static getExpirationDate(
    timeoutHours:
      | number
      | undefined =
      this.DEFAULT_TIMEOUT_HOURS
  ): Date {
    const timeout =
      Number.isFinite(timeoutHours) &&
      timeoutHours > 0
        ? timeoutHours
        : this.DEFAULT_TIMEOUT_HOURS;

    const expirationDate =
      new Date();

    expirationDate.setHours(
      expirationDate.getHours() -
        timeout
    );

    return expirationDate;
  }

 /**
 * ==========================================================
 * FIND EXPIRED ORDERS
 * ==========================================================
 *
 * Order dianggap memenuhi syarat payment expiration jika:
 *
 * 1. createdAt sudah melewati timeout
 * 2. deletedAt = null
 * 3. status = WAITING_PAYMENT
 * 4. paymentStatus = PENDING
 *
 * WAITING_VERIFICATION tidak ikut diproses karena customer
 * sudah mengirimkan bukti pembayaran dan sedang menunggu
 * verifikasi admin.
 * ==========================================================
 */

  static async findExpiredOrders(
    timeoutHours:
      | number
      | undefined =
      this.DEFAULT_TIMEOUT_HOURS
  ) {
    const expirationDate =
      this.getExpirationDate(
        timeoutHours
      );

    return prisma.order.findMany({
  where: {
    createdAt: {
      lte: expirationDate,
    },

    deletedAt: null,

    status:
      OrderStatus.WAITING_PAYMENT,

    paymentStatus:
      PaymentStatus.PENDING,
  },

  select: {
    id: true,
    orderNumber: true,
    status: true,
    paymentStatus: true,
    createdAt: true,
  },

  orderBy: {
    createdAt: "asc",
  },
});
  }

  /**
   * ==========================================================
   * EXPIRE SINGLE ORDER BY ID
   * ==========================================================
   *
   * Digunakan untuk:
   *
   * - targeted testing
   * - admin/manual expiration
   * - future queue job tertentu
   *
   * Method ini TIDAK memeriksa createdAt timeout.
   *
   * Caller bertanggung jawab menentukan bahwa order memang
   * layak diexpire.
   *
   * Safety rules:
   *
   * - Order harus ada
   * - deletedAt harus null
   * - Order tidak boleh CANCELLED
   * - Order tidak boleh COMPLETED
   * - Payment tidak boleh VERIFIED
   *
   * Setelah lolos validasi, seluruh lifecycle diproses melalui:
   *
   * OrderService.cancelOrder()
   * ==========================================================
   */

  static async expireOrderById(
    orderId: string
  ): Promise<ExpireOrderByIdResult> {
    const normalizedOrderId =
      orderId?.trim();

    if (!normalizedOrderId) {
      return {
        success: false,

        message:
          "Order ID wajib diisi.",

        orderId,

        expired: false,
      };
    }

    const order =
      await prisma.order.findUnique({
        where: {
          id:
            normalizedOrderId,
        },

        select: {
          id: true,

          orderNumber: true,

          status: true,

          paymentStatus: true,

          deletedAt: true,
        },
      });

    /**
     * ========================================================
     * ORDER NOT FOUND
     * ========================================================
     */

    if (!order) {
      return {
        success: false,

        message:
          "Order tidak ditemukan.",

        orderId:
          normalizedOrderId,

        expired: false,
      };
    }

    /**
     * ========================================================
     * SOFT DELETED
     * ========================================================
     */

    if (order.deletedAt) {
      return {
        success: false,

        message:
          "Order sudah dihapus dan tidak dapat diexpire.",

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        expired: false,

        previousStatus:
          order.status,

        paymentStatus:
          order.paymentStatus,
      };
    }

    /**
     * ========================================================
     * ALREADY CANCELLED
     * ========================================================
     */

    if (
      order.status ===
      OrderStatus.CANCELLED
    ) {
      return {
        success: true,

        message:
          "Order sudah berstatus CANCELLED.",

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        expired: false,

        previousStatus:
          order.status,

        paymentStatus:
          order.paymentStatus,
      };
    }

    /**
     * ========================================================
     * COMPLETED ORDER
     * ========================================================
     */

    if (
      order.status ===
      OrderStatus.COMPLETED
    ) {
      return {
        success: false,

        message:
          "Order COMPLETED tidak dapat diexpire.",

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        expired: false,

        previousStatus:
          order.status,

        paymentStatus:
          order.paymentStatus,
      };
    }
    /**
     * ========================================================
     * PAYMENT TIMEOUT ELIGIBILITY
     * ========================================================
     *
     * Payment expiration hanya berlaku untuk order
     * yang masih berada pada fase pembayaran.
     *
     * Allowed:
     *
     * PENDING + PENDING
     * WAITING_PAYMENT + PENDING
     *
     * WAITING_VERIFICATION tidak boleh diexpire karena
     * customer sudah mengirim bukti pembayaran.
     *
     * Payment VERIFIED juga tidak boleh diexpire.
     */

    /**
     * --------------------------------------------------------
     * PAYMENT STATUS
     * --------------------------------------------------------
     *
     * Hanya payment PENDING yang boleh masuk
     * payment expiration.
     */

    if (
      order.paymentStatus !==
      PaymentStatus.PENDING
    ) {
      return {
        success: false,

        message:
          "Order hanya dapat diexpire jika paymentStatus masih PENDING.",

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        expired: false,

        previousStatus:
          order.status,

        paymentStatus:
          order.paymentStatus,
      };
    }

    /**
     * --------------------------------------------------------
     * ORDER STATUS
     * --------------------------------------------------------
     *
     * PENDING:
     *   Order baru dibuat tetapi belum dibayar.
     *
     * WAITING_PAYMENT:
     *   Order sedang menunggu pembayaran.
     *
     * Keduanya masih merupakan fase pembayaran
     * dan boleh diproses oleh payment expiration.
     *
     * WAITING_VERIFICATION tidak boleh diexpire
     * karena customer sudah mengirim bukti pembayaran.
     *
     * PROCESSING / SHIPPING juga tidak boleh diexpire
     * karena order sudah melewati fase pembayaran.
     */

    if (
      order.status !==
        OrderStatus.PENDING &&
      order.status !==
        OrderStatus.WAITING_PAYMENT
    ) {
      return {
        success: false,

        message:
          "Order hanya dapat diexpire saat berstatus PENDING atau WAITING_PAYMENT.",

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        expired: false,

        previousStatus:
          order.status,

        paymentStatus:
          order.paymentStatus,
      };
    }

    /**
     * ========================================================
     * CANCEL THROUGH CENTRALIZED LIFECYCLE
     * ========================================================
     *
     * Jangan melakukan cancellation langsung di service ini.
     *
     * Seluruh lifecycle cancellation dipusatkan melalui:
     *
     * OrderService.cancelOrder()
     *
     * agar:
     *
     * - ProductSku.stock dikembalikan
     * - StockLedger CANCEL dibuat
     * - FlashSalePurchase dilepas
     * - FlashSale quota dikembalikan
     * - VoucherUsage dilepas
     * - Order menjadi CANCELLED
     *
     * tetap berjalan secara transactional.
     */

    try {
      await OrderService.cancelOrder(
        order.id
      );

      console.log(
        "[ORDER_EXPIRED_BY_ID]",
        {
          orderId:
            order.id,

          orderNumber:
            order.orderNumber,

          previousStatus:
            order.status,

          paymentStatus:
            order.paymentStatus,
        }
      );

      return {
        success: true,

        message:
          "Order berhasil diexpire.",

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        expired: true,

        previousStatus:
          order.status,

        paymentStatus:
          order.paymentStatus,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengexpire order.";

      console.error(
        "[ORDER_EXPIRE_BY_ID_ERROR]",
        {
          orderId:
            order.id,

          orderNumber:
            order.orderNumber,

          error:
            message,
        }
      );

      return {
        success: false,

        message,

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        expired: false,

        previousStatus:
          order.status,

        paymentStatus:
          order.paymentStatus,
      };
    }
  }

  /**
   * ==========================================================
   * EXPIRE PENDING ORDERS
   * ==========================================================
   *
   * Production batch expiration.
   *
   * Semua order yang sudah melewati timeout akan diproses
   * satu per satu.
   *
   * Satu kegagalan tidak menghentikan batch lainnya.
   * ==========================================================
   */

  static async expirePendingOrders(
    timeoutHours:
      | number
      | undefined =
      this.DEFAULT_TIMEOUT_HOURS
  ): Promise<ExpireOrdersResult> {
    const expiredOrders =
      await this.findExpiredOrders(
        timeoutHours
      );

    const expiredOrderIds:
      string[] = [];

    const failedOrders:
      ExpireOrdersResult["failedOrders"] =
      [];

    for (
      const order of expiredOrders
    ) {
      const result =
        await this.expireOrderById(
          order.id
        );

      if (
        result.success &&
        result.expired
      ) {
        expiredOrderIds.push(
          order.id
        );

        continue;
      }

      if (
        result.success
      ) {
        continue;
      }

      failedOrders.push({
        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        error:
          result.message,
      });
    }

    const totalFound =
      expiredOrders.length;

    const totalExpired =
      expiredOrderIds.length;

    const totalFailed =
      failedOrders.length;

    return {
      success:
        totalFailed === 0,

      message:
        totalFound === 0
          ? "Tidak ada order yang melewati batas waktu pembayaran."
          : totalFailed === 0
            ? `${totalExpired} order berhasil diexpire.`
            : `${totalExpired} order berhasil diexpire dan ${totalFailed} order gagal diproses.`,

      totalFound,

      totalExpired,

      totalFailed,

      expiredOrderIds,

      failedOrders,
    };
  }
}

export default OrderExpirationService;
