"use server";

import { auth } from "@/auth";

import { VoucherService } from "@/services/voucher/voucher.service";

/**
 * ============================================================
 * VALIDATE VOUCHER ACTION
 * ============================================================
 *
 * Server Action untuk preview dan validasi voucher
 * sebelum customer membuat pesanan.
 *
 * Action ini TIDAK:
 * - menambah usageCount
 * - membuat VoucherUsage
 * - mengubah data voucher
 *
 * Voucher hanya benar-benar dikonsumsi saat checkout
 * berhasil dibuat di OrderService.
 * ============================================================
 */

interface ValidateVoucherInput {
  code: string;

  subtotal: number;

  shippingCost?: number;
}

interface ValidateVoucherResult {
  success: boolean;

  message: string;

  voucher?: {
    id: string;

    code: string;

    name: string;

    type: "DISCOUNT" | "FREE_SHIPPING";

    maximumShippingDiscount: number | null;
  };

  subtotal?: number;

  discountAmount?: number;

  finalSubtotal?: number;

  shippingDiscountAmount?: number;
}

/**
 * ============================================================
 * VALIDATE VOUCHER ACTION
 * ============================================================
 */

export async function validateVoucherAction(
  input: ValidateVoucherInput
): Promise<ValidateVoucherResult> {
  try {
    /**
     * ==========================================================
     * AUTHENTICATION
     * ==========================================================
     */

    const session =
      await auth();

    if (!session?.user?.id) {
      return {
        success: false,

        message:
          "Sesi Anda telah berakhir. Silakan login kembali.",
      };
    }

    /**
     * ==========================================================
     * NORMALIZE INPUT
     * ==========================================================
     */

    const code =
      input.code
        ?.trim()
        .toUpperCase();

    if (!code) {
      return {
        success: false,

        message:
          "Masukkan kode voucher terlebih dahulu.",
      };
    }

    const subtotal =
      Number(input.subtotal);

    if (
      !Number.isFinite(subtotal) ||
      subtotal <= 0
    ) {
      return {
        success: false,

        message:
          "Subtotal pesanan tidak valid.",
      };
    }

    /**
     * ==========================================================
     * VALIDATE + CALCULATE
     * ==========================================================
     */

    const result =
      await VoucherService.validateAndCalculate({
        code,

        userId:
          session.user.id,

        subtotal,
      });

    /**
     * ==========================================================
     * SUCCESS
     * ==========================================================
     */

    return {
      success: true,

      message:
        "Voucher berhasil diterapkan.",

      voucher: {
        id:
          result.voucher.id,

        code:
          result.voucher.code,

        name:
          result.voucher.name,

        type:
          result.voucher.type,

        maximumShippingDiscount:
          result.voucher.maximumShippingDiscount !== null
            ? result.voucher.maximumShippingDiscount.toNumber()
            : null,
      },

      subtotal:
        result.subtotal.toNumber(),

      discountAmount:
        result.discountAmount.toNumber(),

      finalSubtotal:
        result.finalSubtotal.toNumber(),

      shippingDiscountAmount:
        VoucherService.calculateShippingDiscount(
          result.voucher,
          input.shippingCost ?? 0,
        ).toNumber(),
    };
  } catch (error) {
    console.error(
      "[VALIDATE_VOUCHER_ACTION_ERROR]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Gagal memvalidasi voucher.",
    };
  }
}