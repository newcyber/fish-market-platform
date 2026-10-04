import { Prisma, WapiDeliveryStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface WapiCustomerAuditListFilters {
  limit?: number;
}

export class WapiCustomerAuditRepository {
  static async create(input: {
    actorId?: string | null;
    deliveryId?: string | null;
    action: string;
    settingKey?: string | null;
    eventType?: string | null;
    fromStatus?: string | null;
    toStatus?: string | null;
    previousValue?: Prisma.InputJsonValue | null;
    newValue?: Prisma.InputJsonValue | null;
    metadata?: Prisma.InputJsonValue | null;
  }) {
    return prisma.wapiCustomerAuditLog.create({
      data: {
        actorId: input.actorId ?? null,
        deliveryId: input.deliveryId ?? null,
        action: input.action,
        settingKey: input.settingKey ?? null,
        eventType: input.eventType ?? null,
        fromStatus: input.fromStatus ? (input.fromStatus as WapiDeliveryStatus) : undefined,
        toStatus: input.toStatus ? (input.toStatus as WapiDeliveryStatus) : undefined,
        previousValue: input.previousValue ?? undefined,
        newValue: input.newValue ?? undefined,
        metadata: input.metadata ?? undefined,
      },
    });
  }

  static async findRecent(limit = 20) {
    const take = Math.min(100, Math.max(1, limit));

    return prisma.wapiCustomerAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        action: true,
        settingKey: true,
        eventType: true,
        fromStatus: true,
        toStatus: true,
        previousValue: true,
        newValue: true,
        metadata: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        delivery: {
          select: {
            id: true,
            eventKey: true,
            eventType: true,
            status: true,
            attempts: true,
            order: {
              select: {
                orderNumber: true,
              },
            },
          },
        },
      },
    });
  }
}

export default WapiCustomerAuditRepository;
