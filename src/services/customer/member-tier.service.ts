import { prisma } from "@/lib/prisma";
import { isMemberTierEnabled } from "@/services/member-tier/member-tier-feature.service";

const MEMBERSHIP_PERIOD_DAYS = 365;

const DEFAULT_MEMBER_TIERS = [
  {
    id: "default-basic",
    name: "PISJO Basic",
    slug: "basic",
    minSpend: 0,
    bonusPointsPercent: 0,
    freeShipping: false,
    prioritySupport: false,
    exclusivePricing: false,
    sortOrder: 0,
  },
  {
    id: "default-silver",
    name: "PISJO Silver",
    slug: "silver",
    minSpend: 500_000,
    bonusPointsPercent: 10,
    freeShipping: false,
    prioritySupport: false,
    exclusivePricing: false,
    sortOrder: 10,
  },
  {
    id: "default-gold",
    name: "PISJO Gold",
    slug: "gold",
    minSpend: 1_500_000,
    bonusPointsPercent: 25,
    freeShipping: true,
    prioritySupport: true,
    exclusivePricing: true,
    sortOrder: 20,
  },
  {
    id: "default-platinum",
    name: "PISJO Platinum",
    slug: "platinum",
    minSpend: 3_000_000,
    bonusPointsPercent: 50,
    freeShipping: true,
    prioritySupport: true,
    exclusivePricing: true,
    sortOrder: 30,
  },
] as const;

export interface CustomerMemberTierSummary {
  currentTier: {
    id: string;
    name: string;
    slug: string;
    minSpend: number;
    bonusPointsPercent: number;
    freeShipping: boolean;
    prioritySupport: boolean;
    exclusivePricing: boolean;
  };
  currentSpend: number;
  periodStart: string;
  periodEnd: string;
  nextTier: {
    id: string;
    name: string;
    slug: string;
    minSpend: number;
    bonusPointsPercent: number;
    freeShipping: boolean;
    prioritySupport: boolean;
    exclusivePricing: boolean;
  } | null;
  remainingSpend: number;
  progress: number;
}

type TierLike = {
  id: string;
  name: string;
  slug: string;
  minSpend: number;
  bonusPointsPercent: number;
  freeShipping: boolean;
  prioritySupport: boolean;
  exclusivePricing: boolean;
};

function fallbackTiers(): TierLike[] {
  return DEFAULT_MEMBER_TIERS.map((tier) => ({ ...tier }));
}

async function getActiveTiers(): Promise<TierLike[]> {
  const tiers = await prisma.memberTier.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ minSpend: "asc" }, { sortOrder: "asc" }],
  });

  if (tiers.length === 0) {
    return fallbackTiers();
  }

  return tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    slug: tier.slug,
    minSpend: tier.minSpend.toNumber(),
    bonusPointsPercent: tier.bonusPointsPercent,
    freeShipping: tier.freeShipping,
    prioritySupport: tier.prioritySupport,
    exclusivePricing: tier.exclusivePricing,
  }));
}

export async function getCustomerMemberTierSummary(
  userId: string,
): Promise<CustomerMemberTierSummary | null> {
  const enabled = await isMemberTierEnabled();

  if (!enabled) return null;

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - MEMBERSHIP_PERIOD_DAYS);

  const [tiers, spending] = await Promise.all([
    getActiveTiers(),
    prisma.order.aggregate({
      where: {
        userId,
        deletedAt: null,
        status: "COMPLETED",
        paymentStatus: "VERIFIED",
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      _sum: {
        total: true,
      },
    }),
  ]);

  const orderedTiers = [...tiers].sort((a, b) => a.minSpend - b.minSpend);

  const currentSpend = Number(spending._sum.total ?? 0);

  const currentTier =
    [...orderedTiers].reverse().find((tier) => currentSpend >= tier.minSpend) ??
    orderedTiers[0] ??
    fallbackTiers()[0];

  const nextTier =
    orderedTiers.find((tier) => tier.minSpend > currentTier.minSpend) ?? null;

  const remainingSpend = nextTier
    ? Math.max(nextTier.minSpend - currentSpend, 0)
    : 0;

  const progress = nextTier
    ? Math.min(
        100,
        Math.round(
          ((currentSpend - currentTier.minSpend) /
            (nextTier.minSpend - currentTier.minSpend)) *
            100,
        ),
      )
    : 100;

  return {
    currentTier,
    currentSpend,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    nextTier,
    remainingSpend,
    progress,
  };
}
