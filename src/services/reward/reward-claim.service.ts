import {
  Prisma,
  RewardClaimStatus,
  RewardPointTransactionType,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import {
  RewardCatalogRepository,
} from "@/repositories/reward/reward-catalog.repository";

import {
  RewardClaimRepository,
} from "@/repositories/reward/reward-claim.repository";

/**
 * ============================================================
 * CLAIM REWARD
 * ============================================================
 *
 * Customer melakukan claim reward fisik menggunakan point.
 *
 * Atomic operation:
 *
 * 1. Lock RewardCatalog
 * 2. Validasi reward
 * 3. Lock User
 * 4. Validasi saldo point
 * 5. Decrement stock
 * 6. Create RewardClaim
 * 7. Create REDEEM ledger
 * 8. Decrement user point balance
 *
 * Jika salah satu proses gagal:
 *
 * ROLLBACK
 *
 * sehingga point, stock, claim, dan ledger
 * tidak berubah sebagian.
 * ============================================================
 */

export async function claimReward(
  userId: string,
  rewardCatalogId: string
) {
  /**
   * ==========================================================
   * NORMALIZE INPUT
   * ==========================================================
   */

  const normalizedUserId =
    String(userId ?? "").trim();

  const normalizedRewardCatalogId =
    String(rewardCatalogId ?? "").trim();

  /**
   * ==========================================================
   * VALIDATE INPUT
   * ==========================================================
   */

  if (!normalizedUserId) {
    throw new Error(
      "User ID tidak valid."
    );
  }

  if (!normalizedRewardCatalogId) {
    throw new Error(
      "Reward tidak valid."
    );
  }

  /**
   * ==========================================================
   * ATOMIC TRANSACTION
   * ==========================================================
   */

  return prisma.$transaction(
  async (tx) => {
    /**
     * ========================================================
     * 1. LOCK USER
     * ========================================================
     *
     * User menjadi resource pertama yang di-lock.
     *
     * Tujuannya:
     *
     * - mencegah concurrent claim menggunakan saldo
     *   point yang sama
     * - menyamakan lock order dengan proses refund
     *
     * Lock order:
     *
     * User
     *   ↓
     * RewardCatalog
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

    const user =
      users[0];

    if (!user) {
      throw new Error(
        "Customer tidak ditemukan."
      );
    }

    /**
     * ========================================================
     * 2. LOCK REWARD CATALOG
     * ========================================================
     *
     * Row lock diperlukan untuk mencegah race condition
     * ketika stock hampir habis.
     *
     * Lock order:
     *
     * User
     *   ↓
     * RewardCatalog
     */
    const reward =
      await RewardCatalogRepository.findByIdForUpdate(
        normalizedRewardCatalogId,
        tx
      );

    if (!reward) {
      throw new Error(
        "Reward tidak ditemukan."
      );
    }

    /**
     * ========================================================
     * 3. VALIDATE REWARD STATUS
     * ========================================================
     */

    if (!reward.isActive) {
      throw new Error(
        "Reward sedang tidak tersedia."
      );
    }

    if (reward.stock <= 0) {
      throw new Error(
        "Stok reward sudah habis."
      );
    }

    /**
     * ========================================================
     * 4. VALIDATE REQUIRED POINTS
     * ========================================================
     */

    if (
      !Number.isInteger(
        reward.requiredPoints
      ) ||
      reward.requiredPoints <= 0
    ) {
      throw new Error(
        "Konfigurasi point reward tidak valid."
      );
    }

    /**
     * ========================================================
     * 5. CHECK POINT BALANCE
     * ========================================================
     */

    if (
      user.rewardPointsBalance <
      reward.requiredPoints
    ) {
      throw new Error(
        `Point tidak mencukupi. Dibutuhkan ${reward.requiredPoints} point, saldo Anda ${user.rewardPointsBalance} point.`
      );
    }

    /**
     * ========================================================
     * 6. DECREMENT STOCK
     * ========================================================
     *
     * Tetap menggunakan guarded decrement sebagai
     * protection tambahan.
     */

    const updatedReward =
      await RewardCatalogRepository.decrementStock(
        reward.id,
        tx
      );

    if (!updatedReward) {
      throw new Error(
        "Gagal mengurangi stok reward."
      );
    }

    /**
     * ========================================================
     * 7. CREATE REWARD CLAIM
     * ========================================================
     */

    const claim =
      await RewardClaimRepository.create(
        {
          userId:
            normalizedUserId,

          rewardCatalogId:
            reward.id,

          pointsSpent:
            reward.requiredPoints,

          rewardName:
            reward.name,

          rewardDescription:
            reward.description,

          rewardImage:
            reward.image,

          status:
            RewardClaimStatus.PENDING,
        },
        tx
      );

    /**
     * ========================================================
     * 8. CREATE REDEEM LEDGER
     * ========================================================
     *
     * REDEEM selalu negatif.
     */

    const transaction =
      await tx.rewardPointTransaction.create({
        data: {
          userId:
            normalizedUserId,

          orderId:
            null,

          rewardClaimId:
            claim.id,

          type:
            RewardPointTransactionType.REDEEM,

          points:
            -reward.requiredPoints,

          weightGrams:
            null,

          description:
            `Claim reward ${reward.name}`,
        },
      });

    /**
     * ========================================================
     * 9. DECREMENT USER BALANCE
     * ========================================================
     */

    const updatedUser =
      await tx.user.update({
        where: {
          id:
            normalizedUserId,
        },

        data: {
          rewardPointsBalance: {
            decrement:
              reward.requiredPoints,
          },
        },

        select: {
          rewardPointsBalance:
            true,
        },
      });

    /**
     * ========================================================
     * 10. RESULT
     * ========================================================
     */

    return {
      success: true,

      claim: {
        id:
          claim.id,

        status:
          claim.status,

        rewardName:
          claim.rewardName,

        rewardDescription:
          claim.rewardDescription,

        rewardImage:
          claim.rewardImage,

        pointsSpent:
          claim.pointsSpent,

        createdAt:
          claim.createdAt,
      },

      remainingPoints:
        updatedUser.rewardPointsBalance,

      remainingStock:
        updatedReward.stock,

      transactionId:
        transaction.id,
    };
  }
);
}

/**
 * ============================================================
 * GET CUSTOMER REWARD CLAIMS
 * ============================================================
 *
 * Mengambil seluruh histori claim reward fisik
 * milik customer yang sedang login.
 *
 * ============================================================
 */

export async function getCustomerRewardClaims(
  userId: string
) {
  const normalizedUserId =
    String(userId ?? "").trim();

  if (!normalizedUserId) {
    throw new Error(
      "User ID tidak valid."
    );
  }

  return RewardClaimRepository.findManyByUser(
    normalizedUserId
  );
}

/**
 * ============================================================
 * UPDATE REWARD CLAIM STATUS
 * ============================================================
 *
 * Lifecycle:
 *
 * PENDING
 *   ├── APPROVED
 *   ├── REJECTED + REFUND
 *   └── CANCELLED + REFUND
 *
 * APPROVED
 *   └── PROCESSING
 *
 * PROCESSING
 *   └── SHIPPED
 *
 * SHIPPED
 *   └── COMPLETED
 *
 * Terminal:
 *
 * COMPLETED
 * REJECTED
 * CANCELLED
 *
 * tidak dapat diubah lagi.
 *
 * ============================================================
 *
 * REFUND:
 *
 * Jika status berubah menjadi:
 *
 * REJECTED
 * atau
 * CANCELLED
 *
 * maka:
 *
 * 1. Lock claim
 * 2. Lock user
 * 3. Restore stock
 * 4. Create REFUND ledger
 * 5. Restore user point balance
 * 6. Update claim status
 *
 * semuanya dalam satu transaction.
 * ============================================================
 */

export async function updateRewardClaimStatus(
  claimId: string,
  status: RewardClaimStatus,
  rejectionReason?: string | null
) {
  /**
   * ==========================================================
   * NORMALIZE INPUT
   * ==========================================================
   */

  const normalizedClaimId =
    String(claimId ?? "").trim();

  /**
   * ==========================================================
   * VALIDATE INPUT
   * ==========================================================
   */

  if (!normalizedClaimId) {
    throw new Error(
      "Claim ID tidak valid."
    );
  }

  /**
   * ==========================================================
   * ATOMIC TRANSACTION
   * ==========================================================
   */

  return prisma.$transaction(
    async (tx) => {

      /**
       * ========================================================
       * 1. LOCK CLAIM
       * ========================================================
       *
       * Row lock diperlukan agar dua request Admin
       * tidak dapat memproses claim yang sama
       * secara bersamaan.
       */

      const claim =
        await RewardClaimRepository.findByIdForUpdate(
          normalizedClaimId,
          tx
        );

      if (!claim) {
        throw new Error(
          "Reward claim tidak ditemukan."
        );
      }

      /**
       * ========================================================
       * 2. IDEMPOTENT CHECK
       * ========================================================
       *
       * Jika status sudah sama:
       *
       * - jangan refund lagi
       * - jangan membuat ledger baru
       * - jangan mengubah stock
       */

      if (
        claim.status === status
      ) {
        return {
          success: true,

          idempotent: true,

          claim,
        };
      }

      /**
       * ========================================================
       * 3. TERMINAL STATE
       * ========================================================
       *
       * Status berikut tidak boleh berubah lagi.
       */

      if (
        claim.status ===
          RewardClaimStatus.COMPLETED ||
        claim.status ===
          RewardClaimStatus.REJECTED ||
        claim.status ===
          RewardClaimStatus.CANCELLED
      ) {
        throw new Error(
          `Claim dengan status ${claim.status} tidak dapat diubah lagi.`
        );
      }

      /**
       * ========================================================
       * 4. VALIDATE TRANSITION
       * ========================================================
       *
       * Lifecycle:
       *
       * PENDING
       *   ├── APPROVED
       *   ├── REJECTED
       *   └── CANCELLED
       *
       * APPROVED
       *   └── PROCESSING
       *
       * PROCESSING
       *   └── SHIPPED
       *
       * SHIPPED
       *   └── COMPLETED
       */

      const allowedTransitions:
        Record<
          RewardClaimStatus,
          RewardClaimStatus[]
        > = {
          [RewardClaimStatus.PENDING]: [
            RewardClaimStatus.APPROVED,
            RewardClaimStatus.REJECTED,
            RewardClaimStatus.CANCELLED,
          ],

          [RewardClaimStatus.APPROVED]: [
            RewardClaimStatus.PROCESSING,
          ],

          [RewardClaimStatus.PROCESSING]: [
            RewardClaimStatus.SHIPPED,
          ],

          [RewardClaimStatus.SHIPPED]: [
            RewardClaimStatus.COMPLETED,
          ],

          [RewardClaimStatus.COMPLETED]: [],

          [RewardClaimStatus.REJECTED]: [],

          [RewardClaimStatus.CANCELLED]: [],
        };

      if (
        !allowedTransitions[
          claim.status
        ].includes(status)
      ) {
        throw new Error(
          `Perubahan status ${claim.status} → ${status} tidak diperbolehkan.`
        );
      }

      /**
       * ========================================================
       * 5. DETERMINE REFUND
       * ========================================================
       */

      const shouldRefund =
        status ===
          RewardClaimStatus.REJECTED ||
        status ===
          RewardClaimStatus.CANCELLED;

      /**
       * ========================================================
       * 6. REFUND VALIDATION
       * ========================================================
       */

      if (shouldRefund) {

        /**
         * ------------------------------------------------------
         * REFUND TIDAK BOLEH DILAKUKAN DUA KALI
         * ------------------------------------------------------
         */

        if (claim.refundedAt) {
          throw new Error(
            "Point claim ini sudah dikembalikan."
          );
        }

        /**
         * ------------------------------------------------------
         * VALIDATE POINTS
         * ------------------------------------------------------
         */

        if (
          !Number.isInteger(
            claim.pointsSpent
          ) ||
          claim.pointsSpent <= 0
        ) {
          throw new Error(
            "Jumlah point refund tidak valid."
          );
        }

        /**
         * ------------------------------------------------------
         * REJECTION REASON WAJIB
         * ------------------------------------------------------
         */

        if (
          status ===
            RewardClaimStatus.REJECTED &&
          !String(
            rejectionReason ?? ""
          ).trim()
        ) {
          throw new Error(
            "Alasan penolakan wajib diisi."
          );
        }
      }

      /**
       * ========================================================
       * 7. REFUND ATOMIC OPERATION
       * ========================================================
       */

let updatedUser:
  | {
      rewardPointsBalance: number;
    }
  | null = null;

let updatedReward:
  | Awaited<
      ReturnType<
        typeof RewardCatalogRepository.incrementStock
      >
    >
  | null = null;

let refundTransaction:
  | Awaited<
      ReturnType<
        typeof tx.rewardPointTransaction.create
      >
    >
  | null = null;

      if (shouldRefund) {

        /**
         * ------------------------------------------------------
         * 7A. LOCK USER
         * ------------------------------------------------------
         *
         * User harus di-lock sebelum saldo point
         * dikembalikan.
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
                "id" = ${claim.userId}
                AND "deletedAt" IS NULL
              FOR UPDATE
            `
          );

        const user =
          users[0];

        if (!user) {
          throw new Error(
            "Customer tidak ditemukan."
          );
        }

        /**
         * ------------------------------------------------------
         * 7B. RESTORE STOCK
         * ------------------------------------------------------
         */

        updatedReward =
          await RewardCatalogRepository.incrementStock(
            claim.rewardCatalogId,
            tx
          );

        if (!updatedReward) {
          throw new Error(
            "Gagal mengembalikan stok hadiah."
          );
        }

        /**
         * ------------------------------------------------------
         * 7C. CREATE REFUND LEDGER
         * ------------------------------------------------------
         *
         * REFUND selalu positif.
         */

        refundTransaction =
          await tx.rewardPointTransaction.create({
            data: {
              userId:
                claim.userId,

              orderId:
                null,

              rewardClaimId:
                claim.id,

              type:
                RewardPointTransactionType.REFUND,

              points:
                claim.pointsSpent,

              weightGrams:
                null,

              description:
                `Refund claim reward ${claim.rewardName}`,
            },
          });

        /**
         * ------------------------------------------------------
         * 7D. RESTORE USER BALANCE
         * ------------------------------------------------------
         */

        updatedUser =
          await tx.user.update({
            where: {
              id:
                claim.userId,
            },

            data: {
              rewardPointsBalance: {
                increment:
                  claim.pointsSpent,
              },
            },

            select: {
              rewardPointsBalance:
                true,
            },
          });
      }

      /**
       * ========================================================
       * 8. UPDATE CLAIM
       * ========================================================
       */

      const now =
        new Date();

      const updatedClaim =
        await RewardClaimRepository.updateStatus(
          claim.id,
          {
            status,

            ...(status ===
              RewardClaimStatus.REJECTED && {
              rejectionReason:
                String(
                  rejectionReason ?? ""
                ).trim(),
            }),

            ...(status !==
              RewardClaimStatus.REJECTED && {
              rejectionReason:
                null,
            }),

            ...(shouldRefund && {
              refundedAt:
                now,
            }),

            ...(status ===
              RewardClaimStatus.APPROVED && {
              approvedAt:
                now,
            }),

            ...(status ===
              RewardClaimStatus.SHIPPED && {
              shippedAt:
                now,
            }),

            ...(status ===
              RewardClaimStatus.COMPLETED && {
              completedAt:
                now,
            }),
          },
          tx
        );

      /**
       * ========================================================
       * 9. RESULT
       * ========================================================
       */

      return {
        success: true,

        idempotent: false,

        claim:
          updatedClaim,

        ...(shouldRefund && {
          refund: {
            points:
              claim.pointsSpent,

            transactionId:
              refundTransaction?.id,

            remainingPoints:
              updatedUser
                ?.rewardPointsBalance,

            remainingStock:
              updatedReward?.stock,
          },
        }),
      };
    }
  );
}
