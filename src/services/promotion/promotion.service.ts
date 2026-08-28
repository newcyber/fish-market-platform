import {
  Prisma,
  PromotionDiscountType,
  PromotionStatus,
  PromotionType,
} from "@prisma/client";

import PromotionRepository, {
  CreatePromotionInput,
  UpdatePromotionInput,
} from "@/repositories/promotion/promotion.repository";

type PromotionValidationInput = {
  type?: PromotionType;
  discountType?: PromotionDiscountType | null;
  discountValue?: Prisma.Decimal | string | number | null;
  startAt?: Date | null;
  endAt?: Date | null;
};

export default class PromotionService {
  /**
   * ============================================================
   * VALIDATE PROMOTION DATA
   * ============================================================
   *
   * Business validation berada di Service.
   * Repository hanya bertanggung jawab terhadap persistence.
   */
  private static validatePromotionData(
    data: PromotionValidationInput,
    options?: {
      requireType?: boolean;
    }
  ) {
    const requireType =
      options?.requireType ?? true;

    /**
     * ----------------------------------------------------------
     * TYPE
     * ----------------------------------------------------------
     */
    if (
      requireType &&
      data.type === undefined
    ) {
      throw new Error(
        "Tipe promotion wajib ditentukan."
      );
    }

    /**
     * ----------------------------------------------------------
     * DATE RANGE
     * ----------------------------------------------------------
     */
    if (
      data.startAt != null &&
      data.endAt != null &&
      data.startAt >= data.endAt
    ) {
      throw new Error(
        "startAt harus lebih kecil dari endAt."
      );
    }

    /**
     * ----------------------------------------------------------
     * MARKETING
     * ----------------------------------------------------------
     *
     * Marketing campaign tidak boleh memiliki pricing rule.
     */
    if (
      data.type === PromotionType.MARKETING
    ) {
      if (
        data.discountType !== undefined &&
        data.discountType !== null
      ) {
        throw new Error(
          "Promotion MARKETING tidak boleh memiliki discountType."
        );
      }

      if (
        data.discountValue !== undefined &&
        data.discountValue !== null
      ) {
        throw new Error(
          "Promotion MARKETING tidak boleh memiliki discountValue."
        );
      }

      return;
    }

    /**
     * ----------------------------------------------------------
     * PRICE DISCOUNT
     * ----------------------------------------------------------
     */
    if (
      data.type ===
      PromotionType.PRICE_DISCOUNT
    ) {
      if (
        data.discountType === undefined ||
        data.discountType === null
      ) {
        throw new Error(
          "Promotion PRICE_DISCOUNT wajib memiliki discountType."
        );
      }

      if (
        data.discountValue === undefined ||
        data.discountValue === null
      ) {
        throw new Error(
          "Promotion PRICE_DISCOUNT wajib memiliki discountValue."
        );
      }

      const value = new Prisma.Decimal(
        data.discountValue
      );

      if (!value.greaterThan(0)) {
        throw new Error(
          "discountValue harus lebih besar dari 0."
        );
      }

      /**
       * Percentage:
       *
       * 0 < value <= 100
       */
      if (
        data.discountType ===
          PromotionDiscountType.PERCENTAGE &&
        value.greaterThan(100)
      ) {
        throw new Error(
          "Discount percentage tidak boleh lebih dari 100%."
        );
      }

      /**
       * Fixed amount:
       *
       * value > 0
       */
      if (
        data.discountType ===
        PromotionDiscountType.FIXED_AMOUNT
      ) {
        if (!value.greaterThan(0)) {
          throw new Error(
            "Fixed discount harus lebih besar dari 0."
          );
        }
      }
    }
  }

  /**
   * ============================================================
   * VALIDATE STATUS TRANSITION
   * ============================================================
   */
  private static assertStatusTransition(
    currentStatus: PromotionStatus,
    nextStatus: PromotionStatus
  ) {
    if (
      currentStatus === nextStatus
    ) {
      return;
    }

    const allowedTransitions: Record<
      PromotionStatus,
      PromotionStatus[]
    > = {
      [PromotionStatus.DRAFT]: [
        PromotionStatus.SCHEDULED,
        PromotionStatus.ACTIVE,
        PromotionStatus.CANCELLED,
      ],

      [PromotionStatus.SCHEDULED]: [
        PromotionStatus.ACTIVE,
        PromotionStatus.CANCELLED,
      ],

      [PromotionStatus.ACTIVE]: [
        PromotionStatus.ENDED,
        PromotionStatus.CANCELLED,
      ],

      [PromotionStatus.ENDED]: [],

      [PromotionStatus.CANCELLED]: [],
    };

    const allowed =
      allowedTransitions[currentStatus];

    if (
      !allowed.includes(nextStatus)
    ) {
      throw new Error(
        `Perubahan status promotion dari ${currentStatus} ke ${nextStatus} tidak diperbolehkan.`
      );
    }
  }

