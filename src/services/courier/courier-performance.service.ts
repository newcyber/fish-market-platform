import {
  CourierAssignmentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CourierSlaSettingsValue = {
  id: string;
  assignmentToStartMinutes: number;
  startToPickupMinutes: number;
  pickupToDeliveryMinutes: number;
  totalDeliveryMinutes: number;
  isActive: boolean;
  updatedAt: string;
};

export type CourierSlaStage = "ASSIGNMENT_TO_START" | "START_TO_PICKUP" | "PICKUP_TO_DELIVERY" | "TOTAL_DELIVERY";
export type CourierSlaStatus = "NOT_STARTED" | "ON_TIME" | "AT_RISK" | "BREACHED" | "COMPLETED";

export type CourierPerformanceRange = "today" | "7d" | "30d";

const DEFAULT_SLA = {
  assignmentToStartMinutes: 15,
  startToPickupMinutes: 30,
  pickupToDeliveryMinutes: 60,
  totalDeliveryMinutes: 105,
};

const ACTIVE_STATUSES: CourierAssignmentStatus[] = [
  CourierAssignmentStatus.ASSIGNED,
  CourierAssignmentStatus.ON_ROUTE,
  CourierAssignmentStatus.PICKED_UP,
];

function getJakartaDateParts(date: Date) {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const [year, month, day] = formatted.split("-").map(Number);
  return { year, month, day };
}

function getJakartaRange(daysBack: number) {
  const now = new Date();
  const { year, month, day } = getJakartaDateParts(now);
  const end = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T23:59:59.999+07:00`);

  const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+07:00`);
  startDate.setUTCDate(startDate.getUTCDate() - daysBack);

  return { start: startDate, end };
}

function resolveRange(range: CourierPerformanceRange) {
  if (range === "today") return getJakartaRange(0);
  if (range === "7d") return getJakartaRange(6);
  return getJakartaRange(29);
}

function round(value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function minutesBetween(start: Date | null, end: Date | null) {
  if (!start || !end) return null;
  const value = (end.getTime() - start.getTime()) / 60000;
  return value >= 0 ? value : null;
}

function statusForElapsed(elapsed: number | null, limit: number, completed = false): CourierSlaStatus {
  if (completed) return elapsed !== null && elapsed <= limit ? "COMPLETED" : "BREACHED";
  if (elapsed === null) return "NOT_STARTED";
  if (elapsed > limit) return "BREACHED";
  if (elapsed >= limit * 0.8) return "AT_RISK";
  return "ON_TIME";
}

async function getActiveSettings() {
  const settings = await prisma.courierSlaSettings.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!settings) return DEFAULT_SLA;
  return {
    assignmentToStartMinutes: settings.assignmentToStartMinutes,
    startToPickupMinutes: settings.startToPickupMinutes,
    pickupToDeliveryMinutes: settings.pickupToDeliveryMinutes,
    totalDeliveryMinutes: settings.totalDeliveryMinutes,
  };
}

export class CourierPerformanceService {
  static async getSlaSettings(): Promise<CourierSlaSettingsValue> {
    const settings = await prisma.courierSlaSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!settings) {
      return {
        id: "defaults",
        ...DEFAULT_SLA,
        isActive: true,
        updatedAt: new Date(0).toISOString(),
      };
    }

