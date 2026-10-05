import { Prisma, WapiDeliveryStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface WapiCourierDeliveryAdminFilters {
  search?: string;
  status?: WapiDeliveryStatus;
  eventType?: string;
  page?: number;
  limit?: number;
}

export class WapiCourierDeliveryRepository {
  private static buildWhere(
    filters: WapiCourierDeliveryAdminFilters = {},
  ): Prisma.WapiCourierDeliveryWhereInput {
    const keyword = filters.search?.trim();

    return {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.eventType ? { eventType: filters.eventType } : {}),
      ...(keyword
        ? {
            OR: [
              { phone: { contains: keyword, mode: "insensitive" } },
              { eventKey: { contains: keyword, mode: "insensitive" } },
              {
                order: {
                  orderNumber: {
                    contains: keyword,
                    mode: "insensitive",
                  },
                },
              },
              {
                courier: {
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

  static async findMany(
    filters: WapiCourierDeliveryAdminFilters = {},
  ) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    return prisma.wapiCourierDelivery.findMany({
      where: this.buildWhere(filters),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        assignmentId: true,
        courierId: true,
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
        courier: {
          select: {
            id: true,
            name: true,
            phone: true,
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

  static async count(
    filters: WapiCourierDeliveryAdminFilters = {},
  ) {
    return prisma.wapiCourierDelivery.count({
      where: this.buildWhere(filters),
    });
  }

  static async statusCounts(
    filters: Omit<WapiCourierDeliveryAdminFilters, "status"> = {},
  ) {
    const rows = await prisma.wapiCourierDelivery.groupBy({
      by: ["status"],
      where: this.buildWhere(filters),
      _count: { _all: true },
      orderBy: { status: "asc" },
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));
  }

  static async getById(id: string) {
    return prisma.wapiCourierDelivery.findUnique({
      where: { id },
      select: {
        id: true,
        assignmentId: true,
        courierId: true,
        orderId: true,
        eventKey: true,
        eventType: true,
        phone: true,
        message: true,
        status: true,
        attempts: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        courier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });
  }
}

export default WapiCourierDeliveryRepository;
