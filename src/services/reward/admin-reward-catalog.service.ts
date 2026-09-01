import {
  Prisma,
} from "@prisma/client";

import {
  RewardCatalogRepository,
  CreateRewardCatalogInput,
  UpdateRewardCatalogInput,
} from "@/repositories/reward/reward-catalog.repository";

import {
  RewardCategoryRepository,
} from "@/repositories/reward/reward-category.repository";

/**
 * ============================================================
 * ADMIN REWARD CATALOG SERVICE
 * ============================================================
 *
 * Business logic khusus administrator untuk mengelola
 * katalog hadiah fisik yang dapat ditukar menggunakan
 * reward point.
 *
 * Service ini TIDAK menangani proses claim customer.
 *
 * Proses claim akan ditangani oleh:
 *
 * RewardClaimService
 *
 * ============================================================
 */

/**
 * ============================================================
 * NORMALIZE NAME
 * ============================================================
 */

function normalizeName(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim();
}

/**
 * ============================================================
 * NORMALIZE OPTIONAL STRING
 * ============================================================
 *
 * Empty string dianggap null.
 *
 * Digunakan untuk:
 *
 * - description
 * - image
 * ============================================================
 */

function normalizeOptionalString(
  value: unknown
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  return normalized || null;
}

/**
 * ============================================================
 * PARSE REQUIRED POINTS
 * ============================================================
 */

function parseRequiredPoints(
  value: unknown
): number {
  const points =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isInteger(points) ||
    points <= 0
  ) {
    throw new Error(
      "Required points harus berupa bilangan bulat lebih dari 0."
    );
  }

  return points;
}

/**
 * ============================================================
 * PARSE STOCK
 * ============================================================
 *
 * Stock boleh 0.
 *
 * Stock = 0 berarti:
 *
 * - hadiah masih ada di katalog
 * - tetapi belum dapat di-claim
 *
 * Stock tidak boleh negatif.
 * ============================================================
 */

function parseStock(
  value: unknown
): number {
  const stock =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    throw new Error(
      "Stock harus berupa bilangan bulat 0 atau lebih."
    );
  }

  return stock;
}

/**
 * ============================================================
 * PARSE SORT ORDER
 * ============================================================
 */

function parseSortOrder(
  value: unknown
): number {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const sortOrder =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    throw new Error(
      "Sort order harus berupa bilangan bulat 0 atau lebih."
    );
  }

  return sortOrder;
}

/**
 * ============================================================
 * VALIDATE CATEGORY ID
 * ============================================================
 *
 * Aturan:
 *
 * CREATE:
 * - category wajib dipilih
 * - category harus ada
 * - category harus aktif
 *
 * UPDATE:
 * - category wajib berupa ID valid
 * - category harus ada
 * - category inactive hanya boleh dipertahankan jika
 *   reward memang sudah menggunakan category tersebut
 * ============================================================
 */

async function validateCategoryId(
  categoryId: unknown,
  options?: {
    allowInactiveExisting?: boolean;
  }
): Promise<string> {
  const normalizedId =
    String(
      categoryId ?? ""
    ).trim();

  if (!normalizedId) {
    throw new Error(
      "Kategori reward wajib dipilih."
    );
  }

  const category =
    await RewardCategoryRepository.findById(
      normalizedId
    );

  if (!category) {
    throw new Error(
      "Reward category tidak ditemukan."
    );
  }

  if (
    !category.isActive &&
    !options?.allowInactiveExisting
  ) {
    throw new Error(
      "Reward category yang dipilih tidak aktif."
    );
  }

  return normalizedId;
}

/**
 * ============================================================
 * VALIDATE CREATE DATA
 * ============================================================
 */

async function validateCreateData(
  input: CreateRewardCatalogInput
) {
  /**
   * ----------------------------------------------------------
   * NAME
   * ----------------------------------------------------------
   */

  const name =
    normalizeName(
      input.name
    );

  if (!name) {
    throw new Error(
      "Nama hadiah wajib diisi."
    );
  }

  /**
   * ----------------------------------------------------------
   * CATEGORY
   * ----------------------------------------------------------
   *
   * Category WAJIB untuk reward baru.
   */

  const categoryId =
    await validateCategoryId(
      input.categoryId
    );

  /**
   * ----------------------------------------------------------
   * REQUIRED POINTS
   * ----------------------------------------------------------
   */

  const requiredPoints =
    parseRequiredPoints(
      input.requiredPoints
    );

  /**
   * ----------------------------------------------------------
   * STOCK
   * ----------------------------------------------------------
   */

  const stock =
    parseStock(
      input.stock ?? 0
    );

  /**
   * ----------------------------------------------------------
   * SORT ORDER
   * ----------------------------------------------------------
   */

  const sortOrder =
    parseSortOrder(
      input.sortOrder
    );

  /**
   * ----------------------------------------------------------
   * DESCRIPTION
   * ----------------------------------------------------------
   */

  const description =
    normalizeOptionalString(
      input.description
    );

  /**
   * ----------------------------------------------------------
   * IMAGE
   * ----------------------------------------------------------
   */

  const image =
    normalizeOptionalString(
      input.image
    );

  /**
   * ----------------------------------------------------------
   * RESULT
   * ----------------------------------------------------------
   */

  return {
    name,

    description,

    image,

    categoryId,

    requiredPoints,

    stock,

    isActive:
      input.isActive ?? true,

    sortOrder,
  };
}

