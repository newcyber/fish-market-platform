import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * SAFE CLEANUP CONCURRENCY TEST VOUCHER
 * ============================================================
 *
 * Voucher:
 * CONCURRENCY1
 *
 * Cleanup:
 * 1. Hapus VoucherUsage khusus CONCURRENCY1
 * 2. Reset usageCount menjadi 0
 *
 * IMPORTANT:
 * - Tidak menghapus Order
 * - Tidak mengubah User
 * - Tidak mengubah snapshot Order
 * ============================================================
 */

const VOUCHER_CODE = "CONCURRENCY1";

async function main() {
  console.log("");

  console.log("========================================");
  console.log("    SAFE CONCURRENCY VOUCHER CLEANUP");
  console.log("========================================");

  console.log("");

  /**
   * ==========================================================
   * FIND VOUCHER
   * ==========================================================
   */

  const voucher = await prisma.voucher.findUnique({
    where: {
      code: VOUCHER_CODE,
    },

    select: {
      id: true,
      code: true,
      usageLimit: true,
      usageCount: true,
    },
  });

  if (!voucher) {
    throw new Error(
      `Voucher ${VOUCHER_CODE} tidak ditemukan.`
    );
  }

  const usagesBefore =
    await prisma.voucherUsage.findMany({
      where: {
        voucherId: voucher.id,
      },

      select: {
        id: true,
        orderId: true,
      },
    });

  console.log("BEFORE CLEANUP");

  console.log("----------------------------------------");

  console.log("Code:", voucher.code);

  console.log(
    "Stored Usage Count:",
    voucher.usageCount
  );

  console.log(
    "Actual VoucherUsage:",
    usagesBefore.length
  );

  for (const usage of usagesBefore) {
    console.log("");
    console.log("VoucherUsage ID:", usage.id);
    console.log("Order ID:", usage.orderId);
  }

  /**
   * ==========================================================
   * CLEANUP TRANSACTION
   * ==========================================================
   */

  const result =
    await prisma.$transaction(
      async (tx) => {
        /**
         * Hapus hanya VoucherUsage
         * yang menggunakan CONCURRENCY1.
         */

        const deletedUsages =
          await tx.voucherUsage.deleteMany({
            where: {
              voucherId: voucher.id,
            },
          });

        /**
         * Reset counter voucher.
         */

        const updatedVoucher =
          await tx.voucher.update({
            where: {
              id: voucher.id,
            },

            data: {
              usageCount: 0,
            },

            select: {
              id: true,
              code: true,
              usageCount: true,
            },
          });

        return {
          deletedUsageCount:
            deletedUsages.count,

          voucher:
            updatedVoucher,
        };
      }
    );

  /**
   * ==========================================================
   * FINAL AUDIT
   * ==========================================================
   */

  const finalUsageCount =
    await prisma.voucherUsage.count({
      where: {
        voucherId: voucher.id,
      },
    });

  const finalVoucher =
    await prisma.voucher.findUnique({
      where: {
        id: voucher.id,
      },

      select: {
        usageCount: true,
      },
    });

  if (!finalVoucher) {
    throw new Error(
      "Voucher tidak ditemukan setelah cleanup."
    );
  }

  const usageCountValid =
    finalVoucher.usageCount === 0;

  const voucherUsageValid =
    finalUsageCount === 0;

  console.log("");

  console.log("========================================");
  console.log("          AFTER CLEANUP");
  console.log("========================================");

  console.log("");

  console.log(
    "VoucherUsage Deleted:",
    result.deletedUsageCount
  );

  console.log(
    "Stored Usage Count:",
    finalVoucher.usageCount
  );

  console.log(
    "Actual VoucherUsage:",
    finalUsageCount
  );

  console.log("");

  console.log("VALIDATION");

  console.log("----------------------------------------");

  console.log(
    "Usage Count = 0:",
    usageCountValid
      ? "✅ VALID"
      : "❌ INVALID"
  );

  console.log(
    "VoucherUsage = 0:",
    voucherUsageValid
      ? "✅ VALID"
      : "❌ INVALID"
  );

  const success =
    usageCountValid &&
    voucherUsageValid;

  console.log("");

  console.log("========================================");

  console.log(
    success
      ? "🎉 CONCURRENCY TEST CLEANUP BERHASIL"
      : "❌ CONCURRENCY TEST CLEANUP GAGAL"
  );

  console.log("========================================");

  if (!success) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(
      "[CLEANUP_CONCURRENCY_VOUCHER_ERROR]",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });