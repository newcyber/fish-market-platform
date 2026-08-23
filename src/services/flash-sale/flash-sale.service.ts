import {
  FlashSaleStatus,
} from "@prisma/client";

import FlashSaleRepository from "@/repositories/flash-sale/flash-sale.repository";

/**
 * ============================================================
 * FLASH SALE SERVICE
 * ============================================================
 *
 * Business logic untuk Flash Sale campaign.
 *
 * Responsibilities:
 *
 * - List campaign
 * - Get campaign detail
 * - Get active campaign for homepage
 * - Create campaign
 * - Update campaign
 * - Soft delete campaign
 * - Validasi nama
 * - Generate slug
 * - Validasi periode
 * - Validasi status lifecycle
 * - Cek slug duplicate
 *
 * ============================================================
 */

/**
 * ============================================================
 * CREATE FLASH SALE INPUT
 * ============================================================
 */

export interface CreateFlashSaleInput {
  name: string;

  slug?: string;

  description?: string | null;

  banner?: string | null;

  status?: FlashSaleStatus;

  startAt: Date | string;

  endAt: Date | string;

  sortOrder?: number;
}

/**
 * ============================================================
 * UPDATE FLASH SALE INPUT
 * ============================================================
 *
 * Semua field bersifat optional karena PATCH dapat
 * melakukan partial update.
 */

export interface UpdateFlashSaleInput {
  name?: string;

  slug?: string;

  description?: string | null;

  banner?: string | null;

  status?: FlashSaleStatus;

  startAt?: Date | string;

  endAt?: Date | string;

  sortOrder?: number;
}

/**
 * ============================================================
 * GET FLASH SALES INPUT
 * ============================================================
 */

export interface GetFlashSalesInput {
  page?: number;

  limit?: number;

  status?: FlashSaleStatus;

  search?: string;
}

/**
 * ============================================================
 * FLASH SALE SERVICE
 * ============================================================
 */

export default class FlashSaleService {
  /**
   * ==========================================================
   * SLUGIFY
   * ==========================================================
   */

