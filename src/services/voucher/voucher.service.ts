import {
  Prisma,
  Voucher,
} from "@prisma/client";

import { VoucherRepository } from "@/repositories/voucher/voucher.repository";

/**
 * ============================================================
 * VOUCHER SERVICE
 * ============================================================
 *
 * Single source of truth untuk:
 *
 * - Voucher validation
 * - Voucher discount calculation
 *
 * Voucher usage TIDAK langsung disimpan di sini.
 *
 * Penyimpanan penggunaan voucher dilakukan saat
 * order berhasil dibuat menggunakan Prisma transaction.
 *
 * Service mendukung optional TransactionClient agar
 * validasi dapat berjalan menggunakan transaction yang
 * sama dengan proses pembuatan order.
 */

/**
 * ============================================================
 * INPUT
 * ============================================================
 */

export interface ValidateVoucherInput {
  code: string;

  userId: string;

  subtotal: number | Prisma.Decimal;
}

/**
 * ============================================================
 * RESULT
 * ============================================================
 */

export interface VoucherCalculationResult {
  voucher: Voucher;

  subtotal: Prisma.Decimal;

  discountAmount: Prisma.Decimal;

  finalSubtotal: Prisma.Decimal;
}

export class VoucherService {
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
   * VALIDATE AND CALCULATE
   * ============================================================
   */

  static async validateAndCalculate(
    input: ValidateVoucherInput,
    tx?: Prisma.TransactionClient
  ): Promise<VoucherCalculationResult> {
    const code =
      this.normalizeCode(
        input.code
      );

    /**
     * ----------------------------------------------------------
     * BASIC INPUT VALIDATION
     * ----------------------------------------------------------
     */

    if (!code) {
      throw new Error(
        "Kode voucher wajib diisi."
      );
    }

    if (!input.userId) {
      throw new Error(
        "User tidak valid."
      );
    }

    const subtotal =
      new Prisma.Decimal(
        input.subtotal
      );

    if (
      subtotal.lessThanOrEqualTo(0)
    ) {
      throw new Error(
        "Subtotal harus lebih dari 0."
      );
    }

    /**
     * ----------------------------------------------------------
     * FIND VOUCHER
     * ----------------------------------------------------------
     */

    const voucher =
      await VoucherRepository.findByCode(
        code,
        tx
      );

    if (!voucher) {
      throw new Error(
        "Voucher tidak ditemukan."
      );
    }

    /**
     * ----------------------------------------------------------
     * ACTIVE STATUS
     * ----------------------------------------------------------
     */

    if (!voucher.isActive) {
      throw new Error(
        "Voucher sedang tidak aktif."
      );
    }

    /**
     * ----------------------------------------------------------
     * VALIDITY PERIOD
     * ----------------------------------------------------------
     */

    const now =
      new Date();

    if (
      voucher.startAt &&
      now < voucher.startAt
    ) {
      throw new Error(
        "Voucher belum dapat digunakan."
      );
    }

    if (
      voucher.endAt &&
      now >= voucher.endAt
    ) {
      throw new Error(
        "Voucher sudah berakhir."
      );
    }

    /**
     * ----------------------------------------------------------
     * USAGE LIMIT
     * ----------------------------------------------------------
     */

    if (
      voucher.usageLimit !== null &&
      voucher.usageCount >=
        voucher.usageLimit
    ) {
      throw new Error(
        "Voucher sudah mencapai batas penggunaan."
      );
    }

    /**
     * ----------------------------------------------------------
     * PER USER LIMIT
     * ----------------------------------------------------------
     */

    if (
      voucher.perUserLimit !== null
    ) {
      const userUsageCount =
        await VoucherRepository.countUserUsage(
          voucher.id,
          input.userId,
          tx
        );

      if (
        userUsageCount >=
        voucher.perUserLimit
      ) {
        throw new Error(
          "Anda sudah mencapai batas penggunaan voucher ini."
        );
      }
    }

    /**
     * ----------------------------------------------------------
     * MINIMUM PURCHASE
     * ----------------------------------------------------------
     */

    if (
      voucher.minimumPurchase !== null &&
      subtotal.lessThan(
        voucher.minimumPurchase
      )
    ) {
      throw new Error(
        `Minimum pembelian untuk voucher ini adalah Rp${voucher.minimumPurchase.toFixed(
          0
        )}.`
      );
    }

    /**
     * ----------------------------------------------------------
     * CALCULATE DISCOUNT
     * ----------------------------------------------------------
     */

    let discountAmount =
      new Prisma.Decimal(0);

    if (
      voucher.discountType ===
      "PERCENTAGE"
    ) {
      const percentage =
        Prisma.Decimal.min(
          new Prisma.Decimal(100),
          Prisma.Decimal.max(
            new Prisma.Decimal(0),
            voucher.discountValue
          )
        );

      discountAmount =
        subtotal
          .mul(percentage)
          .div(100);

      /**
       * Apply maximum discount.
       */

      if (
        voucher.maximumDiscount !== null
      ) {
        discountAmount =
          Prisma.Decimal.min(
            discountAmount,
            voucher.maximumDiscount
          );
      }
    }

    if (
      voucher.discountType ===
      "FIXED_AMOUNT"
    ) {
      discountAmount =
        Prisma.Decimal.min(
          subtotal,
          Prisma.Decimal.max(
            new Prisma.Decimal(0),
            voucher.discountValue
          )
        );
    }

    /**
     * ----------------------------------------------------------
     * SAFETY CLAMP
     * ----------------------------------------------------------
     */

    discountAmount =
      Prisma.Decimal.max(
        new Prisma.Decimal(0),
        Prisma.Decimal.min(
          discountAmount,
          subtotal
        )
      );

    const finalSubtotal =
      subtotal.minus(
        discountAmount
      );

    /**
     * ----------------------------------------------------------
     * RETURN RESULT
     * ----------------------------------------------------------
     */

    return {
      voucher,

      subtotal,

      discountAmount,

      finalSubtotal,
    };
  }
}