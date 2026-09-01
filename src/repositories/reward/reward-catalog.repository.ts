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
 * - membaca reward aktif
 * - mencari reward berdasarkan ID
 * - mencari reward dengan row lock
 * - membuat reward
 * - memperbarui reward
 * - mengaktifkan / menonaktifkan reward
 * - mengurangi stock ketika claim
 * - mengembalikan stock ketika claim dibatalkan / ditolak
 * - menghitung histori claim
 * - menghapus reward yang belum memiliki histori claim
 *
 * Repository TIDAK menangani business logic.
 *
 * Business validation berada di service.
 *
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

  categoryId?: string | null;

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

  categoryId?: string | null;

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
   *
   * Mengambil seluruh reward catalog.
   *
   * Termasuk:
   *
   * - reward aktif
   * - reward nonaktif
   * - reward stock 0
   * - reward tanpa category jika masih ada data legacy
   *
   * Relation category ikut diambil untuk kebutuhan:
   *
   * - Admin Reward Catalog
   * - filter / grouping
   * - tampilan nama category
   *
   * Urutan:
   *
   * 1. sortOrder ASC
   * 2. requiredPoints ASC
   * 3. createdAt ASC
   *
   * ==========================================================
   */

  static async findMany(
    client: RewardCatalogRepositoryClient = prisma
  ) {
    return client.rewardCatalog.findMany({
      include: {
        category: true,
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
   * FIND ACTIVE
   * ==========================================================
   *
   * Hanya reward yang benar-benar dapat ditampilkan kepada
   * customer:
   *
   * 1. Reward aktif
   * 2. Stock > 0
   * 3. Category aktif
   *
   * Category wajib aktif agar reward dari category yang sudah
   * dinonaktifkan tidak muncul di customer catalog.
   *
   * ==========================================================
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

        category: {
          is: {
            isActive: true,
          },
        },
      },

      include: {
        category: true,
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
   *
   * Digunakan untuk:
   *
   * - detail reward
   * - edit reward
   * - validasi reward
   * - delete reward
   *
   * Relation category ikut dikembalikan.
   *
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

      include: {
        category: true,
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
   * Digunakan ketika customer melakukan claim reward.
   *
   * Tujuannya mencegah race condition pada stock.
   *
   * Contoh:
   *
   * Stock = 1
   *
   * Customer A claim
   * Customer B claim
   *
   * Tanpa row lock kedua transaksi dapat membaca stock
   * yang sama.
   *
   * FOR UPDATE memastikan transaksi harus bergantian
   * mengakses row tersebut.
   *
   * ==========================================================
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

          categoryId: string | null;

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
            "categoryId",
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
   *
   * Membuat reward catalog baru.
   *
   * Relation category ikut dikembalikan supaya caller
   * langsung mendapatkan data reward lengkap.
   *
   * ==========================================================
   */

  static async create(
    data: CreateRewardCatalogInput,
    client: RewardCatalogRepositoryClient = prisma
  ) {
    return client.rewardCatalog.create({
      data: {
        name:
          data.name,

        description:
          data.description ?? null,

        image:
          data.image ?? null,

        categoryId:
          data.categoryId ?? null,

        requiredPoints:
          data.requiredPoints,

        stock:
          data.stock ?? 0,

        isActive:
          data.isActive ?? true,

        sortOrder:
          data.sortOrder ?? 0,
      },

      include: {
        category: true,
      },
    });
  }

  /**
   * ==========================================================
   * UPDATE
   * ==========================================================
   *
   * Update bersifat partial.
   *
   * Field yang undefined tidak akan dikirim ke Prisma.
   *
   * categoryId dapat:
   *
   * - diisi category baru
   * - diganti category
   * - di-set null jika business logic mengizinkan
   *
   * Validasi category tetap menjadi tanggung jawab service.
   *
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
          name:
            data.name,
        }),

        ...(data.description !== undefined && {
          description:
            data.description,
        }),

        ...(data.image !== undefined && {
          image:
            data.image,
        }),

        ...(data.categoryId !== undefined && {
          categoryId:
            data.categoryId,
        }),

        ...(data.requiredPoints !== undefined && {
          requiredPoints:
            data.requiredPoints,
        }),

        ...(data.stock !== undefined && {
          stock:
            data.stock,
        }),

        ...(data.isActive !== undefined && {
          isActive:
            data.isActive,
        }),

        ...(data.sortOrder !== undefined && {
          sortOrder:
            data.sortOrder,
        }),
      },

      include: {
        category: true,
      },
    });
  }

  /**
   * ==========================================================
   * SET ACTIVE
   * ==========================================================
   *
   * Mengaktifkan / menonaktifkan reward.
   *
   * Relation category ikut dikembalikan.
   *
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

      include: {
        category: true,
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
   * Guard:
   *
   * stock > 0
   *
   * tetap dipertahankan sebagai protection tambahan.
   *
   * ==========================================================
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

    if (
      result.count !== 1
    ) {
      throw new Error(
        "Stok hadiah sudah habis atau hadiah tidak ditemukan."
      );
    }

    return client.rewardCatalog.findUnique({
      where: {
        id,
      },

      include: {
        category: true,
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
   * Method ini HARUS dipanggil dalam transaction yang sama
   * dengan refund point.
   *
   * ==========================================================
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

    if (
      result.count !== 1
    ) {
      throw new Error(
        "Gagal mengembalikan stok hadiah."
      );
    }

    return client.rewardCatalog.findUnique({
      where: {
        id,
      },

      include: {
        category: true,
      },
    });
  }

  /**
   * ==========================================================
   * COUNT CLAIMS
   * ==========================================================
   *
   * Menghitung seluruh histori RewardClaim untuk reward.
   *
   * Digunakan sebelum hard delete.
   *
   * Jika count > 0:
   *
   * reward tidak boleh dihapus karena histori harus
   * tetap dipertahankan.
   *
   * ==========================================================
   */

  static async countClaims(
    id: string,
    client: RewardCatalogRepositoryClient = prisma
  ) {
    return client.rewardClaim.count({
      where: {
        rewardCatalogId:
          id,
      },
    });
  }

  /**
   * ==========================================================
   * DELETE
   * ==========================================================
   *
   * Hard delete RewardCatalog.
   *
   * Business rule:
   *
   * Reward yang sudah memiliki claim tidak boleh dihapus.
   *
   * Protection utama berada di service.
   *
   * Foreign key:
   *
   * RewardClaim -> RewardCatalog
   *
   * dengan onDelete = Restrict
   *
   * menjadi protection database terakhir terhadap race
   * condition.
   *
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

export default RewardCatalogRepository;