/**
 * ============================================================
 * VALIDATE UPDATE DATA
 * ============================================================
 *
 * Update bersifat partial.
 *
 * Field yang tidak dikirim tidak akan diubah.
 *
 * existingCategoryId digunakan untuk mengetahui apakah
 * category inactive yang dipilih adalah category yang memang
 * sudah digunakan reward tersebut.
 * ============================================================
 */

async function validateUpdateData(
  input: UpdateRewardCatalogInput,
  existingCategoryId?: string | null
) {
  const data: UpdateRewardCatalogInput =
    {};

  /**
   * ----------------------------------------------------------
   * NAME
   * ----------------------------------------------------------
   */

  if (
    input.name !== undefined
  ) {
    const name =
      normalizeName(
        input.name
      );

    if (!name) {
      throw new Error(
        "Nama hadiah wajib diisi."
      );
    }

    data.name =
      name;
  }

  /**
   * ----------------------------------------------------------
   * DESCRIPTION
   * ----------------------------------------------------------
   */

  if (
    input.description !== undefined
  ) {
    data.description =
      normalizeOptionalString(
        input.description
      );
  }

  /**
   * ----------------------------------------------------------
   * IMAGE
   * ----------------------------------------------------------
   */

  if (
    input.image !== undefined
  ) {
    data.image =
      normalizeOptionalString(
        input.image
      );
  }

  /**
   * ----------------------------------------------------------
   * CATEGORY
   * ----------------------------------------------------------
   *
   * Jika categoryId dikirim:
   *
   * 1. harus valid
   * 2. category harus ada
   * 3. category harus aktif
   *
   * Pengecualian:
   *
   * Jika category inactive adalah category yang memang sudah
   * digunakan reward tersebut, category tersebut boleh tetap
   * dipertahankan.
   *
   * Ini penting agar reward lama tidak rusak hanya karena
   * category-nya kemudian dinonaktifkan.
   * ----------------------------------------------------------
   */

  if (
    input.categoryId !== undefined
  ) {
    const normalizedCategoryId =
      String(
        input.categoryId ?? ""
      ).trim();

    if (!normalizedCategoryId) {
      throw new Error(
        "Kategori reward wajib dipilih."
      );
    }

    const category =
      await RewardCategoryRepository.findById(
        normalizedCategoryId
      );

    if (!category) {
      throw new Error(
        "Reward category tidak ditemukan."
      );
    }

    const isExistingCategory =
      normalizedCategoryId ===
      existingCategoryId;

    if (
      !category.isActive &&
      !isExistingCategory
    ) {
      throw new Error(
        "Reward category yang dipilih tidak aktif."
      );
    }

    data.categoryId =
      normalizedCategoryId;
  }

  /**
   * ----------------------------------------------------------
   * REQUIRED POINTS
   * ----------------------------------------------------------
   */

  if (
    input.requiredPoints !== undefined
  ) {
    data.requiredPoints =
      parseRequiredPoints(
        input.requiredPoints
      );
  }

  /**
   * ----------------------------------------------------------
   * STOCK
   * ----------------------------------------------------------
   */

  if (
    input.stock !== undefined
  ) {
    data.stock =
      parseStock(
        input.stock
      );
  }

  /**
   * ----------------------------------------------------------
   * ACTIVE STATUS
   * ----------------------------------------------------------
   */

  if (
    input.isActive !== undefined
  ) {
    if (
      typeof input.isActive !==
      "boolean"
    ) {
      throw new Error(
        "Status aktif tidak valid."
      );
    }

    data.isActive =
      input.isActive;
  }

  /**
   * ----------------------------------------------------------
   * SORT ORDER
   * ----------------------------------------------------------
   */

  if (
    input.sortOrder !== undefined
  ) {
    data.sortOrder =
      parseSortOrder(
        input.sortOrder
      );
  }

  return data;
}

/**
 * ============================================================
 * ADMIN REWARD CATALOG SERVICE
 * ============================================================
 */

export class AdminRewardCatalogService {
  /**
   * ==========================================================
   * GET ALL
   * ==========================================================
   *
   * Mengembalikan seluruh reward termasuk:
   *
   * - active
   * - inactive
   * - stock 0
   */

  static async getAll() {
    return RewardCatalogRepository.findMany();
  }

  /**
   * ==========================================================
   * GET ACTIVE
   * ==========================================================
   *
   * Hanya reward aktif dan memiliki stock.
   */

  static async getActive() {
    return RewardCatalogRepository.findActive();
  }

  /**
   * ==========================================================
   * GET BY ID
   * ==========================================================
   */