    return {
      id: settings.id,
      assignmentToStartMinutes: settings.assignmentToStartMinutes,
      startToPickupMinutes: settings.startToPickupMinutes,
      pickupToDeliveryMinutes: settings.pickupToDeliveryMinutes,
      totalDeliveryMinutes: settings.totalDeliveryMinutes,
      isActive: settings.isActive,
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  static async updateSlaSettings(
    adminId: string,
    input: Partial<typeof DEFAULT_SLA>,
  ) {
    const values = {
      assignmentToStartMinutes: Number(input.assignmentToStartMinutes ?? DEFAULT_SLA.assignmentToStartMinutes),
      startToPickupMinutes: Number(input.startToPickupMinutes ?? DEFAULT_SLA.startToPickupMinutes),
      pickupToDeliveryMinutes: Number(input.pickupToDeliveryMinutes ?? DEFAULT_SLA.pickupToDeliveryMinutes),
      totalDeliveryMinutes: Number(input.totalDeliveryMinutes ?? DEFAULT_SLA.totalDeliveryMinutes),
    };

    if (Object.values(values).some((value) => !Number.isInteger(value) || value < 1 || value > 1440)) {
      throw new Error("INVALID_SLA_SETTINGS");
    }

    return prisma.$transaction(async (tx) => {
      await tx.courierSlaSettings.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      const created = await tx.courierSlaSettings.create({
        data: {
          ...values,
          isActive: true,
          updatedById: adminId,
        },
      });

      return {
        id: created.id,
        ...values,
        isActive: true,
        updatedAt: created.updatedAt.toISOString(),
      };
    });
  }

  static async getPerformance(range: CourierPerformanceRange = "today") {
    const { start, end } = resolveRange(range);
    const sla = await getActiveSettings();

    const assignments = await prisma.courierAssignment.findMany({
      where: {
        assignedAt: { gte: start, lte: end },
        order: { deletedAt: null },
      },
      select: {
        id: true,
        orderId: true,
        courierId: true,
        status: true,
        assignedAt: true,
        startedAt: true,
        pickedUpAt: true,
        deliveredAt: true,
        failedAt: true,
        slaAssignmentToStartMinutes: true,
        slaStartToPickupMinutes: true,
        slaPickupToDeliveryMinutes: true,
        slaTotalDeliveryMinutes: true,
        courier: { select: { id: true, name: true } },
      },
      orderBy: { assignedAt: "desc" },
    });

    const finalAssignments = assignments.filter(
      (item) =>
        item.status === CourierAssignmentStatus.DELIVERED ||
        item.status === CourierAssignmentStatus.FAILED,
    );

    const delivered = assignments.filter(
      (item) => item.status === CourierAssignmentStatus.DELIVERED,
    ).length;
    const failed = assignments.filter(
      (item) => item.status === CourierAssignmentStatus.FAILED,
    ).length;
    const active = assignments.filter((item) => ACTIVE_STATUSES.includes(item.status)).length;

    const orderIds = [...new Set(assignments.map((item) => item.orderId))];
    const retryCounts = orderIds.length
      ? await prisma.courierAssignment.groupBy({
          by: ["orderId"],
          where: { orderId: { in: orderIds } },
          _count: { _all: true },
        })
      : [];

    const retryOrderIds = new Set(
      retryCounts.filter((item) => item._count._all > 1).map((item) => item.orderId),
    );

    const durations = finalAssignments.map((item) => ({
      assignmentToStart: minutesBetween(item.assignedAt, item.startedAt),
      startToPickup: minutesBetween(item.startedAt, item.pickedUpAt),
      pickupToDelivery: minutesBetween(item.pickedUpAt, item.deliveredAt),
      totalDelivery: minutesBetween(item.assignedAt, item.deliveredAt),
    }));

    const average = (key: keyof (typeof durations)[number]) => {
      const values = durations
        .map((item) => item[key])
        .filter((value): value is number => value !== null);
      return values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : null;
    };

    const finalCount = delivered + failed;
    const successRate = finalCount ? round((delivered / finalCount) * 100, 1) : 0;
    const failureRate = finalCount ? round((failed / finalCount) * 100, 1) : 0;
    const retryRate = orderIds.length
      ? round((retryOrderIds.size / orderIds.length) * 100, 1)
      : 0;

    const courierMap = new Map<string, {
      courierId: string;
      courierName: string;
      assigned: number;
      delivered: number;
      failed: number;
      active: number;
      retryOrders: Set<string>;
      deliveryMinutes: number[];
      slaBreached: number;
    }>();

    for (const assignment of assignments) {
      const current = courierMap.get(assignment.courierId) ?? {
        courierId: assignment.courierId,
        courierName: assignment.courier.name,
        assigned: 0,
        delivered: 0,
        failed: 0,
        active: 0,
        retryOrders: new Set<string>(),
        deliveryMinutes: [],
        slaBreached: 0,
      };

      current.assigned += 1;
      if (assignment.status === CourierAssignmentStatus.DELIVERED) current.delivered += 1;
      if (assignment.status === CourierAssignmentStatus.FAILED) current.failed += 1;
      if (ACTIVE_STATUSES.includes(assignment.status)) current.active += 1;
      if (retryOrderIds.has(assignment.orderId)) current.retryOrders.add(assignment.orderId);

      const total = minutesBetween(assignment.assignedAt, assignment.deliveredAt);
      if (total !== null) {
        current.deliveryMinutes.push(total);
        const assignmentSlaTotal =
          assignment.slaTotalDeliveryMinutes ?? sla.totalDeliveryMinutes;
        if (total > assignmentSlaTotal) current.slaBreached += 1;
      }

      courierMap.set(assignment.courierId, current);
    }

    const couriers = [...courierMap.values()]
      .map((item) => {
        const completed = item.delivered + item.failed;
        return {
          courierId: item.courierId,
          courierName: item.courierName,
          assigned: item.assigned,
          delivered: item.delivered,
          failed: item.failed,
          active: item.active,
          successRate: completed ? round((item.delivered / completed) * 100, 1) : 0,
          retryRate: item.assigned ? round((item.retryOrders.size / item.assigned) * 100, 1) : 0,
          averageDeliveryMinutes: item.deliveryMinutes.length
            ? round(item.deliveryMinutes.reduce((a, b) => a + b, 0) / item.deliveryMinutes.length)
            : null,
          slaBreached: item.slaBreached,
        };
      })
      .sort((a, b) => {
    const bSuccessRate = b.successRate ?? -1;
    const aSuccessRate = a.successRate ?? -1;

    if (bSuccessRate !== aSuccessRate) {
      return bSuccessRate - aSuccessRate;
    }
        if ((a.averageDeliveryMinutes ?? Infinity) !== (b.averageDeliveryMinutes ?? Infinity)) {
          return (a.averageDeliveryMinutes ?? Infinity) - (b.averageDeliveryMinutes ?? Infinity);
        }
        return b.delivered - a.delivered;
      });

    return {
      range,
      timezone: "Asia/Jakarta",
      period: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        totalAssigned: assignments.length,
        delivered,
        failed,
        active,
        successRate,
        failureRate,
        retryRate,
        averageAssignmentToStartMinutes: average("assignmentToStart"),
        averageStartToPickupMinutes: average("startToPickup"),
        averagePickupToDeliveryMinutes: average("pickupToDelivery"),
        averageTotalDeliveryMinutes: average("totalDelivery"),
      },
      sla: {
        settings: {
          assignmentToStartMinutes: sla.assignmentToStartMinutes,
          startToPickupMinutes: sla.startToPickupMinutes,
          pickupToDeliveryMinutes: sla.pickupToDeliveryMinutes,
          totalDeliveryMinutes: sla.totalDeliveryMinutes,
        },
      },
      couriers,
    };
  }

