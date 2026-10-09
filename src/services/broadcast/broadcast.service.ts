import {
  BroadcastAudienceType,
  BroadcastChannel,
  BroadcastRecipientStatus,
  BroadcastSourceType,
  BroadcastStatus,
  NotificationType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import pushDeliveryService from "@/services/notification/push/push-delivery.service";

const MAX_BATCH = 200;
const STALE_SENDING_MS = 15 * 60 * 1000;

export interface CreateBroadcastInput {
  title: string;
  message: string;
  imageUrl?: string | null;
  href?: string | null;
  audienceType?: BroadcastAudienceType;
  customerIds?: string[];
  scheduledAt?: Date | null;
  sourceType?: BroadcastSourceType;
  sourceKey?: string;
}

class BroadcastService {
  static async list(limit = 50) {
    return prisma.broadcast.findMany({
      take: Math.min(Math.max(limit, 1), 100),
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { recipients: true } },
      },
    });
  }

  static async create(input: CreateBroadcastInput, createdById: string) {
    const title = input.title?.trim();
    const message = input.message?.trim();
    if (!title || title.length > 150) throw new Error("Judul broadcast wajib diisi dan maksimal 150 karakter.");
    if (!message || message.length > 5000) throw new Error("Pesan broadcast wajib diisi dan maksimal 5000 karakter.");
    if (!createdById?.trim()) throw new Error("Admin pembuat tidak valid.");

    const audienceType = input.audienceType ?? BroadcastAudienceType.ALL_CUSTOMERS;
    const customerIds = [...new Set((input.customerIds ?? []).map((id) => id.trim()).filter(Boolean))];

    if (audienceType === BroadcastAudienceType.SELECTED_CUSTOMERS && customerIds.length === 0) {
      throw new Error("Pilih minimal satu customer.");
    }

    const scheduledAt = input.scheduledAt ?? null;
    const status = scheduledAt && scheduledAt.getTime() > Date.now()
      ? BroadcastStatus.SCHEDULED
      : BroadcastStatus.DRAFT;

    const sourceType = input.sourceType ?? BroadcastSourceType.CUSTOM;
    const sourceKey = input.sourceKey?.trim() || `CUSTOM:${crypto.randomUUID()}`;

    return prisma.broadcast.create({
      data: {
        title,
        message,
        imageUrl: input.imageUrl?.trim() || null,
        href: input.href?.trim() || null,
        audienceType,
        channel: BroadcastChannel.IN_APP,
        sourceType,
        sourceKey,
        scheduledAt,
        status,
        createdById,
        recipients: audienceType === BroadcastAudienceType.SELECTED_CUSTOMERS
          ? {
              create: customerIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
    });
  }


  static async syncFlashSaleBroadcast(flashSale: { id: string; name: string; description: string | null; banner: string | null; slug: string; status: string; startAt: Date; endAt: Date }) {
    return this.syncCampaignBroadcast({
      sourceType: BroadcastSourceType.FLASH_SALE,
      sourceKey: `FLASH_SALE:${flashSale.id}`,
      title: `🔥 ${flashSale.name}`,
      message: flashSale.description?.trim() || `Flash Sale ${flashSale.name} sudah dimulai. Jangan sampai kehabisan!`,
      imageUrl: flashSale.banner,
      href: `/flash-sale/${flashSale.slug}`,
      status: flashSale.status,
      startAt: flashSale.startAt,
      endAt: flashSale.endAt,
    });
  }

  static async syncPromotionBroadcast(promotion: { id: string; name: string; description: string | null; banner: string | null; slug: string; status: string; startAt: Date | null; endAt: Date | null }) {
    if (!promotion.startAt) return null;
    return this.syncCampaignBroadcast({
      sourceType: BroadcastSourceType.PROMOTION,
      sourceKey: `PROMOTION:${promotion.id}`,
      title: `🎁 ${promotion.name}`,
      message: promotion.description?.trim() || `Promo ${promotion.name} sedang berlangsung. Cek penawaran PISJO sekarang!`,
      imageUrl: promotion.banner,
      href: `/promotions/${promotion.slug}`,
      status: promotion.status,
      startAt: promotion.startAt,
      endAt: promotion.endAt,
    });
  }

  private static async syncCampaignBroadcast(input: {
    sourceType: BroadcastSourceType;
    sourceKey: string;
    title: string;
    message: string;
    imageUrl: string | null;
    href: string;
    status: string;
    startAt: Date;
    endAt: Date | null;
  }) {
    const terminal = input.status === "DRAFT" || input.status === "CANCELLED" || input.status === "ENDED";
    const existing = await prisma.broadcast.findUnique({ where: { sourceKey: input.sourceKey } });

    if (terminal) {
      if (
        existing &&
        (existing.status === BroadcastStatus.DRAFT ||
          existing.status === BroadcastStatus.SCHEDULED)
      ) {
        await prisma.broadcast.update({ where: { id: existing.id }, data: { status: BroadcastStatus.CANCELLED } });
      }
      return existing;
    }

    if (
      existing?.status === BroadcastStatus.SENDING ||
      existing?.status === BroadcastStatus.SENT ||
      existing?.status === BroadcastStatus.PARTIAL
    ) {
      return existing;
    }

    const shouldSendNow = input.startAt.getTime() <= Date.now();
    const broadcast = await prisma.broadcast.upsert({
      where: { sourceKey: input.sourceKey },
      update: {
        title: input.title,
        message: input.message,
        imageUrl: input.imageUrl,
        href: input.href,
        scheduledAt: input.startAt,
        status: shouldSendNow ? BroadcastStatus.DRAFT : BroadcastStatus.SCHEDULED,
      },
      create: {
        title: input.title,
        message: input.message,
        imageUrl: input.imageUrl,
        href: input.href,
        audienceType: BroadcastAudienceType.ALL_CUSTOMERS,
        channel: BroadcastChannel.IN_APP,
        sourceType: input.sourceType,
        sourceKey: input.sourceKey,
        scheduledAt: input.startAt,
        status: shouldSendNow ? BroadcastStatus.DRAFT : BroadcastStatus.SCHEDULED,
        createdById: null,
      },
    });

    if (shouldSendNow) {
      await this.process(broadcast.id);
    }

    return broadcast;
  }

  static async cancel(id: string) {
    return prisma.broadcast.updateMany({
      where: {
        id,
        status: { in: [BroadcastStatus.DRAFT, BroadcastStatus.SCHEDULED] },
      },
      data: { status: BroadcastStatus.CANCELLED },
    });
  }

  static async sendNow(id: string) {
    return this.process(id);
  }

  static async processDue(limit = 20) {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_SENDING_MS);

    // Recover broadcasts whose processor lease expired.
    // Notification eventKey + recipient unique constraint makes retry idempotent.
    await prisma.broadcast.updateMany({
      where: {
        status: BroadcastStatus.SENDING,
        startedAt: { lt: staleBefore },
      },
      data: {
        status: BroadcastStatus.SCHEDULED,
      },
    });

    const due = await prisma.broadcast.findMany({
      where: {
        status: BroadcastStatus.SCHEDULED,
        scheduledAt: { lte: now },
      },
      orderBy: { scheduledAt: "asc" },
      take: Math.min(Math.max(limit, 1), 50),
      select: { id: true },
    });

    const results = [];
    for (const item of due) results.push(await this.process(item.id));
    return results;
  }

  static async process(id: string) {
    const locked = await prisma.broadcast.updateMany({
      where: {
        id,
        status: { in: [BroadcastStatus.DRAFT, BroadcastStatus.SCHEDULED] },
      },
      data: { status: BroadcastStatus.SENDING, startedAt: new Date() },
    });

    if (locked.count === 0) {
      return { id, status: "SKIPPED", sent: 0, failed: 0 };
    }

    const broadcast = await prisma.broadcast.findUnique({
      where: { id },
      include: {
        recipients: true,
      },
    });

    if (!broadcast) throw new Error("Broadcast tidak ditemukan.");

    if (broadcast.audienceType === BroadcastAudienceType.ALL_CUSTOMERS) {
      await this.materializeRecipients(broadcast.id);
    }

    const recipients = await prisma.broadcastRecipient.findMany({
      where: { broadcastId: broadcast.id, status: BroadcastRecipientStatus.PENDING },
      take: MAX_BATCH,
    });

    let sent = 0;
    let failed = 0;
    const pushItems: Array<{
      userId: string;
      notificationId: string;
      title: string;
      message: string;
      href: string | null;
      type: NotificationType;
      createdAt: Date;
    }> = [];

    for (const recipient of recipients) {
      const eventKey = `BROADCAST:${broadcast.id}:${recipient.userId}`;

      try {
        let notification: {
          id: string;
          title: string;
          message: string;
          href: string | null;
          type: NotificationType;
          createdAt: Date;
        } | null = null;
        let created = false;

        try {
          const result = await prisma.$transaction(async (tx) => {
            const createdNotification = await tx.notification.create({
              data: {
                userId: recipient.userId,
                title: broadcast.title,
                message: broadcast.message,
                type: NotificationType.SYSTEM,
                href: broadcast.href,
                broadcastId: broadcast.id,
                eventKey,
              },
            });

            const recipientUpdate = await tx.broadcastRecipient.updateMany({
              where: {
                id: recipient.id,
                status: BroadcastRecipientStatus.PENDING,
              },
              data: {
                status: BroadcastRecipientStatus.SENT,
                notificationId: createdNotification.id,
                sentAt: new Date(),
                errorMessage: null,
              },
            });

            if (recipientUpdate.count !== 1) {
              throw new Error("Recipient broadcast sudah diproses oleh worker lain.");
            }

            return createdNotification;
          });

          notification = result;
          created = true;
        } catch (error) {
          // A concurrent/retried processor may have created the notification
          // already. Reconcile the recipient instead of marking it FAILED.
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            const existingNotification = await prisma.notification.findUnique({
              where: { eventKey },
            });

            if (!existingNotification) {
              throw error;
            }

            const reconciled = await prisma.broadcastRecipient.updateMany({
              where: {
                id: recipient.id,
                status: BroadcastRecipientStatus.PENDING,
              },
              data: {
                status: BroadcastRecipientStatus.SENT,
                notificationId: existingNotification.id,
                sentAt: existingNotification.createdAt,
                errorMessage: null,
              },
            });

            if (reconciled.count === 0) {
              const currentRecipient =
                await prisma.broadcastRecipient.findUnique({
                  where: { id: recipient.id },
                  select: {
                    status: true,
                    notificationId: true,
                  },
                });

              if (currentRecipient?.status !== BroadcastRecipientStatus.SENT) {
                throw error;
              }
            }

            notification = existingNotification;
            created = false;
          } else {
            throw error;
          }
        }

        // In-app notification is the source of truth. Push is best-effort.
        // Only the processor that created the notification sends push, avoiding
        // duplicate push deliveries when concurrent processors reconcile
        // the same eventKey.
        if (created && notification) {
          pushItems.push({
            userId: recipient.userId,
            notificationId: notification.id,
            title: notification.title,
            message: notification.message,
            href: notification.href,
            type: notification.type,
            createdAt: notification.createdAt,
          });
        }

        sent++;
      } catch (error) {
        failed++;
        await prisma.broadcastRecipient.updateMany({
          where: {
            id: recipient.id,
            status: BroadcastRecipientStatus.PENDING,
          },
          data: {
            status: BroadcastRecipientStatus.FAILED,
            errorMessage:
              error instanceof Error
                ? error.message
                : "Gagal membuat notification.",
          },
        });
      }
    }

    if (pushItems.length) {
      try {
        await pushDeliveryService.deliver({ notifications: pushItems });
      } catch (error) {
        console.error("[BROADCAST_PUSH_ERROR]", { broadcastId: id, error });
      }
    }

    const [pending, failedTotal] = await Promise.all([
      prisma.broadcastRecipient.count({
        where: {
          broadcastId: id,
          status: BroadcastRecipientStatus.PENDING,
        },
      }),
      prisma.broadcastRecipient.count({
        where: {
          broadcastId: id,
          status: BroadcastRecipientStatus.FAILED,
        },
      }),
    ]);

    const finalStatus = pending > 0
      ? BroadcastStatus.SCHEDULED
      : failedTotal > 0 && sent === 0
        ? BroadcastStatus.FAILED
        : failedTotal > 0
          ? BroadcastStatus.PARTIAL
          : BroadcastStatus.SENT;

    await prisma.broadcast.update({
      where: { id },
      data: {
        status: finalStatus,
        sentAt: pending > 0 ? null : new Date(),
      },
    });

    return { id, status: finalStatus, sent, failed, pending };
  }

  private static async materializeRecipients(broadcastId: string) {
    await prisma.$executeRaw`
      INSERT INTO "BroadcastRecipient" ("id", "broadcastId", "userId", "status", "createdAt", "updatedAt")
      SELECT
        'br_' || md5(random()::text || clock_timestamp()::text || u.id),
        ${broadcastId},
        u.id,
        'PENDING',
        NOW(),
        NOW()
      FROM "User" u
      WHERE u.role = 'CUSTOMER'
        AND u."isActive" = true
        AND u."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "BroadcastRecipient" br
          WHERE br."broadcastId" = ${broadcastId}
            AND br."userId" = u.id
        )
    `;
  }
}

export default BroadcastService;
