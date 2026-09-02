import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import OrderService from "@/services/order/order.service";

const TEST_USER_ID =
  "436d434a-64d9-4abf-80ed-33179ef3e4ab";

const TEST_ADDRESS_ID =
  "43a5944e-8210-4836-9ce2-b8a96d46a497";

const TEST_PRODUCT_ID =
  "c865f20f-8de5-4e0e-a345-87e83dce5ee2";

const TEST_SKU_ID =
  "13c6d46c-92f7-49af-a55d-6a8683053933";

const TEST_SKU_CODE =
  "TEST-TUNA-BERAT-DIBERSIHKAN-2";

const TEST_ORDER_NOTE =
  `TEST 22 ATOMIC ROLLBACK ${Date.now()}`;

const TEST_QUANTITY = 1;

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(
      `ASSERTION FAILED: ${message}`
    );
  }
}

function section(title: string) {
  console.log("");
  console.log(
    "============================================================"
  );
  console.log(title);
  console.log(
    "============================================================"
  );
}

async function waitForCheckoutSkuLock(
  barrierTransactionId: string,
  timeoutMs = 3500
) {
  const startedAt = Date.now();

  while (
    Date.now() - startedAt <
    timeoutMs
  ) {
    const waiting =
      await prisma.$queryRaw<
        Array<{
          count: bigint;
        }>
      >`
        SELECT COUNT(*)::bigint AS "count"
        FROM pg_locks
        WHERE granted = false
          AND locktype = 'transactionid'
          AND transactionid::text = ${barrierTransactionId}
      `;

    const count =
      Number(waiting[0]?.count ?? 0);

    if (count > 0) {
      return;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 25)
    );
  }

  throw new Error(
    "Timeout: checkout tidak terdeteksi menunggu transaction lock milik SKU barrier."
  );
}

async function cleanup() {
  section("TEST 22 CLEANUP");

  try {
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId:
            TEST_USER_ID,
        },
      },
    });

    console.log(
      "PASS: Cart TEST 22 dibersihkan."
    );
  } catch (error) {
    console.error(
      "WARN: Cleanup Cart TEST 22 gagal.",
      error
    );
  }

  try {
    await prisma.productSku.update({
      where: {
        id: TEST_SKU_ID,
      },
      data: {
        stock: 1,
        isActive: true,
      },
    });

    console.log(
      "PASS: Stock SKU dikembalikan ke 1."
    );
  } catch (error) {
    console.error(
      "WARN: Cleanup stock TEST 22 gagal.",
      error
    );
  }

  try {
    const remainingOrders =
      await prisma.order.findMany({
        where: {
          userId:
            TEST_USER_ID,
          notes:
            TEST_ORDER_NOTE,
        },
        select: {
          id: true,
          orderNumber: true,
        },
      });

    if (
      remainingOrders.length > 0
    ) {
      const orderIds =
        remainingOrders.map(
          (order) => order.id
        );

      await prisma.stockLedger.deleteMany({
        where: {
          orderId: {
            in: orderIds,
          },
        },
      });

      await prisma.orderItem.deleteMany({
        where: {
          orderId: {
            in: orderIds,
          },
        },
      });

      await prisma.order.deleteMany({
        where: {
          id: {
            in: orderIds,
          },
        },
      });

      console.log(
        `WARN: ${remainingOrders.length} Order TEST 22 tersisa dan telah dibersihkan.`
      );
    } else {
      console.log(
        "PASS: Tidak ada Order TEST 22 tersisa."
      );
    }
  } catch (error) {
    console.error(
      "WARN: Cleanup Order TEST 22 gagal.",
      error
    );
  }
}

