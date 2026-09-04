import { prisma } from "@/lib/prisma";
import CartService from "@/services/cart/cart.service";
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

const TEST_QUANTITY = 1;

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function main() {
  const createdOrderIds: string[] = [];

  let originalStock: number | null = null;
  let originalIsActive: boolean | null = null;

  try {
    console.log("");
    console.log("============================================================");
    console.log("TEST 20 - CHECKOUT CONCURRENCY");
    console.log("============================================================");

    // ----------------------------------------------------------
    // 1. VALIDATE USER
    // ----------------------------------------------------------

    const user = await prisma.user.findFirst({
      where: {
        id: TEST_USER_ID,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
      },
    });

    assert(
      user,
      `TEST_USER_ID tidak valid atau user tidak aktif: ${TEST_USER_ID}`
    );

    console.log("PASS: Test user valid.");
    console.log({
      userId: user.id,
      email: user.email,
    });

    // ----------------------------------------------------------
    // 2. VALIDATE ADDRESS
    // ----------------------------------------------------------

    const address = await prisma.address.findFirst({
      where: {
        id: TEST_ADDRESS_ID,
        userId: TEST_USER_ID,
        deletedAt: null,
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    });

    assert(
      address,
      `TEST_ADDRESS_ID tidak valid: ${TEST_ADDRESS_ID}`
    );

    console.log("PASS: Address test valid.");

    // ----------------------------------------------------------
    // 3. VALIDATE SKU FIXTURE
    // ----------------------------------------------------------

    const sku = await prisma.productSku.findUnique({
      where: {
        id: TEST_SKU_ID,
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
      `TEST_SKU_ID tidak ditemukan: ${TEST_SKU_ID}`
    );

    assert(
      sku.sku === TEST_SKU_CODE,
      `SKU code mismatch. Expected ${TEST_SKU_CODE}, got ${sku.sku}`
    );

    assert(
      sku.productId === TEST_PRODUCT_ID,
      `SKU product mismatch. Expected ${TEST_PRODUCT_ID}, got ${sku.productId}`
    );

    assert(
      sku.stock >= TEST_QUANTITY,
      `Stock SKU tidak cukup. Stock=${sku.stock}`
    );

    assert(
      sku.isActive,
      "SKU fixture harus aktif."
    );

    originalStock = sku.stock;
    originalIsActive = sku.isActive;

    console.log({
      sku: sku.sku,
      skuId: sku.id,
      productId: sku.productId,
      price: sku.price.toString(),
      stock: sku.stock,
      isActive: sku.isActive,
    });

    console.log("PASS: Fixture SKU TEST 20 valid.");

    // ----------------------------------------------------------
    // 4. VALIDATE PAYMENT CHANNEL
    // ----------------------------------------------------------

    const paymentChannel =
      await prisma.paymentChannel.findFirst({
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: "asc",
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

    console.log({
      paymentChannel: paymentChannel.name,
      type: paymentChannel.type,
    });

    console.log("PASS: PaymentChannel aktif tersedia.");

    // ----------------------------------------------------------
    // 5. CLEAR TEST CART
    // ----------------------------------------------------------

    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: TEST_USER_ID,
        },
      },
    });

    console.log("PASS: Cart test dibersihkan sebelum fixture.");

    // ----------------------------------------------------------
    // 6. CREATE EXACTLY ONE CART ITEM
    // ----------------------------------------------------------

await CartService.addItem({
  owner: {
    type: "customer",
    userId: TEST_USER_ID,
  },
  productId: TEST_PRODUCT_ID,
  skuId: TEST_SKU_ID,
  quantity: TEST_QUANTITY,
});

    const cartBefore =
      await prisma.cart.findUnique({
        where: {
          userId: TEST_USER_ID,
        },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              skuId: true,
              quantity: true,
            },
          },
        },
      });

    assert(
      cartBefore,
      "Cart test tidak ditemukan setelah addItem."
    );

    assert(
      cartBefore.items.length === 1,
      `Cart TEST 20 harus berisi 1 item, aktual=${cartBefore.items.length}`
    );

    assert(
      cartBefore.items[0].productId === TEST_PRODUCT_ID,
      "Cart item productId tidak sesuai fixture."
    );

    assert(
      cartBefore.items[0].skuId === TEST_SKU_ID,
      "Cart item skuId tidak sesuai fixture."
    );

    assert(
      cartBefore.items[0].quantity === TEST_QUANTITY,
      `Cart quantity harus ${TEST_QUANTITY}, aktual=${cartBefore.items[0].quantity}`
    );

    console.log(
      "PASS: Cart TEST 20 berisi 1 SKU."
    );

    // ----------------------------------------------------------
