import { NotificationType } from "@prisma/client";

import notificationRepository from "@/repositories/notification/notification.repository";

/**
 * ============================================================
 * NOTIFICATION SERVICE
 * ============================================================
 *
 * Menangani business logic untuk Notification.
 *
 * Flow:
 *
 * Order Service
 *      ↓
 * Notification Service
 *      ↓
 * Notification Repository
 *      ↓
 * Prisma
 *      ↓
 * Database
 *
 * ============================================================
 */

export interface CreateOrderNotificationInput {
  orderId: string;

  orderNumber: string;

  customerName?: string | null;

  totalAmount?: number | null;
}

export interface NotificationListOptions {
  take?: number;

  skip?: number;

  unreadOnly?: boolean;
}

class NotificationService {
  /**
   * ==========================================================
   * CREATE ORDER NOTIFICATION
   * ==========================================================
   *
   * Membuat notifikasi ketika customer berhasil membuat order.
   */
  async createOrderNotification(
    input: CreateOrderNotificationInput
  ) {
    const customerName =
      input.customerName?.trim() ||
      "Customer";

    const orderNumber =
      input.orderNumber?.trim() ||
      "Pesanan Baru";

    const formattedTotal =
      typeof input.totalAmount === "number"
        ? new Intl.NumberFormat(
            "id-ID",
            {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }
          ).format(input.totalAmount)
        : null;

    const messageParts = [
      `Pesanan baru ${orderNumber} dari ${customerName}.`,
    ];

    if (formattedTotal) {
      messageParts.push(
        `Total pesanan: ${formattedTotal}.`
      );
    }

    return notificationRepository.create({
      title: "Pesanan Baru",

      message:
        messageParts.join(" "),

      type:
        NotificationType.NEW_ORDER,

      href:
        `/admin/orders/${input.orderId}`,
    });
  }

  /**
   * ==========================================================
   * GET LATEST NOTIFICATIONS
   * ==========================================================
   */

  async getLatestNotifications(
    options: NotificationListOptions = {}
  ) {
    return notificationRepository.findMany({
      take: options.take ?? 20,

      skip: options.skip ?? 0,

      unreadOnly:
        options.unreadOnly ?? false,
    });
  }

  /**
   * ==========================================================
   * COUNT UNREAD NOTIFICATIONS
   * ==========================================================
   */

  async getUnreadCount() {
    return notificationRepository.countUnread();
  }

  /**
   * ==========================================================
   * MARK NOTIFICATION AS READ
   * ==========================================================
   */

  async markAsRead(
    notificationId: string
  ) {
    if (!notificationId?.trim()) {
      throw new Error(
        "ID notifikasi tidak valid."
      );
    }

    return notificationRepository.markAsRead(
      notificationId
    );
  }

  /**
   * ==========================================================
   * MARK ALL NOTIFICATIONS AS READ
   * ==========================================================
   */

  async markAllAsRead() {
    return notificationRepository.markAllAsRead();
  }

  /**
   * ==========================================================
   * DELETE NOTIFICATION
   * ==========================================================
   */

  async deleteNotification(
    notificationId: string
  ) {
    if (!notificationId?.trim()) {
      throw new Error(
        "ID notifikasi tidak valid."
      );
    }

    return notificationRepository.delete(
      notificationId
    );
  }
}

const notificationService =
  new NotificationService();

export default notificationService;