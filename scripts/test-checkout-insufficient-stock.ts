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

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function main() {
  let testCartId: string | null = null;
  let originalStock: number | null = null;
  let originalIsActive: boolean | null = null;

  const createdOrderIds: string[] = [];

  try {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "TEST 21 - CHECKOUT INSUFFICIENT STOCK"
    );
    console.log(
      "============================================================"
    );

    // ----------------------------------------------------------
    // 1. VALIDATE USER
    // ----------------------------------------------------------

    const user =
      await prisma.user.findFirst({
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

    const address =
      await prisma.address.findFirst({
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

    console.log(
      "PASS: Address test valid."
    );

    // ----------------------------------------------------------
    // 3. VALIDATE SKU FIXTURE
    // ----------------------------------------------------------

    const sku =
      await prisma.productSku.findUnique({
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
      sku.isActive,
      "SKU fixture harus aktif."
    );

    assert(
      sku.stock >= 1,
      `Stock awal SKU harus >= 1. Aktual=${sku.stock}`
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

    console.log(
      "PASS: Fixture SKU TEST 21 valid."
    );

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

    console.log(
      "PASS: PaymentChannel aktif tersedia."
    );

    // ----------------------------------------------------------
    // 5. CLEAN EXISTING TEST CART
    // ----------------------------------------------------------

    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: TEST_USER_ID,
        },
      },
    });

    console.log(
      "PASS: Cart test dibersihkan sebelum fixture."
    );

    // ----------------------------------------------------------
    // 6. GET / CREATE TEST CART
    // ----------------------------------------------------------

    let cart =
      await prisma.cart.findUnique({
        where: {
          userId: TEST_USER_ID,
        },
        select: {
          id: true,
        },
      });

    if (!cart) {
      cart =
        await prisma.cart.create({
          data: {
            userId: TEST_USER_ID,
          },
          select: {
            id: true,
          },
        });
    }

    testCartId = cart.id;

    console.log({
      cartId: testCartId,
    });

    // ----------------------------------------------------------
    // 7. CREATE INVALID CART ITEM DIRECTLY
    //
    // Sengaja melewati CartService karena CartService memang
    // akan menolak quantity yang melebihi stock.
    //
    // Target:
    //
    // stock    = N
    // quantity = N + 1
    // ----------------------------------------------------------

    const invalidQuantity =
      originalStock! + 1;

    const cartItem =
      await prisma.cartItem.create({
        data: {
          cartId: testCartId,
          productId: TEST_PRODUCT_ID,
          skuId: TEST_SKU_ID,
          quantity: invalidQuantity,
          price: sku.price,
          isFlashSaleApplied: false,
          flashSaleId: null,
          flashSaleItemId: null,
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
      cartItemId: cartItem.id,
      quantity: cartItem.quantity,
      stock: originalStock,
    });

    assert(
      cartItem.quantity === invalidQuantity,
      `Cart quantity harus ${invalidQuantity}. Aktual=${cartItem.quantity}`
    );

    console.log(
      `PASS: CartItem invalid berhasil dibuat. quantity=${invalidQuantity}, stock=${originalStock}`
    );

    // ----------------------------------------------------------
    // 8. SNAPSHOT DATABASE SEBELUM CHECKOUT
    // ----------------------------------------------------------

    const ordersBefore =
      await prisma.order.findMany({
        where: {
          userId: TEST_USER_ID,
          notes: "TEST 21 INSUFFICIENT STOCK",
        },
        select: {
          id: true,
        },
      });

    const ledgerBefore =
      await prisma.stockLedger.findMany({
        where: {
          skuId: TEST_SKU_ID,
          order: {
            userId: TEST_USER_ID,
          },
          type: "SALE",
        },
        select: {
          id: true,
          orderId: true,
        },
      });

    console.log({
      ordersBefore: ordersBefore.length,
      saleLedgersBefore: ledgerBefore.length,
      stockBefore: originalStock,
      cartQuantityBefore: cartItem.quantity,
    });

    // ----------------------------------------------------------
    // 9. EXECUTE CHECKOUT
    // ----------------------------------------------------------

    console.log("");
    console.log(
      "Menjalankan checkout dengan quantity melebihi stock..."
    );

    const result =
      await OrderService.createCheckoutOrder(
        TEST_USER_ID,
        TEST_ADDRESS_ID,
        paymentChannel.id,
        "TEST 21 INSUFFICIENT STOCK",
        "INTERNAL",
        null
      );

    console.log("");
    console.log(
      "CHECKOUT RESULT:"
    );

    console.dir(result, {
      depth: 3,
    });

    assert(
      !result.success,
      "Checkout seharusnya gagal karena stock tidak mencukupi."
    );

    console.log(
      "PASS: Checkout ditolak karena insufficient stock."
    );

    // ----------------------------------------------------------
    // 10. COLLECT ORDER ID JIKA TERNYATA ADA
    // ----------------------------------------------------------

    if (
      result.success &&
      result.data?.id
    ) {
      createdOrderIds.push(
        result.data.id
      );
    }

    // ----------------------------------------------------------
    // 11. VERIFY NO ORDER CREATED
    // ----------------------------------------------------------

    const ordersAfter =
      await prisma.order.findMany({
        where: {
          userId: TEST_USER_ID,
          notes: "TEST 21 INSUFFICIENT STOCK",
        },
        select: {
          id: true,
        },
      });

    assert(
      ordersAfter.length ===
        ordersBefore.length,
      `Order tidak boleh bertambah. Before=${ordersBefore.length}, After=${ordersAfter.length}`
    );

    console.log(
      "PASS: Tidak ada Order baru."
    );

    // ----------------------------------------------------------
    // 12. VERIFY STOCK UNCHANGED
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

    assert(
      skuAfter.stock === originalStock,
      `Stock berubah padahal checkout gagal. Before=${originalStock}, After=${skuAfter.stock}`
    );

    console.log(
      `PASS: Stock tetap ${skuAfter.stock}.`
    );

    // ----------------------------------------------------------
    // 13. VERIFY NO NEW SALE LEDGER
    // ----------------------------------------------------------

    const ledgerAfter =
      await prisma.stockLedger.findMany({
        where: {
          skuId: TEST_SKU_ID,
          order: {
            userId: TEST_USER_ID,
          },
          type: "SALE",
        },
        select: {
          id: true,
          orderId: true,
        },
      });

    assert(
      ledgerAfter.length ===
        ledgerBefore.length,
      `SALE StockLedger tidak boleh bertambah. Before=${ledgerBefore.length}, After=${ledgerAfter.length}`
    );

    console.log(
      "PASS: Tidak ada SALE StockLedger baru."
    );

    // ----------------------------------------------------------
    // 14. VERIFY CART ITEM REMAINS
    // ----------------------------------------------------------

    const cartAfter =
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
      cartAfter,
      "Cart tidak ditemukan setelah checkout gagal."
    );

    assert(
      cartAfter.items.length === 1,
      `CartItem harus tetap ada. Aktual=${cartAfter.items.length}`
    );

    assert(
      cartAfter.items[0].productId ===
        TEST_PRODUCT_ID,
      "CartItem productId berubah."
    );

    assert(
      cartAfter.items[0].skuId ===
        TEST_SKU_ID,
      "CartItem skuId berubah."
    );

    assert(
      cartAfter.items[0].quantity ===
        invalidQuantity,
      `CartItem quantity berubah. Expected=${invalidQuantity}, Actual=${cartAfter.items[0].quantity}`
    );

    console.log(
      `PASS: CartItem tetap ada dengan quantity ${invalidQuantity}.`
    );

    // ----------------------------------------------------------
    // SUCCESS
    // ----------------------------------------------------------

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "TEST 21 PASSED"
    );
    console.log(
      "============================================================"
    );

    console.log(
      "PASS: Insufficient stock ditolak."
    );

    console.log(
      "PASS: Transaction tidak menghasilkan Order."
    );

    console.log(
      "PASS: Stock tidak berubah."
    );

    console.log(
      "PASS: Tidak ada SALE StockLedger baru."
    );

    console.log(
      "PASS: CartItem tetap ada."
    );
  } catch (error) {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "TEST 21 FAILED"
    );
    console.log(
      "============================================================"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "TEST 21 CLEANUP"
    );
    console.log(
      "============================================================"
    );

    try {
      // Hapus Order yang mungkin secara tidak sengaja
      // berhasil dibuat.
      if (
        createdOrderIds.length > 0
      ) {
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
          `PASS: ${createdOrderIds.length} Order TEST 21 dihapus.`
        );
      }

      // Bersihkan Cart test user.
      await prisma.cartItem.deleteMany({
        where: {
          cart: {
            userId: TEST_USER_ID,
          },
        },
      });

      console.log(
        "PASS: Cart TEST 21 dibersihkan."
      );

      // Restore SKU.
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
        "PASS: Cleanup TEST 21 selesai."
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
