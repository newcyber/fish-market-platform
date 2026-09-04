import {
  Prisma,
  RewardPointTransactionType,
  VoucherDiscountType,
  RewardVoucherSetting,
} from "@prisma/client";

import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

import { VoucherRepository } from "@/repositories/voucher/voucher.repository";

/**
 * ============================================================
 * REWARD VOUCHER SERVICE
 * ============================================================
 *
 * Service untuk proses:
 *
 * - membaca reward voucher setting
 * - redeem reward point
 * - membuat voucher personal
 * - membuat UserVoucher
 * - membuat ledger REDEEM
 * - mengurangi rewardPointsBalance
 *
 * Seluruh proses redeem dilakukan dalam satu
 * database transaction.
 *
 * Prinsip utama:
 *
 * Point berkurang
 * +
 * Voucher dibuat
 * +
 * UserVoucher dibuat
 * +
 * Ledger dibuat
 *
 * harus berhasil bersama-sama.
 *
 * Jika salah satu gagal:
 *
 * ROLLBACK
 *
 * sehingga saldo customer tidak hilang.
 */

/**
 * ============================================================
 * GET AVAILABLE REWARD VOUCHERS
 * ============================================================
 *
 * Mengambil seluruh reward voucher setting
 * yang sedang aktif.
 */

export async function getAvailableRewardVouchers(): Promise<
  RewardVoucherSetting[]
> {
  return prisma.rewardVoucherSetting.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        requiredPoints: "asc",
      },
    ],
  });
}

/**
 * ============================================================
 * GET CUSTOMER REWARD BALANCE
 * ============================================================
 */

export async function getCustomerRewardPointBalance(
  userId: string
): Promise<number> {
  const normalizedUserId =
    String(userId).trim();

  if (!normalizedUserId) {
    return 0;
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: normalizedUserId,
      },

      select: {
        rewardPointsBalance: true,
      },
    });

  return (
    user?.rewardPointsBalance ?? 0
  );
}

/**
 * ============================================================
 * GENERATE REWARD VOUCHER CODE
 * ============================================================
 *
 * Format:
 *
 * RWD-XXXXXXXX
 *
 * Menggunakan crypto.randomBytes()
 * agar kode lebih aman daripada Math.random().
 */

function generateRewardVoucherCode(): string {
  const random =
    randomBytes(5)
      .toString("hex")
      .toUpperCase();

  return `RWD-${random}`;
}

/**
 * ============================================================
 * VALIDATE REWARD SETTING
 * ============================================================
 */

function validateRewardVoucherSetting(
  setting: {
    isActive: boolean;
    requiredPoints: number;
    discountType: VoucherDiscountType;
    discountValue: Prisma.Decimal;
  }
) {
  if (!setting.isActive) {
    throw new Error(
      "Reward voucher sedang tidak tersedia."
    );
  }

  if (
    !Number.isInteger(
      setting.requiredPoints
    ) ||
    setting.requiredPoints <= 0
  ) {
    throw new Error(
      "Konfigurasi point reward tidak valid."
    );
  }

  if (
    setting.discountValue.lte(0)
  ) {
    throw new Error(
      "Nilai diskon reward tidak valid."
    );
  }

  if (
    setting.discountType ===
      VoucherDiscountType.PERCENTAGE &&
    setting.discountValue.gt(100)
  ) {
    throw new Error(
      "Diskon persentase tidak boleh lebih dari 100%."
    );
  }
}

/**
 * ============================================================
 * REDEEM REWARD VOUCHER
 * ============================================================
 *
 * Customer menukarkan point menjadi voucher.
 *
 * Contoh:
 *
 * Saldo customer:
 * 750 point
 *
 * Reward:
 * 500 point
 * ↓
 * Voucher Rp1.000
 *
 * Hasil:
 *
 * Saldo:
 * 250 point
 *
 * Ledger:
 * REDEEM -500
 *
 * Voucher:
 * RWD-XXXXXXXX
 */