    /**
   * ============================================================
   * ASSERT NO PRICE DISCOUNT CONFLICT
   * ============================================================
   *
   * Memastikan SKU tidak digunakan oleh promotion
   * PRICE_DISCOUNT lain pada periode yang overlap.
   *
   * Hanya PRICE_DISCOUNT yang diperiksa.
   * MARKETING tidak mengubah harga sehingga tidak conflict.
   */
  private static async assertNoPriceDiscountConflict(
    promotionId: string,
    skuIds: string[],
    startAt: Date | null,
    endAt: Date | null
  ): Promise<void> {
    if (skuIds.length === 0) {
      return;
    }

    const promotion =
      await PromotionRepository.findById(
        promotionId
      );

    if (!promotion) {
      throw new Error(
        "Promotion tidak ditemukan."
      );
    }

    /**
     * Hanya PRICE_DISCOUNT yang perlu
     * dicek terhadap promotion lain.
     */
    if (
      promotion.type !==
      PromotionType.PRICE_DISCOUNT
    ) {
      return;
    }

    /**
     * Hilangkan duplicate SKU agar
     * query tidak dilakukan berulang.
     */
    const uniqueSkuIds = [
      ...new Set(skuIds),
    ];

    for (
      const skuId of uniqueSkuIds
    ) {
      const conflicts =
        await PromotionRepository.findPriceDiscountConflictsForSku(
          skuId,
          startAt,
          endAt,
          promotionId
        );

      if (conflicts.length === 0) {
        continue;
      }

      const conflict =
        conflicts[0];

      throw new Error(
        `SKU ${skuId} sudah digunakan oleh promotion PRICE_DISCOUNT "${conflict.name}" pada periode yang beririsan.`
      );
    }
  }

  /**
   * ============================================================
   * CREATE
   * ============================================================
   */
  static async create(
    data: CreatePromotionInput
  ) {
    this.validatePromotionData({
      type: data.type,
      discountType: data.discountType,
      discountValue:
        data.discountValue !== undefined &&
        data.discountValue !== null
          ? data.discountValue.toString()
          : null,
      startAt: data.startAt,
      endAt: data.endAt,
    });

    return PromotionRepository.create(
      data
    );
  }

  /**
   * ============================================================
   * UPDATE
   * ============================================================
   *
   * Update menggunakan hasil akhir (merged state) sebagai
   * sumber validasi.
   *
   * Ini penting karena update dapat mengubah:
   * - type
   * - discountType
   * - discountValue
   * - startAt
   * - endAt
   * - status
   */
    /**
   * ============================================================
   * UPDATE
   * ============================================================
   *
   * Update hanya mengubah data promotion.
   *
   * Perubahan lifecycle/status WAJIB melalui:
   *
   * - schedule()
   * - activate()
   * - end()
   * - cancel()
   *
   * Status tidak boleh diubah melalui update().
   *
   * Semua validasi menggunakan hasil akhir
   * (existing + incoming update).
   */
  static async update(
    id: string,
    data: UpdatePromotionInput
  ) {
    const existing =
      await PromotionRepository.findById(
        id
      );

    if (!existing) {
      throw new Error(
        "Promotion tidak ditemukan."
      );
    }

    /**
     * ----------------------------------------------------------
     * TERMINAL STATUS
     * ----------------------------------------------------------
     *
     * ENDED dan CANCELLED tidak boleh dimodifikasi.
     */
    if (
      existing.status ===
        PromotionStatus.ENDED ||
      existing.status ===
        PromotionStatus.CANCELLED
    ) {
      throw new Error(
        `Promotion dengan status ${existing.status} tidak dapat diubah.`
      );
    }

    /**
     * ----------------------------------------------------------
     * STATUS CANNOT BE UPDATED DIRECTLY
     * ----------------------------------------------------------
     *
     * Perubahan lifecycle harus melalui method khusus:
     *
     * schedule()
     * activate()
     * end()
     * cancel()
     *
     * update() hanya boleh mengubah data promotion.
     */
    if (data.status !== undefined) {
      throw new Error(
        "Status promotion harus diubah melalui method lifecycle khusus: schedule, activate, end, atau cancel."
      );
    }

    /**
     * ----------------------------------------------------------
     * MERGE EXISTING + UPDATE
     * ----------------------------------------------------------
     *
     * Semua validasi dilakukan terhadap state final.
     */
    const mergedType: PromotionType =
      data.type !== undefined
        ? (data.type as PromotionType)
        : existing.type;

    const mergedDiscountType:
      | PromotionDiscountType
      | null =
      data.discountType !== undefined
        ? (data.discountType as
            | PromotionDiscountType
            | null)
        : existing.discountType;

    const mergedDiscountValue =
      data.discountValue !== undefined
        ? data.discountValue !== null
          ? data.discountValue.toString()
          : null
        : existing.discountValue !== null
          ? existing.discountValue.toString()
          : null;

    const mergedStartAt =
      data.startAt !== undefined
        ? data.startAt
        : existing.startAt;

    const mergedEndAt =
      data.endAt !== undefined
        ? data.endAt
        : existing.endAt;

    /**
     * ----------------------------------------------------------
     * VALIDATE FINAL PROMOTION DATA
     * ----------------------------------------------------------
     */
    this.validatePromotionData({
      type: mergedType,
      discountType:
        mergedDiscountType,
      discountValue:
        mergedDiscountValue,
      startAt: mergedStartAt,
      endAt: mergedEndAt,
    });

    /**
     * ----------------------------------------------------------
     * SCHEDULED / ACTIVE DATE RULE
     * ----------------------------------------------------------
     *
     * Karena update() tidak boleh mengubah status,
     * aturan periode mengikuti status promotion saat ini.
     */
    if (
      existing.status ===
        PromotionStatus.SCHEDULED ||
      existing.status ===
        PromotionStatus.ACTIVE
    ) {
      if (!mergedStartAt) {
        throw new Error(
          "startAt wajib diisi untuk promotion yang SCHEDULED atau ACTIVE."
        );
      }

      if (!mergedEndAt) {
        throw new Error(
          "endAt wajib diisi untuk promotion yang SCHEDULED atau ACTIVE."
        );
      }

      if (
        mergedStartAt >=
        mergedEndAt
      ) {
        throw new Error(
          "startAt harus lebih kecil dari endAt."
        );
      }
    }

    /**
     * ----------------------------------------------------------
     * ACTIVE PROMOTION DATE PROTECTION
     * ----------------------------------------------------------
     *
     * Promotion ACTIVE tidak boleh diubah menjadi
     * periode yang sudah expired atau belum dimulai.
     *
     * Ini mencegah update() menghasilkan ACTIVE promotion
     * dengan periode yang tidak valid.
     */
    if (
      existing.status ===
      PromotionStatus.ACTIVE
    ) {
      const now = new Date();

      if (
        !mergedStartAt ||
        !mergedEndAt
      ) {
        throw new Error(
          "Promotion ACTIVE wajib memiliki startAt dan endAt."
        );
      }

      if (
        now < mergedStartAt
      ) {
        throw new Error(
          "Promotion ACTIVE tidak boleh memiliki startAt di masa depan."
        );
      }

      if (
        now >= mergedEndAt
      ) {
        throw new Error(
          "Promotion ACTIVE tidak boleh memiliki endAt yang sudah lewat."
        );
      }
    }

    /**
     * ----------------------------------------------------------
     * SCHEDULED PROMOTION DATE PROTECTION
     * ----------------------------------------------------------
     *
     * Promotion SCHEDULED tetap harus memiliki
     * startAt di masa depan.
     */
    if (
      existing.status ===
      PromotionStatus.SCHEDULED
    ) {
      if (
        !mergedStartAt
      ) {
        throw new Error(
          "Promotion SCHEDULED wajib memiliki startAt."
        );
      }

      if (
        !mergedEndAt
      ) {
        throw new Error(
          "Promotion SCHEDULED wajib memiliki endAt."
        );
      }

      if (
        mergedStartAt <= new Date()
      ) {
        throw new Error(
          "Promotion SCHEDULED harus memiliki startAt di masa depan."
        );
      }
    }

    /**
     * ----------------------------------------------------------
     * PRICE DISCOUNT CONFLICT
     * ----------------------------------------------------------
     *
     * Conflict diperiksa berdasarkan:
     *
     * - type final
     * - SKU yang sudah dimiliki promotion
     * - periode final
     *
     * Promotion sendiri dikecualikan oleh helper.
     */
    if (
      mergedType ===
        PromotionType.PRICE_DISCOUNT &&
      mergedStartAt !== null &&
      mergedEndAt !== null
    ) {
      const skuIds =
        existing.items.map(
          (item) => item.skuId
        );

      await this.assertNoPriceDiscountConflict(
        id,
        skuIds,
        mergedStartAt,
        mergedEndAt
      );
    }

    /**
     * ----------------------------------------------------------
     * PERSIST
     * ----------------------------------------------------------
     */
    return PromotionRepository.update(
      id,
      data
    );
  }

    /**
   * ============================================================
   * SCHEDULE
   * ============================================================
   *
   * Mengubah promotion menjadi SCHEDULED.
   *
   * Rule:
   * - Promotion harus bisa ditransisikan ke SCHEDULED.
   * - startAt wajib.
   * - endAt wajib.
   * - startAt harus di masa depan.
   * - startAt harus lebih kecil dari endAt.
   * - PRICE_DISCOUNT tidak boleh conflict dengan promotion
   *   PRICE_DISCOUNT lain pada SKU yang sama.
   */
  static async schedule(
    id: string,
    startAt: Date,
    endAt: Date
  ) {
    const existing =
      await PromotionRepository.findById(
        id
      );

    if (!existing) {
      throw new Error(
        "Promotion tidak ditemukan."
      );
    }

    /**
     * ----------------------------------------------------------
     * DATE VALIDATION
     * ----------------------------------------------------------
     *
     * SCHEDULED harus memiliki periode yang lengkap.
     */
    if (!startAt) {
      throw new Error(
        "startAt wajib diisi saat menjadwalkan promotion."
      );
    }

    if (!endAt) {
      throw new Error(
        "endAt wajib diisi saat menjadwalkan promotion."
      );
    }

    if (startAt >= endAt) {
      throw new Error(
        "startAt harus lebih kecil dari endAt."
      );
    }

    if (startAt <= new Date()) {
      throw new Error(
        "startAt promotion yang dijadwalkan harus berada di masa depan."
      );
    }

    /**
     * ----------------------------------------------------------
     * PROMOTION DATA VALIDATION
     * ----------------------------------------------------------
     */
    this.validatePromotionData({
      type: existing.type,
      discountType:
        existing.discountType,
      discountValue:
        existing.discountValue,
      startAt,
      endAt,
    });

    /**
     * ----------------------------------------------------------
     * PRICE DISCOUNT CONFLICT
     * ----------------------------------------------------------
     *
     * Hanya PRICE_DISCOUNT yang perlu diperiksa.
     *
     * Semua SKU yang sudah terdaftar pada promotion
     * diperiksa terhadap promotion PRICE_DISCOUNT lain.
     */
    if (
      existing.type ===
      PromotionType.PRICE_DISCOUNT
    ) {
      const skuIds =
        existing.items.map(
          (item) => item.skuId
        );

      await this.assertNoPriceDiscountConflict(
        id,
        skuIds,
        startAt,
        endAt
      );
    }

    /**
     * ----------------------------------------------------------
     * UPDATE STATUS
     * ----------------------------------------------------------
     */
    return PromotionRepository.update(
      id,
      {
        status:
          PromotionStatus.SCHEDULED,
        startAt,
        endAt,
      }
    );
  }
   /**
   * ============================================================
   * ACTIVATE
   * ============================================================
   *
   * Mengubah promotion SCHEDULED menjadi ACTIVE.
   *
   * Rule:
   * - Promotion harus berstatus SCHEDULED.
   * - startAt wajib.
   * - endAt wajib.
   * - waktu sekarang harus sudah mencapai startAt.
   * - waktu sekarang belum melewati endAt.
   * - PRICE_DISCOUNT harus dicek ulang terhadap conflict.
   *
   * Conflict tetap diperiksa saat activation karena kondisi
   * database dapat berubah setelah promotion dijadwalkan.
   */
  static async activate(
    id: string
  ) {
    const existing =
      await PromotionRepository.findById(
        id
      );

    if (!existing) {
      throw new Error(
        "Promotion tidak ditemukan."
      );
    }

    /**
     * ----------------------------------------------------------
     * STATUS TRANSITION
     * ----------------------------------------------------------
     *
     * Hanya SCHEDULED yang boleh menjadi ACTIVE.
     */
    this.assertStatusTransition(
      existing.status,
      PromotionStatus.ACTIVE
    );

    /**
     * ----------------------------------------------------------
     * DATE VALIDATION
     * ----------------------------------------------------------
     */
    if (!existing.startAt) {
      throw new Error(
        "Promotion tidak dapat diaktifkan karena startAt belum ditentukan."
      );
    }

    if (!existing.endAt) {
      throw new Error(
        "Promotion tidak dapat diaktifkan karena endAt belum ditentukan."
      );
    }

    if (
      existing.startAt >=
      existing.endAt
    ) {
      throw new Error(
        "startAt harus lebih kecil dari endAt."
      );
    }

    const now = new Date();

    /**
     * Jangan izinkan activation sebelum jadwal dimulai.
     */
    if (
      now < existing.startAt
    ) {
      throw new Error(
        "Promotion belum memasuki waktu mulai."
      );
    }

    /**
     * Jangan izinkan activation setelah promotion expired.
     */
    if (
      now >= existing.endAt
    ) {
      throw new Error(
        "Promotion sudah melewati endAt."
      );
    }

    /**
     * ----------------------------------------------------------
     * PROMOTION DATA VALIDATION
     * ----------------------------------------------------------
     */
    this.validatePromotionData({
      type: existing.type,
      discountType:
        existing.discountType,
      discountValue:
        existing.discountValue,
      startAt: existing.startAt,
      endAt: existing.endAt,
    });

    /**
     * ----------------------------------------------------------
     * PRICE DISCOUNT CONFLICT
     * ----------------------------------------------------------
     *
     * Re-check diperlukan karena promotion lain mungkin
     * dibuat setelah promotion ini dijadwalkan.
     */
    if (
      existing.type ===
      PromotionType.PRICE_DISCOUNT
    ) {
      const skuIds =
        existing.items.map(
          (item) => item.skuId
        );

      await this.assertNoPriceDiscountConflict(
        id,
        skuIds,
        existing.startAt,
        existing.endAt
      );
    }

    /**
     * ----------------------------------------------------------
     * ACTIVATE
     * ----------------------------------------------------------
     */
    return PromotionRepository.update(
      id,
      {
        status:
          PromotionStatus.ACTIVE,
      }
    );
  }

