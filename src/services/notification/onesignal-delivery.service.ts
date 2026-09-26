import { env } from "@/lib/env";

/**
 * ============================================================
 * ONESIGNAL DELIVERY SERVICE
 * ============================================================
 *
 * Server-side transactional push delivery for the Median
 * native Android/iOS app and OneSignal Web subscriptions.
 *
 * User identity:
 * - OneSignal External ID = Pisjo Market user.id
 *
 * Targeting:
 * - include_aliases.external_id
 * - target_channel = push
 *
 * The database Notification remains the source of truth.
 * OneSignal delivery is best-effort and must never break an
 * order, payment, shipment, or reward transaction.
 *
 * ============================================================
 */

const ONESIGNAL_API_URL = "https://api.onesignal.com/notifications";

interface OneSignalApiResponse {
  id?: unknown;
  recipients?: unknown;
  errors?: unknown;
}

export interface OneSignalDeliveryItem {
  userId: string;
  title: string;
  message: string;
  href?: string | null;
  notificationId?: string;
  type?: string;
  createdAt?: Date | string;
}

export interface OneSignalDeliveryResult {
  enabled: boolean;
  totalNotifications: number;
  attempted: number;
  sent: number;
  failed: number;
  noSubscription: number;
}

function getTargetUrl(href?: string | null): string | undefined {
  const normalizedHref = href?.trim();

  if (!normalizedHref) {
    return undefined;
  }

  /**
   * Median requires `targetUrl` inside Additional Data for
   * in-app navigation when a notification is tapped.
   *
   * AUTH_URL is the storefront/app URL in production.
   */
  const baseUrl =
    env.APP_URL?.trim() ||
    env.AUTH_URL?.trim() ||
    "https://app.pusatikansegar.com";

  try {
    return new URL(normalizedHref, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function normalizeCreatedAt(value?: Date | string): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const normalized = value.trim();

  return normalized || undefined;
}

class OneSignalDeliveryService {
  /**
   * ==========================================================
   * IS ENABLED
   * ==========================================================
   */

  isEnabled(): boolean {
    return Boolean(env.ONESIGNAL_APP_ID && env.ONESIGNAL_REST_API_KEY);
  }

  /**
   * ==========================================================
   * DELIVER
   * ==========================================================
   */

  async deliver(
    notifications: OneSignalDeliveryItem[],
  ): Promise<OneSignalDeliveryResult> {
    const normalized = notifications
      .map((notification) => ({
        ...notification,
        userId: notification.userId.trim(),
        title: notification.title.trim(),
        message: notification.message.trim(),
        href: notification.href?.trim() || null,
      }))
      .filter((notification) =>
        Boolean(
          notification.userId && notification.title && notification.message,
        ),
      );

    if (!this.isEnabled()) {
      return {
        enabled: false,
        totalNotifications: normalized.length,
        attempted: 0,
        sent: 0,
        failed: 0,
        noSubscription: 0,
      };
    }

    if (normalized.length === 0) {
      return {
        enabled: true,
        totalNotifications: 0,
        attempted: 0,
        sent: 0,
        failed: 0,
        noSubscription: 0,
      };
    }

    let attempted = 0;
    let sent = 0;
    let failed = 0;
    let noSubscription = 0;

    /**
     * One item is intentionally sent per recipient.
     *
     * This keeps each Notification record's href/type/data
     * correctly associated with its user and avoids a large
     * refactor of the existing notification architecture.
     */
    for (const notification of normalized) {
      attempted += 1;

      const targetUrl = getTargetUrl(notification.href);

      const data: Record<string, string> = {
        notificationId: notification.notificationId?.trim() || "",
        type: notification.type?.trim() || "SYSTEM",
      };

      if (targetUrl) {
        /**
         * Reserved Median key:
         * opens the URL inside the Median app.
         */
        data.targetUrl = targetUrl;
      }

      const createdAt = normalizeCreatedAt(notification.createdAt);

      if (createdAt) {
        data.createdAt = createdAt;
      }

      const body: Record<string, unknown> = {
        app_id: env.ONESIGNAL_APP_ID,
        target_channel: "push",
        headings: {
          en: notification.title,
        },
        contents: {
          en: notification.message,
        },
        include_aliases: {
          external_id: [notification.userId],
        },
        data,
      };

      try {
        const response = await fetch(ONESIGNAL_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Key ${env.ONESIGNAL_REST_API_KEY}`,
          },
          body: JSON.stringify(body),
          cache: "no-store",
        });

        const rawText = await response.text();

        let result: OneSignalApiResponse | null = null;

        if (rawText.trim()) {
          try {
            result = JSON.parse(rawText) as OneSignalApiResponse;
          } catch {
            result = null;
          }
        }

        if (!response.ok) {
          failed += 1;

          console.error("[ONESIGNAL_DELIVERY_ERROR]", {
            status: response.status,
            statusText: response.statusText,
            userId: notification.userId,
            notificationId: notification.notificationId,
            response: result ?? rawText,
          });

          continue;
        }

        /**
         * OneSignal may return HTTP 200 without a message ID
         * when no matching subscribed recipient exists.
         */
        if (!result?.id) {
          noSubscription += 1;

          console.info("[ONESIGNAL_NO_SUBSCRIBED_RECIPIENT]", {
            userId: notification.userId,
            notificationId: notification.notificationId,
            response: result,
          });

          continue;
        }

        sent += 1;
      } catch (error) {
        failed += 1;

        console.error("[ONESIGNAL_DELIVERY_NETWORK_ERROR]", {
          userId: notification.userId,
          notificationId: notification.notificationId,
          error,
        });
      }
    }

    return {
      enabled: true,
      totalNotifications: normalized.length,
      attempted,
      sent,
      failed,
      noSubscription,
    };
  }
}

const oneSignalDeliveryService = new OneSignalDeliveryService();

export default oneSignalDeliveryService;