  static async getById(
    id: string
  ) {
    const normalizedId =
      String(
        id ?? ""
      ).trim();

    if (!normalizedId) {
      throw new Error(
        "Reward catalog ID tidak valid."
      );
    }

    const reward =
      await RewardCatalogRepository.findById(
        normalizedId
      );

    if (!reward) {
      throw new Error(
        "Reward tidak ditemukan."
      );
    }

    return reward;
  }

  /**
   * ==========================================================
   * CREATE
   * ==========================================================
   */

  static async create(
    input: CreateRewardCatalogInput
  ) {
    const data =
      await validateCreateData(
        input
      );

    try {
      return await RewardCatalogRepository.create(
        data
      );
    } catch (error) {
      /**
       * Foreign key protection.
       *
       * Secara normal category sudah divalidasi di atas.
       * Tetapi database tetap menjadi protection terakhir
       * terhadap race condition.
       */

      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        if (
          error.code === "P2003"
        ) {
          throw new Error(
            "Reward category tidak ditemukan."
          );
        }
      }

      throw error;
    }
  }

  /**
   * ==========================================================
   * UPDATE
   * ==========================================================
   */

  static async update(
    id: string,
    input: UpdateRewardCatalogInput
  ) {
    const normalizedId =
      String(
        id ?? ""
      ).trim();

    if (!normalizedId) {
      throw new Error(
        "Reward catalog ID tidak valid."
      );
    }

    /**
     * --------------------------------------------------------
     * PASTIKAN REWARD ADA
     * --------------------------------------------------------
     */

    const existing =
      await RewardCatalogRepository.findById(
        normalizedId
      );

    if (!existing) {
      throw new Error(
        "Reward tidak ditemukan."
      );
    }

    /**
     * --------------------------------------------------------
     * VALIDATE UPDATE DATA
     * --------------------------------------------------------
     */

    const data =
      await validateUpdateData(
        input,
        existing.categoryId
      );

    /**
     * --------------------------------------------------------
     * TIDAK ADA DATA
     * --------------------------------------------------------
     */

    if (
      Object.keys(data)
        .length === 0
    ) {
      throw new Error(
        "Tidak ada data reward yang diperbarui."
      );
    }

    try {
      return await RewardCatalogRepository.update(
        normalizedId,
        data
      );
    } catch (error) {
      /**
       * Foreign key protection.
       */

      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        if (
          error.code === "P2003"
        ) {
          throw new Error(
            "Reward category tidak ditemukan."
          );
        }
      }

      throw error;
    }
  }

  /**
   * ==========================================================
   * SET ACTIVE
   * ==========================================================
   */

  static async setActive(
    id: string,
    isActive: boolean
  ) {
    const normalizedId =
      String(
        id ?? ""
      ).trim();

    if (!normalizedId) {
      throw new Error(
        "Reward catalog ID tidak valid."
      );
    }

    const existing =
      await RewardCatalogRepository.findById(
        normalizedId
      );

    if (!existing) {
      throw new Error(
        "Reward tidak ditemukan."
      );
    }

    return RewardCatalogRepository.setActive(
      normalizedId,
      Boolean(isActive)
    );
  }

  /**
   * ==========================================================
   * DELETE
   * ==========================================================
   *
   * Hard delete hanya diperbolehkan jika reward BELUM pernah
   * memiliki histori claim.
   *
   * Jika sudah pernah digunakan customer:
   *
   * - reward tidak boleh dihapus
   * - histori claim harus tetap tersedia
   * - admin diarahkan untuk menonaktifkan reward
   *
   * Database FK onDelete = Restrict menjadi protection terakhir
   * terhadap race condition.
   */

  static async delete(
    id: string
  ) {
    const normalizedId =
      String(
        id ?? ""
      ).trim();

    if (!normalizedId) {
      throw new Error(
        "Reward catalog ID tidak valid."
      );
    }

    /**
     * --------------------------------------------------------
     * GET EXISTING REWARD
     * --------------------------------------------------------
     */

    const existing =
      await RewardCatalogRepository.findById(
        normalizedId
      );

    if (!existing) {
      throw new Error(
        "Reward tidak ditemukan."
      );
    }

    /**
     * --------------------------------------------------------
     * CHECK CLAIM HISTORY
     * --------------------------------------------------------
     */

    const claimCount =
      await RewardCatalogRepository.countClaims(
        normalizedId
      );

    if (
      claimCount > 0
    ) {
      throw new Error(
        "Reward tidak dapat dihapus karena sudah memiliki histori penukaran. Nonaktifkan reward jika tidak ingin menerima penukaran baru."
      );
    }

    /**
     * --------------------------------------------------------
     * HARD DELETE
     * --------------------------------------------------------
     */

    try {
      return await RewardCatalogRepository.delete(
        normalizedId
      );
    } catch (error) {
      /**
       * Database FK Restrict adalah protection terakhir
       * jika terjadi race condition antara pengecekan claim
       * dan proses delete.
       */

      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "P2003"
      ) {
        throw new Error(
          "Reward tidak dapat dihapus karena sudah memiliki histori penukaran. Nonaktifkan reward jika tidak ingin menerima penukaran baru."
        );
      }

      throw error;
    }
  }
}

export default AdminRewardCatalogService;
