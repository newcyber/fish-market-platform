import pushSubscriptionRepository from "@/repositories/notification/push-subscription.repository";

import webPushService from "@/services/notification/push/web-push.service";

import type {
  WebPushSubscription,
} from "@/services/notification/push/push.types";

/**
 * ============================================================
 * WEB PUSH ERROR
 * ============================================================
 *
 * Error shape yang mungkin dikembalikan oleh web-push.
 *
 * Tidak menggunakan `any`.
 * ============================================================
 */

interface WebPushErrorLike {
  statusCode?: unknown;
}

/**
 * ============================================================
 * GET WEB PUSH STATUS CODE
 * ============================================================
 */

function getWebPushStatusCode(
  error: unknown
): number | undefined {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return undefined;
  }

  if (
    !("statusCode" in error)
  ) {
    return undefined;
  }

  const candidate =
    error as WebPushErrorLike;

  return typeof candidate.statusCode ===
    "number"
    ? candidate.statusCode
    : undefined;
}

/**
 * ============================================================
 * NOTIFICATION DELIVERY INPUT
 * ============================================================
 *
 * Satu item mewakili satu Notification record milik satu user.
 *
 * Contoh:
 *
 * ADMIN A
 * {
 *   userId: "admin-a",
 *   notificationId: "notification-a",
 *   ...
 * }
 *
 * ADMIN B
 * {
 *   userId: "admin-b",
 *   notificationId: "notification-b",
 *   ...
 * }
 *
 * Dengan struktur ini notificationId tidak mungkin tertukar
 * antar recipient.
 * ============================================================
 */

export interface PushNotificationDeliveryItem {
  userId: string;

  notificationId: string;

  title: string;

  message: string;

  href?: string | null;

  type?: string;

  createdAt?: Date | string;
}

export interface DeliverPushNotificationInput {
  notifications: PushNotificationDeliveryItem[];
}

/**
 * ============================================================
 * DELIVERY RESULT
 * ============================================================
 */

export interface PushDeliveryResult {
  totalNotifications: number;

  totalSubscriptions: number;

  sent: number;

  failed: number;

  removed: number;
}

/**
 * ============================================================
 * PUSH DELIVERY SERVICE
 * ============================================================
 *
 * Tanggung jawab:
 *
 * - Resolve PushSubscription berdasarkan userId.
 * - Mengirim notification ke seluruh device user.
 * - Menggunakan notificationId yang benar untuk user tersebut.
 * - Menghapus subscription yang sudah invalid.
 *
 * Service ini TIDAK menentukan siapa recipient.
 *
 * Recipient sudah ditentukan oleh business logic.
 *
 * Flow:
 *
 * NotificationService
 *        ↓
 * Notification records
 *        ↓
 * PushDeliveryService
 *        ↓
 * PushSubscriptionRepository
 *        ↓
 * WebPushService
 *        ↓
 * Browser Service Worker
 *
 * ============================================================
 */

class PushDeliveryService {
  /**
   * ==========================================================
   * DELIVER
   * ==========================================================
   */

  async deliver(
    input: DeliverPushNotificationInput
  ): Promise<PushDeliveryResult> {
    /**
     * --------------------------------------------------------
     * NORMALIZE NOTIFICATIONS
     * --------------------------------------------------------
     */

    const notifications =
      input.notifications
        .map(
          (notification) => ({
            ...notification,

            userId:
              notification.userId.trim(),

            notificationId:
              notification.notificationId.trim(),

            title:
              notification.title.trim(),

            message:
              notification.message.trim(),

            href:
              notification.href?.trim() ||
              null,
          })
        )
        .filter(
          (notification) =>
            Boolean(
              notification.userId &&
              notification.notificationId &&
              notification.title &&
              notification.message
            )
        );

    /**
     * --------------------------------------------------------
     * NO NOTIFICATIONS
     * --------------------------------------------------------
     */

    if (notifications.length === 0) {
      return {
        totalNotifications: 0,

        totalSubscriptions: 0,

        sent: 0,

        failed: 0,

        removed: 0,
      };
    }

    /**
     * --------------------------------------------------------
     * RESOLVE UNIQUE USER IDS
     * --------------------------------------------------------
     */

    const userIds = [
      ...new Set(
        notifications.map(
          (notification) =>
            notification.userId
        )
      ),
    ];

    /**
     * --------------------------------------------------------
     * GET SUBSCRIPTIONS
     * --------------------------------------------------------
     *
     * Satu user bisa memiliki beberapa device/browser.
     */

    const subscriptions =
      await pushSubscriptionRepository.findManyByUserIds(
        userIds
      );

    if (subscriptions.length === 0) {
      return {
        totalNotifications:
          notifications.length,

        totalSubscriptions: 0,

        sent: 0,

        failed: 0,

        removed: 0,
      };
    }

    /**
     * --------------------------------------------------------
     * MAP NOTIFICATION BY USER
     * --------------------------------------------------------
     *
     * Setiap user mendapatkan Notification record miliknya
     * sendiri.
     */

    const notificationByUserId =
      new Map<
        string,
        PushNotificationDeliveryItem
      >();

    for (
      const notification of notifications
    ) {
      notificationByUserId.set(
        notification.userId,
        notification
      );
    }

    let sent = 0;

    let failed = 0;

    let removed = 0;

    /**
     * --------------------------------------------------------
     * SEND TO EVERY DEVICE
     * --------------------------------------------------------
     *
     * Jika satu user mempunyai:
     *
     * Chrome
     * Edge
     * Android WebView/PWA
     *
     * semuanya akan menerima notification yang sama,
     * tetapi notificationId tetap milik user tersebut.
     */

    for (
      const subscription of subscriptions
    ) {
      const notification =
        notificationByUserId.get(
          subscription.userId
        );

      /**
       * Subscription user yang tidak memiliki notification
       * pada delivery batch ini tidak boleh menerima push.
       */

      if (!notification) {
        continue;
      }

      const webPushSubscription:
        WebPushSubscription = {
        endpoint:
          subscription.endpoint,

        keys: {
          p256dh:
            subscription.p256dh,

          auth:
            subscription.auth,
        },
      };

      try {
        await webPushService.sendNotification({
          subscription:
            webPushSubscription,

          title:
            notification.title,

          message:
            notification.message,

          href:
            notification.href,

          notificationId:
            notification.notificationId,

          type:
            notification.type,

          createdAt:
            notification.createdAt instanceof
            Date
              ? notification.createdAt.toISOString()
              : notification.createdAt,
        });

        sent++;
      } catch (error) {
        failed++;

        const statusCode =
          getWebPushStatusCode(
            error
          );

        /**
         * ----------------------------------------------------
         * INVALID SUBSCRIPTION
         * ----------------------------------------------------
         *
         * HTTP 404 / 410 menunjukkan endpoint sudah tidak
         * valid atau subscription sudah expired/revoked.
         *
         * Subscription tersebut aman untuk dihapus.
         */

        if (
          statusCode === 404 ||
          statusCode === 410
        ) {
          try {
            const result =
              await pushSubscriptionRepository.deleteByEndpoint(
                subscription.userId,

                subscription.endpoint
              );

            if (
              result.count > 0
            ) {
              removed +=
                result.count;
            }
          } catch (
            deleteError
          ) {
            console.error(
              "[PUSH_INVALID_SUBSCRIPTION_DELETE_ERROR]",
              {
                userId:
                  subscription.userId,

                endpoint:
                  subscription.endpoint,

                error:
                  deleteError,
              }
            );
          }

          continue;
        }

        /**
         * ----------------------------------------------------
         * OTHER ERROR
         * ----------------------------------------------------
         *
         * Network error, 5xx, provider temporary failure,
         * dan error lainnya tidak langsung menghapus
         * subscription.
         */

        console.error(
          "[PUSH_DELIVERY_ERROR]",
          {
            userId:
              subscription.userId,

            endpoint:
              subscription.endpoint,

            notificationId:
              notification.notificationId,

            statusCode,

            error,
          }
        );
      }
    }

    return {
      totalNotifications:
        notifications.length,

      totalSubscriptions:
        subscriptions.length,

      sent,

      failed,

      removed,
    };
  }
}

const pushDeliveryService =
  new PushDeliveryService();

export default pushDeliveryService;