import {
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

/**
 * ============================================================
 * REWARD CATEGORY REPOSITORY
 * ============================================================
 *
 * Repository khusus untuk RewardCategory.
 *
 * Tanggung jawab:
 *
 * - membaca seluruh category
 * - membaca category aktif
 * - mencari category berdasarkan ID
 * - mencari category berdasarkan slug
 * - membuat category
 * - memperbarui category
 * - mengaktifkan / menonaktifkan category
 * - menghitung reward yang menggunakan category
 *
 * Repository TIDAK menangani business logic.
 *
 * Business validation tetap berada di:
 *
 * AdminRewardCategoryService
 *
 * ============================================================
 */

type RewardCategoryRepositoryClient =
  | typeof prisma
  | Prisma.TransactionClient;

/**
 * ============================================================
 * CREATE INPUT
 * ============================================================
 */

export type CreateRewardCategoryInput = {
  name: string;

  slug: string;

  isActive?: boolean;

  sortOrder?: number;
};

/**
 * ============================================================
 * UPDATE INPUT
 * ============================================================
 */

export type UpdateRewardCategoryInput = {
  name?: string;

  slug?: string;

  isActive?: boolean;

  sortOrder?: number;
};

/**
 * ============================================================
 * REPOSITORY
 * ============================================================
 */

export class RewardCategoryRepository {
  /**
   * ==========================================================
   * FIND MANY
   * ==========================================================
   *
   * Mengambil seluruh reward category.
   *
   * Termasuk:
   *
   * - active
   * - inactive
   *
   * Digunakan oleh halaman Admin.
   *
   * Urutan:
   *
   * 1. sortOrder ASC
   * 2. name ASC
   * 3. createdAt ASC
   */

  static async findMany(
    client: RewardCategoryRepositoryClient = prisma
  ) {
    return client.rewardCategory.findMany({
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
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
   * Hanya mengambil category aktif.
   *
   * Digunakan sebagai pilihan category baru.
   *
   * Digunakan oleh:
   *
   * - Create Reward Catalog
   * - pilihan category pengganti pada Edit Reward Catalog
   * - Customer Reward Catalog
   */

  static async findActive(
    client: RewardCategoryRepositoryClient = prisma
  ) {
    return client.rewardCategory.findMany({
      where: {
        isActive: true,
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
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
   * Mengambil category tanpa mempedulikan status aktif.
   *
   * Penting untuk Edit Reward Catalog karena category yang
   * sedang digunakan reward boleh saja sudah inactive.
   */

  static async findById(
    id: string,
    client: RewardCategoryRepositoryClient = prisma
  ) {
    return client.rewardCategory.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * ==========================================================
   * FIND BY ID WITH REWARD COUNT
   * ==========================================================
   *
   * Mengambil category sekaligus jumlah reward yang
   * menggunakan category tersebut.
   *
   * Digunakan untuk kebutuhan Admin.
   */

  static async findByIdWithRewardCount(
    id: string,
    client: RewardCategoryRepositoryClient = prisma
  ) {
    return client.rewardCategory.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            rewards: true,
          },
        },
      },
    });
  }

  /**
   * ==========================================================
   * FIND BY SLUG
   * ==========================================================
   *
   * Slug bersifat unique di database.
   *
   * Contoh:
   *
   * kebutuhan-rumah
   * dapur
   * elektronik
   */

  static async findBySlug(
    slug: string,
    client: RewardCategoryRepositoryClient = prisma
  ) {
    return client.rewardCategory.findUnique({
      where: {
        slug,
      },
    });
  }

  /**
   * ==========================================================
   * CREATE
   * ==========================================================
   */

  static async create(
    data: CreateRewardCategoryInput,
    client: RewardCategoryRepositoryClient = prisma
  ) {
    return client.rewardCategory.create({
      data: {
        name:
          data.name,

        slug:
          data.slug,

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
    data: UpdateRewardCategoryInput,
    client: RewardCategoryRepositoryClient = prisma
  ) {
    return client.rewardCategory.update({
      where: {
        id,
      },

      data: {
        ...(data.name !== undefined && {
          name:
            data.name,
        }),

        ...(data.slug !== undefined && {
          slug:
            data.slug,
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
    client: RewardCategoryRepositoryClient = prisma
  ) {
    return client.rewardCategory.update({
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
   * COUNT REWARDS
   * ==========================================================
   *
   * Menghitung berapa RewardCatalog yang menggunakan
   * category tertentu.
   *
   * Digunakan untuk:
   *
   * - informasi Admin
   * - validasi business logic
   * - mengetahui apakah category sudah digunakan reward
   *
   * Category tidak menyediakan hard delete.
   */

  static async countRewards(
    id: string,
    client: RewardCategoryRepositoryClient = prisma
  ) {
    return client.rewardCatalog.count({
      where: {
        categoryId:
          id,
      },
    });
  }
}

export default RewardCategoryRepository;
