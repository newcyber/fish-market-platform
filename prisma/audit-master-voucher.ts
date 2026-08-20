import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * MASTER VOUCHER SYSTEM AUDIT
 * ============================================================
 *
 * READ ONLY AUDIT
 *
 * Memeriksa:
 *
 * 1. Voucher usageCount vs VoucherUsage
 * 2. VoucherUsage vs Order snapshot
 * 3. Cancelled order lifecycle
 *    - payment VERIFIED  -> VoucherUsage harus tetap ada
 *    - payment selain VERIFIED -> VoucherUsage harus tidak ada
 *
 * Script ini TIDAK mengubah database.
 * ============================================================
 */

type AuditIssue = {
  type: string;
  message: string;
  orderNumber?: string;
  voucherCode?: string;
};

async function main() {
  console.log("");

  console.log("========================================");
  console.log("       MASTER VOUCHER SYSTEM AUDIT");
  console.log("========================================");

  console.log("");

  const issues: AuditIssue[] = [];

  /**
   * ==========================================================
   * 1. VOUCHER COUNTER AUDIT
   * ==========================================================
   */

  console.log("VOUCHER COUNTER AUDIT");

  console.log("----------------------------------------");

  const vouchers = await prisma.voucher.findMany({
    where: {
      deletedAt: null,
    },

    select: {
      id: true,
      code: true,
      name: true,
      usageCount: true,

      _count: {
        select: {
          usages: true,
        },
      },
    },

    orderBy: {
      code: "asc",
    },
  });

  let validVoucherCounters = 0;
  let invalidVoucherCounters = 0;

  for (const voucher of vouchers) {
    const actualUsageCount =
      voucher._count.usages;

    const valid =
      voucher.usageCount ===
      actualUsageCount;

    console.log(
      `${voucher.code} | Stored: ${voucher.usageCount} | Actual: ${actualUsageCount} | ${
        valid
          ? "✅ VALID"
          : "❌ INVALID"
      }`
    );

    if (valid) {
      validVoucherCounters++;
    } else {
      invalidVoucherCounters++;

      issues.push({
        type: "VOUCHER_COUNTER_MISMATCH",
        voucherCode: voucher.code,
        message:
          `usageCount=${voucher.usageCount}, ` +
          `VoucherUsage=${actualUsageCount}`,
      });
    }
  }

  /**
   * ==========================================================
   * 2. VOUCHER USAGE + ORDER SNAPSHOT AUDIT
   * ==========================================================
   */

  console.log("");
  console.log("VOUCHER USAGE / ORDER SNAPSHOT AUDIT");

  console.log("----------------------------------------");

  const usages = await prisma.voucherUsage.findMany({
    select: {
      id: true,
      voucherId: true,
      discountAmount: true,

      voucher: {
        select: {
          code: true,
        },
      },

      order: {
        select: {
          orderNumber: true,
          voucherId: true,
          voucherCode: true,
          voucherDiscount: true,
        },
      },
    },

    orderBy: {
      usedAt: "asc",
    },
  });

  let validUsageSnapshots = 0;
  let invalidUsageSnapshots = 0;

  for (const usage of usages) {
    const voucherIdMatches =
      usage.order.voucherId ===
      usage.voucherId;

    const voucherCodeMatches =
      usage.order.voucherCode ===
      usage.voucher.code;

    const discountMatches =
      usage.order.voucherDiscount.equals(
        usage.discountAmount
      );

    const valid =
      voucherIdMatches &&
      voucherCodeMatches &&
      discountMatches;

    console.log(
      `${usage.order.orderNumber} | ${usage.voucher.code} | ${
        valid
          ? "✅ VALID"
          : "❌ INVALID"
      }`
    );

    if (valid) {
      validUsageSnapshots++;
    } else {
      invalidUsageSnapshots++;

      issues.push({
        type: "VOUCHER_ORDER_SNAPSHOT_MISMATCH",
        voucherCode: usage.voucher.code,
        orderNumber:
          usage.order.orderNumber,
        message:
          `voucherId=${voucherIdMatches}, ` +
          `voucherCode=${voucherCodeMatches}, ` +
          `discount=${discountMatches}`,
      });
    }
  }

  /**
   * ==========================================================
   * 3. CANCELLED ORDER VOUCHER LIFECYCLE AUDIT
   * ==========================================================
   */

  console.log("");
  console.log("CANCELLED ORDER VOUCHER LIFECYCLE AUDIT");

  console.log("----------------------------------------");

  const cancelledOrders =
    await prisma.order.findMany({
      where: {
        deletedAt: null,
        status: "CANCELLED",
      },

      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        voucherId: true,
        voucherCode: true,

        voucherUsage: {
          select: {
            id: true,
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    });

  let validCancelledLifecycle = 0;
  let invalidCancelledLifecycle = 0;

  for (const order of cancelledOrders) {
    /**
     * Order tanpa voucher snapshot tidak perlu
     * memiliki VoucherUsage.
     */
    if (!order.voucherId) {
      continue;
    }

    const hasUsage =
      order.voucherUsage !== null;

    const shouldRetainUsage =
      order.paymentStatus === "VERIFIED";

    const valid =
      shouldRetainUsage
        ? hasUsage
        : !hasUsage;

    console.log(
      `${order.orderNumber} | Payment: ${order.paymentStatus} | Voucher: ${
        order.voucherCode ?? "-"
      } | Usage: ${
        hasUsage ? "ADA" : "TIDAK ADA"
      } | ${
        valid
          ? "✅ VALID"
          : "❌ INVALID"
      }`
    );

    if (valid) {
      validCancelledLifecycle++;
    } else {
      invalidCancelledLifecycle++;

      issues.push({
        type: "CANCELLED_ORDER_VOUCHER_LIFECYCLE",
        voucherCode:
          order.voucherCode ??
          undefined,
        orderNumber:
          order.orderNumber,
        message:
          shouldRetainUsage
            ? "Payment VERIFIED tetapi VoucherUsage tidak ada."
            : "Payment belum VERIFIED tetapi VoucherUsage masih ada.",
      });
    }
  }

  /**
   * ==========================================================
   * FINAL SUMMARY
   * ==========================================================
   */

  const totalChecks =
    validVoucherCounters +
    invalidVoucherCounters +
    validUsageSnapshots +
    invalidUsageSnapshots +
    validCancelledLifecycle +
    invalidCancelledLifecycle;

  const totalValid =
    validVoucherCounters +
    validUsageSnapshots +
    validCancelledLifecycle;

  const totalInvalid =
    invalidVoucherCounters +
    invalidUsageSnapshots +
    invalidCancelledLifecycle;

  console.log("");

  console.log("========================================");
  console.log("             AUDIT SUMMARY");
  console.log("========================================");

  console.log("");

  console.log(
    "Total Vouchers:",
    vouchers.length
  );

  console.log(
    "Total VoucherUsage:",
    usages.length
  );

  console.log(
    "Cancelled Orders:",
    cancelledOrders.length
  );

  console.log("");

  console.log(
    "Valid Voucher Counters:",
    validVoucherCounters
  );

  console.log(
    "Invalid Voucher Counters:",
    invalidVoucherCounters
  );

  console.log("");

  console.log(
    "Valid Usage Snapshots:",
    validUsageSnapshots
  );

  console.log(
    "Invalid Usage Snapshots:",
    invalidUsageSnapshots
  );

  console.log("");

  console.log(
    "Valid Cancelled Lifecycles:",
    validCancelledLifecycle
  );

  console.log(
    "Invalid Cancelled Lifecycles:",
    invalidCancelledLifecycle
  );

  console.log("");

  console.log(
    "Total Checks:",
    totalChecks
  );

  console.log(
    "Total Valid:",
    totalValid
  );

  console.log(
    "Issues Found:",
    totalInvalid
  );

  /**
   * ==========================================================
   * ISSUE DETAILS
   * ==========================================================
   */

  if (issues.length > 0) {
    console.log("");

    console.log("========================================");
    console.log("              ISSUES");
    console.log("========================================");

    for (const issue of issues) {
      console.log("");

      console.log(
        "Type:",
        issue.type
      );

      if (issue.voucherCode) {
        console.log(
          "Voucher:",
          issue.voucherCode
        );
      }

      if (issue.orderNumber) {
        console.log(
          "Order:",
          issue.orderNumber
        );
      }

      console.log(
        "Message:",
        issue.message
      );
    }
  }

  /**
   * ==========================================================
   * FINAL RESULT
   * ==========================================================
   */

  console.log("");

  console.log("========================================");

  if (totalInvalid === 0) {
    console.log(
      "🎉 MASTER VOUCHER AUDIT BERHASIL"
    );

    console.log(
      "Semua counter, snapshot, dan lifecycle valid."
    );
  } else {
    console.log(
      "❌ MASTER VOUCHER AUDIT MENEMUKAN MASALAH"
    );
  }

  console.log("========================================");

  if (totalInvalid > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(
      "[MASTER_VOUCHER_AUDIT_ERROR]",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });