import { Prisma, WapiDeliveryStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface WapiDeliveryAdminFilters {
  search?: string;
  status?: WapiDeliveryStatus;
  page?: number;
  limit?: number;
}

export interface WapiDeliveryStatusCount {
  status: WapiDeliveryStatus;
  count: number;
}

export class WapiDeliveryRepository {
  private static buildAdminWhere(
    filters: WapiDeliveryAdminFilters = {},
  ): Prisma.WapiDeliveryWhereInput {
    const { search, status } = filters;

    const keyword = search?.trim();

    return {
      ...(status ? { status } : {}),
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
                order: {
                  orderNumber: {
                    contains: keyword,
                    mode: "insensitive",
                  },
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
            ],
          }
        : {}),
    };
  }

  static async findManyForAdminList(filters: WapiDeliveryAdminFilters = {}) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    return prisma.wapiDelivery.findMany({
      where: this.buildAdminWhere(filters),
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderId: true,
        userId: true,
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
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  static async countForAdminList(filters: WapiDeliveryAdminFilters = {}) {
    return prisma.wapiDelivery.count({
      where: this.buildAdminWhere(filters),
    });
  }

  static async getStatusCounts(
    filters: Omit<WapiDeliveryAdminFilters, "status"> = {},
  ): Promise<WapiDeliveryStatusCount[]> {
    const rows = await prisma.wapiDelivery.groupBy({
      by: ["status"],
      where: this.buildAdminWhere(filters),
      _count: {
        _all: true,
      },
      orderBy: {
        status: "asc",
      },
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));
  }
}
