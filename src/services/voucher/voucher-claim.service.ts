

import { prisma } from "@/lib/prisma";

export class VoucherClaimService {
  static async listAvailable(userId: string) {
    const now = new Date();

    const vouchers = await prisma.voucher.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        claimable: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [
          { OR: [{ endAt: null }, { endAt: { gt: now } }] },
          {
            OR: [
              { claimLimit: null },
              { claimLimit: { gt: 0 } },
            ],
          },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
      include: {
        userVouchers: {
          where: { userId },
          select: { id: true, claimedAt: true },
          take: 1,
        },
      },
    });

    return vouchers.filter((voucher) =>
      voucher.claimLimit === null || voucher.claimCount < voucher.claimLimit
    );
  }

  static async listMine(userId: string) {
    const userVouchers = await prisma.userVoucher.findMany({
      where: {
        userId,
        voucher: {
          deletedAt: null,
        },
      },
      orderBy: { claimedAt: "desc" },
      include: {
        voucher: true,
      },
    });

    if (userVouchers.length === 0) {
      return [];
    }

    /**
     * Ambil jumlah penggunaan per voucher dalam satu query.
     *
     * Ini penting karena perUserLimit dapat lebih dari 1.
     * Hanya mengambil usage terakhir tidak cukup untuk menentukan
     * apakah voucher masih dapat digunakan.
     */
    const voucherIds = userVouchers.map(
      (userVoucher) => userVoucher.voucherId,
    );

    const usageRows = await prisma.voucherUsage.findMany({
      where: {
        userId,
        voucherId: {
          in: voucherIds,
        },
      },
      orderBy: {
        usedAt: "desc",
      },
      select: {
        id: true,
        voucherId: true,
        usedAt: true,
        discountAmount: true,
        shippingDiscountAmount: true,
      },
    });

    const usageCountByVoucherId = new Map<string, number>();

    for (const usage of usageRows) {
      usageCountByVoucherId.set(
        usage.voucherId,
        (usageCountByVoucherId.get(usage.voucherId) ?? 0) + 1,
      );
    }

    const latestUsageByVoucherId = new Map<
      string,
      (typeof usageRows)[number]
    >();

    for (const usage of usageRows) {
      if (!latestUsageByVoucherId.has(usage.voucherId)) {
        latestUsageByVoucherId.set(usage.voucherId, usage);
      }
    }

    return userVouchers.map((userVoucher) => {
      const latestUsage = latestUsageByVoucherId.get(
        userVoucher.voucherId,
      );

      return {
        ...userVoucher,
        voucher: {
          ...userVoucher.voucher,
          userUsageCount:
            usageCountByVoucherId.get(userVoucher.voucherId) ?? 0,
          usages: latestUsage
            ? [
                {
                  id: latestUsage.id,
                  usedAt: latestUsage.usedAt,
                  discountAmount: latestUsage.discountAmount,
                  shippingDiscountAmount:
                    latestUsage.shippingDiscountAmount,
                },
              ]
            : [],
        },
      };
    });
  }

  static async claim(userId: string, voucherId: string) {
    if (!userId) throw new Error("User tidak valid.");
    if (!voucherId) throw new Error("Voucher tidak valid.");

    return prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findFirst({
        where: {
          id: voucherId,
          deletedAt: null,
          isActive: true,
          claimable: true,
        },
      });

      if (!voucher) throw new Error("Voucher tidak tersedia untuk diklaim.");

      const now = new Date();

      if (voucher.startAt && now < voucher.startAt) {
        throw new Error("Voucher belum dapat diklaim.");
      }
      if (voucher.endAt && now >= voucher.endAt) {
        throw new Error("Masa klaim voucher sudah berakhir.");
      }

      const existing = await tx.userVoucher.findUnique({
        where: {
          userId_voucherId: { userId, voucherId },
        },
      });

      if (existing) {
        throw new Error("Voucher sudah ada di Voucher Saya.");
      }

      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtext(${voucherId} || ':claim')::bigint
        )
      `;

      const guarded = await tx.voucher.updateMany({
        where: {
          id: voucherId,
          deletedAt: null,
          isActive: true,
          claimable: true,
          ...(voucher.claimLimit !== null
            ? { claimCount: { lt: voucher.claimLimit } }
            : {}),
        },
        data: {
          claimCount: { increment: 1 },
        },
      });

      if (guarded.count !== 1) {
        throw new Error("Kuota klaim voucher sudah habis.");
      }

      return tx.userVoucher.create({
        data: {
          userId,
          voucherId,
          rewardVoucherSettingId: null,
          pointsSpent: 0,
          redeemedAt: now,
          claimedAt: now,
        },
        include: {
          voucher: true,
        },
      });
    });
  }
}
