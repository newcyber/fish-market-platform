import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import notificationRepository from "@/repositories/notification/notification.repository";
import { WapiCustomerDeliveryAnalyticsRepository } from "@/repositories/notification/wapi-customer-delivery-analytics.repository";
import pushDeliveryService from "@/services/notification/push/push-delivery.service";

export type WapiCustomerDeliveryAnalyticsAlert = {
  active: boolean;
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  notifiedRecipients: number;
};

function hourBucket(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");

  return `${year}${month}${day}${hour}`;
}

function buildAlertMessage(
  health: Awaited<
    ReturnType<typeof WapiCustomerDeliveryAnalyticsRepository.getOverview>
  >["health"],
) {
  return health.reasons.join(" ");
}

export class WapiCustomerDeliveryAnalyticsService {
  static async getOverview() {
    const data = await WapiCustomerDeliveryAnalyticsRepository.getOverview();

    const alert = await this.ensureHealthAlert(data.health);

    return {
      ...data,
      alert,
    };
  }

  /**
   * Creates an in-app + push alert for ADMIN/SUPER_ADMIN only when the
   * operational health is WARNING/CRITICAL.
   *
   * The event key contains the health level, recipient and UTC hour. This
   * makes the alert idempotent while still allowing a persistent incident
   * to be surfaced again on a later hour.
   */
  private static async ensureHealthAlert(
    health: Awaited<
      ReturnType<typeof WapiCustomerDeliveryAnalyticsRepository.getOverview>
    >["health"],
  ): Promise<WapiCustomerDeliveryAnalyticsAlert> {
    const active = health.status !== "HEALTHY";

    if (!active) {
      return {
        active: false,
        status: health.status,
        title: "WAPI sehat",
        message: "Semua indikator delivery berada dalam batas normal.",
        notifiedRecipients: 0,
      };
    }

    const title =
      health.status === "CRITICAL"
        ? "WAPI Customer — CRITICAL"
        : "WAPI Customer — WARNING";

    const message = buildAlertMessage(health);
    const bucket = hourBucket();

    const recipients = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "SUPER_ADMIN"],
        },
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (recipients.length === 0) {
      return {
        active: true,
        status: health.status,
        title,
        message,
        notifiedRecipients: 0,
      };
    }

    const createdNotifications = (
      await Promise.all(
        recipients.map(async (recipient) => {
          const result = await notificationRepository.createIdempotent({
            userId: recipient.id,
            title,
            message,
            type: NotificationType.SYSTEM,
            href: "/admin/notifications/wapi-customer-deliveries",
            eventKey: `WAPI_HEALTH:${health.status}:${bucket}:${recipient.id}`,
          });

          return result.created ? result.notification : null;
        }),
      )
    ).filter((notification): notification is NonNullable<typeof notification> =>
      Boolean(notification),
    );

    if (createdNotifications.length > 0) {
      try {
        await pushDeliveryService.deliver({
          notifications: createdNotifications.map((notification) => ({
            userId: notification.userId,
            notificationId: notification.id,
            title: notification.title,
            message: notification.message,
            href: notification.href,
            type: notification.type,
            createdAt: notification.createdAt,
          })),
        });
      } catch (error) {
        // Health evaluation must never fail because push delivery failed.
        console.error("[WAPI_HEALTH_ALERT_PUSH_ERROR]", error);
      }
    }

    return {
      active: true,
      status: health.status,
      title,
      message,
      notifiedRecipients: createdNotifications.length,
    };
  }
}
