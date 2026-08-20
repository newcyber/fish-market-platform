import {
  Prisma,
  VoucherDiscountType,
} from "@prisma/client";

import { VoucherRepository } from "@/repositories/voucher/voucher.repository";

/**
 * ============================================================
 * ADMIN VOUCHER SERVICE
 * ============================================================
 *
 * Business logic khusus Admin Voucher Management.
 *
 * Tidak digunakan oleh checkout engine.
 * Tidak mengubah lifecycle VoucherUsage.
 */

export interface CreateAdminVoucherInput {
  code: string;

  name: string;

  description?: string | null;

  discountType: VoucherDiscountType;

  discountValue: number;

  minimumPurchase?: number | null;

  maximumDiscount?: number | null;

  usageLimit?: number | null;

  perUserLimit?: number | null;

  startAt?: Date | null;

  endAt?: Date | null;

  isActive?: boolean;
}

export interface UpdateAdminVoucherInput {
  code?: string;

  name?: string;

  description?: string | null;

  discountType?: VoucherDiscountType;

  discountValue?: number;

  minimumPurchase?: number | null;

  maximumDiscount?: number | null;

  usageLimit?: number | null;

  perUserLimit?: number | null;

  startAt?: Date | null;

  endAt?: Date | null;

  isActive?: boolean;
}

export interface AdminVoucherListOptions {
  search?: string;

  isActive?: boolean;

  discountType?: VoucherDiscountType;

  page?: number;

  limit?: number;
}

export class AdminVoucherService {
  /**
   * ============================================================
   * NORMALIZE CODE
   * ============================================================
   */

  private static normalizeCode(
    code: string
  ): string {
    return code
      .trim()
      .toUpperCase();
  }

  /**
   * ============================================================
   * VALIDATE VOUCHER DATA
   * ============================================================
   */

  private static validateVoucherData(
    data: {
      code?: string;

      name?: string;

      discountType?: VoucherDiscountType;

      discountValue?: number;

      minimumPurchase?: number | null;

      maximumDiscount?: number | null;

      usageLimit?: number | null;

      perUserLimit?: number | null;

      startAt?: Date | null;

      endAt?: Date | null;
    }
  ) {
    if (
      data.code !== undefined &&
      !data.code.trim()
    ) {
      throw new Error(
        "Kode voucher wajib diisi."
      );
    }

    if (
      data.name !== undefined &&
      !data.name.trim()
    ) {
      throw new Error(
        "Nama voucher wajib diisi."
      );
    }

    if (
      data.discountValue !== undefined &&
      data.discountValue <= 0
    ) {
      throw new Error(
        "Nilai diskon harus lebih besar dari 0."
      );
    }

    if (
      data.discountType === "PERCENTAGE" &&
      data.discountValue !== undefined &&
      data.discountValue > 100
    ) {
      throw new Error(
        "Diskon persentase tidak boleh lebih dari 100%."
      );
    }

    if (
      data.minimumPurchase !== undefined &&
      data.minimumPurchase !== null &&
      data.minimumPurchase < 0
    ) {
      throw new Error(
        "Minimum pembelian tidak boleh kurang dari 0."
      );
    }

    if (
      data.maximumDiscount !== undefined &&
      data.maximumDiscount !== null &&
      data.maximumDiscount <= 0
    ) {
      throw new Error(
        "Maksimum diskon harus lebih besar dari 0."
      );
    }

    if (
      data.usageLimit !== undefined &&
      data.usageLimit !== null &&
      data.usageLimit <= 0
    ) {
      throw new Error(
        "Batas penggunaan harus lebih besar dari 0."
      );
    }

    if (
      data.perUserLimit !== undefined &&
      data.perUserLimit !== null &&
      data.perUserLimit <= 0
    ) {
      throw new Error(
        "Batas penggunaan per pengguna harus lebih besar dari 0."
      );
    }

    if (
      data.startAt &&
      data.endAt &&
      data.endAt <= data.startAt
    ) {
      throw new Error(
        "Tanggal berakhir harus lebih besar dari tanggal mulai."
      );
    }
  }

  /**
   * ============================================================
   * GET LIST
   * ============================================================
   */

  static async getList(
    options: AdminVoucherListOptions = {}
  ) {
    const page =
      Math.max(1, options.page ?? 1);

    const limit =
      Math.min(
        100,
        Math.max(
          1,
          options.limit ?? 20
        )
      );

    const skip =
      (page - 1) * limit;

    const filters = {
      search: options.search,

      isActive: options.isActive,

      discountType: options.discountType,
    };

    const [
      vouchers,
      total,
    ] = await Promise.all([
      VoucherRepository.findMany({
        ...filters,
        skip,
        take: limit,
      }),

      VoucherRepository.count(
        filters
      ),
    ]);

    return {
      data: vouchers,

      pagination: {
        page,

        limit,

        total,

        totalPages:
          Math.ceil(total / limit),
      },
    };
  }

  /**
   * ============================================================
   * GET BY ID
   * ============================================================
   */

  static async getById(
    id: string
  ) {
    const voucher =
      await VoucherRepository.findById(id);

    if (!voucher) {
      throw new Error(
        "Voucher tidak ditemukan."
      );
    }

    return voucher;
  }

  /**
   * ============================================================
   * CREATE
   * ============================================================
   */

  static async create(
    input: CreateAdminVoucherInput
  ) {
    const code =
      this.normalizeCode(input.code);

    this.validateVoucherData({
      ...input,
      code,
    });

    const existing =
      await VoucherRepository.findByCode(
        code
      );

    if (existing) {
      throw new Error(
        "Kode voucher sudah digunakan."
      );
    }

    return VoucherRepository.create({
      code,

      name: input.name.trim(),

      description:
        input.description?.trim() ||
        null,

      discountType:
        input.discountType,

      discountValue:
        new Prisma.Decimal(
          input.discountValue
        ),

      minimumPurchase:
        input.minimumPurchase !== undefined &&
        input.minimumPurchase !== null
          ? new Prisma.Decimal(
              input.minimumPurchase
            )
          : null,

      maximumDiscount:
        input.maximumDiscount !== undefined &&
        input.maximumDiscount !== null
          ? new Prisma.Decimal(
              input.maximumDiscount
            )
          : null,

      usageLimit:
        input.usageLimit ?? null,

      perUserLimit:
        input.perUserLimit ?? null,

      startAt:
        input.startAt ?? null,

      endAt:
        input.endAt ?? null,

      isActive:
        input.isActive ?? true,
    });
  }

  /**
   * ============================================================
   * UPDATE
   * ============================================================
   */

  static async update(
    id: string,
    input: UpdateAdminVoucherInput
  ) {
    const voucher =
      await this.getById(id);

    const normalizedCode =
      input.code !== undefined
        ? this.normalizeCode(input.code)
        : undefined;

    /**
     * ==========================================================
     * MERGE DATA
     * ==========================================================
     *
     * Validasi dilakukan menggunakan nilai final
     * antara data lama + data baru.
     */

    const finalDiscountType =
      input.discountType ??
      voucher.discountType;

    const finalDiscountValue =
      input.discountValue ??
      Number(voucher.discountValue);

    const finalStartAt =
      input.startAt !== undefined
        ? input.startAt
        : voucher.startAt;

    const finalEndAt =
      input.endAt !== undefined
        ? input.endAt
        : voucher.endAt;

    this.validateVoucherData({
      code: normalizedCode,

      name: input.name,

      discountType:
        finalDiscountType,

      discountValue:
        finalDiscountValue,

      minimumPurchase:
        input.minimumPurchase,

      maximumDiscount:
        input.maximumDiscount,

      usageLimit:
        input.usageLimit,

      perUserLimit:
        input.perUserLimit,

      startAt:
        finalStartAt,

      endAt:
        finalEndAt,
    });

    /**
     * ==========================================================
     * CHECK DUPLICATE CODE
     * ==========================================================
     */

    if (
      normalizedCode &&
      normalizedCode !== voucher.code
    ) {
      const existing =
        await VoucherRepository.findByCode(
          normalizedCode
        );

      if (
        existing &&
        existing.id !== id
      ) {
        throw new Error(
          "Kode voucher sudah digunakan."
        );
      }
    }

    /**
     * ==========================================================
     * BUILD UPDATE DATA
     * ==========================================================
     */

    const data: Prisma.VoucherUpdateInput = {};

    if (
      normalizedCode !== undefined
    ) {
      data.code = normalizedCode;
    }

    if (
      input.name !== undefined
    ) {
      data.name = input.name.trim();
    }

    if (
      input.description !== undefined
    ) {
      data.description =
        input.description?.trim() ||
        null;
    }

    if (
      input.discountType !== undefined
    ) {
      data.discountType =
        input.discountType;
    }

    if (
      input.discountValue !== undefined
    ) {
      data.discountValue =
        new Prisma.Decimal(
          input.discountValue
        );
    }

    if (
      input.minimumPurchase !== undefined
    ) {
      data.minimumPurchase =
        input.minimumPurchase !== null
          ? new Prisma.Decimal(
              input.minimumPurchase
            )
          : null;
    }

    if (
      input.maximumDiscount !== undefined
    ) {
      data.maximumDiscount =
        input.maximumDiscount !== null
          ? new Prisma.Decimal(
              input.maximumDiscount
            )
          : null;
    }

    if (
      input.usageLimit !== undefined
    ) {
      data.usageLimit =
        input.usageLimit;
    }

    if (
      input.perUserLimit !== undefined
    ) {
      data.perUserLimit =
        input.perUserLimit;
    }

    if (
      input.startAt !== undefined
    ) {
      data.startAt =
        input.startAt;
    }

    if (
      input.endAt !== undefined
    ) {
      data.endAt =
        input.endAt;
    }

    if (
      input.isActive !== undefined
    ) {
      data.isActive =
        input.isActive;
    }

    return VoucherRepository.update(
      id,
      data
    );
  }

  /**
   * ============================================================
   * SET ACTIVE STATUS
   * ============================================================
   */

  static async setActive(
    id: string,
    isActive: boolean
  ) {
    await this.getById(id);

    return VoucherRepository.setActive(
      id,
      isActive
    );
  }

  /**
   * ============================================================
   * SOFT DELETE
   * ============================================================
   */

  static async delete(
    id: string
  ) {
    const voucher =
      await this.getById(id);

    /**
     * Voucher yang sudah digunakan tidak boleh
     * dihapus secara fisik.
     *
     * Repository menggunakan soft delete sehingga
     * histori VoucherUsage tetap aman.
     */

    if (voucher.usageCount > 0) {
      throw new Error(
        "Voucher yang sudah digunakan tidak dapat dihapus."
      );
    }

    return VoucherRepository.softDelete(
      id
    );
  }

  /**
   * ============================================================
   * GET USAGE HISTORY
   * ============================================================
   */

  static async getUsageHistory(
    voucherId: string,
    options: {
      page?: number;

      limit?: number;
    } = {}
  ) {
    await this.getById(voucherId);

    const page =
      Math.max(1, options.page ?? 1);

    const limit =
      Math.min(
        100,
        Math.max(
          1,
          options.limit ?? 20
        )
      );

    const skip =
      (page - 1) * limit;

    const [
      usages,
      total,
    ] = await Promise.all([
      VoucherRepository.findUsages(
        voucherId,
        {
          skip,
          take: limit,
        }
      ),

      VoucherRepository.countUsages(
        voucherId
      ),
    ]);

    return {
      data: usages,

      pagination: {
        page,

        limit,

        total,

        totalPages:
          Math.ceil(total / limit),
      },
    };
  }
}