import { Prisma, Voucher, VoucherType } from "@prisma/client";

import { VoucherRepository } from "@/repositories/voucher/voucher.repository";

export interface ValidateVoucherInput {
  code: string;
  userId: string;
  subtotal: number | Prisma.Decimal;
}

export interface VoucherCalculationResult {
  voucher: Voucher;
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  finalSubtotal: Prisma.Decimal;
}

export class VoucherService {
  private static normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  static async validateAndCalculate(
    input: ValidateVoucherInput,
    tx?: Prisma.TransactionClient,
  ): Promise<VoucherCalculationResult> {
    const code = this.normalizeCode(input.code);

    if (!code) throw new Error("Kode voucher wajib diisi.");
    if (!input.userId) throw new Error("User tidak valid.");

    const subtotal = new Prisma.Decimal(input.subtotal);
    if (subtotal.lessThanOrEqualTo(0)) {
      throw new Error("Subtotal harus lebih dari 0.");
    }

    const voucher = await VoucherRepository.findByCode(code, tx);
    if (!voucher) throw new Error("Voucher tidak ditemukan.");

    const ownedVoucher = await VoucherRepository.findUserVoucher(
      voucher.id,
      input.userId,
      tx,
    );

    if (voucher.claimable && !ownedVoucher) {
      throw new Error("Voucher ini harus diklaim terlebih dahulu.");
    }

    if (!voucher.claimable) {
      const rewardOwner = await VoucherRepository.findUserVoucherOwner(
        voucher.id,
        tx,
      );

      if (rewardOwner && rewardOwner.userId !== input.userId) {
        throw new Error("Voucher reward ini bukan milik Anda.");
      }
    }

    if (!voucher.isActive) throw new Error("Voucher sedang tidak aktif.");

    const now = new Date();
    if (voucher.startAt && now < voucher.startAt) {
      throw new Error("Voucher belum dapat digunakan.");
    }
    if (voucher.endAt && now >= voucher.endAt) {
      throw new Error("Voucher sudah berakhir.");
    }

    if (
      voucher.usageLimit !== null &&
      voucher.usageCount >= voucher.usageLimit
    ) {
      throw new Error("Voucher sudah mencapai batas penggunaan.");
    }

    if (voucher.perUserLimit !== null) {
      const userUsageCount = await VoucherRepository.countUserUsage(
        voucher.id,
        input.userId,
        tx,
      );
      if (userUsageCount >= voucher.perUserLimit) {
        throw new Error("Anda sudah mencapai batas penggunaan voucher ini.");
      }
    }

    if (
      voucher.minimumPurchase !== null &&
      subtotal.lessThan(voucher.minimumPurchase)
    ) {
      throw new Error(
        `Minimum pembelian untuk voucher ini adalah Rp${voucher.minimumPurchase.toFixed(0)}.`,
      );
    }

    let discountAmount = new Prisma.Decimal(0);

    if (voucher.type === VoucherType.DISCOUNT) {
      if (voucher.discountType === "PERCENTAGE") {
        const percentage = Prisma.Decimal.min(
          new Prisma.Decimal(100),
          Prisma.Decimal.max(new Prisma.Decimal(0), voucher.discountValue),
        );

        discountAmount = subtotal.mul(percentage).div(100);

        if (voucher.maximumDiscount !== null) {
          discountAmount = Prisma.Decimal.min(
            discountAmount,
            voucher.maximumDiscount,
          );
        }
      } else {
        discountAmount = Prisma.Decimal.min(
          subtotal,
          Prisma.Decimal.max(new Prisma.Decimal(0), voucher.discountValue),
        );
      }
    }

    discountAmount = Prisma.Decimal.max(
      new Prisma.Decimal(0),
      Prisma.Decimal.min(discountAmount, subtotal),
    );

    return {
      voucher,
      subtotal,
      discountAmount,
      finalSubtotal: subtotal.minus(discountAmount),
    };
  }

  static calculateShippingDiscount(
    voucher: Voucher,
    shippingCost: number | Prisma.Decimal,
  ): Prisma.Decimal {
    const shipping = new Prisma.Decimal(shippingCost);

    if (voucher.type !== VoucherType.FREE_SHIPPING) {
      return new Prisma.Decimal(0);
    }

    if (shipping.lessThanOrEqualTo(0)) {
      return new Prisma.Decimal(0);
    }

    const maximum =
      voucher.maximumShippingDiscount ??
      shipping;

    return Prisma.Decimal.max(
      new Prisma.Decimal(0),
      Prisma.Decimal.min(shipping, maximum),
    );
  }

  static async acquireUserVoucherLock(
    voucherId: string,
    userId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(
        hashtext(${voucherId} || ':' || ${userId})::bigint
      )
    `;
  }
}
