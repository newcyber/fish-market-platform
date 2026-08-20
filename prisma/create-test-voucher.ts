import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const voucher = await prisma.voucher.upsert({
    where: {
      code: "HEMAT10",
    },

    update: {
      name: "Diskon 10%",
      description:
        "Voucher test diskon 10% untuk checkout",

      isActive: true,

      discountType: "PERCENTAGE",

      discountValue: 10,

      minimumPurchase: 0,

      maximumDiscount: 100000,

      startAt: null,

      endAt: null,

      usageLimit: null,

      perUserLimit: null,

      deletedAt: null,
    },

    create: {
      code: "HEMAT10",

      name: "Diskon 10%",

      description:
        "Voucher test diskon 10% untuk checkout",

      isActive: true,

      discountType: "PERCENTAGE",

      discountValue: 10,

      minimumPurchase: 0,

      maximumDiscount: 100000,

      startAt: null,

      endAt: null,

      usageLimit: null,

      usageCount: 0,

      perUserLimit: null,

      deletedAt: null,
    },
  });

  console.log("=================================");
  console.log("VOUCHER TEST BERHASIL DIBUAT");
  console.log("=================================");
  console.log("ID:", voucher.id);
  console.log("Code:", voucher.code);
  console.log("Name:", voucher.name);
  console.log("Discount Type:", voucher.discountType);
  console.log("Discount Value:", voucher.discountValue.toString());
  console.log("Is Active:", voucher.isActive);
  console.log("Usage Count:", voucher.usageCount);
  console.log("=================================");
}

main()
  .catch((error) => {
    console.error(
      "[CREATE_TEST_VOUCHER_ERROR]",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });