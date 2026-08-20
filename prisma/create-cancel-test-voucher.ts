import {
  PrismaClient,
  VoucherDiscountType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "   CREATE CANCEL TEST VOUCHER"
  );
  console.log(
    "========================================"
  );
  console.log("");

  const code =
    "CANCELTEST";

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
      "Usage Count:",
      existingVoucher.usageCount
    );

    console.log(
      "Usage Limit:",
      existingVoucher.usageLimit
    );

    console.log(
      "Per User Limit:",
      existingVoucher.perUserLimit
    );

    return;
  }

  const voucher =
    await prisma.voucher.create({
      data: {
        code,

        name:
          "Voucher Test Cancellation",

        description:
          "Voucher untuk menguji release voucher saat order dibatalkan.",

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
    "Usage Count:",
    voucher.usageCount
  );

  console.log(
    "========================================"
  );
}

main()
  .catch(
    (error) => {
      console.error(
        "[CREATE_CANCEL_TEST_VOUCHER_ERROR]",
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