  /**
   * ============================================================
   * END
   * ============================================================
   */
  static async end(
    id: string
  ) {
    const existing =
      await PromotionRepository.findById(
        id
      );

    if (!existing) {
      throw new Error(
        "Promotion tidak ditemukan."
      );
    }

    this.assertStatusTransition(
      existing.status,
      PromotionStatus.ENDED
    );

    return PromotionRepository.update(
      id,
      {
        status:
          PromotionStatus.ENDED,
      }
    );
  }

  /**
   * ============================================================
   * CANCEL
   * ============================================================
   */
  static async cancel(
    id: string
  ) {
    const existing =
      await PromotionRepository.findById(
        id
      );

    if (!existing) {
      throw new Error(
        "Promotion tidak ditemukan."
      );
    }

    this.assertStatusTransition(
      existing.status,
      PromotionStatus.CANCELLED
    );

    return PromotionRepository.update(
      id,
      {
        status:
          PromotionStatus.CANCELLED,
      }
    );
  }

  /**
   * ============================================================
   * DELETE
   * ============================================================
   */
  static async delete(
    id: string
  ) {
    const existing =
      await PromotionRepository.findById(
        id
      );

    if (!existing) {
      throw new Error(
        "Promotion tidak ditemukan."
      );
    }

    if (
      existing.status ===
      PromotionStatus.ACTIVE
    ) {
      throw new Error(
        "Promotion aktif tidak boleh langsung dihapus. Cancel atau end promotion terlebih dahulu."
      );
    }

    return PromotionRepository.softDelete(
      id
    );
  }