async function main() {
  section(
    "TEST 22 - CHECKOUT ATOMIC ROLLBACK AFTER ORDER CREATION"
  );

  let originalStock = 0;

  // Harus berada di scope main(), bukan di dalam try,
  // karena digunakan lagi oleh finally untuk melepas barrier.
  let releaseBarrier:
    (() => void)
    | undefined;

  try {
    /**
     * ========================================================
     * 1. VALIDATE FIXTURES
     * ========================================================
     */

    const user =
      await prisma.user.findUnique({
        where: {
          id:
            TEST_USER_ID,
        },
        select: {
          id: true,
          email: true,
          isActive: true,
          deletedAt: true,
        },
      });

    assert(
      user,
      "Test user tidak ditemukan."
    );

    assert(
      user.isActive &&
        user.deletedAt === null,
      "Test user harus aktif dan tidak terhapus."
    );

    console.log(
      "PASS: Test user valid."
    );

    const address =
      await prisma.address.findFirst({
        where: {
          id:
            TEST_ADDRESS_ID,

          userId:
            TEST_USER_ID,

          deletedAt:
            null,
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
        },
      });

    assert(
      address,
      "Address test tidak ditemukan."
    );

    assert(
      address.latitude !== null &&
        address.longitude !== null,
      "Address test harus memiliki koordinat."
    );

    console.log(
      "PASS: Address test valid."
    );

    const sku =
      await prisma.productSku.findUnique({
        where: {
          id:
            TEST_SKU_ID,
        },
        select: {
          id: true,
          sku: true,
          productId: true,
          price: true,
          stock: true,
          isActive: true,
        },
      });

    assert(
      sku,
      "Fixture SKU tidak ditemukan."
    );

    assert(
      sku.productId ===
        TEST_PRODUCT_ID,
      `SKU ${TEST_SKU_CODE} tidak sesuai dengan product fixture.`
    );

    assert(
      sku.sku ===
        TEST_SKU_CODE,
      `SKU code fixture tidak sesuai. Aktual=${sku.sku}`
    );

    assert(
      sku.isActive,
      "Fixture SKU harus aktif."
    );

    originalStock =
      sku.stock;

    console.log({
      sku: sku.sku,
      skuId: sku.id,
      productId: sku.productId,
      price: sku.price.toString(),
      stock: sku.stock,
      isActive: sku.isActive,
    });

    assert(
      originalStock > 0,
      "Fixture SKU harus memiliki stock > 0."
    );

    const paymentChannel =
      await prisma.paymentChannel.findFirst({
        where: {
          isActive:
            true,
        },
        orderBy: {
          sortOrder:
            "asc",
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
      });

    assert(
      paymentChannel,
      "Tidak ada PaymentChannel aktif."
    );

    console.log(
      "PASS: PaymentChannel aktif tersedia."
    );

    /**
     * ========================================================
     * 2. PREPARE SAFE TEST STATE
     * ========================================================
     *
     * Kita sengaja menggunakan stock = 1.
     *
     * Initial checkout stock check:
     *
     *   stock 1 >= quantity 1
     *
     * sehingga checkout lolos pre-check.
     *
     * Setelah Order + OrderItem dibuat, checkout akan mencoba
     * ProductSku FOR UPDATE.
     *
     * Pada titik tersebut external barrier mengubah stock:
     *
     *   1 -> 0
     *
     * sehingga final stock validation gagal.
     */

    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId:
            TEST_USER_ID,
        },
      },
    });

    console.log(
      "PASS: Cart TEST 22 dibersihkan sebelum fixture."
    );

    await prisma.productSku.update({
      where: {
        id:
          TEST_SKU_ID,
      },
      data: {
        stock: 1,
        isActive: true,
      },
    });

    console.log(
      "PASS: Stock fixture diset menjadi 1."
    );

    const cart =
      await prisma.cart.findUnique({
        where: {
          userId:
            TEST_USER_ID,
        },
        select: {
          id: true,
        },
      });

    assert(
      cart,
      "Cart test tidak ditemukan."
    );

    const cartItem =
      await prisma.cartItem.create({
        data: {
          cartId:
            cart.id,

          productId:
            TEST_PRODUCT_ID,

          skuId:
            TEST_SKU_ID,

          quantity:
            TEST_QUANTITY,

          price:
            sku.price,

          isFlashSaleApplied:
            false,

          flashSaleId:
            null,

          flashSaleItemId:
            null,
        },
        select: {
          id: true,
          cartId: true,
          productId: true,
          skuId: true,
          quantity: true,
          price: true,
        },
      });

    console.log({
      cartItemId:
        cartItem.id,
      quantity:
        cartItem.quantity,
      stock:
        1,
    });

    console.log(
      "PASS: CartItem TEST 22 berhasil dibuat."
    );

    /**
     * ========================================================
     * 3. SNAPSHOT DATABASE
     * ========================================================
     */

    const ordersBefore =
      await prisma.order.findMany({
        where: {
          userId:
            TEST_USER_ID,

          notes:
            TEST_ORDER_NOTE,
        },
        select: {
          id: true,
        },
      });

    const orderIdsBefore =
      ordersBefore.map(
        (order) => order.id
      );

    const orderItemsBefore =
      orderIdsBefore.length === 0
        ? 0
        : await prisma.orderItem.count({
            where: {
              orderId: {
                in:
                  orderIdsBefore,
              },
            },
          });

    const saleLedgersBefore =
      await prisma.stockLedger.count({
        where: {
          skuId:
            TEST_SKU_ID,

          type:
            "SALE",

          order: {
            userId:
              TEST_USER_ID,
          },
        },
      });

    const stockBefore =
      await prisma.productSku.findUnique({
        where: {
          id:
            TEST_SKU_ID,
        },
        select: {
          stock: true,
        },
      });

    assert(
      stockBefore?.stock === 1,
      `Stock awal TEST 22 harus 1. Aktual=${stockBefore?.stock}`
    );

    const cartBefore =
      await prisma.cartItem.findUnique({
        where: {
          id:
            cartItem.id,
        },
        select: {
          quantity: true,
        },
      });

    assert(
      cartBefore?.quantity ===
        TEST_QUANTITY,
      "CartItem awal tidak sesuai."
    );

    console.log("");
    console.log({
      ordersBefore:
        ordersBefore.length,
      orderItemsBefore,
      saleLedgersBefore,
      stockBefore:
        stockBefore.stock,
      cartQuantityBefore:
        cartBefore.quantity,
    });

    /**
     * ========================================================
     * 4. CREATE SKU BARRIER
     * ========================================================
     *
     * Transaction ini sengaja memegang lock ProductSku.
     *
     * Checkout akan:
     *
     *   initial stock check
     *   -> CREATE Order + OrderItem
     *   -> menunggu ProductSku FOR UPDATE
     *
     * Setelah checkout terdeteksi menunggu lock, barrier akan
     * mengubah stock 1 -> 0 lalu COMMIT.
     */

    let barrierError:
      unknown = null;

    let barrierTransactionId:
      string | undefined;

    const barrierReady =
      new Promise<void>(
        async (resolve, reject) => {
          try {
            await prisma.$transaction(
              async (tx) => {
                const txidRows =
                  await tx.$queryRaw<
                    Array<{
                      txid: bigint;
                    }>
                  >`
                    SELECT txid_current() AS "txid"
                  `;

                barrierTransactionId =
                  String(txidRows[0]?.txid);

                if (!barrierTransactionId) {
                  throw new Error(
                    "Barrier transaction ID tidak tersedia."
                  );
                }

                await tx.$queryRaw`
                  SELECT "id"
                  FROM "ProductSku"
                  WHERE "id" = ${TEST_SKU_ID}
                  FOR UPDATE
                `;

                console.log(
                  "PASS: SKU barrier berhasil mendapatkan ProductSku lock."
                );

                resolve();

                await new Promise<void>(
                  (release) => {
                    releaseBarrier =
                      release;
                  }
                );

                await tx.productSku.update({
                  where: {
                    id:
                      TEST_SKU_ID,
                  },
                  data: {
                    stock: 0,
                  },
                });

                console.log(
                  "PASS: Barrier mengubah stock 1 -> 0."
                );
              },
              {
                maxWait: 10000,
                timeout: 4500,
              }
            );
          } catch (error) {
            barrierError =
              error;

            reject(error);
          }
        }
      );

    await barrierReady;

    /**
     * ========================================================
     * 5. START CHECKOUT
     * ========================================================
     */

    console.log("");
    console.log(
      "Menjalankan checkout TEST 22..."
    );

    const checkoutPromise =
      OrderService.createCheckoutOrder(
        TEST_USER_ID,
        TEST_ADDRESS_ID,
        paymentChannel.id,
        TEST_ORDER_NOTE,
        "INTERNAL",
        null
      );

    /**
     * ========================================================
     * 6. WAIT UNTIL CHECKOUT IS BLOCKED BY SKU LOCK
     * ========================================================
     *
     * Ini membuat race condition deterministic.
     */

    if (!barrierTransactionId) {
      throw new Error(
        "Barrier transaction ID belum tersedia."
      );
    }

    await waitForCheckoutSkuLock(
      barrierTransactionId
    );

    console.log(
      "PASS: Checkout terdeteksi menunggu ProductSku FOR UPDATE."
    );

    /**
     * ========================================================
     * 7. RELEASE BARRIER
     * ========================================================
     *
     * Barrier sekarang:
     *
     *   stock 1 -> 0
     *   COMMIT
     *
     * Checkout kemudian memperoleh SKU lock dan membaca stock 0.
     */

    console.log("");
    console.log(
      "Melepas SKU barrier..."
    );

