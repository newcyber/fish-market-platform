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
  assert(product.skus.length > 0, "Product belum mempunyai SKU aktif.");

  const skuInfo = product.skus.map((sku) => {
    const size = sku.skuOptions.find(
      (x) => x.variantOption.group.name.trim().toLowerCase() === "ukuran",
    );
    const weight = sku.skuOptions.find(
      (x) => x.variantOption.group.name.trim().toLowerCase() === "berat",
    );
    return {
      ...sku,
      sizeLabel: size?.variantOption.label ?? null,
      sizeOptionId: size?.variantOption.id ?? null,
      weightGrams: weight ? parseWeightLabelToGrams(weight.variantOption.label) : null,
    };
  });

  const candidates = skuInfo
    .filter((x) => x.sizeOptionId && x.weightGrams)
    .map((x) => ({
      ...x,
      pool: product.inventoryPools.find(
        (pool) => pool.sizeVariantOptionId === x.sizeOptionId,
      ),
    }))
    .filter((x) => x.pool);

  const oneKg = candidates.find((x) => x.weightGrams === 1000);
  const fiveHundred = candidates.find((x) => x.weightGrams === 500);

  assert(oneKg, "SKU 1 Kg yang terhubung ke pool tidak ditemukan.");
  assert(fiveHundred, "SKU 500 gram yang terhubung ke pool tidak ditemukan.");
  assert(oneKg.pool!.id === fiveHundred.pool!.id, "SKU 1 Kg dan 500g tidak berbagi pool ukuran yang sama.");

  const poolId = oneKg.pool!.id;
  const initialStock = oneKg.pool!.stockGrams;
  assert(initialStock >= 1000, `Pool ${oneKg.sizeLabel} hanya ${initialStock}g; test membutuhkan >= 1000g.`);

  const orderNumber = `TEST-PHYSICAL-${Date.now()}`;

  console.log(`Product : ${product.name}`);
  console.log(`Pool    : ${oneKg.sizeLabel}`);
  console.log(`Initial : ${initialStock}g`);
  console.log(`1 Kg SKU: ${oneKg.sku}`);
  console.log(`500g SKU: ${fiveHundred.sku}`);
  console.log(`Order   : ${orderNumber}`);
  console.log("");

  await prisma.$transaction(async (tx) => {
    const readStock = async () => {
      const pool = await tx.productInventoryPool.findUnique({
        where: { id: poolId },
        select: { stockGrams: true },
      });
      assert(pool, "Pool hilang saat test.");
      return pool.stockGrams;
    };

    // 1) Checkout: 1kg => -1000g
    await ProductPhysicalInventoryService.consumeForOrder(
      [{ skuId: oneKg.id, quantity: 1 }],
      { orderNumber },
      tx,
    );
    assert((await readStock()) === initialStock - 1000, "Checkout 1kg tidak mengurangi 1000g.");

    // 2) Update 1kg -> 500g => +500g
    await ProductPhysicalInventoryService.reconcileForOrder(
      [{ skuId: fiveHundred.id, quantity: 1 }],
      { orderNumber },
      tx,
    );
    assert((await readStock()) === initialStock - 500, "Update 1kg -> 500g tidak mengembalikan 500g.");

    // 3) Update 500g -> 1kg => -500g
    await ProductPhysicalInventoryService.reconcileForOrder(
      [{ skuId: oneKg.id, quantity: 1 }],
      { orderNumber },
      tx,
    );
    assert((await readStock()) === initialStock - 1000, "Update 500g -> 1kg tidak mengambil 500g.");

    // 4) Update 1kg -> 2 x 500g (same physical grams) => no net mutation
    await ProductPhysicalInventoryService.reconcileForOrder(
      [{ skuId: fiveHundred.id, quantity: 2 }],
      { orderNumber },
      tx,
    );
    assert((await readStock()) === initialStock - 1000, "1kg -> 2x500g seharusnya tidak mengubah physical grams.");

    // 5) Update -> empty => +1000g
    await ProductPhysicalInventoryService.reconcileForOrder(
      [],
      { orderNumber },
      tx,
    );
    assert((await readStock()) === initialStock, "Menghapus seluruh item tidak me-restore 1000g.");

    // 6) Checkout again, then cancellation restore => back to initial.
    const cancelOrderNumber = `${orderNumber}-CANCEL`;
    await ProductPhysicalInventoryService.consumeForOrder(
      [{ skuId: oneKg.id, quantity: 1 }],
      { orderNumber: cancelOrderNumber },
      tx,
    );
    assert((await readStock()) === initialStock - 1000, "Checkout kedua gagal mengurangi 1000g.");

    await ProductPhysicalInventoryService.restoreForOrder(
      cancelOrderNumber,
      {},
      tx,
    );
    assert((await readStock()) === initialStock, "Cancellation restore tidak mengembalikan 1000g.");

    // 7) Idempotency: restore kedua tidak boleh menambah stok lagi.
    await ProductPhysicalInventoryService.restoreForOrder(
      cancelOrderNumber,
      {},
      tx,
    );
    assert((await readStock()) === initialStock, "Restore kedua menyebabkan double restore.");

    // 8) Insufficient stock must fail without changing the pool.
    const insufficientOrderNumber = `${orderNumber}-INSUFFICIENT`;
    const beforeInsufficient = await readStock();
    let failed = false;

    try {
      await ProductPhysicalInventoryService.consumeForOrder(
        [{ skuId: oneKg.id, quantity: Math.ceil((beforeInsufficient + 1) / 1000) }],
        { orderNumber: insufficientOrderNumber },
        tx,
      );
    } catch (error) {
      failed = true;
      console.log(`Expected insufficient-stock error: ${(error as Error).message}`);
    }

    assert(failed, "Insufficient physical stock seharusnya gagal.");
    assert((await readStock()) === beforeInsufficient, "Insufficient checkout mengubah pool.");

    console.log("");
    console.log("ALL PHYSICAL INVENTORY LIFECYCLE TESTS PASSED.");
    console.log("Transaction akan di-ROLLBACK; database production tidak berubah.");
    throw new Error("__ROLLBACK_TEST__");
  }).catch((error) => {
    if ((error as Error).message !== "__ROLLBACK_TEST__") {
      throw error;
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
