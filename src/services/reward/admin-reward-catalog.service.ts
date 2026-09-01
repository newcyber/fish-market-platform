import {
  RewardCatalogRepository,
  CreateRewardCatalogInput,
  UpdateRewardCatalogInput,
} from "@/repositories/reward/reward-catalog.repository";

/**
 * ============================================================
 * ADMIN REWARD CATALOG SERVICE
 * ============================================================
 *
 * Business logic khusus administrator untuk mengelola
 * katalog hadiah fisik yang dapat ditukar menggunakan
 * reward point.
 *
 * Contoh reward:
 *
 * TV
 * Kulkas
 * Sepeda Gunung
 * Blender
 * Rice Cooker
 * dan lain-lain.
 *
 * Service ini TIDAK menangani proses claim customer.
 *
 * Proses claim akan ditangani oleh:
 *
 * RewardClaimService
 *
 * yang bertanggung jawab terhadap:
 *
 * - authentication / authorization melalui action
 * - pengecekan saldo point
 * - pengecekan stock
 * - row locking
 * - create RewardClaim
 * - create RewardPointTransaction REDEEM
 * - decrement rewardPointsBalance
 * - decrement stock
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
 * VALIDATE CREATE DATA
 * ============================================================
 */

function validateCreateData(
  input: CreateRewardCatalogInput
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

  const requiredPoints =
    parseRequiredPoints(
      input.requiredPoints
    );

  const stock =
    parseStock(
      input.stock ?? 0
    );

  const sortOrder =
    parseSortOrder(
      input.sortOrder
    );

  const description =
    normalizeOptionalString(
      input.description
    );

  const image =
    normalizeOptionalString(
      input.image
    );

  return {
    name,

    description,

    image,

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
 */

function validateUpdateData(
  input: UpdateRewardCatalogInput
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

    data.name = name;
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
    data.isActive =
      Boolean(
        input.isActive
      );
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
   * Digunakan oleh halaman Admin.
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
   * Digunakan oleh halaman customer.
   *
   * Hanya mengembalikan reward:
   *
   * isActive = true
   * stock > 0
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
      validateCreateData(
        input
      );

    return RewardCatalogRepository.create(
      data
    );
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
     * Pastikan reward memang ada
     * sebelum melakukan update.
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

    const data =
      validateUpdateData(
        input
      );

    /**
     * Tidak ada field yang dikirim.
     */

    if (
      Object.keys(data)
        .length === 0
    ) {
      throw new Error(
        "Tidak ada data reward yang diperbarui."
      );
    }

    return RewardCatalogRepository.update(
      normalizedId,
      data
    );
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
     * ----------------------------------------------------------
     * GET EXISTING REWARD
     * ----------------------------------------------------------
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
     * ----------------------------------------------------------
     * CHECK CLAIM HISTORY
     * ----------------------------------------------------------
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
     * ----------------------------------------------------------
     * HARD DELETE
     * ----------------------------------------------------------
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
