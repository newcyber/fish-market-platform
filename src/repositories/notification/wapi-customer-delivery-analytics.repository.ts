import { WapiDeliveryStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type WapiCustomerDeliveryAnalytics = {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  processing: number;
  skipped: number;
  retryCount: number;
  averageAttempts: number;
  successRate: number;
  failureRate: number;
  retryRate: number;
  eventTypes: Array<{
    eventType: string;
    count: number;
    sent: number;
    failed: number;
    successRate: number;
  }>;
  failureReasons: Array<{
    reason: string;
    count: number;
  }>;
  health: {
    status: "HEALTHY" | "WARNING" | "CRITICAL";
    reasons: string[];
    failureRate: number;
    retryRate: number;
    processingCount: number;
    oldestProcessingMinutes: number;
    windowHours: number;
    windowTotal: number;
    windowFailed: number;
    windowRetried: number;
    thresholds: {
      failureWarningRate: number;
      failureCriticalRate: number;
      retryWarningRate: number;
      retryCriticalRate: number;
      processingWarningMinutes: number;
      processingCriticalMinutes: number;
    };
  };
};

const HEALTH_WINDOW_HOURS = 24;

const HEALTH_THRESHOLDS = {
  failureWarningRate: 5,
  failureCriticalRate: 15,
  retryWarningRate: 10,
  retryCriticalRate: 25,
  processingWarningMinutes: 10,
  processingCriticalMinutes: 30,
} as const;

function percentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((value / total) * 100).toFixed(1));
}

export class WapiCustomerDeliveryAnalyticsRepository {
  static async getOverview(): Promise<WapiCustomerDeliveryAnalytics> {
    const [
      total,
      statusRows,
      attemptsAggregate,
      retryCount,
      eventStatusRows,
      failureReasonRows,
      oldestProcessing,
      healthWindowTotal,
      healthWindowFailed,
      healthWindowRetried,
    ] = await Promise.all([
      prisma.wapiCustomerDelivery.count(),
      prisma.wapiCustomerDelivery.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.wapiCustomerDelivery.aggregate({
        _avg: { attempts: true },
      }),
      prisma.wapiCustomerDelivery.count({
        where: { attempts: { gt: 1 } },
      }),
      prisma.wapiCustomerDelivery.groupBy({
        by: ["eventType", "status"],
        _count: { _all: true },
        orderBy: [{ eventType: "asc" }, { status: "asc" }],
      }),
      prisma.wapiCustomerDelivery.groupBy({
        by: ["errorMessage"],
        where: {
          status: WapiDeliveryStatus.FAILED,
          errorMessage: { not: null },
        },
        _count: { _all: true },
        orderBy: {
          _count: {
            errorMessage: "desc",
          },
        },
        take: 8,
      }),
      prisma.wapiCustomerDelivery.findFirst({
        where: {
          status: WapiDeliveryStatus.PROCESSING,
          processingStartedAt: { not: null },
        },
        orderBy: { processingStartedAt: "asc" },
        select: { processingStartedAt: true },
      }),
      prisma.wapiCustomerDelivery.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - HEALTH_WINDOW_HOURS * 60 * 60 * 1000),
          },
        },
      }),
      prisma.wapiCustomerDelivery.count({
        where: {
          status: WapiDeliveryStatus.FAILED,
          createdAt: {
            gte: new Date(Date.now() - HEALTH_WINDOW_HOURS * 60 * 60 * 1000),
          },
        },
      }),
      prisma.wapiCustomerDelivery.count({
        where: {
          attempts: { gt: 1 },
          createdAt: {
            gte: new Date(Date.now() - HEALTH_WINDOW_HOURS * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const statusMap = new Map(
      statusRows.map((row) => [row.status, row._count._all]),
    );

    const sent = statusMap.get(WapiDeliveryStatus.SENT) ?? 0;
    const failed = statusMap.get(WapiDeliveryStatus.FAILED) ?? 0;
    const pending = statusMap.get(WapiDeliveryStatus.PENDING) ?? 0;
    const processing = statusMap.get(WapiDeliveryStatus.PROCESSING) ?? 0;
    const skipped = statusMap.get(WapiDeliveryStatus.SKIPPED) ?? 0;

    const eventMap = new Map<
      string,
      { count: number; sent: number; failed: number }
    >();

    for (const row of eventStatusRows) {
      const current = eventMap.get(row.eventType) ?? {
        count: 0,
        sent: 0,
        failed: 0,
      };

      current.count += row._count._all;
      if (row.status === WapiDeliveryStatus.SENT) {
        current.sent += row._count._all;
      }
      if (row.status === WapiDeliveryStatus.FAILED) {
        current.failed += row._count._all;
      }

      eventMap.set(row.eventType, current);
    }

    const eventTypes = Array.from(eventMap.entries())
      .map(([eventType, value]) => ({
        eventType,
        ...value,
        successRate: percentage(value.sent, value.count),
      }))
      .sort((a, b) => b.count - a.count || a.eventType.localeCompare(b.eventType))
      .slice(0, 12);

    const failureReasons = failureReasonRows.map((row) => ({
      reason: row.errorMessage?.trim() || "Unknown error",
      count: row._count._all,
    }));

    const successRate = percentage(sent, total);
    const failureRate = percentage(failed, total);
    const retryRate = percentage(retryCount, total);

    const oldestProcessingMinutes = oldestProcessing?.processingStartedAt
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - oldestProcessing.processingStartedAt.getTime()) / 60000,
          ),
        )
      : 0;

    const healthWindowFailureRate = percentage(healthWindowFailed, healthWindowTotal);
    const healthWindowRetryRate = percentage(healthWindowRetried, healthWindowTotal);

    const healthReasons: string[] = [];
    let healthStatus: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";

    if (healthWindowFailureRate >= HEALTH_THRESHOLDS.failureCriticalRate) {
      healthStatus = "CRITICAL";
      healthReasons.push(`Failure rate 24 jam ${healthWindowFailureRate}% melewati threshold critical ${HEALTH_THRESHOLDS.failureCriticalRate}%.`);
    } else if (healthWindowFailureRate >= HEALTH_THRESHOLDS.failureWarningRate) {
      healthStatus = "WARNING";
      healthReasons.push(`Failure rate 24 jam ${healthWindowFailureRate}% melewati threshold warning ${HEALTH_THRESHOLDS.failureWarningRate}%.`);
    }

    if (healthWindowRetryRate >= HEALTH_THRESHOLDS.retryCriticalRate) {
      healthStatus = "CRITICAL";
      healthReasons.push(`Retry rate 24 jam ${healthWindowRetryRate}% melewati threshold critical ${HEALTH_THRESHOLDS.retryCriticalRate}%.`);
    } else if (healthWindowRetryRate >= HEALTH_THRESHOLDS.retryWarningRate) {
      if (healthStatus === "HEALTHY") healthStatus = "WARNING";
      healthReasons.push(`Retry rate 24 jam ${healthWindowRetryRate}% melewati threshold warning ${HEALTH_THRESHOLDS.retryWarningRate}%.`);
    }

    if (processing >= 1 && oldestProcessingMinutes >= HEALTH_THRESHOLDS.processingCriticalMinutes) {
      healthStatus = "CRITICAL";
      healthReasons.push(`Ada ${processing} delivery PROCESSING; delivery tertua sudah ${oldestProcessingMinutes} menit.`);
    } else if (processing >= 1 && oldestProcessingMinutes >= HEALTH_THRESHOLDS.processingWarningMinutes) {
      if (healthStatus === "HEALTHY") healthStatus = "WARNING";
      healthReasons.push(`Ada ${processing} delivery PROCESSING; delivery tertua sudah ${oldestProcessingMinutes} menit.`);
    }

    if (healthReasons.length === 0) {
      healthReasons.push("Semua indikator delivery berada dalam batas normal.");
    }

    return {
      total,
      sent,
      failed,
      pending,
      processing,
      skipped,
      retryCount,
      averageAttempts: Number((attemptsAggregate._avg.attempts ?? 0).toFixed(2)),
      successRate,
      failureRate,
      retryRate,
      eventTypes,
      failureReasons,
      health: {
        status: healthStatus,
        reasons: healthReasons,
        failureRate: healthWindowFailureRate,
        retryRate: healthWindowRetryRate,
        processingCount: processing,
        windowHours: HEALTH_WINDOW_HOURS,
        windowTotal: healthWindowTotal,
        windowFailed: healthWindowFailed,
        windowRetried: healthWindowRetried,
        oldestProcessingMinutes,
        thresholds: HEALTH_THRESHOLDS,
      },
    };
  }
}
