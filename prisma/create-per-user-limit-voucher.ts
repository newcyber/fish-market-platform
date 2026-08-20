import {
  PrismaClient,
  VoucherDiscountType,
} from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ============================================================
 * CREATE PER USER LIMIT TEST VOUCHER
 * ============================================================
 */

async function main() {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "   CREATE PER USER LIMIT TEST VOUCHER"
  );
  console.log(
    "========================================"
  );
  console.log("");

  const code =
    "PERUSER1";

  /**
   * ==========================================================
   * DELETE EXISTING TEST VOUCHER
   * ==========================================================
   *
   * Agar script dapat dijalankan berulang kali.
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
      "Per User Limit:",
      existingVoucher.perUserLimit
    );

    console.log(
      "Usage Count:",
      existingVoucher.usageCount
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
          "Voucher Test 1 Kali per User",

        description:
          "Voucher untuk menguji perUserLimit.",

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

        usageLimit:
          null,

        usageCount:
          0,

        /**
         * ====================================================
         * IMPORTANT
         * ====================================================
         */

        perUserLimit:
          1,
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
    "Per User Limit:",
    voucher.perUserLimit
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
        "[CREATE_PER_USER_LIMIT_VOUCHER_ERROR]",
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