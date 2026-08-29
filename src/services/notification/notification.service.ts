import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import notificationRepository from "@/repositories/notification/notification.repository";

import pushDeliveryService from "@/services/notification/push/push-delivery.service";

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
 * Push notification:
 *
 * - Bersifat best-effort.
 * - Kegagalan push tidak menggagalkan notification database.
 * - Kegagalan push tidak menggagalkan checkout/order.
 * - Detail Web Push ditangani oleh PushDeliveryService.
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
   *
   * Flow:
   *
   * Order
   *   ↓
   * resolve active admin recipients
   *   ↓
   * create Notification records
   *   ↓
   * PushDeliveryService
   *   ↓
   * seluruh device recipient
   *
   * Push bersifat best-effort.
   */

  async createOrderNotification(
    input: CreateOrderNotificationInput
  ) {
    /**
     * --------------------------------------------------------
     * VALIDATE ORDER ID
     * --------------------------------------------------------
     */

    const orderId =
      input.orderId?.trim();

    if (!orderId) {
      throw new Error(
        "Order ID tidak valid."
      );
    }

    /**
     * --------------------------------------------------------
     * NORMALIZE MESSAGE DATA
     * --------------------------------------------------------
     */

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
     *
     * Recipient ditentukan sepenuhnya oleh server.
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

    /**
     * --------------------------------------------------------
     * NO ACTIVE RECIPIENT
     * --------------------------------------------------------
     */

    if (recipients.length === 0) {
      return {
        count: 0,

        push: {
          totalSubscriptions: 0,
          sent: 0,
          failed: 0,
          removed: 0,
        },
      };
    }

    /**
     * ========================================================
     * CREATE NOTIFICATIONS
     * ========================================================
     *
     * createManyAndReturn() digunakan karena kita membutuhkan
     * ID notification untuk payload Web Push.
     */

const notifications =
  await notificationRepository.createManyAndReturn(
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

        orderId,
      })
    )
  );

    /**
     * ========================================================
     * WEB PUSH DELIVERY
     * ========================================================
     *
     * Push tidak boleh menggagalkan proses order.
     *
     * PushDeliveryService menangani:
     *
     * - pencarian subscription
     * - pengiriman ke seluruh device
     * - invalid subscription 404/410
     * - cleanup subscription invalid
     * - error handling per subscription
     */

    let pushResult = {
  totalNotifications: 0,
  totalSubscriptions: 0,
  sent: 0,
  failed: 0,
  removed: 0,
};

try {
  pushResult =
    await pushDeliveryService.deliver({
      notifications:
        notifications.map(
          (notification) => ({
            userId:
              notification.userId,

            notificationId:
              notification.id,

            title:
              notification.title,

            message:
              notification.message,

            href:
              notification.href,

            type:
              notification.type,

            createdAt:
              notification.createdAt,
          })
        ),
    });
} catch (error) {
  console.error(
    "[WEB_PUSH_DELIVERY_FATAL_ERROR]",
    error
  );
}

    /**
     * ========================================================
     * RESULT
     * ========================================================
     */

    return {
      count:
        notifications.length,

      push:
        pushResult,
    };
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