if (typeof releaseBarrier !== "function") {
      throw new Error(
        "Barrier release function tidak tersedia."
      );
    }

    releaseBarrier();

    const checkoutResult =
      await checkoutPromise;

    console.log("");
    console.log(
      "CHECKOUT RESULT:"
    );
    console.dir(
      checkoutResult,
      {
        depth: 4,
      }
    );

    assert(
      barrierError === null,
      `SKU barrier gagal: ${
        barrierError instanceof Error
          ? barrierError.message
          : String(barrierError)
      }`
    );

    assert(
      checkoutResult.success ===
        false,
      "Checkout TEST 22 seharusnya gagal."
    );

    assert(
      typeof checkoutResult.message ===
        "string" &&
        checkoutResult.message.includes(
          "tidak mencukupi"
        ),
      `Checkout gagal dengan alasan yang tidak sesuai: ${checkoutResult.message}`
    );

    console.log(
      "PASS: Checkout gagal setelah stock berubah concurrent."
    );

    /**
     * ========================================================
     * 8. VERIFY ORDER ROLLBACK
     * ========================================================
     */

    const ordersAfter =
      await prisma.order.findMany({
        where: {
          userId:
            TEST_USER_ID,

          notes:
            TEST_ORDER_NOTE,
        },
        select: {
          id: true,
        },
      });

    assert(
      ordersAfter.length ===
        ordersBefore.length,
      `Order harus rollback. Before=${ordersBefore.length}, After=${ordersAfter.length}.`
    );

    console.log(
      "PASS: Tidak ada Order TEST 22 yang tersisa."
    );

    const orderItemsAfter =
      ordersAfter.length === 0
        ? 0
        : await prisma.orderItem.count({
            where: {
              orderId: {
                in:
                  ordersAfter.map(
                    (order) =>
                      order.id
                  ),
              },
            },
          });

    assert(
      orderItemsAfter ===
        orderItemsBefore,
      `OrderItem harus rollback. Before=${orderItemsBefore}, After=${orderItemsAfter}.`
    );

    console.log(
      "PASS: OrderItem ikut rollback."
    );

    /**
     * ========================================================
     * 9. VERIFY STOCK
     * ========================================================
     *
     * Stock saat ini harus 0 karena perubahan 1 -> 0 berasal
     * dari external barrier transaction yang memang COMMIT.
     *
     * Yang kita buktikan adalah checkout TIDAK melakukan
     * decrement kedua dan tidak meninggalkan stock mutation
     * miliknya sendiri.
     */

    const stockAfterCheckout =
      await prisma.productSku.findUnique({
        where: {
          id:
            TEST_SKU_ID,
        },
        select: {
          stock: true,
        },
      });

    assert(
      stockAfterCheckout?.stock ===
        0,
      `Stock setelah barrier + rollback checkout harus 0. Aktual=${stockAfterCheckout?.stock}`
    );

    console.log(
      "PASS: Stock hanya berubah oleh barrier: 1 -> 0."
    );

    /**
     * ========================================================
     * 10. VERIFY NO NEW SALE LEDGER
     * ========================================================
     */

    const saleLedgersAfter =
      await prisma.stockLedger.count({
        where: {
          skuId:
            TEST_SKU_ID,

          type:
            "SALE",

          order: {
            userId:
              TEST_USER_ID,
          },
        },
      });

    assert(
      saleLedgersAfter ===
        saleLedgersBefore,
      `SALE StockLedger harus rollback. Before=${saleLedgersBefore}, After=${saleLedgersAfter}.`
    );

    console.log(
      "PASS: Tidak ada SALE StockLedger baru."
    );

    /**
     * ========================================================
     * 11. VERIFY CART REMAINS
     * ========================================================
     */

    const cartAfter =
      await prisma.cartItem.findUnique({
        where: {
          id:
            cartItem.id,
        },
        select: {
          id: true,
          quantity: true,
          skuId: true,
          cartId: true,
        },
      });

    assert(
      cartAfter !== null,
      "CartItem harus tetap ada setelah rollback."
    );

    assert(
      cartAfter.quantity ===
        TEST_QUANTITY,
      `CartItem quantity harus tetap ${TEST_QUANTITY}. Aktual=${cartAfter.quantity}`
    );

    assert(
      cartAfter.skuId ===
        TEST_SKU_ID,
      "CartItem SKU tidak boleh berubah."
    );

    console.log(
      "PASS: CartItem tetap ada."
    );

    /**
     * ========================================================
     * 12. RESTORE STOCK
     * ========================================================
     */

    await prisma.productSku.update({
      where: {
        id:
          TEST_SKU_ID,
      },
      data: {
        stock:
          originalStock,
        isActive:
          true,
      },
    });

    console.log(
      `PASS: Stock dikembalikan ke ${originalStock}.`
    );

    /**
     * ========================================================
     * TEST PASSED
     * ========================================================
     */

    section(
      "TEST 22 PASSED"
    );

    console.log(
      "PASS: Checkout gagal setelah Order/OrderItem diproses."
    );

    console.log(
      "PASS: Order rollback."
    );

    console.log(
      "PASS: OrderItem rollback."
    );

    console.log(
      "PASS: Tidak ada SALE StockLedger dari checkout."
    );

    console.log(
      "PASS: CartItem tetap ada."
    );

    console.log(
      "PASS: Transaction checkout terbukti atomic."
    );
  } catch (error) {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "TEST 22 FAILED"
    );
    console.log(
      "============================================================"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    if (typeof releaseBarrier === "function") {
      try {
        releaseBarrier();
      } catch {
        // Barrier mungkin sudah dilepas.
      }
    }

    await cleanup();

    await prisma.$disconnect();
  }
}

main().catch(
  (error) => {
    console.error(
      "[TEST 22 FATAL ERROR]",
      error
    );

    process.exitCode = 1;
  }
);
