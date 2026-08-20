import {
  VoucherDiscountType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * CREATE CONCURRENCY TEST VOUCHER
 * ============================================================
 *
 * Voucher khusus untuk audit race condition.
 *
 * Global usage limit:
 *
 * 1
 *
 * Artinya walaupun ada beberapa request berjalan bersamaan,
 * hanya satu penggunaan yang boleh berhasil.
 * ============================================================
 */

async function main() {
  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "     CREATE CONCURRENCY TEST VOUCHER"
  );

  console.log(
    "========================================"
  );

  console.log("");

  const code =
    "CONCURRENCY1";

  /**
   * Cari voucher existing.
   */

  const existing =
    await prisma.voucher.findUnique({
      where: {
        code,
      },

      select: {
        id: true,

        code: true,

        name: true,

        usageLimit: true,

        usageCount: true,
      },
    });

  /**
   * Jika sudah ada, gunakan voucher tersebut.
   */

  if (existing) {
    console.log(
      `⚠️ Voucher ${code} sudah ada.`
    );

    console.log(
      "Menggunakan voucher yang sudah ada."
    );

    console.log("");

    console.log(
      "========================================"
    );

    console.log(
      "VOUCHER TEST SIAP"
    );

    console.log(
      "========================================"
    );

    console.log(
      "Code:",
      existing.code
    );

    console.log(
      "Name:",
      existing.name
    );

    console.log(
      "Usage Limit:",
      existing.usageLimit
    );

    console.log(
      "Usage Count:",
      existing.usageCount
    );

    return;
  }

  /**
   * Buat voucher baru.
   */

  const voucher =
    await prisma.voucher.create({
      data: {
        code,

        name:
          "Voucher Concurrency Test",

        description:
          "Voucher khusus audit race condition",

        isActive:
          true,

        discountType:
          VoucherDiscountType.FIXED_AMOUNT,

        discountValue:
          1000,

        usageLimit:
          1,

        usageCount:
          0,

        perUserLimit:
          null,
      },

      select: {
        id: true,

        code: true,

        name: true,

        usageLimit: true,

        usageCount: true,
      },
    });

  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "VOUCHER TEST BERHASIL DIBUAT"
  );

  console.log(
    "========================================"
  );

  console.log(
    "ID:",
    voucher.id
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
    "Usage Limit:",
    voucher.usageLimit
  );

  console.log(
    "Usage Count:",
    voucher.usageCount
  );
}

main()
  .catch(
    (error) => {
      console.error(
        "[CREATE_CONCURRENCY_VOUCHER_ERROR]",
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