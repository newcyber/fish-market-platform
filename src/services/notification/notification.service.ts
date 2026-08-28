import { NotificationType } from "@prisma/client";

import notificationRepository from "@/repositories/notification/notification.repository";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * NOTIFICATION SERVICE
 * ============================================================
 *
 * Business logic untuk Notification.
 *
 * Prinsip:
 *
 * - Notification selalu mempunyai recipient user.
 * - User-facing query selalu user-scoped.
 * - Event system dapat melakukan broadcast ke beberapa user.
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
  userId: string;

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
   * Order baru harus diberitahukan kepada seluruh ADMIN
   * dan SUPER_ADMIN aktif.
   *
   * Customer yang membuat order BUKAN recipient notification
   * admin ini.
   */

  async createOrderNotification(
    input: CreateOrderNotificationInput
  ) {
    const orderId =
      input.orderId?.trim();

    if (!orderId) {
      throw new Error(
        "Order ID tidak valid."
      );
    }

    const orderNumber =
      input.orderNumber?.trim() ||
      "Pesanan Baru";

    const customerName =
      input.customerName?.trim() ||
      "Customer";

    const formattedTotal =
      typeof input.totalAmount ===
      "number"
        ? new Intl.NumberFormat(
            "id-ID",
            {
              style:
                "currency",

              currency:
                "IDR",

              minimumFractionDigits:
                0,
            }
          ).format(
            input.totalAmount
          )
        : null;

    const messageParts = [
      `Pesanan baru ${orderNumber} dari ${customerName}.`,
    ];

    if (formattedTotal) {
      messageParts.push(
        `Total pesanan: ${formattedTotal}.`
      );
    }

    const message =
      messageParts.join(" ");

    /**
     * ========================================================
     * GET ACTIVE ADMIN RECIPIENTS
     * ========================================================
     */

    const recipients =
      await prisma.user.findMany({
        where: {
          role: {
            in: [
              "ADMIN",
              "SUPER_ADMIN",
            ],
          },

          isActive:
            true,

          deletedAt:
            null,
        },

        select: {
          id: true,
        },
      });

    if (recipients.length === 0) {
      /**
       * Tidak ada admin aktif.
       *
       * Order tetap berhasil.
       * Notification tidak perlu dianggap sebagai kegagalan
       * terhadap proses checkout.
       */

      return {
        count: 0,
      };
    }

    /**
     * ========================================================
     * CREATE NOTIFICATIONS
     * ========================================================
     */

    return notificationRepository.createMany(
      recipients.map(
        (recipient) => ({
          userId:
            recipient.id,

          title:
            "Pesanan Baru",

          message,

          type:
            NotificationType.NEW_ORDER,

          href:
            `/admin/orders/${orderId}`,
        })
      )
    );
  }

  /**
   * ==========================================================
   * GET LATEST NOTIFICATIONS
   * ==========================================================
   */

  async getLatestNotifications(
    options: NotificationListOptions
  ) {
    const userId =
      options.userId?.trim();

    if (!userId) {
      throw new Error(
        "User ID tidak valid."
      );
    }

    return notificationRepository.findMany({
      userId,

      take:
        options.take ?? 20,

      skip:
        options.skip ?? 0,

      unreadOnly:
        options.unreadOnly ??
        false,
    });
  }

  /**
   * ==========================================================
   * COUNT UNREAD
   * ==========================================================
   */

  async getUnreadCount(
    userId: string
  ) {
    const normalizedUserId =
      userId?.trim();

    if (!normalizedUserId) {
      throw new Error(
        "User ID tidak valid."
      );
    }

    return notificationRepository.countUnread(
      normalizedUserId
    );
  }

  /**
   * ==========================================================
   * MARK AS READ
   * ==========================================================
   */

  async markAsRead(
    userId: string,
    notificationId: string
  ) {
    const normalizedUserId =
      userId?.trim();

    if (!normalizedUserId) {
      throw new Error(
        "User ID tidak valid."
      );
    }

    const normalizedNotificationId =
      notificationId?.trim();

    if (!normalizedNotificationId) {
      throw new Error(
        "ID notifikasi tidak valid."
      );
    }

    return notificationRepository.markAsRead(
      normalizedUserId,

      normalizedNotificationId
    );
  }

  /**
   * ==========================================================
   * MARK ALL AS READ
   * ==========================================================
   */

  async markAllAsRead(
    userId: string
  ) {
    const normalizedUserId =
      userId?.trim();

    if (!normalizedUserId) {
      throw new Error(
        "User ID tidak valid."
      );
    }

    return notificationRepository.markAllAsRead(
      normalizedUserId
    );
  }

  /**
   * ==========================================================
   * DELETE NOTIFICATION
   * ==========================================================
   */

  async deleteNotification(
    userId: string,
    notificationId: string
  ) {
    const normalizedUserId =
      userId?.trim();

    if (!normalizedUserId) {
      throw new Error(
        "User ID tidak valid."
      );
    }

    const normalizedNotificationId =
      notificationId?.trim();

    if (!normalizedNotificationId) {
      throw new Error(
        "ID notifikasi tidak valid."
      );
    }

    return notificationRepository.delete(
      normalizedUserId,

      normalizedNotificationId
    );
  }
}

const notificationService =
  new NotificationService();

export default notificationService;