  static async getSlaAttention(limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const sla = await getActiveSettings();
    const now = new Date();

    const assignments = await prisma.courierAssignment.findMany({
      where: {
        isActive: true,
        status: { in: ACTIVE_STATUSES },
        order: { deletedAt: null },
      },
      select: {
        id: true,
        orderId: true,
        courierId: true,
        status: true,
        assignedAt: true,
        startedAt: true,
        pickedUpAt: true,
        slaAssignmentToStartMinutes: true,
        slaStartToPickupMinutes: true,
        slaPickupToDeliveryMinutes: true,
        order: {
          select: {
            orderNumber: true,
            address: { select: { receiverName: true, city: true, district: true } },
          },
        },
        courier: { select: { name: true } },
      },
      orderBy: { assignedAt: "asc" },
      take: safeLimit,
    });

    return assignments.map((assignment) => {
      let stage: CourierSlaStage = "ASSIGNMENT_TO_START";
      let elapsed = minutesBetween(assignment.assignedAt, now) ?? 0;
      let limit =
        assignment.slaAssignmentToStartMinutes ??
        sla.assignmentToStartMinutes;

      if (assignment.status === CourierAssignmentStatus.ON_ROUTE) {
        stage = "START_TO_PICKUP";
        elapsed = minutesBetween(assignment.startedAt, now) ?? 0;
        limit =
          assignment.slaStartToPickupMinutes ??
          sla.startToPickupMinutes;
      }

      if (assignment.status === CourierAssignmentStatus.PICKED_UP) {
        stage = "PICKUP_TO_DELIVERY";
        elapsed = minutesBetween(assignment.pickedUpAt, now) ?? 0;
        limit =
          assignment.slaPickupToDeliveryMinutes ??
          sla.pickupToDeliveryMinutes;
      }

      const status = statusForElapsed(elapsed, limit);
      return {
        id: assignment.id,
        orderId: assignment.orderId,
        orderNumber: assignment.order.orderNumber,
        courierId: assignment.courierId,
        courierName: assignment.courier.name,
        receiverName: assignment.order.address.receiverName,
        city: assignment.order.address.city,
        district: assignment.order.address.district,
        assignmentStatus: assignment.status,
        stage,
        elapsedMinutes: round(elapsed),
        slaMinutes: limit,
        status,
      };
    }).filter((item) => item.status === "AT_RISK" || item.status === "BREACHED");
  }
}
