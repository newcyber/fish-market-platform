import { WapiDeliveryStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  normalizeWhatsAppPhone,
  whatsappService,
} from "@/services/whatsapp/whatsapp.service";
import {
  classifyWapiCustomerError,
  formatWapiCustomerError,
  parseWapiCustomerError,
} from "@/services/notification/wapi-customer-error";

const WAPI_RETRY_COOLDOWN_MS = 60_000;

function getRetryCooldown(delivery: {
  attempts: number;
  status: string;
  updatedAt?: Date | null;
  createdAt?: Date | null;
}) {
  if (delivery.status !== "FAILED") {
    return null;
  }

  const attempts = Math.max(1, delivery.attempts || 1);

  // Exponential backoff:
  // attempt 1 -> 1 menit
  // attempt 2 -> 2 menit
  // attempt 3 -> 4 menit
  // dst, maksimal 15 menit.
  const cooldownMs = Math.min(
    WAPI_RETRY_COOLDOWN_MS * 2 ** (attempts - 1),
    15 * 60_000,
  );

  const baseDate = delivery.updatedAt ?? delivery.createdAt;

  if (!baseDate) {
    return null;
  }

  const nextRetryAt = new Date(baseDate.getTime() + cooldownMs);
  const remainingMs = Math.max(0, nextRetryAt.getTime() - Date.now());

  return {
    cooldownMs,
    nextRetryAt,
    remainingMs,
    delayMinutes: Math.ceil(remainingMs / 60_000),
    blocked: remainingMs > 0,
  };
}

const MAX_ATTEMPTS = Math.min(
  10,
  Math.max(1, Number(process.env.WAPI_CUSTOMER_MAX_ATTEMPTS || 3)),
);

const RETRY_BACKOFF_MINUTES = [5, 15] as const;

export type WapiCustomerEventType =
  | "ORDER_CREATED"
  | "ORDER_STATUS"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_REJECTED"
  | "REWARD_POINTS";

const EVENT_TYPES = new Set<WapiCustomerEventType>([
  "ORDER_CREATED",
  "ORDER_STATUS",
  "PAYMENT_VERIFIED",
  "PAYMENT_REJECTED",
  "REWARD_POINTS",
]);

export interface DeliverCustomerWapiInput {
  userId: string;
  orderId?: string | null;
  eventKey: string;
  eventType: WapiCustomerEventType;
  message: string;
}

export interface DeliverCustomerWapiResult {
  status:
    | "SENT"
    | "SKIPPED"
    | "FAILED"
    | "ALREADY_SENT"
    | "IN_PROGRESS"
    | "BLOCKED";
  deliveryId?: string;
  messageId?: string;
  errorMessage?: string;
  attempts?: number;
}

function normalizeText(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} tidak valid.`);
  }

  return normalized;
}

function normalizeEventType(value: string): WapiCustomerEventType {
  const normalized = value.trim().toUpperCase() as WapiCustomerEventType;

  if (!EVENT_TYPES.has(normalized)) {
    throw new Error(`Event type WhatsApp customer tidak didukung: ${value}.`);
  }

  return normalized;
}

/**
 * Customer-facing WhatsApp delivery engine.
 *
 * Concurrency guarantee:
 * - eventKey is the database idempotency key.
 * - PostgreSQL transaction advisory lock serializes concurrent attempts
 *   for the same eventKey before the gateway is called.
 * - The delivery row is claimed atomically inside that transaction.
 *
 * Important:
 * The gateway contract currently exposes no idempotency key. Therefore
 * exactly-once delivery cannot be mathematically guaranteed across a
 * process crash after the provider accepts a message but before our DB
 * transaction commits. This service deliberately favors no concurrent
 * duplicate sends and documents that provider limitation rather than
 * pretending it is solved.
 */
export class WapiCustomerDeliveryService {
  static async deliver(
    input: DeliverCustomerWapiInput,
  ): Promise<DeliverCustomerWapiResult> {
    const userId = normalizeText(input.userId, "User ID");
    const eventKey = normalizeText(input.eventKey, "Event key");
    const eventType = normalizeEventType(input.eventType);
    const message = normalizeText(input.message, "WhatsApp message");
    const orderId = input.orderId?.trim() || null;

    /*
     * Do not perform a stale PROCESSING reset here.
     *
     * A request that is still alive may legitimately take longer than a
     * timeout. Resetting it from another request can cause two gateway
     * calls for the same event. Recovery must be an explicit operational
     * action once the provider supports idempotency or the process is known
     * to have terminated.
     */
    return prisma.$transaction(
      async (tx) => {
        // PostgreSQL advisory transaction locks are released automatically
        // on commit/rollback, including when the process throws.
        // pg_advisory_xact_lock() returns PostgreSQL VOID.
        // $queryRaw tries to deserialize that VOID result and causes Prisma P2010.
        // $executeRaw is the correct API because we only need the lock side-effect.
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(hashtext(${eventKey}))
        `;

        const storeSettings = await tx.storeSettings.findFirst({
          select: {
            wapiCustomerNotificationEnabled: true,
            wapiCustomerOrderCreatedEnabled: true,
            wapiCustomerOrderStatusEnabled: true,
            wapiCustomerPaymentVerifiedEnabled: true,
            wapiCustomerPaymentRejectedEnabled: true,
            wapiCustomerRewardPointsEnabled: true,
          },
        });

        if (!storeSettings?.wapiCustomerNotificationEnabled) {
          return {
            status: "BLOCKED" as const,
            errorMessage:
              "Notifikasi WhatsApp transaksional customer dinonaktifkan admin.",
          };
        }

        const eventEnabled =
          eventType === "ORDER_CREATED"
            ? storeSettings.wapiCustomerOrderCreatedEnabled
            : eventType === "ORDER_STATUS"
              ? storeSettings.wapiCustomerOrderStatusEnabled
              : eventType === "PAYMENT_VERIFIED"
                ? storeSettings.wapiCustomerPaymentVerifiedEnabled
                : eventType === "PAYMENT_REJECTED"
                  ? storeSettings.wapiCustomerPaymentRejectedEnabled
                  : storeSettings.wapiCustomerRewardPointsEnabled;

        if (!eventEnabled) {
          return {
            status: "BLOCKED" as const,
            errorMessage: `Notifikasi WhatsApp customer untuk event ${eventType} dinonaktifkan admin.`,
          };
        }

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            phone: true,
            isActive: true,
            deletedAt: true,
            wapiTransactionalEnabled: true,
          },
        });

        if (!user || !user.isActive || user.deletedAt) {
          return {
            status: "SKIPPED" as const,
            errorMessage: "Customer tidak aktif atau tidak ditemukan.",
          };
        }

        if (!user.wapiTransactionalEnabled) {
          return {
            status: "SKIPPED" as const,
            errorMessage:
              "Notifikasi WhatsApp transaksional dinonaktifkan customer.",
          };
        }

        const rawPhone = user.phone?.trim();

        if (!rawPhone) {
          return {
            status: "SKIPPED" as const,
            errorMessage: "Customer tidak memiliki nomor WhatsApp.",
          };
        }

        let phone: string;

        try {
          phone = normalizeWhatsAppPhone(rawPhone);
        } catch (error) {
          return {
            status: "SKIPPED" as const,
            errorMessage:
              error instanceof Error
                ? error.message
                : "Nomor WhatsApp customer tidak valid.",
          };
        }

        const existing = await tx.wapiCustomerDelivery.findUnique({
          where: { eventKey },
          select: {
            id: true,
              status: true,
              attempts: true,
              messageId: true,
              errorMessage: true,
              updatedAt: true,
            createdAt: true,
          },
        });

        if (existing?.status === WapiDeliveryStatus.SENT) {
          return {
            status: "ALREADY_SENT" as const,
            deliveryId: existing.id,
            messageId: existing.messageId ?? undefined,
            attempts: existing.attempts,
          };
        }

        if (existing?.status === WapiDeliveryStatus.PROCESSING) {
          return {
            status: "IN_PROGRESS" as const,
            deliveryId: existing.id,
            attempts: existing.attempts,
          };
        }

        const delivery = await tx.wapiCustomerDelivery.upsert({
          where: { eventKey },
          create: {
            userId,
            orderId,
            eventKey,
            eventType,
            phone,
            message,
            status: WapiDeliveryStatus.PENDING,
          },
          update: {
            userId,
            orderId,
            eventType,
            phone,
            message,
          },
        });

        if (delivery.attempts >= MAX_ATTEMPTS) {
          return {
            status: "FAILED" as const,
            deliveryId: delivery.id,
            attempts: delivery.attempts,
            errorMessage:
              delivery.errorMessage ||
              `Batas retry ${MAX_ATTEMPTS} kali telah tercapai.`,
          };
        }

        if (delivery.status === WapiDeliveryStatus.FAILED && delivery.errorMessage) {
          const classified = parseWapiCustomerError(delivery.errorMessage);

          if (classified && !classified.retryable) {
            return {
              status: "BLOCKED" as const,
              deliveryId: delivery.id,
              attempts: delivery.attempts,
              errorMessage: `Retry diblokir: ${classified.code}. ${classified.message}`,
            };
          }

          const cooldown = getRetryCooldown(delivery);
          if (cooldown?.blocked) {
            return {
              status: "BLOCKED" as const,
              deliveryId: delivery.id,
              attempts: delivery.attempts,
              errorMessage: `Retry berikutnya baru dapat dilakukan sekitar ${cooldown.delayMinutes} menit setelah kegagalan terakhir.`,
            };
          }
        }

        const claim = await tx.wapiCustomerDelivery.updateMany({
          where: {
            id: delivery.id,
            status: {
              in: [
                WapiDeliveryStatus.PENDING,
                WapiDeliveryStatus.FAILED,
              ],
            },
            attempts: {
              lt: MAX_ATTEMPTS,
            },
          },
          data: {
            status: WapiDeliveryStatus.PROCESSING,
            processingStartedAt: new Date(),
            errorMessage: null,
          },
        });

        if (claim.count !== 1) {
          const current = await tx.wapiCustomerDelivery.findUnique({
            where: { id: delivery.id },
            select: {
              status: true,
              attempts: true,
              messageId: true,
              errorMessage: true,
            },
          });

          if (current?.status === WapiDeliveryStatus.SENT) {
            return {
              status: "ALREADY_SENT" as const,
              deliveryId: delivery.id,
              messageId: current.messageId ?? undefined,
              attempts: current.attempts,
            };
          }

          return {
            status: "IN_PROGRESS" as const,
            deliveryId: delivery.id,
            attempts: current?.attempts ?? delivery.attempts,
            errorMessage: current?.errorMessage ?? undefined,
          };
        }

        try {
          const result = await whatsappService.sendText({
            phone,
            message,
          });

          const updated = await tx.wapiCustomerDelivery.update({
            where: {
              id: delivery.id,
            },
            data: {
              status: WapiDeliveryStatus.SENT,
              messageId: result.messageId,
              jid: result.jid,
              attempts: {
                increment: 1,
              },
              errorMessage: null,
              processingStartedAt: null,
              sentAt: new Date(),
            },
            select: {
              attempts: true,
            },
          });

          return {
            status: "SENT" as const,
            deliveryId: delivery.id,
            messageId: result.messageId,
            attempts: updated.attempts,
          };
        } catch (error) {
          const classified = classifyWapiCustomerError(error);
          const errorMessage = formatWapiCustomerError(classified);

          const updated = await tx.wapiCustomerDelivery.update({
            where: {
              id: delivery.id,
            },
            data: {
              status: WapiDeliveryStatus.FAILED,
              attempts: {
                increment: 1,
              },
              errorMessage,
              processingStartedAt: null,
            },
            select: {
              attempts: true,
            },
          });

          console.error("[WAPI_CUSTOMER_DELIVERY_ERROR]", {
            userId,
            orderId,
            eventKey,
            eventType,
            attempts: updated.attempts,
            error,
          });

          return {
            status: "FAILED" as const,
            deliveryId: delivery.id,
            attempts: updated.attempts,
            errorMessage,
          };
        }
      },
      {
        maxWait: 10_000,
        timeout: Math.max(
          30_000,
          Number(process.env.WAPI_CUSTOMER_TRANSACTION_TIMEOUT_MS || 30_000),
        ),
      },
    );
  }

  /**
   * Controlled admin retry.
   *
   * This deliberately respects MAX_ATTEMPTS. An administrator can retry a
   * failed delivery only while the delivery still has retry capacity.
   * The normal deliver() path keeps the same eventKey, so the existing
   * advisory-lock + unique-key idempotency guarantees remain in force.
   */
  static async retryFailedDelivery(
    deliveryId: string,
  ): Promise<DeliverCustomerWapiResult> {
    const normalizedId = normalizeText(deliveryId, "Delivery ID");

    const delivery = await prisma.wapiCustomerDelivery.findUnique({
      where: { id: normalizedId },
      select: {
        id: true,
        userId: true,
        orderId: true,
        eventKey: true,
        eventType: true,
        message: true,
        status: true,
        attempts: true,
        errorMessage: true,
        updatedAt: true,
      },
    });

    if (!delivery) {
      throw new Error("WAPI customer delivery tidak ditemukan.");
    }

    if (delivery.status === WapiDeliveryStatus.SENT) {
      return {
        status: "ALREADY_SENT",
        deliveryId: delivery.id,
        attempts: delivery.attempts,
      };
    }

    if (delivery.status === WapiDeliveryStatus.PROCESSING) {
      return {
        status: "IN_PROGRESS",
        deliveryId: delivery.id,
        attempts: delivery.attempts,
      };
    }

    if (delivery.status !== WapiDeliveryStatus.FAILED) {
      throw new Error(
        `Delivery dengan status ${delivery.status} tidak dapat di-retry manual.`,
      );
    }

    if (delivery.attempts >= MAX_ATTEMPTS) {
      return {
        status: "FAILED",
        deliveryId: delivery.id,
        attempts: delivery.attempts,
        errorMessage:
          delivery.errorMessage ||
          `Batas retry ${MAX_ATTEMPTS} kali telah tercapai.`,
      };
    }

    const classified = parseWapiCustomerError(delivery.errorMessage);

    if (classified && !classified.retryable) {
      return {
        status: "BLOCKED",
        deliveryId: delivery.id,
        attempts: delivery.attempts,
        errorMessage: `Retry diblokir: ${classified.code}. ${classified.message}`,
      };
    }

    const cooldown = getRetryCooldown(delivery);

    if (cooldown?.blocked) {
      return {
        status: "BLOCKED",
        deliveryId: delivery.id,
        attempts: delivery.attempts,
        errorMessage: `Retry berikutnya baru dapat dilakukan sekitar ${cooldown.delayMinutes} menit setelah kegagalan terakhir.`,
      };
    }

    return this.deliver({
      userId: delivery.userId,
      orderId: delivery.orderId,
      eventKey: delivery.eventKey,
      eventType: delivery.eventType as WapiCustomerEventType,
      message: delivery.message,
    });
  }

  static async getDeliveryById(deliveryId: string) {
    return prisma.wapiCustomerDelivery.findUnique({
      where: { id: normalizeText(deliveryId, "Delivery ID") },
      select: {
        id: true,
        eventType: true,
        status: true,
        attempts: true,
      },
    });
  }

  static async getDeliveryByEventKey(eventKey: string) {
    return prisma.wapiCustomerDelivery.findUnique({
      where: { eventKey: normalizeText(eventKey, "Event key") },
    });
  }

  static async getRecentForCustomer(userId: string, limit = 20) {
    const take = Math.min(100, Math.max(1, limit));

    return prisma.wapiCustomerDelivery.findMany({
      where: { userId: normalizeText(userId, "User ID") },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        orderId: true,
        eventKey: true,
        eventType: true,
        phone: true,
        status: true,
        messageId: true,
        attempts: true,
        errorMessage: true,
        sentAt: true,
        createdAt: true,
      },
    });
  }
}

export default WapiCustomerDeliveryService;