   /**
   * ============================================================
   * ADD SKU
   * ============================================================
   */
  static async addSku(
    promotionId: string,
    skuId: string
  ) {
    const promotion =
      await PromotionRepository.findById(
        promotionId
      );

    if (!promotion) {
      throw new Error(
        "Promotion tidak ditemukan."
      );
    }

    /**
     * Promotion terminal tidak boleh diubah.
     */
    if (
      promotion.status ===
        PromotionStatus.ENDED ||
      promotion.status ===
        PromotionStatus.CANCELLED
    ) {
      throw new Error(
        "SKU tidak dapat ditambahkan ke promotion yang sudah berakhir atau dibatalkan."
      );
    }

    /**
     * Jangan menambahkan SKU yang sama dua kali.
     *
     * Database memiliki unique constraint
     * sebagai protection terakhir.
     */
    const alreadyExists =
      promotion.items.some(
        (item) =>
          item.skuId === skuId
      );

    if (alreadyExists) {
      throw new Error(
        "SKU sudah terdaftar pada promotion ini."
      );
    }

    /**
     * ----------------------------------------------------------
     * PRICE DISCOUNT CONFLICT
     * ----------------------------------------------------------
     *
     * Periode menggunakan data Promotion yang sudah tersimpan.
     * Bukan tanggal dari client.
     */
    if (
      promotion.type ===
      PromotionType.PRICE_DISCOUNT
    ) {
      await this.assertNoPriceDiscountConflict(
        promotionId,
        [skuId],
        promotion.startAt,
        promotion.endAt
      );
    }

    return PromotionRepository.addSku(
      promotionId,
      skuId
    );
  }

  /**
   * ============================================================
   * REMOVE SKU
   * ============================================================
   */
  static async removeSku(
    promotionId: string,
    skuId: string
  ) {
    const promotion =
      await PromotionRepository.findById(
        promotionId
      );

    if (!promotion) {
      throw new Error(
        "Promotion tidak ditemukan."
      );
    }

    if (
      promotion.status ===
      PromotionStatus.ACTIVE
    ) {
      throw new Error(
        "SKU tidak boleh dihapus dari promotion yang sedang aktif."
      );
    }

    if (
      promotion.status ===
        PromotionStatus.ENDED ||
      promotion.status ===
        PromotionStatus.CANCELLED
    ) {
      throw new Error(
        "SKU tidak dapat diubah pada promotion yang sudah berakhir atau dibatalkan."
      );
    }

    return PromotionRepository.removeSku(
      promotionId,
      skuId
    );
  }

    /**
   * ============================================================
   * GET BY ID
   * ============================================================
   */
  static async getById(
    id: string
  ) {
    return PromotionRepository.findById(
      id
    );
  }

  /**
   * ============================================================
   * GET BY SLUG
   * ============================================================
   *
   * Digunakan untuk kebutuhan internal/admin
   * yang membutuhkan promotion berdasarkan slug.
   *
   * Untuk customer-facing page gunakan:
   *
   * getActiveBySlugForCustomer()
   */
  static async getBySlug(
    slug: string
  ) {
    return PromotionRepository.findBySlug(
      slug
    );
  }

  /**
   * ============================================================
   * GET MANY
   * ============================================================
   */
  static async getMany(
    input?: Parameters<
      typeof PromotionRepository.findMany
    >[0]
  ) {
    return PromotionRepository.findMany(
      input
    );
  }

  /**
   * ============================================================
   * GET ACTIVE FOR CUSTOMER
   * ============================================================
   *
   * Hanya mengembalikan promotion yang:
   *
   * - ACTIVE
   * - belum soft deleted
   * - sudah memasuki startAt
   * - belum melewati endAt
   *
   * Projection customer ditentukan oleh repository.
   */
  static async getActiveForCustomer(
    now = new Date()
  ) {
    return PromotionRepository.findActiveForCustomer(
      now
    );
  }

  /**
   * ============================================================
   * GET ACTIVE BY SLUG FOR CUSTOMER
   * ============================================================
   *
   * Digunakan oleh customer promotion detail page.
   *
   * Hanya promotion yang benar-benar aktif
   * yang boleh ditampilkan kepada customer.
   */
  static async getActiveBySlugForCustomer(
    slug: string,
    now = new Date()
  ) {
    return PromotionRepository.findActiveBySlugForCustomer(
      slug,
      now
    );
  }
}