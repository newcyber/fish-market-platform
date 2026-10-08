import { prisma } from "../src/lib/prisma";
import ProductPhysicalInventoryAdminService from "../src/services/product/product-physical-inventory-admin.service";

const ROLLBACK = "__ROLLBACK_ADMIN_PHYSICAL_INVENTORY_TEST__";

async function main() {
  const pool = await prisma.productInventoryPool.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      productId: true,
      stockGrams: true,
      sizeVariantOptionId: true,
    },
  });

  if (!pool) {
    throw new Error("Tidak ada ProductInventoryPool untuk test.");
  }

  const initial = pool.stockGrams;

  try {
    await prisma.$transaction(async (tx) => {
      const add = await ProductPhysicalInventoryAdminService.adjust(
        {
          productId: pool.productId,
          adjustments: [
            {
              poolId: pool.id,
              quantityGrams: 1000,
              note: "TEST admin adjustment +1000g",
            },
          ],
        },
        "TEST_ADMIN",
        tx,
      );

      const afterAdd = await tx.productInventoryPool.findUniqueOrThrow({
        where: { id: pool.id },
        select: { stockGrams: true },
      });

      if (afterAdd.stockGrams !== initial + 1000) {
        throw new Error(
          `Tambah stok gagal: expected ${initial + 1000}, got ${afterAdd.stockGrams}`,
        );
      }

      const remove = await ProductPhysicalInventoryAdminService.adjust(
        {
          productId: pool.productId,
          adjustments: [
            {
              poolId: pool.id,
              quantityGrams: -400,
              note: "TEST admin adjustment -400g",
            },
          ],
        },
        "TEST_ADMIN",
        tx,
      );

      const afterRemove = await tx.productInventoryPool.findUniqueOrThrow({
        where: { id: pool.id },
        select: { stockGrams: true },
      });

      if (afterRemove.stockGrams !== initial + 600) {
        throw new Error(
          `Pengurangan stok gagal: expected ${initial + 600}, got ${afterRemove.stockGrams}`,
        );
      }

      let negativeRejected = false;

      try {
        await ProductPhysicalInventoryAdminService.adjust(
          {
            productId: pool.productId,
            adjustments: [
              {
                poolId: pool.id,
                quantityGrams: -(initial + 10000),
                note: "TEST negative stock rejection",
              },
            ],
          },
          "TEST_ADMIN",
          tx,
        );
      } catch (error) {
        negativeRejected =
          error instanceof Error &&
          error.message.includes("tidak boleh negatif");
      }

      if (!negativeRejected) {
        throw new Error("Negative stock adjustment tidak ditolak.");
      }

      const afterRejected = await tx.productInventoryPool.findUniqueOrThrow({
        where: { id: pool.id },
        select: { stockGrams: true },
      });

      if (afterRejected.stockGrams !== initial + 600) {
        throw new Error(
          `Pool berubah setelah adjustment ditolak: ${afterRejected.stockGrams}`,
        );
      }

      const ledgers = await tx.productInventoryPoolLedger.count({
        where: {
          poolId: pool.id,
          actorUserId: "TEST_ADMIN",
          type: "ADMIN_ADJUSTMENT",
        },
      });

      if (ledgers !== 2) {
        throw new Error(
          `Expected 2 admin ledgers sebelum rollback, got ${ledgers}`,
        );
      }

      throw new Error(ROLLBACK);
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== ROLLBACK) {
      throw error;
    }
  }

  const finalPool = await prisma.productInventoryPool.findUniqueOrThrow({
    where: { id: pool.id },
    select: { stockGrams: true },
  });

  const finalLedgers = await prisma.productInventoryPoolLedger.count({
    where: {
      poolId: pool.id,
      actorUserId: "TEST_ADMIN",
      type: "ADMIN_ADJUSTMENT",
    },
  });

  if (finalPool.stockGrams !== initial) {
    throw new Error(
      `Rollback gagal: pool ${finalPool.stockGrams}, expected ${initial}`,
    );
  }

  if (finalLedgers !== 0) {
    throw new Error(
      `Rollback audit ledger gagal: masih ada ${finalLedgers} ledger test.`,
    );
  }

  console.log("ADMIN PHYSICAL INVENTORY TEST PASSED.");
  console.log(`Pool tested: ${pool.id}`);
  console.log(`Initial stock: ${initial} gram`);
  console.log("+1000g PASS");
  console.log("-400g PASS");
  console.log("Negative stock rejection PASS");
  console.log("Transaction rollback PASS");
  console.log("Database production tidak berubah.");
}

main()
  .catch((error) => {
    console.error("ADMIN PHYSICAL INVENTORY TEST FAILED.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
