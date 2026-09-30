import { prisma } from "@/lib/prisma";

export type CustomerRewardSummary = {
  points: number;
  vouchers: {
    count: number;
    items: Array<{
      id: string;
      name: string;
      code: string;
      type: "DISCOUNT" | "FREE_SHIPPING";
      endAt: string | null;
    }>;
  };
  nextReward: {
    id: string;
    type: "VOUCHER" | "REWARD";
    name: string;
    requiredPoints: number;
    currentPoints: number;
    remainingPoints: number;
    progress: number;
    estimatedWeightKg: number | null;
  } | null;
};

export async function getCustomerRewardSummary(
  userId: string,
): Promise<CustomerRewardSummary> {
  const normalizedUserId = String(userId).trim();

  if (!normalizedUserId) {
    return {
      points: 0,
      vouchers: { count: 0, items: [] },
      nextReward: null,
    };
  }

  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: normalizedUserId },
    select: { rewardPointsBalance: true },
  });

  const points = user?.rewardPointsBalance ?? 0;

  const [userVouchers, rewardVoucher, catalogReward, settings] =
    await Promise.all([
      prisma.userVoucher.findMany({
        where: {
          userId: normalizedUserId,
          voucher: {
            isActive: true,
            deletedAt: null,
            AND: [
              { OR: [{ startAt: null }, { startAt: { lte: now } }] },
              { OR: [{ endAt: null }, { endAt: { gte: now } }] },
              {
                usages: {
                  none: {
                    userId: normalizedUserId,
                  },
                },
              },
            ],
          },
        },
        orderBy: { claimedAt: "desc" },
        select: {
          id: true,
          voucher: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
              endAt: true,
            },
          },
        },
      }),

      prisma.rewardVoucherSetting.findFirst({
        where: {
          isActive: true,
          requiredPoints: { gt: points },
        },
        orderBy: [
          { requiredPoints: "asc" },
          { sortOrder: "asc" },
        ],
        select: {
          id: true,
          name: true,
          requiredPoints: true,
        },
      }),

      prisma.rewardCatalog.findFirst({
        where: {
          isActive: true,
          stock: { gt: 0 },
          requiredPoints: { gt: points },
        },
        orderBy: [
          { requiredPoints: "asc" },
          { sortOrder: "asc" },
        ],
        select: {
          id: true,
          name: true,
          requiredPoints: true,
        },
      }),

      prisma.rewardPointSettings.findUnique({
        where: { key: "default" },
        select: { pointsPerKg: true },
      }),
    ]);

  const items = userVouchers.map((item) => ({
    id: item.voucher.id,
    name: item.voucher.name,
    code: item.voucher.code,
    type: item.voucher.type as "DISCOUNT" | "FREE_SHIPPING",
    endAt: item.voucher.endAt?.toISOString() ?? null,
  }));

  const candidates = [
    rewardVoucher
      ? {
          id: rewardVoucher.id,
          type: "VOUCHER" as const,
          name: rewardVoucher.name,
          requiredPoints: rewardVoucher.requiredPoints,
        }
      : null,
    catalogReward
      ? {
          id: catalogReward.id,
          type: "REWARD" as const,
          name: catalogReward.name,
          requiredPoints: catalogReward.requiredPoints,
        }
      : null,
  ]
    .filter(
      (
        item,
      ): item is {
        id: string;
        type: "VOUCHER" | "REWARD";
        name: string;
        requiredPoints: number;
      } => Boolean(item),
    )
    .sort((a, b) => {
      if (a.requiredPoints !== b.requiredPoints) {
        return a.requiredPoints - b.requiredPoints;
      }

      return a.type === "VOUCHER" ? -1 : 1;
    });

  const next = candidates[0] ?? null;

  const nextReward = next
    ? {
        id: next.id,
        type: next.type,
        name: next.name,
        requiredPoints: next.requiredPoints,
        currentPoints: points,
        remainingPoints: Math.max(next.requiredPoints - points, 0),
        progress: Math.min(
          100,
          Math.round((points / next.requiredPoints) * 100),
        ),
        estimatedWeightKg:
          settings && settings.pointsPerKg > 0
            ? Math.ceil(
                ((next.requiredPoints - points) / settings.pointsPerKg) * 100,
              ) / 100
            : null,
      }
    : null;

  return {
    points,
    vouchers: {
      count: items.length,
      items: items.slice(0, 3),
    },
    nextReward,
  };
}
