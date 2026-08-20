import {
  PrismaClient,
} from "@prisma/client";

const prisma =
  new PrismaClient();

/**
 * ============================================================
 * VERIFIED CANCEL VOUCHER AUDIT
 * ============================================================
 *
 * Memastikan voucher tetap consumed ketika:
 *
 * 1. Order menggunakan voucher
 * 2. Payment sudah VERIFIED
 * 3. Order kemudian CANCELLED
 *
 * Expected:
 *
 * - VoucherUsage tetap ada
 * - usageCount tetap
 * - paymentStatus tetap VERIFIED
 * - order status = CANCELLED
 * ============================================================
 */

function formatCurrency(
  value:
    | number
    | string
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value)
  );
}

async function main() {
  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    " VERIFIED CANCEL VOUCHER AUDIT"
  );

  console.log(
    "========================================"
  );

  console.log("");

  const voucherCode =
    "VERIFIEDCANCEL";

  /**
   * ==========================================================
   * FIND VOUCHER
   * ==========================================================
   */

  const voucher =
    await prisma.voucher.findUnique({
      where: {
        code:
          voucherCode,
      },

      include: {
        usages: {
          include: {
            order: {
              select: {
                id: true,

                orderNumber: true,

                status: true,

                paymentStatus: true,

                subtotal: true,

                voucherCode: true,

                voucherName: true,

                voucherDiscount: true,

                shippingCost: true,

                total: true,

                createdAt: true,
              },
            },
          },

          orderBy: {
            usedAt:
              "desc",
          },
        },
      },
    });

  /**
   * ==========================================================
   * VOUCHER NOT FOUND
   * ==========================================================
   */

  if (!voucher) {
    console.log(
      `❌ Voucher ${voucherCode} tidak ditemukan.`
    );

    process.exitCode =
      1;

    return;
  }

  /**
   * ==========================================================
   * VOUCHER SUMMARY
   * ==========================================================
   */

  console.log(
    "VOUCHER"
  );

  console.log(
    "----------------------------------------"
  );

  console.log(
    "Code:",
    voucher.code
  );

  console.log(
    "Name:",
    voucher.name
  );

  console.log(
    "Usage Count:",
    voucher.usageCount
  );

  console.log(
    "Actual VoucherUsage Records:",
    voucher.usages.length
  );

  console.log("");

  /**
   * ==========================================================
   * NO USAGE
   * ==========================================================
   */

  if (
    voucher.usages.length === 0
  ) {
    console.log(
      "❌ Tidak ditemukan VoucherUsage."
    );

    console.log("");

    console.log(
      "EXPECTED:"
    );

    console.log(
      "VoucherUsage harus tetap ada jika order sudah VERIFIED lalu CANCELLED."
    );

    process.exitCode =
      1;

    return;
  }

  /**
   * ==========================================================
   * USAGE COUNT VALIDATION
   * ==========================================================
   */

  const usageCountValid =
    voucher.usageCount ===
    voucher.usages.length;

  console.log(
    usageCountValid
      ? "✅ usageCount sesuai dengan jumlah VoucherUsage."
      : "⚠️ usageCount berbeda dengan jumlah VoucherUsage."
  );

  console.log("");

  /**
   * ==========================================================
   * AUDIT EACH USAGE
   * ==========================================================
   */

  let hasCancelledVerifiedOrder =
    false;

  let hasInvalidUsage =
    false;

  for (
    const usage of voucher.usages
  ) {
    const order =
      usage.order;

    console.log(
      "========================================"
    );

    console.log(
      "VOUCHER USAGE"
    );

    console.log(
      "========================================"
    );

    console.log(
      "Usage ID:",
      usage.id
    );

    console.log(
      "Order ID:",
      usage.orderId
    );

    console.log(
      "Order Number:",
      order.orderNumber
    );

    console.log(
      "Used At:",
      usage.usedAt.toISOString()
    );

    console.log("");

    /**
     * ========================================================
     * ORDER SNAPSHOT
     * ========================================================
     */

    console.log(
      "ORDER"
    );

    console.log(
      "----------------------------------------"
    );

    console.log(
      "Order Status:",
      order.status
    );

    console.log(
      "Payment Status:",
      order.paymentStatus
    );

    console.log(
      "Subtotal:",
      formatCurrency(
        order.subtotal.toString()
      )
    );

    console.log(
      "Voucher Code:",
      order.voucherCode ??
        "-"
    );

    console.log(
      "Voucher Name:",
      order.voucherName ??
        "-"
    );

    console.log(
      "Order Voucher Discount:",
      formatCurrency(
        order.voucherDiscount.toString()
      )
    );

    console.log(
      "VoucherUsage Discount:",
      formatCurrency(
        usage.discountAmount.toString()
      )
    );

    console.log(
      "Shipping Cost:",
      formatCurrency(
        order.shippingCost.toString()
      )
    );

    console.log(
      "Order Total:",
      formatCurrency(
        order.total.toString()
      )
    );

    console.log("");

    /**
     * ========================================================
     * VALIDATION
     * ========================================================
     */

    const isCancelled =
      order.status ===
      "CANCELLED";

    const isVerified =
      order.paymentStatus ===
      "VERIFIED";

    const voucherCodeValid =
      order.voucherCode ===
      voucher.code;

    const discountValid =
      order.voucherDiscount.equals(
        usage.discountAmount
      );

    const isTargetScenario =
      isCancelled &&
      isVerified;

    if (
      isTargetScenario
    ) {
      hasCancelledVerifiedOrder =
        true;
    }

    console.log(
      "VALIDATION"
    );

    console.log(
      "Order CANCELLED:",
      isCancelled
        ? "✅ VALID"
        : "⚠️ NOT CANCELLED"
    );

    console.log(
      "Payment VERIFIED:",
      isVerified
        ? "✅ VALID"
        : "⚠️ NOT VERIFIED"
    );

    console.log(
      "Voucher Code:",
      voucherCodeValid
        ? "✅ VALID"
        : "❌ INVALID"
    );

    console.log(
      "Discount:",
      discountValid
        ? "✅ VALID"
        : "❌ INVALID"
    );

    console.log(
      "VoucherUsage:",
      isTargetScenario
        ? "✅ RETAINED AFTER VERIFIED CANCEL"
        : "⚠️ NOT TARGET SCENARIO"
    );

    if (
      !voucherCodeValid ||
      !discountValid
    ) {
      hasInvalidUsage =
        true;
    }

    console.log("");
  }

  /**
   * ==========================================================
   * FINAL RESULT
   * ==========================================================
   */

  console.log(
    "========================================"
  );

  console.log(
    "FINAL RESULT"
  );

  console.log(
    "========================================"
  );

  console.log(
    hasCancelledVerifiedOrder
      ? "✅ Ditemukan order CANCELLED dengan payment VERIFIED dan VoucherUsage tetap ada."
      : "⚠️ Belum ditemukan order dengan kombinasi CANCELLED + VERIFIED."
  );

  console.log(
    usageCountValid
      ? "✅ usageCount konsisten."
      : "❌ usageCount tidak konsisten."
  );

  console.log(
    !hasInvalidUsage
      ? "✅ Snapshot voucher konsisten."
      : "❌ Ditemukan snapshot voucher tidak konsisten."
  );

  const success =
    hasCancelledVerifiedOrder &&
    usageCountValid &&
    !hasInvalidUsage;

  console.log("");

  console.log(
    success
      ? "🎉 VERIFIED CANCELLATION AUDIT BERHASIL"
      : "❌ VERIFIED CANCELLATION AUDIT BELUM LULUS"
  );

  console.log(
    "========================================"
  );

  if (!success) {
    process.exitCode =
      1;
  }
}

main()
  .catch(
    (error) => {
      console.error(
        "[CHECK_VERIFIED_CANCEL_VOUCHER_ERROR]",
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