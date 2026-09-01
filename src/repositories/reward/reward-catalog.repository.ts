import {
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

/**
 * ============================================================
 * REWARD CATALOG REPOSITORY
 * ============================================================
 *
 * Repository khusus untuk RewardCatalog.
 *
 * Tanggung jawab:
 *
 * - membaca katalog reward
 * - mencari reward berdasarkan ID
 * - membuat reward
 * - memperbarui reward
 * - mengaktifkan / menonaktifkan reward
 * - mengurangi stock ketika claim
 * - mengembalikan stock ketika claim dibatalkan / ditolak
 *
 * Repository TIDAK menangani business logic claim.
 *
 * Proses claim reward fisik akan ditangani oleh
 * RewardClaimService dan berjalan dalam transaction.
 * ============================================================
 */

type RewardCatalogRepositoryClient =
  | typeof prisma
  | Prisma.TransactionClient;

/**
 * ============================================================
 * CREATE INPUT
 * ============================================================
 */

export type CreateRewardCatalogInput = {
  name: string;

  description?: string | null;

  image?: string | null;

  requiredPoints: number;

  stock?: number;

  isActive?: boolean;

  sortOrder?: number;
};

/**
 * ============================================================
 * UPDATE INPUT
 * ============================================================
 */

export type UpdateRewardCatalogInput = {
  name?: string;

  description?: string | null;

  image?: string | null;

  requiredPoints?: number;

  stock?: number;

  isActive?: boolean;

  sortOrder?: number;
};

/**
 * ============================================================
 * REPOSITORY
 * ============================================================
 */

export class RewardCatalogRepository {
  /**
   * ==========================================================
   * FIND MANY
   * ==========================================================
   */

  static async findMany(
    client: RewardCatalogRepositoryClient = prisma
  ) {
    return client.rewardCatalog.findMany({
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          requiredPoints: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  /**
   * ==========================================================
   * FIND ACTIVE
   * ==========================================================
   *
   * Hanya reward:
   *
   * - aktif
   * - stock tersedia
   */

  static async findActive(
    client: RewardCatalogRepositoryClient = prisma
  ) {
    return client.rewardCatalog.findMany({
      where: {
        isActive: true,

        stock: {
          gt: 0,
        },
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          requiredPoints: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  /**
   * ==========================================================
   * FIND BY ID
   * ==========================================================
   */

  static async findById(
    id: string,
    client: RewardCatalogRepositoryClient = prisma
  ) {
    return client.rewardCatalog.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * ==========================================================
   * FIND BY ID FOR UPDATE
   * ==========================================================
   *
   * PostgreSQL row lock.
   *
   * Digunakan ketika claim reward untuk mencegah
   * race condition pada stock.
   */

  static async findByIdForUpdate(
    id: string,
    client: Prisma.TransactionClient
  ) {
    const rows =
      await client.$queryRaw<
        Array<{
          id: string;

          name: string;

          description: string | null;

          image: string | null;

          requiredPoints: number;

          stock: number;

          isActive: boolean;

          sortOrder: number;

          createdAt: Date;

          updatedAt: Date;
        }>
      >(
        Prisma.sql`
          SELECT
            "id",
            "name",
            "description",
            "image",
            "requiredPoints",
            "stock",
            "isActive",
            "sortOrder",
            "createdAt",
            "updatedAt"
          FROM "RewardCatalog"
          WHERE "id" = ${id}
          FOR UPDATE
        `
      );

    return rows[0] ?? null;
  }

  /**
   * ==========================================================
   * CREATE
   * ==========================================================
   */

  static async create(
    data: CreateRewardCatalogInput,
    client: RewardCatalogRepositoryClient = prisma
  ) {
    return client.rewardCatalog.create({
      data: {
        name: data.name,

        description:
          data.description ?? null,

        image:
          data.image ?? null,

        requiredPoints:
          data.requiredPoints,

        stock:
          data.stock ?? 0,

        isActive:
          data.isActive ?? true,

        sortOrder:
          data.sortOrder ?? 0,
      },
    });
  }

  /**
   * ==========================================================
   * UPDATE
   * ==========================================================
   */

  static async update(
    id: string,
    data: UpdateRewardCatalogInput,
    client: RewardCatalogRepositoryClient = prisma
  ) {
    return client.rewardCatalog.update({
      where: {
        id,
      },

      data: {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.description !== undefined && {
          description: data.description,
        }),

        ...(data.image !== undefined && {
          image: data.image,
        }),

        ...(data.requiredPoints !== undefined && {
          requiredPoints: data.requiredPoints,
        }),

        ...(data.stock !== undefined && {
          stock: data.stock,
        }),

        ...(data.isActive !== undefined && {
          isActive: data.isActive,
        }),

        ...(data.sortOrder !== undefined && {
          sortOrder: data.sortOrder,
        }),
      },
    });
  }

  /**
   * ==========================================================
   * SET ACTIVE
   * ==========================================================
   */

  static async setActive(
    id: string,
    isActive: boolean,
    client: RewardCatalogRepositoryClient = prisma
  ) {
    return client.rewardCatalog.update({
      where: {
        id,
      },

      data: {
        isActive,
      },
    });
  }

  /**
   * ==========================================================
   * DECREMENT STOCK
   * ==========================================================
   *
   * Mengurangi stock sebanyak 1.
   *
   * Digunakan dalam transaction claim.
   *
   * Guard stock > 0 tetap dipertahankan sebagai
   * protection tambahan.
   */

  static async decrementStock(
    id: string,
    client: Prisma.TransactionClient
  ) {
    const result =
      await client.rewardCatalog.updateMany({
        where: {
          id,

          stock: {
            gt: 0,
          },
        },

        data: {
          stock: {
            decrement: 1,
          },
        },
      });

    if (result.count !== 1) {
      throw new Error(
        "Stok hadiah sudah habis atau hadiah tidak ditemukan."
      );
    }

    return client.rewardCatalog.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * ==========================================================
   * INCREMENT STOCK
   * ==========================================================
   *
   * Mengembalikan stock sebanyak 1.
   *
   * Digunakan ketika RewardClaim:
   *
   * - REJECTED
   * - CANCELLED
   *
   * sebelum fulfillment.
   *
   * Method ini HARUS dipanggil dalam transaction
   * yang sama dengan refund point.
   */

    static async incrementStock(
    id: string,
    client: Prisma.TransactionClient
  ) {
    const result =
      await client.rewardCatalog.updateMany({
        where: {
          id,
        },

        data: {
          stock: {
            increment: 1,
          },
        },
      });

    if (result.count !== 1) {
      throw new Error(
        "Gagal mengembalikan stok hadiah."
      );
    }

    return client.rewardCatalog.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * ==========================================================
   * COUNT CLAIMS
   * ==========================================================
   */

  static async countClaims(
    id: string,
    client: RewardCatalogRepositoryClient = prisma
  ) {
    return client.rewardClaim.count({
      where: {
        rewardCatalogId: id,
      },
    });
  }

  /**
   * ==========================================================
   * DELETE
   * ==========================================================
   */

  static async delete(
    id: string,
    client: RewardCatalogRepositoryClient = prisma
  ) {
    return client.rewardCatalog.delete({
      where: {
        id,
      },
    });
  }
}
