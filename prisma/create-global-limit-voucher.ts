import {
  PrismaClient,
  VoucherDiscountType,
} from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ============================================================
 * CREATE GLOBAL USAGE LIMIT TEST VOUCHER
 * ============================================================
 */

async function main() {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "   CREATE GLOBAL LIMIT TEST VOUCHER"
  );
  console.log(
    "========================================"
  );
  console.log("");

  const code =
    "GLOBAL1";

  /**
   * ==========================================================
   * FIND EXISTING VOUCHER
   * ==========================================================
   */

  const existingVoucher =
    await prisma.voucher.findUnique({
      where: {
        code,
      },
    });

  if (existingVoucher) {
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
      existingVoucher.code
    );

    console.log(
      "Name:",
      existingVoucher.name
    );

    console.log(
      "Discount Type:",
      existingVoucher.discountType
    );

    console.log(
      "Discount Value:",
      existingVoucher.discountValue.toString()
    );

    console.log(
      "Usage Limit:",
      existingVoucher.usageLimit
    );

    console.log(
      "Usage Count:",
      existingVoucher.usageCount
    );

    console.log(
      "Per User Limit:",
      existingVoucher.perUserLimit
    );

    return;
  }

  /**
   * ==========================================================
   * CREATE VOUCHER
   * ==========================================================
   */

  const voucher =
    await prisma.voucher.create({
      data: {
        code,

        name:
          "Voucher Test Global 1 Kali",

        description:
          "Voucher untuk menguji global usageLimit.",

        isActive:
          true,

        discountType:
          VoucherDiscountType.FIXED_AMOUNT,

        discountValue:
          1000,

        minimumPurchase:
          null,

        maximumDiscount:
          null,

        startAt:
          new Date(),

        endAt:
          null,

        /**
         * ====================================================
         * GLOBAL LIMIT
         * ====================================================
         */

        usageLimit:
          1,

        usageCount:
          0,

        /**
         * ====================================================
         * PER USER LIMIT
         * ====================================================
         *
         * null berarti tidak dibatasi per user.
         */

        perUserLimit:
          null,
      },
    });

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
    "Discount Type:",
    voucher.discountType
  );

  console.log(
    "Discount Value:",
    voucher.discountValue.toString()
  );

  console.log(
    "Usage Limit:",
    voucher.usageLimit
  );

  console.log(
    "Usage Count:",
    voucher.usageCount
  );

  console.log(
    "Per User Limit:",
    voucher.perUserLimit
  );

  console.log(
    "Is Active:",
    voucher.isActive
  );

  console.log(
    "========================================"
  );
}

main()
  .catch(
    (error) => {
      console.error(
        "[CREATE_GLOBAL_LIMIT_VOUCHER_ERROR]",
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