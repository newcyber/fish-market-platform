import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const sku = await prisma.productSku.findUnique({
    where: {
      sku: "TEST-TUNA-500GR",
    },
    select: {
      id: true,
      sku: true,
      productId: true,
    },
  });

  console.log("\n=== SKU ===");
  console.dir(sku, { depth: null });

  if (sku === null) {
    console.log("SKU TEST-TUNA-500GR tidak ditemukan.");
    return;
  }

  const items = await prisma.flashSaleItem.findMany({
    where: {
      OR: [
        {
          skuId: sku.id,
        },
        {
          productId: sku.productId,
          skuId: null,
        },
      ],
    },
    select: {
      id: true,
      flashSaleId: true,
      skuId: true,
      flashPrice: true,
      stockLimit: true,
      soldQuantity: true,
      isActive: true,

      flashSale: {
        select: {
          name: true,
          status: true,
          startAt: true,
          endAt: true,
          deletedAt: true,
          sortOrder: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log("\n=== FLASH SALE ITEMS UNTUK SKU ===");
  console.dir(items, { depth: null });

  console.log("\n=== TOTAL ===");
  console.log(`Found ${items.length} FlashSaleItem(s).`);
}

run()
  .catch((error) => {
    console.error("\nERROR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
