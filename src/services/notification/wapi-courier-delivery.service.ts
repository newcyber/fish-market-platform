import { WapiDeliveryStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  normalizeWhatsAppPhone,
  whatsappService,
} from "@/services/whatsapp/whatsapp.service";

const MAX_ATTEMPTS = Math.min(
  10,
  Math.max(1, Number(process.env.WAPI_COURIER_MAX_ATTEMPTS || 3)),
);

const RETRY_COOLDOWN_MS = 60_000;

export type WapiCourierEventType = "ASSIGNMENT";

export interface DeliverCourierWapiInput {
  assignmentId: string;
  courierId: string;
  orderId: string;
  eventKey: string;
  eventType: WapiCourierEventType;
  message: string;
}

export interface DeliverCourierWapiResult {
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

function normalizeRequired(value: string, field: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} tidak valid.`);
  }

  return normalized;
}

function getRetryCooldown(delivery: {
  attempts: number;
  status: string;
  updatedAt: Date;
}) {
  if (delivery.status !== WapiDeliveryStatus.FAILED) {
    return null;
  }

  const attempts = Math.max(1, delivery.attempts);
  const cooldownMs = Math.min(
    RETRY_COOLDOWN_MS * 2 ** (attempts - 1),
    15 * 60_000,
  );
  const nextRetryAt = delivery.updatedAt.getTime() + cooldownMs;
  const remainingMs = Math.max(0, nextRetryAt - Date.now());

  return {
    blocked: remainingMs > 0,
    delayMinutes: Math.ceil(remainingMs / 60_000),
  };
}

/**
 * Courier-facing WhatsApp delivery engine.
 *
 * V1 hanya mendukung event ASSIGNMENT. Delivery memiliki ledger terpisah
 * dari customer karena lifecycle courier dan kebutuhan audit/retry berbeda.
 *
 * eventKey + PostgreSQL advisory transaction lock mencegah dua request
 * concurrent mengirim event assignment yang sama.
 */
export class WapiCourierDeliveryService {
  static async deliver(
    input: DeliverCourierWapiInput,
  ): Promise<DeliverCourierWapiResult> {
    const assignmentId = normalizeRequired(
      input.assignmentId,
      "Assignment ID",
    );
    const courierId = normalizeRequired(input.courierId, "Courier ID");
    const orderId = normalizeRequired(input.orderId, "Order ID");
    const eventKey = normalizeRequired(input.eventKey, "Event key");
    const message = normalizeRequired(input.message, "WhatsApp message");

    if (input.eventType !== "ASSIGNMENT") {
      throw new Error(
        `Event WhatsApp courier tidak didukung: ${input.eventType}.`,
      );
    }

    return prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(hashtext(${eventKey}))
        `;

        const settings = await tx.storeSettings.findFirst({
          select: {
            wapiCourierNotificationEnabled: true,
            wapiCourierAssignmentEnabled: true,
          },
        });

        if (!settings?.wapiCourierNotificationEnabled) {
          return {
            status: "BLOCKED" as const,
            errorMessage:
              "Notifikasi WhatsApp courier dinonaktifkan admin.",
          };
        }

        if (!settings.wapiCourierAssignmentEnabled) {
          return {
            status: "BLOCKED" as const,
            errorMessage:
              "Notifikasi WhatsApp penugasan courier dinonaktifkan admin.",
          };
        }

        const courier = await tx.user.findFirst({
          where: {
            id: courierId,
            role: "COURIER",
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            phone: true,
          },
        });

        if (!courier) {
          return {
            status: "SKIPPED" as const,
            errorMessage: "Courier tidak aktif atau tidak ditemukan.",
          };
        }

        if (!courier.phone?.trim()) {
          return {
            status: "SKIPPED" as const,
            errorMessage: "Courier tidak memiliki nomor WhatsApp.",
          };
        }

        let phone: string;

        try {
          phone = normalizeWhatsAppPhone(courier.phone);
        } catch (error) {
          return {
            status: "SKIPPED" as const,
            errorMessage:
              error instanceof Error
                ? error.message
                : "Nomor WhatsApp courier tidak valid.",
          };
        }

        const existing = await tx.wapiCourierDelivery.findUnique({
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

        const delivery = await tx.wapiCourierDelivery.upsert({
          where: { eventKey },
          create: {
            assignmentId,
            courierId,
            orderId,
            eventKey,
            eventType: input.eventType,
            phone,
            message,
            status: WapiDeliveryStatus.PENDING,
          },
          update: {
            assignmentId,
            courierId,
            orderId,
            eventType: input.eventType,
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

        if (delivery.status === WapiDeliveryStatus.FAILED) {
          const cooldown = getRetryCooldown(delivery);

          if (cooldown?.blocked) {
            return {
              status: "BLOCKED" as const,
              deliveryId: delivery.id,
              attempts: delivery.attempts,
              errorMessage: `Retry berikutnya baru dapat dilakukan sekitar ${cooldown.delayMinutes} menit.`,
            };
          }
        }

        const claim = await tx.wapiCourierDelivery.updateMany({
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
          const current = await tx.wapiCourierDelivery.findUnique({
            where: { id: delivery.id },
            select: {
              status: true,
              attempts: true,
              messageId: true,
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
          };
        }

        try {
          const result = await whatsappService.sendText({
            phone,
            message,
          });

          const updated = await tx.wapiCourierDelivery.update({
            where: { id: delivery.id },
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
          const errorMessage =
            error instanceof Error
              ? error.message
              : "WhatsApp courier delivery gagal.";

          const updated = await tx.wapiCourierDelivery.update({
            where: { id: delivery.id },
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

          console.error("[WAPI_COURIER_DELIVERY_ERROR]", {
            assignmentId,
            courierId,
            orderId,
            eventKey,
            eventType: input.eventType,
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
          Number(process.env.WAPI_COURIER_TRANSACTION_TIMEOUT_MS || 30_000),
        ),
      },
    );
  }
}

export default WapiCourierDeliveryService;
