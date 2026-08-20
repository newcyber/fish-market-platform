import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * EXPIRED / CANCELLED ORDERS AUDIT
 * ============================================================
 *
 * READ-ONLY AUDIT
 *
 * Script ini TIDAK:
 *
 * - mengubah Order
 * - menghapus VoucherUsage
 * - mengubah Voucher usageCount
 * - mengubah stock
 *
 * Tujuan:
 *
 * 1. Memeriksa order CANCELLED
 * 2. Memeriksa payment status
 * 3. Memastikan VoucherUsage tidak tertinggal pada
 *    order yang belum VERIFIED
 * 4. Memastikan usageCount voucher konsisten
 * ============================================================
 */

interface AuditIssue {
  orderId: string;

  orderNumber: string;

  issue: string;
}

async function main() {
  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "     EXPIRED ORDERS BATCH AUDIT"
  );

  console.log(
    "========================================"
  );

  console.log("");

  /**
   * ==========================================================
   * FIND CANCELLED ORDERS
   * ==========================================================
   */

  const orders =
    await prisma.order.findMany({
      where: {
        deletedAt: null,

        status:
          OrderStatus.CANCELLED,
      },

      select: {
        id: true,

        orderNumber: true,

        status: true,

        paymentStatus: true,

        voucherId: true,

        voucherCode: true,

        voucherName: true,

        voucherDiscount: true,

        voucherUsage: {
          select: {
            id: true,

            voucherId: true,

            discountAmount: true,

            usedAt: true,
          },
        },

        createdAt: true,

        updatedAt: true,
      },

      orderBy: {
        updatedAt:
          "desc",
      },
    });

  console.log(
    "Total Cancelled Orders:",
    orders.length
  );

  console.log("");

  if (orders.length === 0) {
    console.log(
      "Tidak ditemukan order CANCELLED."
    );

    return;
  }

  /**
   * ==========================================================
   * AUDIT RESULT
   * ==========================================================
   */

  const issues:
    AuditIssue[] = [];

  let verifiedCancelledCount =
    0;

  let unverifiedCancelledCount =
    0;

  let ordersWithVoucher =
    0;

  let releasedVoucherCount =
    0;

  let retainedVoucherCount =
    0;

  /**
   * ==========================================================
   * AUDIT EACH ORDER
   * ==========================================================
   */

  for (
    const order of orders
  ) {
    const hasVoucher =
      Boolean(
        order.voucherId ||
        order.voucherCode
      );

    const isVerified =
      order.paymentStatus ===
      PaymentStatus.VERIFIED;

    if (isVerified) {
      verifiedCancelledCount += 1;
    } else {
      unverifiedCancelledCount += 1;
    }

    if (hasVoucher) {
      ordersWithVoucher += 1;
    }

    const hasVoucherUsage =
      Boolean(
        order.voucherUsage
      );

    console.log(
      "----------------------------------------"
    );

    console.log(
      "Order Number:",
      order.orderNumber
    );

    console.log(
      "Order ID:",
      order.id
    );

    console.log(
      "Status:",
      order.status
    );

    console.log(
      "Payment Status:",
      order.paymentStatus
    );

    console.log(
      "Voucher:",
      order.voucherCode ??
        "-"
    );

    console.log(
      "Voucher Discount:",
      order.voucherDiscount.toString()
    );

    console.log(
      "VoucherUsage:",
      hasVoucherUsage
        ? "ADA"
        : "TIDAK ADA"
    );

    /**
     * ========================================================
     * VERIFIED CANCELLED
     * ========================================================
     *
     * VoucherUsage HARUS tetap ada.
     */

    if (isVerified) {
      if (hasVoucher) {
        if (hasVoucherUsage) {
          retainedVoucherCount += 1;

          console.log(
            "Voucher Lifecycle:",
            "✅ RETAINED (VERIFIED)"
          );
        } else {
          issues.push({
            orderId:
              order.id,

            orderNumber:
              order.orderNumber,

            issue:
              "Order CANCELLED dengan payment VERIFIED memiliki voucher tetapi VoucherUsage tidak ditemukan.",
          });

          console.log(
            "Voucher Lifecycle:",
            "❌ MISSING VOUCHER USAGE"
          );
        }
      }

      continue;
    }

    /**
     * ========================================================
     * UNVERIFIED CANCELLED
     * ========================================================
     *
     * VoucherUsage HARUS sudah dilepas.
     */

    if (
      hasVoucherUsage
    ) {
      issues.push({
        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        issue:
          "Order CANCELLED dengan payment belum VERIFIED masih memiliki VoucherUsage.",
      });

      console.log(
        "Voucher Lifecycle:",
        "❌ SHOULD HAVE BEEN RELEASED"
      );
    } else {
      if (hasVoucher) {
        releasedVoucherCount += 1;

        console.log(
          "Voucher Lifecycle:",
          "✅ RELEASED"
        );
      }
    }
  }

  /**
   * ==========================================================
   * VOUCHER COUNTER AUDIT
   * ==========================================================
   *
   * usageCount harus sama dengan jumlah VoucherUsage aktual.
   * ==========================================================
   */

  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "       VOUCHER COUNTER AUDIT"
  );

  console.log(
    "========================================"
  );

  console.log("");

  const vouchers =
    await prisma.voucher.findMany({
      where: {
        deletedAt: null,
      },

      select: {
        id: true,

        code: true,

        usageCount: true,

        _count: {
          select: {
            usages: true,
          },
        },
      },

      orderBy: {
        code:
          "asc",
      },
    });

  let invalidVoucherCount =
    0;

  for (
    const voucher of vouchers
  ) {
    const actualUsageCount =
      voucher._count.usages;

    const isValid =
      voucher.usageCount ===
      actualUsageCount;

    if (!isValid) {
      invalidVoucherCount += 1;

      issues.push({
        orderId:
          "-",

        orderNumber:
          voucher.code,

        issue:
          `Voucher usageCount (${voucher.usageCount}) tidak sama dengan jumlah VoucherUsage (${actualUsageCount}).`,
      });
    }

    console.log(
      voucher.code,
      "| Stored:",
      voucher.usageCount,
      "| Actual:",
      actualUsageCount,
      "|",
      isValid
        ? "✅ VALID"
        : "❌ INVALID"
    );
  }

  /**
   * ==========================================================
   * SUMMARY
   * ==========================================================
   */

  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "             AUDIT SUMMARY"
  );

  console.log(
    "========================================"
  );

  console.log("");

  console.log(
    "Total Cancelled Orders:",
    orders.length
  );

  console.log(
    "Cancelled + VERIFIED:",
    verifiedCancelledCount
  );

  console.log(
    "Cancelled + Unverified:",
    unverifiedCancelledCount
  );

  console.log(
    "Orders With Voucher:",
    ordersWithVoucher
  );

  console.log(
    "Voucher Released:",
    releasedVoucherCount
  );

  console.log(
    "Voucher Retained:",
    retainedVoucherCount
  );

  console.log(
    "Invalid Voucher Counters:",
    invalidVoucherCount
  );

  console.log(
    "Issues Found:",
    issues.length
  );

  /**
   * ==========================================================
   * ISSUE DETAILS
   * ==========================================================
   */

  if (issues.length > 0) {
    console.log("");

    console.log(
      "========================================"
    );

    console.log(
      "             AUDIT ISSUES"
    );

    console.log(
      "========================================"
    );

    for (
      const issue of issues
    ) {
      console.log("");

      console.log(
        "Order:",
        issue.orderNumber
      );

      console.log(
        "ID:",
        issue.orderId
      );

      console.log(
        "Issue:",
        issue.issue
      );
    }
  }

  /**
   * ==========================================================
   * FINAL RESULT
   * ==========================================================
   */

  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    issues.length === 0
      ? "🎉 EXPIRED ORDERS AUDIT BERHASIL"
      : "⚠️ EXPIRED ORDERS AUDIT MENEMUKAN MASALAH"
  );

  console.log(
    "========================================"
  );

  if (issues.length > 0) {
    process.exitCode =
      1;
  }
}

main()
  .catch(
    (error) => {
      console.error(
        "[AUDIT_EXPIRED_ORDERS_ERROR]",
        error
      );

      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );