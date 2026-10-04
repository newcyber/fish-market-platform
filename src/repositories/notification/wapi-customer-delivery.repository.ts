import { Prisma, WapiDeliveryStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface WapiCustomerDeliveryAdminFilters {
  search?: string;
  status?: WapiDeliveryStatus;
  eventType?: string;
  page?: number;
  limit?: number;
}

function buildWhere(
  filters: WapiCustomerDeliveryAdminFilters,
): Prisma.WapiCustomerDeliveryWhereInput {
  const keyword = filters.search?.trim();

  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.eventType ? { eventType: filters.eventType } : {}),
    ...(keyword
      ? {
          OR: [
            {
              phone: {
                contains: keyword,
                mode: "insensitive",
              },
            },
            {
              eventKey: {
                contains: keyword,
                mode: "insensitive",
              },
            },
            {
              user: {
                name: {
                  contains: keyword,
                  mode: "insensitive",
                },
              },
            },
            {
              user: {
                email: {
                  contains: keyword,
                  mode: "insensitive",
                },
              },
            },
            {
              order: {
                orderNumber: {
                  contains: keyword,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : {}),
  };
}

export class WapiCustomerDeliveryRepository {
  static async findMany(
    filters: WapiCustomerDeliveryAdminFilters = {},
  ) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    return prisma.wapiCustomerDelivery.findMany({
      where: buildWhere(filters),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        userId: true,
        orderId: true,
        eventKey: true,
        eventType: true,
        phone: true,
        message: true,
        status: true,
        messageId: true,
        jid: true,
        attempts: true,
        errorMessage: true,
        processingStartedAt: true,
        sentAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
    });
  }

  static count(filters: WapiCustomerDeliveryAdminFilters = {}) {
    return prisma.wapiCustomerDelivery.count({
      where: buildWhere(filters),
    });
  }

  static statusCounts(filters: Omit<WapiCustomerDeliveryAdminFilters, "status"> = {}) {
    return prisma.wapiCustomerDelivery.groupBy({
      by: ["status"],
      where: buildWhere(filters),
      _count: {
        _all: true,
      },
      orderBy: {
        status: "asc",
      },
    });
  }
}
