import {
  PrismaClient,
  VoucherDiscountType,
} from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ============================================================
 * FORMAT CURRENCY
 * ============================================================
 */

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

/**
 * ============================================================
 * MAIN
 * ============================================================
 */

async function main() {
  const voucherCode =
    "HEMAT10";

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "       VOUCHER ORDER AUDIT"
  );
  console.log(
    "========================================"
  );
  console.log("");

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
          orderBy: {
            usedAt:
              "desc",
          },

          include: {
            order: {
              select: {
                id: true,

                orderNumber: true,

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
        },
      },
    });

  if (!voucher) {
    console.log(
      `❌ Voucher ${voucherCode} tidak ditemukan.`
    );

    return;
  }

  /**
   * ==========================================================
   * VOUCHER INFORMATION
   * ==========================================================
   */

  console.log("VOUCHER");
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
    "Discount Type:",
    voucher.discountType
  );

  console.log(
    "Discount Value:",
    voucher.discountValue.toString()
  );

  console.log(
    "Usage Count:",
    voucher.usageCount
  );

  console.log(
    "Actual Usage Records:",
    voucher.usages.length
  );

  console.log("");

  /**
   * ==========================================================
   * VALIDATE USAGE COUNT
   * ==========================================================
   */

  if (
    voucher.usageCount ===
    voucher.usages.length
  ) {
    console.log(
      "✅ usageCount sesuai dengan VoucherUsage."
    );
  } else {
    console.log(
      "⚠️ usageCount TIDAK sesuai dengan jumlah VoucherUsage."
    );
  }

  console.log("");

  /**
   * ==========================================================
   * VOUCHER USAGE RECORDS
   * ==========================================================
   */

  if (
    voucher.usages.length === 0
  ) {
    console.log(
      "❌ Belum ada VoucherUsage untuk voucher ini."
    );

    return;
  }

  console.log(
    "VOUCHER USAGE RECORDS"
  );

  console.log(
    "----------------------------------------"
  );

  for (
    const usage of
    voucher.usages
  ) {
    const order =
      usage.order;

    /**
     * ========================================================
     * ACTUAL ORDER VALUES
     * ========================================================
     */

    const subtotal =
      order.subtotal.toNumber();

    const voucherDiscount =
      order.voucherDiscount.toNumber();

    const shippingCost =
      order.shippingCost.toNumber();

    const total =
      order.total.toNumber();

    /**
     * ========================================================
     * CALCULATE EXPECTED DISCOUNT
     * ========================================================
     */

    let expectedDiscount =
      0;

    if (
      voucher.discountType ===
      VoucherDiscountType.PERCENTAGE
    ) {
      expectedDiscount =
        subtotal *
        (
          voucher.discountValue.toNumber() /
          100
        );

      /**
       * Apply maximum discount.
       */

      if (
        voucher.maximumDiscount !== null
      ) {
        expectedDiscount =
          Math.min(
            expectedDiscount,
            voucher.maximumDiscount.toNumber()
          );
      }
    }

    if (
      voucher.discountType ===
      VoucherDiscountType.FIXED_AMOUNT
    ) {
      expectedDiscount =
        voucher.discountValue.toNumber();
    }

    /**
     * Discount tidak boleh lebih besar
     * dari subtotal order.
     */

    expectedDiscount =
      Math.min(
        expectedDiscount,
        subtotal
      );

    /**
     * Pembulatan mengikuti nominal
     * mata uang yang digunakan sistem.
     */

    expectedDiscount =
      Math.round(
        expectedDiscount
      );

    /**
     * ========================================================
     * CALCULATE EXPECTED TOTAL
     * ========================================================
     */

    const expectedTotal =
      subtotal -
      expectedDiscount +
      shippingCost;

    /**
     * ========================================================
     * VALIDATE DATA
     * ========================================================
     */

    const voucherCodeValid =
      order.voucherCode ===
      voucher.code;

    const discountValid =
      Math.abs(
        voucherDiscount -
        expectedDiscount
      ) < 0.01;

    const usageDiscountValid =
      Math.abs(
        usage.discountAmount.toNumber() -
        voucherDiscount
      ) < 0.01;

    const totalValid =
      Math.abs(
        total -
        expectedTotal
      ) < 0.01;

    /**
     * ========================================================
     * OUTPUT
     * ========================================================
     */

    console.log("");

    console.log(
      "Usage ID:",
      usage.id
    );

    console.log(
      "User ID:",
      usage.userId
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
      usage.usedAt
    );

    console.log("");

    console.log(
      "ORDER SNAPSHOT"
    );

    console.log(
      "Subtotal:",
      formatCurrency(
        subtotal
      )
    );

    console.log(
      "Voucher Code:",
      order.voucherCode
    );

    console.log(
      "Voucher Name:",
      order.voucherName
    );

    console.log(
      "Voucher Discount:",
      formatCurrency(
        voucherDiscount
      )
    );

    console.log(
      "VoucherUsage Discount:",
      formatCurrency(
        usage.discountAmount.toNumber()
      )
    );

    console.log(
      "Shipping Cost:",
      formatCurrency(
        shippingCost
      )
    );

    console.log(
      "Total:",
      formatCurrency(
        total
      )
    );

    console.log("");

    console.log(
      "EXPECTED CALCULATION"
    );

    console.log(
      "Expected Discount:",
      formatCurrency(
        expectedDiscount
      )
    );

    console.log(
      "Expected Total:",
      formatCurrency(
        expectedTotal
      )
    );

    console.log("");

    console.log(
      "VALIDATION"
    );

    console.log(
      "Voucher Code:",
      voucherCodeValid
        ? "✅ VALID"
        : "❌ INVALID"
    );

    console.log(
      "Order Discount:",
      discountValid
        ? "✅ VALID"
        : "❌ INVALID"
    );

    console.log(
      "VoucherUsage Discount:",
      usageDiscountValid
        ? "✅ VALID"
        : "❌ INVALID"
    );

    console.log(
      "Order Total:",
      totalValid
        ? "✅ VALID"
        : "❌ INVALID"
    );

    console.log(
      "----------------------------------------"
    );
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
    "          AUDIT SELESAI"
  );

  console.log(
    "========================================"
  );
}

/**
 * ============================================================
 * EXECUTION
 * ============================================================
 */

main()
  .catch(
    (error) => {
      console.error(
        "[CHECK_VOUCHER_ORDER_ERROR]",
        error
      );

      process.exit(1);
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );