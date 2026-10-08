import { prisma } from "../src/lib/prisma";
import { ProductPhysicalInventoryService } from "../src/services/product/product-physical-inventory.service";
import { parseWeightLabelToGrams } from "../src/services/reward-point/reward-point.service";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

async function main() {
  const productName = "Udang Vaname Kualitas Ekspor";

  const product = await prisma.product.findFirst({
    where: { name: productName, deletedAt: null },
    select: {
      id: true,
      name: true,
      inventoryPools: {
        select: {
          id: true,
          sizeVariantOptionId: true,
          stockGrams: true,
          sizeVariantOption: { select: { label: true } },
        },
      },
      skus: {
        where: { isActive: true },
        select: {
          id: true,
          sku: true,
          skuOptions: {
            select: {
              variantOption: {
                select: {
                  id: true,
                  label: true,
                  group: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  assert(product, `Product "${productName}" tidak ditemukan.`);
  assert(product.inventoryPools.length > 0, "Product belum mempunyai inventory pool.");

  const skuInfo = product.skus.map((sku) => {
    const size = sku.skuOptions.find(
      (x) => x.variantOption.group.name.trim().toLowerCase() === "ukuran",
    );
    const weight = sku.skuOptions.find(
      (x) => x.variantOption.group.name.trim().toLowerCase() === "berat",
    );

    return {
      ...sku,
      sizeOptionId: size?.variantOption.id ?? null,
      sizeLabel: size?.variantOption.label ?? null,
      weightGrams: weight ? parseWeightLabelToGrams(weight.variantOption.label) : null,
    };
  });

  const oneKg = skuInfo.find((x) => x.weightGrams === 1000 && x.sizeOptionId);
  assert(oneKg, "SKU 1 Kg yang terhubung ke inventory pool tidak ditemukan.");

  const pool = product.inventoryPools.find(
    (candidate) => candidate.sizeVariantOptionId === oneKg.sizeOptionId,
  );
  assert(pool, "Pool untuk SKU 1 Kg tidak ditemukan.");

  const initialStock = pool.stockGrams;
  assert(initialStock >= 1000, `Pool ${pool.sizeVariantOption.label} hanya ${initialStock}g; test membutuhkan >= 1000g.`);

  // Each concurrent checkout asks for more than half of the pool.
  // Therefore exactly one can succeed, while the other must fail atomically.
  const quantityEach = Math.max(1, Math.floor(initialStock / 1000 / 2) + 1);
  const requiredEachGrams = quantityEach * 1000;
  assert(requiredEachGrams <= initialStock, "Test quantity melebihi stok awal pool.");
  assert(requiredEachGrams * 2 > initialStock, "Test tidak membentuk contention yang cukup.");

  const baseOrderNumber = `TEST-PHYSICAL-CONCURRENCY-${Date.now()}`;
  const orderA = `${baseOrderNumber}-A`;
  const orderB = `${baseOrderNumber}-B`;

  console.log(`Product       : ${product.name}`);
  console.log(`Pool          : ${pool.sizeVariantOption.label}`);
  console.log(`Initial       : ${initialStock}g`);
  console.log(`SKU           : ${oneKg.sku}`);
  console.log(`Quantity/test : ${quantityEach} x 1kg = ${requiredEachGrams}g`);
  console.log(`Order A       : ${orderA}`);
  console.log(`Order B       : ${orderB}`);
  console.log("");

  let results: Array<{ orderNumber: string; success: boolean; error?: string }> = [];

  try {
    // Run two independent Prisma transactions concurrently. They must not share
    // a transaction client; otherwise there is no real database contention.
    results = await Promise.all(
      [orderA, orderB].map(async (orderNumber) => {
        try {
          await prisma.$transaction(async (tx) => {
            await ProductPhysicalInventoryService.consumeForOrder(
              [{ skuId: oneKg.id, quantity: quantityEach }],
              { orderNumber },
              tx,
            );
          });

          return { orderNumber, success: true };
        } catch (error) {
          return {
            orderNumber,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    const successful = results.filter((result) => result.success);
    const failed = results.filter((result) => !result.success);

    console.log("Results:");
    for (const result of results) {
      console.log(
        `  ${result.orderNumber}: ${result.success ? "SUCCESS" : `FAILED (${result.error})`}`,
      );
    }

    assert(successful.length === 1, `Concurrency test harus menghasilkan tepat 1 SUCCESS, tetapi mendapat ${successful.length}.`);
    assert(failed.length === 1, `Concurrency test harus menghasilkan tepat 1 FAILED, tetapi mendapat ${failed.length}.`);

    const after = await prisma.productInventoryPool.findUnique({
      where: { id: pool.id },
      select: { stockGrams: true },
    });

    assert(after, "Pool hilang setelah concurrency test.");
    const expectedAfter = initialStock - requiredEachGrams;
    assert(
      after.stockGrams === expectedAfter,
      `Final pool salah. Expected ${expectedAfter}g, actual ${after.stockGrams}g.`,
    );

    const successfulOrder = successful[0].orderNumber;
    const successfulLedgers = await prisma.productInventoryPoolLedger.findMany({
      where: {
        note: { startsWith: `Penjualan ${successfulOrder} - ` },
        type: "SALE",
      },
      select: { quantityGrams: true },
    });

    const consumedBySuccessfulOrder = successfulLedgers.reduce(
      (total, ledger) => total + Math.abs(ledger.quantityGrams),
      0,
    );
    assert(
      consumedBySuccessfulOrder === requiredEachGrams,
      `Ledger SUCCESS salah. Expected ${requiredEachGrams}g, actual ${consumedBySuccessfulOrder}g.`,
    );

    console.log("");
    console.log("CONCURRENCY PROTECTION TEST PASSED.");
    console.log(`Exactly one checkout succeeded; final pool = ${after.stockGrams}g.`);
  } finally {
    // Cleanup only the successful test reservation and restore the exact initial
    // stock. Failed transaction(s) create no SALE ledger and mutate no stock.
    const successfulOrders = results.filter((result) => result.success).map((result) => result.orderNumber);

    await prisma.$transaction(async (tx) => {
      if (successfulOrders.length > 0) {
        const ledgers = await tx.productInventoryPoolLedger.findMany({
          where: {
            poolId: pool.id,
            type: "SALE",
            OR: successfulOrders.map((orderNumber) => ({
              note: { startsWith: `Penjualan ${orderNumber} - ` },
            })),
          },
          select: {
            id: true,
            quantityGrams: true,
          },
        });

        const consumed = ledgers.reduce(
          (total, ledger) => total + Math.abs(ledger.quantityGrams),
          0,
        );

        if (consumed > 0) {
          await tx.productInventoryPool.update({
            where: { id: pool.id },
            data: { stockGrams: { increment: consumed } },
          });
        }

        if (ledgers.length > 0) {
          await tx.productInventoryPoolLedger.deleteMany({
            where: { id: { in: ledgers.map((ledger) => ledger.id) } },
          });
        }
      }

      const restored = await tx.productInventoryPool.findUnique({
        where: { id: pool.id },
        select: { stockGrams: true },
      });

      assert(restored?.stockGrams === initialStock, `Cleanup gagal. Expected ${initialStock}g, actual ${restored?.stockGrams ?? "missing"}g.`);
    });

    console.log(`Cleanup complete: pool dikembalikan ke ${initialStock}g.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