  private static slugify(
    value: string
  ) {
    return value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        "");
  }

  /**
   * ==========================================================
   * PARSE DATE
   * ==========================================================
   */

  private static parseDate(
    value: Date | string,
    fieldName: string
  ) {
    const date =
      value instanceof Date
        ? value
        : new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      throw new Error(
        `${fieldName} tidak valid.`
      );
    }

    return date;
  }

  /**
   * ==========================================================
   * VALIDATE STATUS TRANSITION
   * ==========================================================
   *
   * Lifecycle Flash Sale:
   *
   * DRAFT
   *   ↓
   * SCHEDULED
   *   ↓
   * ACTIVE
   *   ↓
   * ENDED
   *
   * DRAFT / SCHEDULED / ACTIVE
   *   ↓
   * CANCELLED
   *
   * ENDED dan CANCELLED bersifat terminal.
   *
   * ==========================================================
   */

  private static validateStatusTransition(
    currentStatus: FlashSaleStatus,
    nextStatus: FlashSaleStatus
  ) {
    /**
     * Tidak ada perubahan status.
     */
    if (
      currentStatus ===
      nextStatus
    ) {
      return;
    }

    const allowedTransitions:
      Record<
        FlashSaleStatus,
        FlashSaleStatus[]
      > = {
        /**
         * ------------------------------------------------------
         * DRAFT
         * ------------------------------------------------------
         */

        [FlashSaleStatus.DRAFT]: [
          FlashSaleStatus.SCHEDULED,
          FlashSaleStatus.ACTIVE,
          FlashSaleStatus.CANCELLED,
        ],

        /**
         * ------------------------------------------------------
         * SCHEDULED
         * ------------------------------------------------------
         */

        [FlashSaleStatus.SCHEDULED]: [
          FlashSaleStatus.ACTIVE,
          FlashSaleStatus.CANCELLED,
        ],

        /**
         * ------------------------------------------------------
         * ACTIVE
         * ------------------------------------------------------
         */

        [FlashSaleStatus.ACTIVE]: [
          FlashSaleStatus.ENDED,
          FlashSaleStatus.CANCELLED,
        ],

        /**
         * ------------------------------------------------------
         * ENDED
         * ------------------------------------------------------
         *
         * Terminal state.
         */

        [FlashSaleStatus.ENDED]: [],

        /**
         * ------------------------------------------------------
         * CANCELLED
         * ------------------------------------------------------
         *
         * Terminal state.
         */

        [FlashSaleStatus.CANCELLED]: [],
      };

    const allowed =
      allowedTransitions[
        currentStatus
      ];

    if (
      !allowed.includes(
        nextStatus
      )
    ) {
      throw new Error(
        `Status Flash Sale tidak dapat diubah dari ${currentStatus} menjadi ${nextStatus}.`
      );
    }
  }

  /**
   * ==========================================================
   * VALIDATE ACTIVE PERIOD
   * ==========================================================
   *
   * ACTIVE hanya boleh digunakan jika sekarang berada
   * di antara startAt dan endAt.
   *
   * startAt <= now < endAt
   *
   * ==========================================================
   */

  private static validateActivePeriod(
    startAt: Date,
    endAt: Date
  ) {
    const now =
      new Date();

    if (
      now.getTime() <
      startAt.getTime()
    ) {
      throw new Error(
        "Flash Sale belum memasuki periode mulai."
      );
    }

    if (
      now.getTime() >=
      endAt.getTime()
    ) {
      throw new Error(
        "Periode Flash Sale sudah berakhir."
      );
    }
  }

  /**
   * ==========================================================
   * GET MANY
   * ==========================================================
   */

  static async getMany(
    input: GetFlashSalesInput = {}
  ) {
    const page =
      Math.max(
        1,
        Math.floor(
          input.page ?? 1
        )
      );

    const limit =
      Math.min(
        100,
        Math.max(
          1,
          Math.floor(
            input.limit ?? 20
          )
        )
      );

    const skip =
      (page - 1) *
      limit;

    const [
      data,
      total,
    ] =
      await Promise.all([
        FlashSaleRepository.findMany({
          skip,
          take: limit,
          status: input.status,
          search: input.search,
        }),

        FlashSaleRepository.count({
          status: input.status,
          search: input.search,
        }),
      ]);

    return {
      data,

      pagination: {
        page,

        limit,

        total,

        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    };
  }

  /**
   * ==========================================================
   * GET BY ID
   * ==========================================================
   */

  static async getById(
    id: string
  ) {
    if (
      !id?.trim()
    ) {
      throw new Error(
        "Flash Sale ID wajib diisi."
      );
    }

    const flashSale =
      await FlashSaleRepository.findById(
        id
      );

    if (!flashSale) {
      throw new Error(
        "Flash Sale tidak ditemukan."
      );
    }

    return flashSale;
  }

  /**
   * ==========================================================
   * CREATE
   * ==========================================================
   */

  static async create(
    input: CreateFlashSaleInput
  ) {
    /**
     * --------------------------------------------------------
     * VALIDATE NAME
     * --------------------------------------------------------
     */

    const name =
      input.name?.trim();

    if (!name) {
      throw new Error(
        "Nama Flash Sale wajib diisi."
      );
    }

    if (
      name.length < 3
    ) {
      throw new Error(
        "Nama Flash Sale minimal 3 karakter."
      );
    }

    if (
      name.length > 150
    ) {
      throw new Error(
        "Nama Flash Sale maksimal 150 karakter."
      );
    }

    /**
     * --------------------------------------------------------
     * GENERATE SLUG
     * --------------------------------------------------------
     */

    const slug =
      this.slugify(
        input.slug?.trim() ||
        name
      );

    if (!slug) {
      throw new Error(
        "Slug Flash Sale tidak valid."
      );
    }

    /**
     * --------------------------------------------------------
     * CHECK SLUG DUPLICATE
     * --------------------------------------------------------
     */

    const existing =
      await FlashSaleRepository.findBySlug(
        slug
      );

    if (existing) {
      throw new Error(
        "Slug Flash Sale sudah digunakan."
      );
    }

    /**
     * --------------------------------------------------------
     * VALIDATE DATE
     * --------------------------------------------------------
     */

    const startAt =
      this.parseDate(
        input.startAt,
        "Tanggal mulai"
      );

    const endAt =
      this.parseDate(
        input.endAt,
        "Tanggal selesai"
      );

    if (
      endAt.getTime() <=
      startAt.getTime()
    ) {
      throw new Error(
        "Tanggal selesai harus setelah tanggal mulai."
      );
    }

    /**
     * --------------------------------------------------------
     * VALIDATE STATUS
     * --------------------------------------------------------
     */

    const status =
      input.status ??
      FlashSaleStatus.DRAFT;

    /**
     * ACTIVE saat CREATE hanya diperbolehkan
     * jika periode memang sedang aktif.
     */
    if (
      status ===
      FlashSaleStatus.ACTIVE
    ) {
      this.validateActivePeriod(
        startAt,
        endAt
      );
    }

    /**
     * CANCELLED saat CREATE tidak ideal secara bisnis.
     *
     * Campaign baru seharusnya dibuat sebagai DRAFT,
     * SCHEDULED, atau ACTIVE.
     */
    if (
      status ===
      FlashSaleStatus.CANCELLED
    ) {
      throw new Error(
        "Flash Sale baru tidak dapat dibuat dengan status CANCELLED."
      );
    }

    /**
     * ENDED saat CREATE juga tidak valid.
     */
    if (
      status ===
      FlashSaleStatus.ENDED
    ) {
      throw new Error(
        "Flash Sale baru tidak dapat dibuat dengan status ENDED."
      );
    }

    /**
     * --------------------------------------------------------
     * VALIDATE SCHEDULED
     * --------------------------------------------------------
     */

    if (
      status ===
      FlashSaleStatus.SCHEDULED
    ) {
      const now =
        new Date();

      if (
        startAt.getTime() <=
        now.getTime()
      ) {
        throw new Error(
          "Flash Sale SCHEDULED harus memiliki tanggal mulai di masa depan."
        );
      }
    }

    /**
     * --------------------------------------------------------
     * VALIDATE SORT ORDER
     * --------------------------------------------------------
     */

    const sortOrder =
      input.sortOrder ?? 0;

    if (
      !Number.isInteger(
        sortOrder
      )
    ) {
      throw new Error(
        "Sort order harus berupa angka bulat."
      );
    }

    /**
     * --------------------------------------------------------
     * CREATE FLASH SALE
     * --------------------------------------------------------
     */

    return FlashSaleRepository.create({
      name,

      slug,

      description:
        input.description?.trim() ||
        null,

      banner:
        input.banner?.trim() ||
        null,

      status,

      startAt,

      endAt,

      sortOrder,
    });
  }

  /**
   * ==========================================================
   * UPDATE
   * ==========================================================
   *
   * Partial update untuk campaign Flash Sale.
   *
   * ==========================================================
   */

  static async update(
    id: string,
    input: UpdateFlashSaleInput
  ) {
    /**
     * --------------------------------------------------------
     * ENSURE FLASH SALE EXISTS
     * --------------------------------------------------------
     */

    const current =
      await this.getById(
        id
      );

    /**
     * --------------------------------------------------------
     * PREPARE UPDATE DATA
     * --------------------------------------------------------
     */

    const data: {
      name?: string;

      slug?: string;

      description?: string | null;

      banner?: string | null;

      status?: FlashSaleStatus;

      startAt?: Date;

      endAt?: Date;

      sortOrder?: number;
    } = {};

    /**
     * --------------------------------------------------------
     * VALIDATE NAME
     * --------------------------------------------------------
     */

    if (
      input.name !==
      undefined
    ) {
      const name =
        input.name.trim();

      if (!name) {
        throw new Error(
          "Nama Flash Sale wajib diisi."
        );
      }

      if (
        name.length < 3
      ) {
        throw new Error(
          "Nama Flash Sale minimal 3 karakter."
        );
      }

      if (
        name.length > 150
      ) {
        throw new Error(
          "Nama Flash Sale maksimal 150 karakter."
        );
      }

      data.name =
        name;
    }

    /**
     * --------------------------------------------------------
     * VALIDATE / GENERATE SLUG
     * --------------------------------------------------------
     */

    if (
      input.slug !==
      undefined
    ) {
      const slug =
        this.slugify(
          input.slug
        );

      if (!slug) {
        throw new Error(
          "Slug Flash Sale tidak valid."
        );
      }

      const existing =
        await FlashSaleRepository.findBySlug(
          slug
        );

      if (
        existing &&
        existing.id !==
          current.id
      ) {
        throw new Error(
          "Slug Flash Sale sudah digunakan."
        );
      }

      data.slug =
        slug;
    }

    /**
     * --------------------------------------------------------
     * VALIDATE DESCRIPTION
     * --------------------------------------------------------
     */

    if (
      input.description !==
      undefined
    ) {
      data.description =
        input.description?.trim() ||
        null;
    }

    /**
     * --------------------------------------------------------
     * VALIDATE BANNER
     * --------------------------------------------------------
     */

    if (
      input.banner !==
      undefined
    ) {
      data.banner =
        input.banner?.trim() ||
        null;
    }

    /**
     * --------------------------------------------------------
     * DATE VALIDATION
     * --------------------------------------------------------
     *
     * Jika hanya salah satu tanggal diubah,
     * gunakan nilai campaign yang sekarang untuk
     * melakukan validasi periode.
     */

    const startAt =
      input.startAt !==
      undefined
        ? this.parseDate(
            input.startAt,
            "Tanggal mulai"
          )
        : current.startAt;

    const endAt =
      input.endAt !==
      undefined
        ? this.parseDate(
            input.endAt,
            "Tanggal selesai"
          )
        : current.endAt;

    if (
      endAt.getTime() <=
      startAt.getTime()
    ) {
      throw new Error(
        "Tanggal selesai harus setelah tanggal mulai."
      );
    }

    /**
     * --------------------------------------------------------
     * APPLY DATE UPDATE
     * --------------------------------------------------------
     */

    if (
      input.startAt !==
      undefined
    ) {
      data.startAt =
        startAt;
    }

    if (
      input.endAt !==
      undefined
    ) {
      data.endAt =
        endAt;
    }

    /**
     * --------------------------------------------------------
     * STATUS
     * --------------------------------------------------------
     *
     * Status divalidasi SETELAH tanggal final tersedia.
     *
     * Ini penting karena ACTIVE membutuhkan startAt/endAt.
     */

    if (
      input.status !==
      undefined
    ) {
      this.validateStatusTransition(
        current.status,
        input.status
      );

      /**
       * ------------------------------------------------------
       * ACTIVE
       * ------------------------------------------------------
       */

      if (
        input.status ===
        FlashSaleStatus.ACTIVE
      ) {
        this.validateActivePeriod(
          startAt,
          endAt
        );
      }

      /**
       * ------------------------------------------------------
       * SCHEDULED
       * ------------------------------------------------------
       */

      if (
        input.status ===
        FlashSaleStatus.SCHEDULED
      ) {
        const now =
          new Date();

        if (
          startAt.getTime() <=
          now.getTime()
        ) {
          throw new Error(
            "Flash Sale SCHEDULED harus memiliki tanggal mulai di masa depan."
          );
        }
      }

      data.status =
        input.status;
    }

    /**
     * --------------------------------------------------------
     * VALIDATE SORT ORDER
     * --------------------------------------------------------
     */

    if (
      input.sortOrder !==
      undefined
    ) {
      if (
        !Number.isInteger(
          input.sortOrder
        )
      ) {
        throw new Error(
          "Sort order harus berupa angka bulat."
        );
      }

      data.sortOrder =
        input.sortOrder;
    }

    /**
     * --------------------------------------------------------
     * PREVENT EMPTY UPDATE
     * --------------------------------------------------------
     */

    if (
      Object.keys(data)
        .length === 0
    ) {
      throw new Error(
        "Tidak ada data yang diperbarui."
      );
    }

    /**
     * --------------------------------------------------------
     * UPDATE FLASH SALE
     * --------------------------------------------------------
     */

    return FlashSaleRepository.update(
      id,
      data
    );
  }

  /**
   * ==========================================================
   * GET ACTIVE FLASH SALE FOR HOMEPAGE
   * ==========================================================
   *
   * Read-only method khusus homepage.
   *
   * Method ini hanya mengambil Flash Sale aktif
   * beserta item yang tersedia untuk ditampilkan
   * pada homepage.
   *
   * Tidak mengubah:
   *
   * - stock
   * - sold quantity
   * - pricing
   * - cart
   * - checkout
   *
   * ==========================================================
   */

  static async getActiveForHomepage() {
    return FlashSaleRepository.findActiveForHomepage();
  }

  /**
   * ==========================================================
   * DELETE
   * ==========================================================
   *
   * Soft delete campaign Flash Sale.
   *
   * Repository bertanggung jawab untuk:
   *
   * - CANCELLED
   * - deletedAt
   * - deactivate seluruh FlashSaleItem
   *
   * ==========================================================
   */

  static async delete(
    id: string
  ) {
    await this.getById(
      id
    );

    return FlashSaleRepository.softDelete(
      id
    );
  }
}