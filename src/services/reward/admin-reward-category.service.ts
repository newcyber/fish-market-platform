import {
  Prisma,
} from "@prisma/client";

import {
  RewardCategoryRepository,
  CreateRewardCategoryInput,
  UpdateRewardCategoryInput,
} from "@/repositories/reward/reward-category.repository";

/**
 * ============================================================
 * ADMIN REWARD CATEGORY SERVICE
 * ============================================================
 *
 * Business logic khusus administrator untuk mengelola
 * master kategori reward.
 *
 * Contoh:
 *
 * - Kebutuhan Rumah
 * - Dapur
 * - Elektronik
 * - Lifestyle
 *
 * Service ini TIDAK menangani:
 *
 * - Reward Claim
 * - Reward Point
 * - Stock claim
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
 * NORMALIZE SLUG
 * ============================================================
 *
 * Slug digunakan sebagai identifier yang stabil.
 *
 * Contoh:
 *
 * "Kebutuhan Rumah"
 * ↓
 * "kebutuhan-rumah"
 *
 * Aturan:
 *
 * - lowercase
 * - trim
 * - spasi menjadi "-"
 * - karakter selain huruf/angka dihapus
 * - multiple "-" dirapikan
 */

function normalizeSlug(
  value: unknown
): string {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9\s-]/g,
      ""
    )
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
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
    !Number.isInteger(
      sortOrder
    ) ||
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
 * VALIDATE ACTIVE
 * ============================================================
 */

function parseIsActive(
  value: unknown
): boolean {
  if (
    value === undefined
  ) {
    return true;
  }

  if (
    typeof value !== "boolean"
  ) {
    throw new Error(
      "Status aktif tidak valid."
    );
  }

  return value;
}

/**
 * ============================================================
 * VALIDATE CREATE DATA
 * ============================================================
 */

function validateCreateData(
  input: CreateRewardCategoryInput
) {
  const name =
    normalizeName(
      input.name
    );

  if (!name) {
    throw new Error(
      "Nama kategori wajib diisi."
    );
  }

  const slug =
    normalizeSlug(
      input.slug || name
    );

  if (!slug) {
    throw new Error(
      "Slug kategori tidak valid."
    );
  }

  const sortOrder =
    parseSortOrder(
      input.sortOrder
    );

  const isActive =
    parseIsActive(
      input.isActive
    );

  return {
    name,

    slug,

    isActive,

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
  input: UpdateRewardCategoryInput
) {
  const data: UpdateRewardCategoryInput =
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
        "Nama kategori wajib diisi."
      );
    }

    data.name =
      name;
  }

  /**
   * ----------------------------------------------------------
   * SLUG
   * ----------------------------------------------------------
   */

  if (
    input.slug !== undefined
  ) {
    const slug =
      normalizeSlug(
        input.slug
      );

    if (!slug) {
      throw new Error(
        "Slug kategori tidak valid."
      );
    }

    data.slug =
      slug;
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
      parseIsActive(
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
 * ADMIN REWARD CATEGORY SERVICE
 * ============================================================
 */

export class AdminRewardCategoryService {
  /**
   * ==========================================================
   * GET ALL
   * ==========================================================
   *
   * Mengembalikan seluruh category:
   *
   * - active
   * - inactive
   *
   * Digunakan oleh halaman Admin.
   */

  static async getAll() {
    return RewardCategoryRepository.findMany();
  }

  /**
   * ==========================================================
   * GET ACTIVE
   * ==========================================================
   *
   * Hanya mengembalikan category aktif.
   *
   * Digunakan sebagai pilihan category baru.
   */

  static async getActive() {
    return RewardCategoryRepository.findActive();
  }

  /**
   * ==========================================================
   * GET FOR REWARD CATALOG
   * ==========================================================
   *
   * Digunakan oleh form Reward Catalog.
   *
   * CREATE:
   *
   * - hanya category aktif
   *
   * EDIT:
   *
   * - category aktif tetap tersedia
   * - category lama yang inactive tetap disertakan
   *
   * Dengan demikian reward existing tidak kehilangan
   * category hanya karena category tersebut dinonaktifkan.
   *
   * inactive category hanya boleh dipertahankan sebagai
   * category existing.
   */

  static async getForRewardCatalog(
    currentCategoryId?: string | null
  ) {
    const activeCategories =
      await RewardCategoryRepository.findActive();

    const normalizedCurrentId =
      String(
        currentCategoryId ?? ""
      ).trim();

    if (
      !normalizedCurrentId
    ) {
      return activeCategories;
    }

    /**
     * Jika category saat ini aktif, sudah otomatis ada
     * di activeCategories.
     */

    const currentCategory =
      await RewardCategoryRepository.findById(
        normalizedCurrentId
      );

    if (
      !currentCategory
    ) {
      throw new Error(
        "Reward category tidak ditemukan."
      );
    }

    if (
      currentCategory.isActive
    ) {
      return activeCategories;
    }

    /**
     * Category inactive lama harus tetap tersedia
     * supaya reward existing dapat diedit tanpa
     * kehilangan relasi category.
     *
     * Kita letakkan di posisi paling awal agar mudah
     * ditemukan oleh UI.
     */

    return [
      currentCategory,
      ...activeCategories,
    ];
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
        "Reward category ID tidak valid."
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

    return category;
  }

  /**
   * ==========================================================
   * CREATE
   * ==========================================================
   */

  static async create(
    input: CreateRewardCategoryInput
  ) {
    const data =
      validateCreateData(
        input
      );

    /**
     * --------------------------------------------------------
     * CEK SLUG DUPLIKAT
     * --------------------------------------------------------
     */

    const existing =
      await RewardCategoryRepository.findBySlug(
        data.slug
      );

    if (existing) {
      throw new Error(
        "Slug reward category sudah digunakan."
      );
    }

    try {
      return await RewardCategoryRepository.create(
        data
      );
    } catch (error) {
      /**
       * Fallback protection terhadap race condition
       * pada unique constraint slug.
       */

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error(
          "Slug reward category sudah digunakan."
        );
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
    input: UpdateRewardCategoryInput
  ) {
    const normalizedId =
      String(
        id ?? ""
      ).trim();

    if (!normalizedId) {
      throw new Error(
        "Reward category ID tidak valid."
      );
    }

    /**
     * --------------------------------------------------------
     * PASTIKAN CATEGORY ADA
     * --------------------------------------------------------
     */

    const existing =
      await RewardCategoryRepository.findById(
        normalizedId
      );

    if (!existing) {
      throw new Error(
        "Reward category tidak ditemukan."
      );
    }

    const data =
      validateUpdateData(
        input
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
        "Tidak ada data reward category yang diperbarui."
      );
    }

    /**
     * --------------------------------------------------------
     * CEK SLUG DUPLIKAT
     * --------------------------------------------------------
     */

    if (
      data.slug !== undefined &&
      data.slug !== existing.slug
    ) {
      const duplicate =
        await RewardCategoryRepository.findBySlug(
          data.slug
        );

      if (
        duplicate &&
        duplicate.id !==
          normalizedId
      ) {
        throw new Error(
          "Slug reward category sudah digunakan."
        );
      }
    }

    try {
      return await RewardCategoryRepository.update(
        normalizedId,
        data
      );
    } catch (error) {
      /**
       * Fallback protection terhadap race condition
       * pada unique constraint slug.
       */

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error(
          "Slug reward category sudah digunakan."
        );
      }

      throw error;
    }
  }

  /**
   * ==========================================================
   * SET ACTIVE
   * ==========================================================
   *
   * Category tidak dihapus.
   *
   * Jika category tidak ingin digunakan lagi,
   * administrator menonaktifkannya.
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
        "Reward category ID tidak valid."
      );
    }

    const existing =
      await RewardCategoryRepository.findById(
        normalizedId
      );

    if (!existing) {
      throw new Error(
        "Reward category tidak ditemukan."
      );
    }

    return RewardCategoryRepository.setActive(
      normalizedId,
      Boolean(isActive)
    );
  }

  /**
   * ==========================================================
   * GET REWARD COUNT
   * ==========================================================
   */

  static async getRewardCount(
    id: string
  ) {
    const normalizedId =
      String(
        id ?? ""
      ).trim();

    if (!normalizedId) {
      throw new Error(
        "Reward category ID tidak valid."
      );
    }

    return RewardCategoryRepository.countRewards(
      normalizedId
    );
  }
}

export default AdminRewardCategoryService;
