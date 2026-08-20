import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * VOUCHER FULL TRANSACTION CONCURRENCY TEST
 * ============================================================
 *
 * Menguji race condition pada:
 *
 * 1. Atomic voucher claim
 * 2. usageCount increment
 * 3. VoucherUsage creation
 * 4. Prisma transaction consistency
 *
 * Voucher:
 *
 * CONCURRENCY1
 *
 * Expected:
 *
 * Request A ─┐
 *            ├── hanya 1 transaction berhasil
 * Request B ─┘
 *
 * Final:
 *
 * usageCount = 1
 * VoucherUsage = 1
 * ============================================================
 */

const VOUCHER_CODE = "CONCURRENCY1";

interface TransactionResult {
  request: string;

  success: boolean;

  message: string;
}

/**
 * ============================================================
 * CLAIM VOUCHER INSIDE TRANSACTION
 * ============================================================
 */

async function executeTransaction(
  requestName: string,
  voucherId: string
): Promise<TransactionResult> {
  try {
    await prisma.$transaction(
      async (tx) => {
        /**
         * ======================================================
         * ATOMIC CLAIM
         * ======================================================
         *
         * Hanya berhasil jika:
         *
         * usageCount < usageLimit
         */

        const usageResult =
          await tx.voucher.updateMany({
            where: {
              id: voucherId,

              deletedAt: null,

              usageCount: {
                lt: 1,
              },
            },

            data: {
              usageCount: {
                increment: 1,
              },
            },
          });

        /**
         * ======================================================
         * CLAIM FAILED
         * ======================================================
         */

        if (
          usageResult.count !== 1
        ) {
          throw new Error(
            "VOUCHER_LIMIT_REACHED"
          );
        }

        /**
         * ======================================================
         * CREATE TEST VOUCHER USAGE
         * ======================================================
         *
         * Karena VoucherUsage membutuhkan:
         *
         * - voucherId
         * - userId
         * - orderId
         *
         * Kita tidak boleh membuat fake record sembarangan
         * yang melanggar foreign key.
         *
         * Maka untuk test ini kita menggunakan existing user
         * dan order khusus yang dibuat secara aman terlebih dahulu.
         */

        const testOrder =
          await tx.order.findFirst({
            where: {
              deletedAt: null,
            },

            select: {
              id: true,

              userId: true,
            },

            orderBy: {
              createdAt: "asc",
            },
          });

        if (!testOrder) {
          throw new Error(
            "TEST_ORDER_NOT_FOUND"
          );
        }

        /**
         * VoucherUsage memiliki:
         *
         * orderId @unique
         *
         * Maka kita perlu memastikan order yang dipakai
         * belum memiliki VoucherUsage.
         */

        const existingUsage =
          await tx.voucherUsage.findUnique({
            where: {
              orderId: testOrder.id,
            },

            select: {
              id: true,
            },
          });

        if (existingUsage) {
          /**
           * Cari order lain yang belum memiliki VoucherUsage.
           */

          const alternativeOrder =
            await tx.order.findFirst({
              where: {
                deletedAt: null,

                voucherUsage: null,
              },

              select: {
                id: true,

                userId: true,
              },

              orderBy: {
                createdAt: "asc",
              },
            });

          if (!alternativeOrder) {
            throw new Error(
              "TEST_ORDER_WITHOUT_VOUCHER_USAGE_NOT_FOUND"
            );
          }

          await tx.voucherUsage.create({
            data: {
              voucherId,

              userId:
                alternativeOrder.userId,

              orderId:
                alternativeOrder.id,

              discountAmount:
                1000,
            },
          });

          return;
        }

        /**
         * ======================================================
         * CREATE VOUCHER USAGE
         * ======================================================
         */

        await tx.voucherUsage.create({
          data: {
            voucherId,

            userId:
              testOrder.userId,

            orderId:
              testOrder.id,

            discountAmount:
              1000,
          },
        });
      }
    );

    return {
      request: requestName,

      success: true,

      message:
        "Transaction berhasil mengklaim voucher dan membuat VoucherUsage.",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    if (
      message ===
      "VOUCHER_LIMIT_REACHED"
    ) {
      return {
        request: requestName,

        success: false,

        message:
          "Voucher sudah mencapai batas penggunaan.",
      };
    }

    return {
      request: requestName,

      success: false,

      message,
    };
  }
}

/**
 * ============================================================
 * MAIN
 * ============================================================
 */

async function main() {
  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    " VOUCHER FULL TRANSACTION CONCURRENCY TEST"
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

  console.log("VOUCHER");

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
    "Usage Count Before:",
    voucher.usageCount
  );

  /**
   * ==========================================================
   * VALIDATE INITIAL STATE
   * ==========================================================
   */

  const initialUsageCount =
    await prisma.voucherUsage.count({
      where: {
        voucherId: voucher.id,
      },
    });

  console.log(
    "VoucherUsage Before:",
    initialUsageCount
  );

  if (
    voucher.usageLimit !== 1
  ) {
    throw new Error(
      "Voucher harus memiliki usageLimit = 1."
    );
  }

  if (
    voucher.usageCount !== 0
  ) {
    throw new Error(
      `Voucher harus memiliki usageCount = 0. Current: ${voucher.usageCount}`
    );
  }

  if (
    initialUsageCount !== 0
  ) {
    throw new Error(
      `VoucherUsage harus 0. Current: ${initialUsageCount}`
    );
  }

  /**
   * ==========================================================
   * START CONCURRENT TRANSACTIONS
   * ==========================================================
   */

  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    " STARTING 2 CONCURRENT TRANSACTIONS"
  );

  console.log(
    "========================================"
  );

  console.log("");

  const results =
    await Promise.all([
      executeTransaction(
        "TRANSACTION A",
        voucher.id
      ),

      executeTransaction(
        "TRANSACTION B",
        voucher.id
      ),
    ]);

  /**
   * ==========================================================
   * DISPLAY RESULTS
   * ==========================================================
   */

  console.log("RESULTS");

  console.log(
    "----------------------------------------"
  );

  for (
    const result of results
  ) {
    console.log(
      `${result.request}:`,
      result.success
        ? "✅ SUCCESS"
        : "❌ FAILED"
    );

    console.log(
      "Message:",
      result.message
    );

    console.log("");
  }

  /**
   * ==========================================================
   * FINAL AUDIT
   * ==========================================================
   */

  const finalVoucher =
    await prisma.voucher.findUnique({
      where: {
        id: voucher.id,
      },

      select: {
        usageCount: true,

        usageLimit: true,
      },
    });

  const actualUsageCount =
    await prisma.voucherUsage.count({
      where: {
        voucherId: voucher.id,
      },
    });

  if (!finalVoucher) {
    throw new Error(
      "Voucher hilang setelah test."
    );
  }

  const successCount =
    results.filter(
      (result) =>
        result.success
    ).length;

  const failedCount =
    results.filter(
      (result) =>
        !result.success
    ).length;

  /**
   * ==========================================================
   * VALIDATION
   * ==========================================================
   */

  const exactlyOneSuccess =
    successCount === 1;

  const exactlyOneFailed =
    failedCount === 1;

  const usageCountValid =
    finalVoucher.usageCount === 1;

  const voucherUsageValid =
    actualUsageCount === 1;

  const consistencyValid =
    finalVoucher.usageCount ===
    actualUsageCount;

  console.log(
    "========================================"
  );

  console.log(
    "             FINAL AUDIT"
  );

  console.log(
    "========================================"
  );

  console.log("");

  console.log(
    "Usage Limit:",
    finalVoucher.usageLimit
  );

  console.log(
    "Stored Usage Count:",
    finalVoucher.usageCount
  );

  console.log(
    "Actual VoucherUsage:",
    actualUsageCount
  );

  console.log(
    "Successful Transactions:",
    successCount
  );

  console.log(
    "Failed Transactions:",
    failedCount
  );

  console.log("");

  console.log("VALIDATION");

  console.log(
    "----------------------------------------"
  );

  console.log(
    "Exactly 1 Success:",
    exactlyOneSuccess
      ? "✅ VALID"
      : "❌ INVALID"
  );

  console.log(
    "Exactly 1 Failed:",
    exactlyOneFailed
      ? "✅ VALID"
      : "❌ INVALID"
  );

  console.log(
    "Usage Count = 1:",
    usageCountValid
      ? "✅ VALID"
      : "❌ INVALID"
  );

  console.log(
    "VoucherUsage = 1:",
    voucherUsageValid
      ? "✅ VALID"
      : "❌ INVALID"
  );

  console.log(
    "Counter Consistency:",
    consistencyValid
      ? "✅ VALID"
      : "❌ INVALID"
  );

  /**
   * ==========================================================
   * FINAL RESULT
   * ==========================================================
   */

  const success =
    exactlyOneSuccess &&
    exactlyOneFailed &&
    usageCountValid &&
    voucherUsageValid &&
    consistencyValid;

  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    success
      ? "🎉 FULL TRANSACTION CONCURRENCY TEST BERHASIL"
      : "❌ FULL TRANSACTION CONCURRENCY TEST GAGAL"
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
        "[VOUCHER_TRANSACTION_CONCURRENCY_TEST_ERROR]",
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