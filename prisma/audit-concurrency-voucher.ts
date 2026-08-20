import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * CONCURRENCY VOUCHER AUDIT
 * ============================================================
 *
 * Audit khusus voucher test:
 *
 * CONCURRENCY1
 *
 * Memastikan:
 *
 * - Voucher ditemukan
 * - usageCount konsisten dengan VoucherUsage
 * - Menampilkan order yang terkena test
 * - Menampilkan user pemilik order
 *
 * Script ini READ ONLY.
 * Tidak mengubah database.
 * ============================================================
 */

const VOUCHER_CODE = "CONCURRENCY1";

async function main() {
  console.log("");

  console.log("========================================");
  console.log("       CONCURRENCY VOUCHER AUDIT");
  console.log("========================================");

  console.log("");

  const voucher = await prisma.voucher.findUnique({
    where: {
      code: VOUCHER_CODE,
    },

    select: {
      id: true,
      code: true,
      name: true,
      usageLimit: true,
      usageCount: true,
    },
  });

  if (!voucher) {
    throw new Error(
      `Voucher ${VOUCHER_CODE} tidak ditemukan.`
    );
  }

  const usages = await prisma.voucherUsage.findMany({
    where: {
      voucherId: voucher.id,
    },

    select: {
      id: true,
      discountAmount: true,
      usedAt: true,

      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          subtotal: true,
          voucherId: true,
          voucherCode: true,
          voucherName: true,
          voucherDiscount: true,
          total: true,
        },
      },

      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },

    orderBy: {
      usedAt: "asc",
    },
  });

  console.log("VOUCHER");

  console.log("----------------------------------------");

  console.log("ID:", voucher.id);
  console.log("Code:", voucher.code);
  console.log("Name:", voucher.name);
  console.log("Usage Limit:", voucher.usageLimit);
  console.log("Stored Usage Count:", voucher.usageCount);
  console.log("Actual VoucherUsage:", usages.length);

  console.log("");

  console.log("VOUCHER USAGE RECORDS");

  console.log("----------------------------------------");

  if (usages.length === 0) {
    console.log("Tidak ada VoucherUsage.");
  }

  for (const usage of usages) {
    console.log("");

    console.log("Usage ID:", usage.id);
    console.log("Discount Amount:", usage.discountAmount.toString());
    console.log("Used At:", usage.usedAt.toISOString());

    console.log("");

    console.log("USER");
    console.log("User ID:", usage.user.id);
    console.log("Email:", usage.user.email);

    console.log("");

    console.log("ORDER");
    console.log("Order ID:", usage.order.id);
    console.log("Order Number:", usage.order.orderNumber);
    console.log("Status:", usage.order.status);
    console.log("Payment Status:", usage.order.paymentStatus);
    console.log("Subtotal:", usage.order.subtotal.toString());
    console.log("Voucher Code:", usage.order.voucherCode ?? "-");
    console.log(
      "Voucher Discount:",
      usage.order.voucherDiscount.toString()
    );
    console.log("Total:", usage.order.total.toString());

    console.log("");
    console.log("----------------------------------------");
  }

  const counterValid =
    voucher.usageCount === usages.length;

  console.log("");

  console.log("VALIDATION");

  console.log("----------------------------------------");

  console.log(
    "Counter Consistency:",
    counterValid
      ? "✅ VALID"
      : "❌ INVALID"
  );

  console.log("");

  console.log("========================================");

  console.log(
    counterValid
      ? "🎉 AUDIT SELESAI"
      : "⚠️ COUNTER TIDAK KONSISTEN"
  );

  console.log("========================================");

  if (!counterValid) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(
      "[AUDIT_CONCURRENCY_VOUCHER_ERROR]",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });