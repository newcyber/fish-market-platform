import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * RESET CONCURRENCY TEST VOUCHER
 * ============================================================
 *
 * Script ini hanya digunakan untuk voucher:
 *
 * CONCURRENCY1
 *
 * Sebelum menjalankan full transaction concurrency test,
 * kondisi harus:
 *
 * usageCount = 0
 * VoucherUsage = 0
 * ============================================================
 */

const VOUCHER_CODE = "CONCURRENCY1";

async function main() {
  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "     RESET CONCURRENCY TEST VOUCHER"
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

  console.log("VOUCHER BEFORE RESET");

  console.log(
    "----------------------------------------"
  );

  console.log(
    "Code:",
    voucher.code
  );

  console.log(
    "Usage Limit:",
    voucher.usageLimit
  );

  console.log(
    "Usage Count:",
    voucher.usageCount
  );

  /**
   * ==========================================================
   * RESET INSIDE TRANSACTION
   * ==========================================================
   *
   * Hapus VoucherUsage khusus voucher test ini terlebih dahulu,
   * lalu reset usageCount menjadi 0.
   *
   * Order test sebelumnya tidak disentuh.
   */

  const result =
    await prisma.$transaction(
      async (tx) => {
        const deletedUsages =
          await tx.voucherUsage.deleteMany({
            where: {
              voucherId: voucher.id,
            },
          });

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
              usageLimit: true,
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
   * VERIFY FINAL STATE
   * ==========================================================
   */

  const actualUsageCount =
    await prisma.voucherUsage.count({
      where: {
        voucherId: voucher.id,
      },
    });

  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "       VOUCHER AFTER RESET"
  );

  console.log(
    "========================================"
  );

  console.log("");

  console.log(
    "Code:",
    result.voucher.code
  );

  console.log(
    "Usage Limit:",
    result.voucher.usageLimit
  );

  console.log(
    "Usage Count:",
    result.voucher.usageCount
  );

  console.log(
    "VoucherUsage Deleted:",
    result.deletedUsageCount
  );

  console.log(
    "Actual VoucherUsage:",
    actualUsageCount
  );

  const usageCountValid =
    result.voucher.usageCount === 0;

  const voucherUsageValid =
    actualUsageCount === 0;

  console.log("");

  console.log("VALIDATION");

  console.log(
    "----------------------------------------"
  );

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

  console.log(
    "========================================"
  );

  console.log(
    success
      ? "🎉 RESET BERHASIL"
      : "❌ RESET GAGAL"
  );

  console.log(
    "========================================"
  );

  if (!success) {
    process.exitCode = 1;
  }
}

main()
  .catch(
    (error) => {
      console.error(
        "[RESET_CONCURRENCY_VOUCHER_ERROR]",
        error
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );