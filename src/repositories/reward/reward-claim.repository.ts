import {
  Prisma,
  RewardClaimStatus,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

/**
 * ============================================================
 * REWARD CLAIM REPOSITORY
 * ============================================================
 *
 * Repository khusus untuk RewardClaim.
 *
 * Tanggung jawab:
 *
 * - membaca RewardClaim
 * - membuat RewardClaim
 * - memperbarui status RewardClaim
 * - mengambil riwayat claim customer
 *
 * Repository TIDAK menangani business logic:
 *
 * - validasi saldo point
 * - validasi stock
 * - refund point
 * - perubahan RewardPointTransaction
 * - perubahan rewardPointsBalance
 *
 * Business logic tersebut berada di RewardClaimService.
 *
 * Repository mendukung Prisma TransactionClient agar
 * RewardClaim dapat dibuat / diubah dalam transaction
 * yang sama dengan perubahan point dan stock.
 * ============================================================
 */

type RewardClaimRepositoryClient =
  | typeof prisma
  | Prisma.TransactionClient;

/**
 * ============================================================
 * CREATE INPUT
 * ============================================================
 */

export type CreateRewardClaimInput = {
  userId: string;

  rewardCatalogId: string;

  pointsSpent: number;

  rewardName: string;

  rewardDescription?: string | null;

  rewardImage?: string | null;

  status?: RewardClaimStatus;
};

/**
 * ============================================================
 * UPDATE STATUS INPUT
 * ============================================================
 */

export type UpdateRewardClaimStatusInput = {
  status: RewardClaimStatus;

  rejectionReason?: string | null;

  refundedAt?: Date | null;

  approvedAt?: Date | null;

  shippedAt?: Date | null;

  completedAt?: Date | null;
};

/**
 * ============================================================
 * REPOSITORY
 * ============================================================
 */

export class RewardClaimRepository {
  /**
   * ==========================================================
   * GET CLIENT
   * ==========================================================
   */

  private static getClient(
    client: RewardClaimRepositoryClient
  ) {
    return client;
  }

  /**
   * ==========================================================
   * FIND BY ID
   * ==========================================================
   */

  static async findById(
    id: string,
    client: RewardClaimRepositoryClient = prisma
  ) {
    const db =
      this.getClient(client);

    return db.rewardClaim.findUnique({
      where: {
        id,
      },

      include: {
        rewardCatalog: true,
      },
    });
  }

  /**
 * ==========================================================
 * FIND BY ID FOR UPDATE
 * ==========================================================
 *
 * Digunakan oleh lifecycle RewardClaim.
 *
 * Row lock diperlukan agar dua request Admin
 * tidak dapat memproses claim yang sama
 * secara bersamaan.
 */
static async findByIdForUpdate(
  id: string,
  client: Prisma.TransactionClient
) {
  const rows =
    await client.$queryRaw<
      Array<{
        id: string;
        userId: string;
        rewardCatalogId: string;
        pointsSpent: number;
        rewardName: string;
        rewardDescription: string | null;
        rewardImage: string | null;
        status: RewardClaimStatus;
        rejectionReason: string | null;
        refundedAt: Date | null;
        approvedAt: Date | null;
        shippedAt: Date | null;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >(
      Prisma.sql`
        SELECT
          "id",
          "userId",
          "rewardCatalogId",
          "pointsSpent",
          "rewardName",
          "rewardDescription",
          "rewardImage",
          "status",
          "rejectionReason",
          "refundedAt",
          "approvedAt",
          "shippedAt",
          "completedAt",
          "createdAt",
          "updatedAt"
        FROM "RewardClaim"
        WHERE "id" = ${id}
        FOR UPDATE
      `
    );

  return rows[0] ?? null;
}

  /**
   * ==========================================================
   * FIND MANY BY USER
   * ==========================================================
   *
   * Digunakan untuk halaman riwayat reward customer.
   */

  static async findManyByUser(
    userId: string,
    client: RewardClaimRepositoryClient = prisma
  ) {
    const db =
      this.getClient(client);

    return db.rewardClaim.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        rewardCatalog: {
          select: {
            id: true,

            name: true,

            image: true,
          },
        },
      },
    });
  }

  /**
   * ==========================================================
   * FIND MANY
   * ==========================================================
   *
   * Digunakan oleh Admin untuk melihat seluruh claim.
   */

  static async findMany(
    options?: {
      status?: RewardClaimStatus;

      userId?: string;

      rewardCatalogId?: string;

      skip?: number;

      take?: number;
    },

    client: RewardClaimRepositoryClient = prisma
  ) {
    const db =
      this.getClient(client);

    const {
      status,
      userId,
      rewardCatalogId,
      skip,
      take,
    } = options ?? {};

    return db.rewardClaim.findMany({
      where: {
        ...(status !== undefined && {
          status,
        }),

        ...(userId !== undefined && {
          userId,
        }),

        ...(rewardCatalogId !== undefined && {
          rewardCatalogId,
        }),
      },

      orderBy: {
        createdAt: "desc",
      },

      ...(typeof skip === "number" && {
        skip,
      }),

      ...(typeof take === "number" && {
        take,
      }),

      include: {
        rewardCatalog: {
          select: {
            id: true,

            name: true,

            image: true,
          },
        },

        user: {
          select: {
            id: true,

            name: true,

            email: true,

            phone: true,
          },
        },
      },
    });
  }

  /**
   * ==========================================================
   * CREATE
   * ==========================================================
   *
   * Hanya membuat RewardClaim.
   *
   * Tidak mengurangi point.
   * Tidak mengurangi stock.
   * Tidak membuat ledger.
   */

  static async create(
    data: CreateRewardClaimInput,

    client: RewardClaimRepositoryClient = prisma
  ) {
    const db =
      this.getClient(client);

    return db.rewardClaim.create({
      data: {
        userId:
          data.userId,

        rewardCatalogId:
          data.rewardCatalogId,

        pointsSpent:
          data.pointsSpent,

        rewardName:
          data.rewardName,

        rewardDescription:
          data.rewardDescription ?? null,

        rewardImage:
          data.rewardImage ?? null,

        status:
          data.status ??
          RewardClaimStatus.PENDING,
      },
    });
  }

  /**
   * ==========================================================
   * UPDATE STATUS
   * ==========================================================
   *
   * Method generik untuk perubahan status.
   *
   * Business validation transition status dilakukan
   * oleh RewardClaimService.
   */

  static async updateStatus(
    id: string,

    data: UpdateRewardClaimStatusInput,

    client: RewardClaimRepositoryClient = prisma
  ) {
    const db =
      this.getClient(client);

    return db.rewardClaim.update({
      where: {
        id,
      },

data: {
  status:
    data.status,

  ...(data.rejectionReason !== undefined && {
    rejectionReason:
      data.rejectionReason,
  }),

  ...(data.refundedAt !== undefined && {
    refundedAt:
      data.refundedAt,
  }),

  ...(data.approvedAt !== undefined && {
    approvedAt:
      data.approvedAt,
  }),

  ...(data.shippedAt !== undefined && {
    shippedAt:
      data.shippedAt,
  }),

  ...(data.completedAt !== undefined && {
    completedAt:
      data.completedAt,
  }),
},
    });
  }
}
