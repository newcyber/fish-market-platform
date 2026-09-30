import { PaymentStatus, Role, OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MemberTierRepositoryCreateInput = {
  name: string;
  slug: string;
  minSpend: number;
  bonusPointsPercent: number;
  freeShipping: boolean;
  prioritySupport: boolean;
  exclusivePricing: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type MemberTierRepositoryUpdateInput =
  Partial<MemberTierRepositoryCreateInput>;

export const DEFAULT_MEMBER_TIER_ROWS = [
  {
    id: "default-basic",
    name: "PISJO Basic",
    slug: "basic",
    minSpend: 0,
    bonusPointsPercent: 0,
    freeShipping: false,
    prioritySupport: false,
    exclusivePricing: false,
    isActive: true,
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
    isActive: true,
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
    isActive: true,
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
    isActive: true,
    sortOrder: 30,
  },
] as const;

export class MemberTierRepository {
  static async findMany() {
    const tiers = await prisma.memberTier.findMany({
      orderBy: [{ minSpend: "asc" }, { sortOrder: "asc" }],
    });

    const userCounts = await this.getResolvedCustomerCounts(tiers);

    return tiers.map((tier) => ({
      ...tier,
      userCount: userCounts.get(tier.id) ?? 0,
    }));
  }

  /**
   * Menghitung customer berdasarkan tier yang benar-benar sedang berlaku.
   *
   * Sumber kebenaran membership adalah spending customer dalam 365 hari
   * terakhir dari order COMPLETED + payment VERIFIED, sama seperti
   * getCustomerMemberTierSummary(). Jangan gunakan User.memberTierId
   * karena tier customer dihitung secara dinamis.
   */
  private static async getResolvedCustomerCounts(
    tiers: Array<{
      id: string;
      minSpend: import("@prisma/client").Prisma.Decimal;
      isActive: boolean;
    }>,
  ) {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 365);

    const [customers, spending] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: Role.CUSTOMER,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      }),
      prisma.order.groupBy({
        by: ["userId"],
        where: {
          deletedAt: null,
          status: OrderStatus.COMPLETED,
          paymentStatus: PaymentStatus.VERIFIED,
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

    const customerIds = new Set(customers.map((customer) => customer.id));
    const spendingByCustomer = new Map(
      spending
        .filter(
          (row): row is typeof row & { userId: string } =>
            row.userId !== null && customerIds.has(row.userId),
        )
        .map((row) => [row.userId, Number(row._sum.total ?? 0)]),
    );

    const orderedTiers = [...tiers]
      .filter((tier) => tier.isActive)
      .map((tier) => ({
        id: tier.id,
        minSpend: tier.minSpend.toNumber(),
      }))
      .sort((a, b) => a.minSpend - b.minSpend);

    const counts = new Map<string, number>(
      orderedTiers.map((tier) => [tier.id, 0]),
    );

    for (const customer of customers) {
      const currentSpend = spendingByCustomer.get(customer.id) ?? 0;

      const currentTier =
        [...orderedTiers]
          .reverse()
          .find((tier) => currentSpend >= tier.minSpend) ?? orderedTiers[0];

      if (currentTier) {
        counts.set(currentTier.id, (counts.get(currentTier.id) ?? 0) + 1);
      }
    }

    return counts;
  }

  static async findById(id: string) {
    return prisma.memberTier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  static async findBySlug(slug: string) {
    return prisma.memberTier.findUnique({
      where: { slug },
    });
  }

  static async findByMinSpend(minSpend: number, excludeId?: string) {
    return prisma.memberTier.findFirst({
      where: {
        minSpend,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, name: true, slug: true },
    });
  }

  static async create(input: MemberTierRepositoryCreateInput) {
    return prisma.memberTier.create({
      data: input,
    });
  }

  static async update(id: string, input: MemberTierRepositoryUpdateInput) {
    return prisma.memberTier.update({
      where: { id },
      data: input,
    });
  }

  static async countActive() {
    return prisma.memberTier.count({
      where: { isActive: true },
    });
  }

  static async countBasicCandidates() {
    return prisma.memberTier.count({
      where: {
        isActive: true,
        minSpend: 0,
      },
    });
  }

  static async seedDefaultsIfEmpty() {
    const count = await prisma.memberTier.count();

    if (count > 0) {
      return this.findMany();
    }

    await prisma.$transaction(
      DEFAULT_MEMBER_TIER_ROWS.map((tier) =>
        prisma.memberTier.create({
          data: tier,
        }),
      ),
    );

    return this.findMany();
  }
}
