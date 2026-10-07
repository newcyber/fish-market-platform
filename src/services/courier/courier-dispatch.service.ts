import { CourierAssignmentStatus, OrderStatus, PaymentStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CourierPerformanceService } from "@/services/courier/courier-performance.service";

const ACTIVE_ASSIGNMENT_STATUSES: CourierAssignmentStatus[] = [
  CourierAssignmentStatus.ASSIGNED,
  CourierAssignmentStatus.PICKED_UP,
  CourierAssignmentStatus.ON_ROUTE,
  CourierAssignmentStatus.ARRIVED,
];

const WEIGHTS = {
  availability: 0.25,
  workload: 0.20,
  sla: 0.20,
  success: 0.15,
  deliveryTime: 0.10,
  retry: 0.10,
} as const;

const COLD_START_SCORE = 70;
const MAX_CANDIDATES = 20;

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function scoreFromAverageDeliveryMinutes(
  averageMinutes: number | null,
  targetMinutes: number,
) {
  if (averageMinutes === null || averageMinutes <= 0) return COLD_START_SCORE;
  return clamp((targetMinutes / averageMinutes) * 100);
}

function buildReasons(input: {
  activeAssignments: number;
  successRate: number;
  slaScore: number;
  deliveryTimeScore: number;
  retryScore: number;
}) {
  const reasons: string[] = [];

  if (input.activeAssignments === 0) reasons.push("Tidak memiliki assignment aktif");
  else if (input.activeAssignments <= 2) reasons.push("Beban assignment masih rendah");

  if (input.slaScore >= 90) reasons.push("Kepatuhan SLA sangat baik");
  else if (input.slaScore >= 75) reasons.push("Kepatuhan SLA baik");

  if (input.successRate >= 95) reasons.push("Tingkat keberhasilan pengantaran tinggi");
  else if (input.successRate >= 85) reasons.push("Tingkat keberhasilan pengantaran baik");

  if (input.deliveryTimeScore >= 95) reasons.push("Rata-rata waktu antar sangat baik");
  if (input.retryScore >= 95) reasons.push("Riwayat retry rendah");

  if (!reasons.length) reasons.push("Kandidat aktif dengan data performa terbatas");
  return reasons.slice(0, 3);
}

export type CourierDispatchCandidate = {
  courierId: string;
  courierName: string;
  phone: string | null;
  rank: number;
  score: number;
  eligible: boolean;
  activeAssignments: number;
  metrics: {
    availability: number;
    workload: number;
    sla: number;
    success: number;
    deliveryTime: number;
    retry: number;
  };
  reasons: string[];
};

export class CourierDispatchService {
  static async getCandidates(orderId: string) {
    if (!orderId) throw new Error("INVALID_DISPATCH_ORDER");

    const order = await prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        address: { select: { city: true, district: true } },
        courierAssignments: {
          where: { isActive: true },
          select: { id: true, courierId: true, status: true },
        },
      },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.paymentStatus !== PaymentStatus.VERIFIED) {
      throw new Error("ORDER_PAYMENT_NOT_VERIFIED");
    }
    if (order.status !== OrderStatus.PROCESSING && order.status !== OrderStatus.SHIPPING) {
      throw new Error("ORDER_NOT_READY_FOR_COURIER");
    }
    if (order.courierAssignments.length) {
      throw new Error("ORDER_ALREADY_ASSIGNED");
    }

    const [couriers, activeAssignments, performance] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: Role.COURIER,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true, name: true, phone: true },
        orderBy: { name: "asc" },
      }),
      prisma.courierAssignment.groupBy({
        by: ["courierId"],
        where: {
          isActive: true,
          status: { in: ACTIVE_ASSIGNMENT_STATUSES },
          order: { deletedAt: null },
        },
        _count: { _all: true },
      }),
      CourierPerformanceService.getPerformance("30d"),
    ]);

    const workloadMap = new Map(
      activeAssignments.map((item) => [item.courierId, item._count._all]),
    );
    const performanceMap = new Map(
      performance.couriers.map((item) => [item.courierId, item]),
    );

    const candidates = couriers.map((courier) => {
      const activeCount = workloadMap.get(courier.id) ?? 0;
      const metrics = performanceMap.get(courier.id);
      const completed = (metrics?.delivered ?? 0) + (metrics?.failed ?? 0);

      const availability = 100;
      const workload = clamp(100 - activeCount * 20);
      const sla = completed > 0
        ? clamp(100 - ((metrics?.slaBreached ?? 0) / completed) * 100)
        : COLD_START_SCORE;
      const success = completed > 0
        ? clamp((metrics?.delivered ?? 0) / completed * 100)
        : COLD_START_SCORE;
      const deliveryTime = scoreFromAverageDeliveryMinutes(
        metrics?.averageDeliveryMinutes ?? null,
        performance.sla.settings.totalDeliveryMinutes,
      );
      const retry = metrics?.retryRate === null || metrics?.retryRate === undefined
        ? COLD_START_SCORE
        : clamp(100 - metrics.retryRate);

      const score = round(
        availability * WEIGHTS.availability +
        workload * WEIGHTS.workload +
        sla * WEIGHTS.sla +
        success * WEIGHTS.success +
        deliveryTime * WEIGHTS.deliveryTime +
        retry * WEIGHTS.retry,
      );

      return {
        courierId: courier.id,
        courierName: courier.name,
        phone: courier.phone ?? null,
        rank: 0,
        score,
        eligible: true,
        activeAssignments: activeCount,
        metrics: {
          availability,
          workload,
          sla: round(sla),
          success: round(success),
          deliveryTime: round(deliveryTime),
          retry: round(retry),
        },
        reasons: buildReasons({
          activeAssignments: activeCount,
          successRate: success,
          slaScore: sla,
          deliveryTimeScore: deliveryTime,
          retryScore: retry,
        }),
      } satisfies CourierDispatchCandidate;
    });

    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.activeAssignments !== b.activeAssignments) {
        return a.activeAssignments - b.activeAssignments;
      }
      return a.courierName.localeCompare(b.courierName, "id");
    });

    const ranked = candidates.slice(0, MAX_CANDIDATES).map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        address: order.address,
      },
      scoring: {
        version: "v1",
        range: "30d",
        coldStartScore: COLD_START_SCORE,
        weights: {
          availability: WEIGHTS.availability,
          workload: WEIGHTS.workload,
          sla: WEIGHTS.sla,
          success: WEIGHTS.success,
          deliveryTime: WEIGHTS.deliveryTime,
          retry: WEIGHTS.retry,
        },
      },
      candidates: ranked,
    };
  }
}