export async function redeemRewardVoucher(
  userId: string,
  rewardVoucherSettingId: string
) {
  const normalizedUserId =
    String(userId).trim();

  const normalizedSettingId =
    String(
      rewardVoucherSettingId
    ).trim();

  if (!normalizedUserId) {
    throw new Error(
      "User ID tidak valid."
    );
  }

  if (!normalizedSettingId) {
    throw new Error(
      "Reward voucher tidak valid."
    );
  }

  /**
   * ==========================================================
   * LOAD REWARD SETTING
   * ==========================================================
   */

  const setting =
    await prisma.rewardVoucherSetting.findUnique(
      {
        where: {
          id: normalizedSettingId,
        },
      }
    );

  if (!setting) {
    throw new Error(
      "Reward voucher tidak ditemukan."
    );
  }

  validateRewardVoucherSetting(
    setting
  );

  /**
   * ==========================================================
   * ATOMIC TRANSACTION
   * ==========================================================
   */

  return prisma.$transaction(
    async (tx) => {
      /**
       * ========================================================
       * 1. LOCK CUSTOMER
       * ========================================================
       *
       * FOR UPDATE memastikan dua request redeem
       * bersamaan tidak dapat menggunakan saldo
       * yang sama.
       */

      const users =
        await tx.$queryRaw<
          Array<{
            id: string;
            rewardPointsBalance: number;
          }>
        >(
          Prisma.sql`
            SELECT
              "id",
              "rewardPointsBalance"
            FROM "User"
            WHERE
              "id" = ${normalizedUserId}
              AND "deletedAt" IS NULL
            FOR UPDATE
          `
        );

      const user = users[0];

      if (!user) {
        throw new Error(
          "Customer tidak ditemukan."
        );
      }

      /**
       * ========================================================
       * 2. CHECK BALANCE
       * ========================================================
       */

      if (
        user.rewardPointsBalance <
        setting.requiredPoints
      ) {
        throw new Error(
          `Point tidak mencukupi. Dibutuhkan ${setting.requiredPoints} point, saldo Anda ${user.rewardPointsBalance} point.`
        );
      }

      /**
       * ========================================================
       * 3. GENERATE UNIQUE VOUCHER CODE
       * ========================================================
       */

      let voucherCode: string | null =
        null;

      for (
        let attempt = 0;
        attempt < 10;
        attempt++
      ) {
        const candidate =
          generateRewardVoucherCode();

        const existing =
          await VoucherRepository.findByCode(
            candidate,
            tx
          );

        if (!existing) {
          voucherCode = candidate;
          break;
        }
      }

      if (!voucherCode) {
        throw new Error(
          "Gagal membuat kode voucher unik. Silakan coba lagi."
        );
      }

      /**
       * ========================================================
       * 4. CREATE VOUCHER
       * ========================================================
       *
       * Voucher ini merupakan voucher PERSONAL.
       *
       * Kepemilikan customer dicatat melalui:
       *
       * UserVoucher
       */

      const voucher =
        await VoucherRepository.create(
          {
            code: voucherCode,

            name:
              setting.name.trim(),

            description:
              `Voucher reward hasil penukaran ${setting.requiredPoints} point.`,

            isActive: true,

            discountType:
              setting.discountType,

            discountValue:
              setting.discountValue,

            minimumPurchase:
              setting.minimumPurchase,

            maximumDiscount:
              setting.maximumDiscount,

            /**
             * Voucher hasil redeem hanya boleh
             * digunakan satu kali.
             */

            usageLimit: 1,

            perUserLimit: 1,

            startAt: new Date(),

            endAt: null,
          },

          tx
        );

      /**
       * ========================================================
       * 5. CREATE USER VOUCHER
       * ========================================================
       */

      const userVoucher =
        await tx.userVoucher.create({
          data: {
            userId:
              normalizedUserId,

            rewardVoucherSettingId:
              setting.id,

            voucherId:
              voucher.id,

            pointsSpent:
              setting.requiredPoints,
          },
        });

      /**
       * ========================================================
       * 6. CREATE REDEEM LEDGER
       * ========================================================
       *
       * REDEEM selalu negatif.
       *
       * Contoh:
       *
       * -500
       */

      const transaction =
        await tx.rewardPointTransaction.create(
          {
            data: {
              userId:
                normalizedUserId,

              orderId: null,

              type:
                RewardPointTransactionType.REDEEM,

              points:
                -setting.requiredPoints,

              weightGrams: null,

              description:
                `Redeem ${setting.requiredPoints} point untuk voucher ${voucher.code}`,
            },
          }
        );

      /**
       * ========================================================
       * 7. UPDATE BALANCE
       * ========================================================
       */

      const updatedUser =
        await tx.user.update({
          where: {
            id: normalizedUserId,
          },

          data: {
            rewardPointsBalance: {
              decrement:
                setting.requiredPoints,
            },
          },

          select: {
            rewardPointsBalance: true,
          },
        });

      /**
       * ========================================================
       * 8. RESULT
       * ========================================================
       */

      return {
        success: true,

        pointsSpent:
          setting.requiredPoints,

        remainingPoints:
          updatedUser.rewardPointsBalance,

        rewardVoucherSetting: {
          id: setting.id,

          name:
            setting.name,

          requiredPoints:
            setting.requiredPoints,

          discountType:
            setting.discountType,

          discountValue:
            setting.discountValue,
        },

        voucher: {
          id:
            voucher.id,

          code:
            voucher.code,

          name:
            voucher.name,

          discountType:
            voucher.discountType,

          discountValue:
            voucher.discountValue,

          minimumPurchase:
            voucher.minimumPurchase,

          maximumDiscount:
            voucher.maximumDiscount,

          startAt:
            voucher.startAt,

          endAt:
            voucher.endAt,
        },

        userVoucher: {
          id:
            userVoucher.id,
        },

        transaction: {
          id:
            transaction.id,

          type:
            transaction.type,

          points:
            transaction.points,
        },
      };
    }
  );
}