// 7. START TWO CHECKOUTS CONCURRENTLY
// ----------------------------------------------------------

console.log("");
console.log(
  "Menjalankan 2 checkout secara bersamaan..."
);

const checkoutA =
  OrderService.createCheckoutOrder(
    TEST_USER_ID,
    TEST_ADDRESS_ID,
    paymentChannel.id,
    "TEST 20 CHECKOUT A",
    "INTERNAL",
    null
  );

const checkoutB =
  OrderService.createCheckoutOrder(
    TEST_USER_ID,
    TEST_ADDRESS_ID,
    paymentChannel.id,
    "TEST 20 CHECKOUT B",
    "INTERNAL",
    null
);

// ----------------------------------------------------------
// 8. WAIT FOR BOTH CHECKOUTS
// ----------------------------------------------------------

const [resultA, resultB] =
  await Promise.all([
    checkoutA,
    checkoutB,
  ]);

if (
  resultA.success &&
  resultA.data?.id
) {
  createdOrderIds.push(
    resultA.data.id
  );
}

if (
  resultB.success &&
  resultB.data?.id
) {
  createdOrderIds.push(
    resultB.data.id
  );
}

    console.log("");
    console.log("============================================================");
    console.log("CHECKOUT RESULT");
    console.log("============================================================");

    console.log("Checkout A:");
    console.dir(resultA, {
      depth: 3,
    });

    console.log("");
    console.log("Checkout B:");
    console.dir(resultB, {
      depth: 3,
    });

    // ----------------------------------------------------------
    // 11. ASSERT EXACTLY ONE SUCCESS
    // ----------------------------------------------------------

    const successCount =
      Number(resultA.success) +
      Number(resultB.success);

    const failureCount =
      Number(!resultA.success) +
      Number(!resultB.success);

    console.log("");
    console.log({
      successCount,
      failureCount,
    });

    assert(
      successCount === 1,
      `Concurrency checkout harus menghasilkan tepat 1 success. Aktual=${successCount}`
    );

    assert(
      failureCount === 1,
      `Concurrency checkout harus menghasilkan tepat 1 failure. Aktual=${failureCount}`
    );

    console.log(
      "PASS: Tepat 1 checkout berhasil dan 1 checkout ditolak."
    );

    // ----------------------------------------------------------
    // 12. VERIFY DATABASE ORDER COUNT
    // ----------------------------------------------------------

    const createdOrders =
      await prisma.order.findMany({
        where: {
          id: {
            in: createdOrderIds,
          },
        },
        include: {
          items: true,
        },
      });

    assert(
      createdOrders.length === 1,
      `Harus terbentuk tepat 1 Order. Aktual=${createdOrders.length}`
    );

    const createdOrder =
      createdOrders[0];

    assert(
      createdOrder.items.length === 1,
      `Order harus memiliki tepat 1 OrderItem. Aktual=${createdOrder.items.length}`
    );

    const orderItem =
      createdOrder.items[0];

    assert(
      orderItem.productId === TEST_PRODUCT_ID,
      "OrderItem productId tidak sesuai."
    );

    assert(
      orderItem.skuId === TEST_SKU_ID,
      "OrderItem skuId tidak sesuai."
    );

    assert(
      orderItem.quantity === TEST_QUANTITY,
      `OrderItem quantity harus ${TEST_QUANTITY}. Aktual=${orderItem.quantity}`
    );

    console.log(
      "PASS: Tepat 1 Order + 1 OrderItem terbentuk."
    );

    // ----------------------------------------------------------
    // 13. VERIFY STOCK
    // ----------------------------------------------------------

    const skuAfter =
      await prisma.productSku.findUnique({
        where: {
          id: TEST_SKU_ID,
        },
        select: {
          stock: true,
          isActive: true,
        },
      });

    assert(
      skuAfter,
      "SKU tidak ditemukan setelah checkout."
    );

    const expectedStock =
      originalStock! - TEST_QUANTITY;

    assert(
      skuAfter.stock === expectedStock,
      `Stock salah. Expected=${expectedStock}, actual=${skuAfter.stock}`
    );

    console.log(
      `PASS: Stock SKU ${originalStock} -> ${skuAfter.stock}.`
    );

    // ----------------------------------------------------------
    // 14. VERIFY STOCK LEDGER
    // ----------------------------------------------------------

    const saleLedgers =
      await prisma.stockLedger.findMany({
        where: {
          orderId: createdOrder.id,
          skuId: TEST_SKU_ID,
          type: "SALE",
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    assert(
      saleLedgers.length === 1,
      `Harus ada tepat 1 SALE StockLedger. Aktual=${saleLedgers.length}`
    );

    const saleLedger =
      saleLedgers[0];

    assert(
      saleLedger.quantity === -TEST_QUANTITY,
      `StockLedger quantity harus -${TEST_QUANTITY}. Aktual=${saleLedger.quantity}`
    );

    console.log(
      "PASS: Tepat 1 SALE StockLedger tercatat."
    );

    // ----------------------------------------------------------
    // 15. VERIFY CART EMPTY
    // ----------------------------------------------------------

    const cartAfter =
      await prisma.cart.findUnique({
        where: {
          userId: TEST_USER_ID,
        },
        include: {
          items: true,
        },
      });

    assert(
      cartAfter,
      "Cart tidak ditemukan setelah checkout."
    );

    assert(
      cartAfter.items.length === 0,
      `Cart harus kosong setelah checkout. Aktual=${cartAfter.items.length}`
    );

    console.log(
      "PASS: Cart kosong setelah checkout."
    );

    // ----------------------------------------------------------
    // SUCCESS
    // ----------------------------------------------------------

    console.log("");
    console.log("============================================================");
    console.log("TEST 20 PASSED");
    console.log("============================================================");
    console.log(
      "PASS: Checkout concurrency berhasil diamankan."
    );
    console.log(
      "PASS: Hanya satu checkout dapat membuat Order dari satu Cart."
    );
  } catch (error) {
    console.log("");
    console.log("============================================================");
    console.log("TEST 20 FAILED");
    console.log("============================================================");

    console.error(error);

    process.exitCode = 1;
  } finally {

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    console.log("");
    console.log("============================================================");
    console.log("TEST 20 CLEANUP");
    console.log("============================================================");

    try {
      // Hanya hapus Order yang benar-benar dibuat
      // oleh TEST 20.
      if (createdOrderIds.length > 0) {
        await prisma.notification.deleteMany({
          where: {
            orderId: {
              in: createdOrderIds,
            },
          },
        });

        await prisma.stockLedger.deleteMany({
          where: {
            orderId: {
              in: createdOrderIds,
            },
          },
        });

        await prisma.orderItem.deleteMany({
          where: {
            orderId: {
              in: createdOrderIds,
            },
          },
        });

        await prisma.order.deleteMany({
          where: {
            id: {
              in: createdOrderIds,
            },
          },
        });

        console.log(
          `PASS: ${createdOrderIds.length} Order TEST 20 dihapus.`
        );
      }

      // Bersihkan cart test user.
      await prisma.cartItem.deleteMany({
        where: {
          cart: {
            userId: TEST_USER_ID,
          },
        },
      });

      console.log(
        "PASS: Cart TEST 20 dibersihkan."
      );

      // Restore SKU ke kondisi awal.
      if (
        originalStock !== null &&
        originalIsActive !== null
      ) {
        await prisma.productSku.update({
          where: {
            id: TEST_SKU_ID,
          },
          data: {
            stock: originalStock,
            isActive: originalIsActive,
          },
        });

        console.log(
          `PASS: Stock SKU dikembalikan ke ${originalStock}.`
        );
      }

      console.log(
        "PASS: Cleanup TEST 20 selesai."
      );
    } catch (cleanupError) {
      console.error(
        "CLEANUP ERROR:",
        cleanupError
      );

      process.exitCode = 1;
    }

    await prisma.$disconnect();
  }
}

void main();
