import {
  Prisma,
  PaymentMethod,
  OrderStatus,
  PaymentStatus,
  FlashSaleStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import OrderService from "@/services/order/order.service";
import {
  OrderExpirationService,
} from "@/services/order/order-expiration.service";

/**
 * FLASH SALE ORDER FLOW INTEGRATION TEST
 *
 * Production flow:
 * ProductSku
 *   -> ProductPricingService.resolve()
 *   -> OrderService.createOrder()
 *   -> FlashSaleCheckoutService.consume()
 *   -> FlashSalePurchase
 *   -> ProductSku.stock decrement
 *   -> StockLedger
 *
 * TEST 12 menguji race condition quota Flash Sale:
 * - 2 customer berbeda
 * - 1 FlashSaleItem
 * - stockLimit = 1
 * - 2 checkout dijalankan bersamaan
 *
 * Expected:
 * - tepat 1 order berhasil
 * - tepat 1 checkout ditolak
 * - soldQuantity = 1
 * - tepat 1 FlashSalePurchase
 * - tepat 1 StockLedger
 * - SKU stock berkurang tepat 1
 * - transaction yang kalah tidak meninggalkan data
 */

const TEST_USER_ID =
  "436d434a-64d9-4abf-80ed-33179ef3e4ab";

const TEST_ADDRESS_ID =
  "43a5944e-8210-4836-9ce2-b8a96d46a497";

const TEST_SKU_CODE =
  "TEST-TUNA-500GR";

const FLASH_SALE_NAME =
  `TEST ORDER FLOW ${Date.now()}`;

const FLASH_SALE_SLUG =
  `test-order-flow-${Date.now()}`;

const CONCURRENCY_PRICE =
  new Prisma.Decimal(11000);

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function section(
  number: number,
  title: string
) {
  console.log("");
  console.log(
    "------------------------------------------------------------"
  );
  console.log(
    `TEST ${number} - ${title}`
  );
  console.log(
    "------------------------------------------------------------"
  );
}

async function main() {

  let flashSaleId: string | null = null;
  let flashSaleItemId: string | null = null;

  let concurrencyFlashSaleId:
    | string
    | null = null;

  let concurrencyFlashSaleItemId:
    | string
    | null = null;

  // Dedicated Flash Sale untuk TEST 16 (Order Expiration).
  // Dipisahkan dari campaign TEST 12 agar TEST 16 tidak
  // bergantung pada state quota / per-user limit test lain.
  let expirationFlashSaleId: string | null = null;
let expirationFlashSaleItemId: string | null = null;

// Dedicated Flash Sale untuk TEST 18
// Payment vs Cancellation Concurrency.
let paymentCancelFlashSaleId: string | null = null;
let paymentCancelFlashSaleItemId: string | null = null;

  let skuId: string | null = null;

  let originalSkuStock: number | null =
    null;

  let firstOrderId: string | null =
    null;

  const additionalOrderIds: string[] =
    [];

  let secondUserId: string | null =
    null;

  let secondAddressId: string | null =
    null;

  try {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "FLASH SALE ORDER FLOW INTEGRATION TEST"
    );
    console.log(
      "============================================================"
    );

    // ==========================================================
    // TEST 1 - CUSTOMER
    // ==========================================================

    section(1, "PREPARE CUSTOMER");

    const user =
      await prisma.user.findFirst({
        where: {
          id: TEST_USER_ID,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

    assert(
      user !== null,
      "FAIL: Customer test tidak ditemukan."
    );

    assert(
      user.isActive,
      "FAIL: Customer test tidak aktif."
    );

    console.log(user);
    console.log(
      "PASS: Customer test tersedia."
    );

    // ==========================================================
    // TEST 2 - ADDRESS
    // ==========================================================

    section(2, "PREPARE ADDRESS");

    const address =
      await prisma.address.findFirst({
        where: {
          id: TEST_ADDRESS_ID,
          userId: TEST_USER_ID,
          deletedAt: null,
        },
        select: {
          id: true,
          label: true,
          receiverName: true,
          receiverPhone: true,
          fullAddress: true,
          isDefault: true,
        },
      });

    assert(
      address !== null,
      "FAIL: Address test tidak ditemukan atau bukan milik customer."
    );

    console.log(address);
    console.log(
      "PASS: Address test tersedia."
    );

    // ==========================================================
    // TEST 3 - SKU
    // ==========================================================

    section(3, "PREPARE SKU");

    const sku =
      await prisma.productSku.findFirst({
        where: {
          sku: TEST_SKU_CODE,
          isActive: true,
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
      sku !== null,
      `FAIL: SKU "${TEST_SKU_CODE}" tidak ditemukan.`
    );

    assert(
      sku.isActive,
      "FAIL: SKU test tidak aktif."
    );

    assert(
      sku.stock >= 2,
      `FAIL: Stock SKU minimal 2 diperlukan untuk seluruh test. Stock saat ini: ${sku.stock}`
    );

    skuId = sku.id;
    originalSkuStock = sku.stock;

    console.log({
      sku: sku.sku,
      skuId: sku.id,
      productId: sku.productId,
      price: sku.price.toString(),
      stock: sku.stock,
      isActive: sku.isActive,
    });

    console.log(
      "PASS: SKU test tersedia."
    );

    // ==========================================================
    // TEST 4 - CREATE ACTIVE FLASH SALE
    // ==========================================================

    section(4, "CREATE ACTIVE FLASH SALE");

    const now = new Date();

    const startAt = new Date(
      now.getTime() - 60_000
    );

    const endAt = new Date(
      now.getTime() + 10 * 60_000
    );

    const flashSale =
      await prisma.flashSale.create({
        data: {
          name: FLASH_SALE_NAME,
          slug: FLASH_SALE_SLUG,
          description:
            "Integration test Flash Sale Order Flow.",
          status:
            FlashSaleStatus.ACTIVE,
          startAt,
          endAt,
          sortOrder: 999999,
          items: {
            create: {
              productId: sku.productId,
              skuId: sku.id,
              originalPrice: sku.price,
              flashPrice:
                new Prisma.Decimal(12000),
              stockLimit: 2,
              soldQuantity: 0,
              perUserLimit: 1,
              isActive: true,
              sortOrder: 0,
            },
          },
        },
        include: {
          items: true,
        },
      });

    flashSaleId = flashSale.id;

    assert(
      flashSale.items.length === 1,
      "FAIL: Flash Sale seharusnya memiliki tepat 1 item."
    );

    flashSaleItemId =
      flashSale.items[0].id;

    const createdItem =
      flashSale.items[0];

    assert(
      createdItem.stockLimit === 2,
      `FAIL: stockLimit awal seharusnya 2, tetapi ${createdItem.stockLimit}.`
    );

    assert(
      createdItem.soldQuantity === 0,
      `FAIL: soldQuantity awal seharusnya 0, tetapi ${createdItem.soldQuantity}.`
    );

    assert(
      createdItem.perUserLimit === 1,
      `FAIL: perUserLimit awal seharusnya 1, tetapi ${createdItem.perUserLimit}.`
    );

    console.log({
      flashSaleId: flashSale.id,
      flashSaleItemId:
        createdItem.id,
      originalPrice:
        createdItem.originalPrice.toString(),
      flashPrice:
        createdItem.flashPrice.toString(),
      stockLimit:
        createdItem.stockLimit,
      soldQuantity:
        createdItem.soldQuantity,
      perUserLimit:
        createdItem.perUserLimit,
    });

    console.log(
      "PASS: Active Flash Sale berhasil dibuat."
    );

    console.log(
      "PASS: FlashSaleItem memiliki quota awal yang valid."
    );

    // ==========================================================
    // TEST 5 - PRODUCTION ORDER FLOW
    // ==========================================================

    section(
      5,
      "CREATE ORDER THROUGH PRODUCTION FLOW"
    );

    const order =
      await OrderService.createOrder({
        userId: TEST_USER_ID,
        addressId: TEST_ADDRESS_ID,
        paymentMethod:
          PaymentMethod.QRIS,
        shippingCost: 0,
        items: [
          {
            productId: sku.productId,
            skuId: sku.id,
            quantity: 1,
            customerNote:
              "Flash Sale integration test.",
          },
        ],
      });

    assert(
      order !== null,
      "FAIL: Order tidak berhasil dibuat."
    );

    assert(
      order.id,
      "FAIL: Order tidak memiliki ID."
    );

    firstOrderId = order.id;

    console.log({
      orderId: order.id,
      orderNumber:
        order.orderNumber,
      status: order.status,
      paymentStatus:
        order.paymentStatus,
      subtotal:
        order.subtotal.toString(),
      total:
        order.total.toString(),
      itemCount:
        order.items.length,
    });

    console.log(
      "PASS: Order berhasil dibuat melalui OrderService.createOrder()."
    );

    // ==========================================================
    // TEST 6 - ORDER ITEM PRICE
    // ==========================================================

    section(
      6,
      "VERIFY ORDER ITEM FLASH SALE PRICE"
    );

    assert(
      order.items.length === 1,
      `FAIL: Order seharusnya memiliki 1 item, tetapi ${order.items.length}.`
    );

    const orderItem =
      order.items[0];

    assert(
      orderItem.skuId === sku.id,
      "FAIL: OrderItem.skuId tidak sesuai dengan SKU test."
    );

    assert(
      orderItem.quantity === 1,
      `FAIL: OrderItem.quantity seharusnya 1, tetapi ${orderItem.quantity}.`
    );

    assert(
      orderItem.price.toString() ===
        "12000",
      `FAIL: OrderItem.price seharusnya 12000 karena Flash Sale, tetapi ${orderItem.price.toString()}.`
    );

    assert(
      orderItem.subtotal.toString() ===
        "12000",
      `FAIL: OrderItem.subtotal seharusnya 12000, tetapi ${orderItem.subtotal.toString()}.`
    );

    console.log({
      skuId: orderItem.skuId,
      quantity: orderItem.quantity,
      price:
        orderItem.price.toString(),
      subtotal:
        orderItem.subtotal.toString(),
    });

    console.log(
      "PASS: OrderItem menggunakan harga Flash Sale 12.000."
    );

    // ==========================================================
    // TEST 7 - FLASH SALE PURCHASE
    // ==========================================================

    section(
      7,
      "VERIFY FLASH SALE PURCHASE"
    );

    const purchases =
      await prisma.flashSalePurchase.findMany({
        where: {
          orderId: order.id,
        },
        select: {
          id: true,
          flashSaleItemId: true,
          userId: true,
          orderId: true,
          quantity: true,
          price: true,
        },
      });

    assert(
      purchases.length === 1,
      `FAIL: Order seharusnya menghasilkan tepat 1 FlashSalePurchase, tetapi ditemukan ${purchases.length}.`
    );

    const purchase =
      purchases[0];

    assert(
      purchase !== undefined,
      "FAIL: FlashSalePurchase tidak tersedia setelah query."
    );

    assert(
      purchase.orderId === order.id,
      "FAIL: FlashSalePurchase.orderId tidak sesuai."
    );

    assert(
      purchase.userId === TEST_USER_ID,
      "FAIL: FlashSalePurchase.userId tidak sesuai."
    );

    assert(
      purchase.flashSaleItemId ===
        flashSaleItemId,
      `FAIL: FlashSalePurchase.flashSaleItemId tidak sesuai. Expected ${flashSaleItemId}, actual ${purchase.flashSaleItemId}.`
    );

    assert(
      purchase.quantity === 1,
      `FAIL: FlashSalePurchase.quantity seharusnya 1, tetapi ${purchase.quantity}.`
    );

    assert(
      purchase.price.toString() ===
        "12000",
      `FAIL: FlashSalePurchase.price seharusnya 12000, tetapi ${purchase.price.toString()}.`
    );

    console.log(purchase);

    console.log(
      "PASS: FlashSalePurchase tercatat dengan orderId dan harga yang benar."
    );

    // ==========================================================
    // TEST 8 - SOLD QUANTITY
    // ==========================================================

    section(
      8,
      "VERIFY FLASH SALE SOLD QUANTITY"
    );

    const flashSaleItemAfter =
      await prisma.flashSaleItem.findUnique({
        where: {
          id: flashSaleItemId!,
        },
        select: {
          id: true,
          soldQuantity: true,
          stockLimit: true,
          perUserLimit: true,
          flashPrice: true,
        },
      });

    assert(
      flashSaleItemAfter !== null,
      "FAIL: FlashSaleItem tidak ditemukan setelah order."
    );

    assert(
      flashSaleItemAfter.soldQuantity ===
        1,
      `FAIL: soldQuantity seharusnya 1, tetapi ${flashSaleItemAfter.soldQuantity}.`
    );

    assert(
      flashSaleItemAfter.soldQuantity <=
        flashSaleItemAfter.stockLimit,
      "FAIL: soldQuantity melebihi stockLimit."
    );

    console.log({
      soldQuantity:
        flashSaleItemAfter.soldQuantity,
      stockLimit:
        flashSaleItemAfter.stockLimit,
      perUserLimit:
        flashSaleItemAfter.perUserLimit,
      flashPrice:
        flashSaleItemAfter.flashPrice.toString(),
    });

    console.log(
      "PASS: Flash Sale soldQuantity bertambah menjadi 1."
    );

    // ==========================================================
    // TEST 9 - SKU STOCK
    // ==========================================================

    section(9, "VERIFY SKU STOCK");

    const skuAfter =
      await prisma.productSku.findUnique({
        where: {
          id: sku.id,
        },
        select: {
          id: true,
          sku: true,
          stock: true,
        },
      });

    assert(
      skuAfter !== null,
      "FAIL: SKU tidak ditemukan setelah order."
    );

    const expectedStockAfterFirstOrder =
      originalSkuStock! - 1;

    assert(
      skuAfter.stock ===
        expectedStockAfterFirstOrder,
      `FAIL: Stock SKU seharusnya ${expectedStockAfterFirstOrder}, tetapi ${skuAfter.stock}.`
    );

    console.log({
      stockBefore:
        originalSkuStock,
      stockAfter:
        skuAfter.stock,
      quantitySold: 1,
    });

    console.log(
      "PASS: ProductSku.stock berkurang 1."
    );

    // ==========================================================
    // TEST 10 - STOCK LEDGER
    // ==========================================================

    section(
      10,
      "VERIFY STOCK LEDGER"
    );

    const ledger =
      await prisma.stockLedger.findFirst({
        where: {
          orderId: order.id,
          skuId: sku.id,
          type: "SALE",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          productId: true,
          skuId: true,
          orderId: true,
          type: true,
          quantity: true,
          stockBefore: true,
          stockAfter: true,
          note: true,
        },
      });

    assert(
      ledger !== null,
      "FAIL: StockLedger SALE tidak ditemukan."
    );

    assert(
      ledger.skuId === sku.id,
      "FAIL: StockLedger.skuId tidak sesuai."
    );

    assert(
      ledger.orderId === order.id,
      "FAIL: StockLedger.orderId tidak sesuai."
    );

    assert(
      ledger.quantity === -1,
      `FAIL: StockLedger.quantity seharusnya -1, tetapi ${ledger.quantity}.`
    );

    assert(
      ledger.stockBefore ===
        originalSkuStock,
      `FAIL: StockLedger.stockBefore seharusnya ${originalSkuStock}, tetapi ${ledger.stockBefore}.`
    );

    assert(
      ledger.stockAfter ===
        expectedStockAfterFirstOrder,
      `FAIL: StockLedger.stockAfter seharusnya ${expectedStockAfterFirstOrder}, tetapi ${ledger.stockAfter}.`
    );

    console.log(ledger);

    console.log(
      "PASS: StockLedger SALE tercatat dengan benar."
    );

    // ==========================================================
    // TEST 11 - PER USER LIMIT
    // ==========================================================

    section(
      11,
      "VERIFY PER-USER LIMIT"
    );

    let secondOrderRejected =
      false;

    try {
      await OrderService.createOrder({
        userId: TEST_USER_ID,
        addressId: TEST_ADDRESS_ID,
        paymentMethod:
          PaymentMethod.QRIS,
        shippingCost: 0,
        items: [
          {
            productId: sku.productId,
            skuId: sku.id,
            quantity: 1,
            customerNote:
              "Second Flash Sale purchase - should be rejected.",
          },
        ],
      });
    } catch (error) {
      const message =
        getErrorMessage(error);

      console.log(
        "Expected rejection:"
      );
      console.log(message);

      if (
        message.includes(
          "Batas pembelian Flash Sale"
        )
      ) {
        secondOrderRejected = true;
      } else {
        throw error;
      }
    }

    assert(
      secondOrderRejected,
      "FAIL: Pembelian kedua seharusnya ditolak oleh perUserLimit."
    );

    console.log(
      "PASS: Pembelian kedua customer yang sama ditolak oleh perUserLimit."
    );

    const flashSaleState =
      await prisma.flashSaleItem.findUnique({
        where: {
          id: flashSaleItemId!,
        },
        select: {
          soldQuantity: true,
          stockLimit: true,
          perUserLimit: true,
          isActive: true,
        },
      });

    assert(
      flashSaleState !== null,
      "FAIL: FlashSaleItem tidak ditemukan setelah pembelian kedua ditolak."
    );

    assert(
      flashSaleState.soldQuantity === 1,
      `FAIL: soldQuantity seharusnya tetap 1, tetapi ${flashSaleState.soldQuantity}.`
    );

    assert(
      flashSaleState.stockLimit === 2,
      `FAIL: stockLimit seharusnya tetap 2, tetapi ${flashSaleState.stockLimit}.`
    );

    assert(
      flashSaleState.perUserLimit === 1,
      `FAIL: perUserLimit seharusnya tetap 1, tetapi ${flashSaleState.perUserLimit}.`
    );

    const purchaseCount =
      await prisma.flashSalePurchase.count({
        where: {
          flashSaleItemId:
            flashSaleItemId!,
          userId: TEST_USER_ID,
        },
      });

    assert(
      purchaseCount === 1,
      `FAIL: Customer seharusnya hanya memiliki 1 FlashSalePurchase, tetapi ditemukan ${purchaseCount}.`
    );

    console.log(
      "PASS: State Flash Sale tetap konsisten setelah perUserLimit ditolak."
    );

    console.log(
      "PASS: Tidak ada FlashSalePurchase tambahan setelah limit ditolak."
    );

    // ==========================================================
    // TEST 12 - GLOBAL QUOTA CONCURRENCY
    // ==========================================================

    section(
      12,
      "VERIFY GLOBAL QUOTA CONCURRENCY"
    );

    /**
     * Customer kedua:
     * gunakan customer existing yang aktif.
     * Address dibuat khusus untuk test dan dihapus saat cleanup.
     */

    const secondUser =
      await prisma.user.findFirst({
        where: {
          role: "CUSTOMER",
          isActive: true,
          deletedAt: null,
          id: {
            not: TEST_USER_ID,
          },
        },
        select: {
          id: true,
          email: true,
        },
        orderBy: {
          id: "asc",
        },
      });

    assert(
      secondUser !== null,
      "FAIL: Customer kedua untuk concurrency test tidak ditemukan."
    );

    secondUserId = secondUser.id;

    const temporaryAddress =
      await prisma.address.create({
        data: {
          userId: secondUser.id,
          receiverName:
            "Flash Sale Concurrency Test",
          receiverPhone:
            "081234567890",
          province:
            "DI Yogyakarta",
          city: "Bantul",
          district: "Bantul",
          village: "Trirenggo",
          postalCode: "55714",
          fullAddress:
            "Temporary address for Flash Sale concurrency integration test.",
          label:
            "TEST FLASH SALE CONCURRENCY",
          notes:
            "Temporary integration test address.",
          isDefault: false,
        },
        select: {
          id: true,
        },
      });

    secondAddressId =
      temporaryAddress.id;

    console.log({
      secondUserId:
        secondUser.id,
      secondUserEmail:
        secondUser.email,
      secondAddressId:
        temporaryAddress.id,
    });

    /**
     * Matikan campaign pertama sementara supaya
     * ProductPricingService tidak memilih campaign lama.
     *
     * Setelah concurrency test selesai, status dikembalikan ACTIVE.
     */

    await prisma.flashSale.update({
      where: {
        id: flashSaleId!,
      },
      data: {
        status:
          FlashSaleStatus.ENDED,
      },
    });

    /**
     * Flash Sale khusus concurrency:
     *
     * stockLimit = 1
     * soldQuantity = 0
     * perUserLimit = 1
     *
     * Hanya satu dari dua checkout yang boleh menang.
     */

    const concurrencyNow =
      new Date();

    const concurrencyFlashSale =
      await prisma.flashSale.create({
        data: {
          name:
            `TEST CONCURRENCY ${Date.now()}`,
          slug:
            `test-concurrency-${Date.now()}`,
          description:
            "Flash Sale global quota concurrency integration test.",
          status:
            FlashSaleStatus.ACTIVE,
          startAt:
            new Date(
              concurrencyNow.getTime() -
                60_000
            ),
          endAt:
            new Date(
              concurrencyNow.getTime() +
                10 * 60_000
            ),
          sortOrder:
            1_000_001,
          items: {
            create: {
              productId:
                sku.productId,
              skuId: sku.id,
              originalPrice:
                sku.price,
              flashPrice:
                CONCURRENCY_PRICE,
              stockLimit: 1,
              soldQuantity: 0,
              perUserLimit: 1,
              isActive: true,
              sortOrder: 0,
            },
          },
        },
        include: {
          items: true,
        },
      });

    concurrencyFlashSaleId =
      concurrencyFlashSale.id;

    assert(
      concurrencyFlashSale.items.length === 1,
      "FAIL: Concurrency Flash Sale harus memiliki 1 item."
    );

    concurrencyFlashSaleItemId =
      concurrencyFlashSale.items[0].id;

    console.log({
      concurrencyFlashSaleId:
        concurrencyFlashSale.id,
      concurrencyFlashSaleItemId:
        concurrencyFlashSale.items[0].id,
      stockLimit:
        concurrencyFlashSale.items[0]
          .stockLimit,
      soldQuantity:
        concurrencyFlashSale.items[0]
          .soldQuantity,
      perUserLimit:
        concurrencyFlashSale.items[0]
          .perUserLimit,
      flashPrice:
        concurrencyFlashSale.items[0]
          .flashPrice.toString(),
    });

    assert(
      concurrencyFlashSale.items[0]
        .stockLimit === 1,
      "FAIL: Concurrency Flash Sale stockLimit harus 1."
    );

    assert(
      concurrencyFlashSale.items[0]
        .soldQuantity === 0,
      "FAIL: Concurrency Flash Sale soldQuantity awal harus 0."
    );

    console.log(
      "PASS: Concurrency Flash Sale berhasil dibuat dengan quota 1."
    );

    const skuBeforeConcurrency =
      await prisma.productSku.findUnique({
        where: {
          id: sku.id,
        },
        select: {
          stock: true,
        },
      });

    assert(
      skuBeforeConcurrency !== null,
      "FAIL: SKU tidak ditemukan sebelum concurrency test."
    );

    /**
     * Jalankan dua checkout secara bersamaan.
     *
     * Customer berbeda -> bukan perUserLimit.
     * FlashSaleItem sama -> menguji global quota.
     */

    const concurrencyResults =
      await Promise.allSettled([
        OrderService.createOrder({
          userId: TEST_USER_ID,
          addressId: TEST_ADDRESS_ID,
          paymentMethod:
            PaymentMethod.QRIS,
          shippingCost: 0,
          items: [
            {
              productId:
                sku.productId,
              skuId: sku.id,
              quantity: 1,
              customerNote:
                "Concurrency checkout A.",
            },
          ],
        }),

        OrderService.createOrder({
          userId:
            secondUser.id,
          addressId:
            temporaryAddress.id,
          paymentMethod:
            PaymentMethod.QRIS,
          shippingCost: 0,
          items: [
            {
              productId:
                sku.productId,
              skuId: sku.id,
              quantity: 1,
              customerNote:
                "Concurrency checkout B.",
            },
          ],
        }),
      ]);

    const successfulResults =
      concurrencyResults.filter(
        (
          result
        ): result is PromiseFulfilledResult<
          Awaited<
            ReturnType<
              typeof OrderService.createOrder
            >
          >
        > =>
          result.status ===
          "fulfilled"
      );

    const rejectedResults =
      concurrencyResults.filter(
        (result) =>
          result.status ===
          "rejected"
      );

    console.log({
      successful:
        successfulResults.length,
      rejected:
        rejectedResults.length,
    });

    for (
      const [index, result] of
        concurrencyResults.entries()
    ) {
      if (
        result.status ===
        "fulfilled"
      ) {
        console.log(
          `Concurrency checkout ${index + 1}: SUCCESS`,
          {
            orderId:
              result.value.id,
            orderNumber:
              result.value
                .orderNumber,
          }
        );

        additionalOrderIds.push(
          result.value.id
        );
      } else {
        console.log(
          `Concurrency checkout ${index + 1}: REJECTED`,
          getErrorMessage(
            result.reason
          )
        );
      }
    }

    assert(
      successfulResults.length === 1,
      `FAIL: Concurrency harus menghasilkan tepat 1 checkout berhasil, tetapi ${successfulResults.length}.`
    );

    assert(
      rejectedResults.length === 1,
      `FAIL: Concurrency harus menghasilkan tepat 1 checkout ditolak, tetapi ${rejectedResults.length}.`
    );

    console.log(
      "PASS: Tepat 1 dari 2 checkout concurrent berhasil."
    );

    /**
     * Verify order sukses benar-benar menggunakan
     * Flash Sale concurrency.
     */

    const concurrencyOrder =
      successfulResults[0].value;

    assert(
      concurrencyOrder.items.length === 1,
      "FAIL: Concurrency order seharusnya memiliki 1 item."
    );

    assert(
      concurrencyOrder.items[0]
        .price.toString() ===
        CONCURRENCY_PRICE.toString(),
      `FAIL: Harga concurrency order seharusnya ${CONCURRENCY_PRICE.toString()}, tetapi ${concurrencyOrder.items[0].price.toString()}.`
    );

    console.log(
      "PASS: Order pemenang menggunakan harga Flash Sale concurrency."
    );

    /**
     * Verify quota.
     */

    const concurrencyItemAfter =
      await prisma.flashSaleItem.findUnique({
        where: {
          id:
            concurrencyFlashSaleItemId!,
        },
        select: {
          stockLimit: true,
          soldQuantity: true,
          perUserLimit: true,
        },
      });

    assert(
      concurrencyItemAfter !== null,
      "FAIL: Concurrency FlashSaleItem tidak ditemukan."
    );

    assert(
      concurrencyItemAfter.stockLimit === 1,
      `FAIL: Concurrency stockLimit seharusnya 1, tetapi ${concurrencyItemAfter.stockLimit}.`
    );

    assert(
      concurrencyItemAfter.soldQuantity === 1,
      `FAIL: Concurrency soldQuantity harus tepat 1, tetapi ${concurrencyItemAfter.soldQuantity}.`
    );

    console.log(
      "PASS: Global Flash Sale quota hanya terpakai 1 item."
    );

    /**
     * Verify hanya satu FlashSalePurchase.
     */

    const concurrencyPurchases =
      await prisma.flashSalePurchase.findMany({
        where: {
          flashSaleItemId:
            concurrencyFlashSaleItemId!,
        },
        select: {
          id: true,
          userId: true,
          orderId: true,
          quantity: true,
          price: true,
        },
      });

    assert(
      concurrencyPurchases.length === 1,
      `FAIL: Concurrency harus menghasilkan tepat 1 FlashSalePurchase, tetapi ${concurrencyPurchases.length}.`
    );

    assert(
      concurrencyPurchases[0]
        .quantity === 1,
      "FAIL: Concurrency purchase quantity harus 1."
    );

    assert(
      concurrencyPurchases[0]
        .price.toString() ===
        CONCURRENCY_PRICE.toString(),
      "FAIL: Concurrency purchase price tidak sesuai."
    );

    console.log(
      "PASS: Hanya 1 FlashSalePurchase tercatat."
    );

    /**
     * Verify stock hanya berkurang 1.
     */

    const skuAfterConcurrency =
      await prisma.productSku.findUnique({
        where: {
          id: sku.id,
        },
        select: {
          stock: true,
        },
      });

    assert(
      skuAfterConcurrency !== null,
      "FAIL: SKU tidak ditemukan setelah concurrency test."
    );

    const expectedConcurrencyStock =
      skuBeforeConcurrency.stock - 1;

    assert(
      skuAfterConcurrency.stock ===
        expectedConcurrencyStock,
      `FAIL: Stock SKU setelah concurrency seharusnya ${expectedConcurrencyStock}, tetapi ${skuAfterConcurrency.stock}.`
    );

    console.log(
      "PASS: ProductSku.stock hanya berkurang 1 pada concurrency test."
    );

    /**
     * Verify tepat satu StockLedger untuk
     * Flash Sale concurrency.
     */

    const concurrencyLedgers =
      await prisma.stockLedger.findMany({
        where: {
          orderId:
            concurrencyOrder.id,
          skuId: sku.id,
          type: "SALE",
        },
        select: {
          id: true,
          orderId: true,
          skuId: true,
          quantity: true,
          stockBefore: true,
          stockAfter: true,
        },
      });

    assert(
      concurrencyLedgers.length === 1,
      `FAIL: Concurrency order harus memiliki tepat 1 StockLedger SALE, tetapi ${concurrencyLedgers.length}.`
    );

    assert(
      concurrencyLedgers[0].quantity === -1,
      "FAIL: Concurrency StockLedger quantity harus -1."
    );

    console.log(
      "PASS: Tepat 1 StockLedger SALE tercatat."
    );

    /**
     * Verify tidak ada order tambahan yang tersisa
     * dari checkout yang ditolak.
     *
     * Kedua order ID hanya ditambahkan dari hasil fulfilled.
     * Jadi rejected transaction tidak boleh menghasilkan
     * order yang bisa ditemukan.
     */

    const concurrencyOrders =
      await prisma.order.findMany({
        where: {
          id: {
            in: additionalOrderIds,
          },
        },
        select: {
          id: true,
          userId: true,
          status: true,
        },
      });

    assert(
      concurrencyOrders.length === 1,
      `FAIL: Harus hanya ada 1 order hasil concurrency, tetapi ditemukan ${concurrencyOrders.length}.`
    );

    console.log(
      "PASS: Tidak ada order yatim dari checkout yang kalah."
    );

    /**
     * Restore campaign pertama supaya state
     * sebelum Test 12 kembali seperti semula.
     */

    await prisma.flashSale.update({
      where: {
        id: flashSaleId!,
      },
      data: {
        status:
          FlashSaleStatus.ACTIVE,
      },
    });

    console.log(
      "PASS: Status Flash Sale utama dikembalikan ACTIVE."
    );

    /**
     * ========================================================
     * TEST 13
     * VERIFY ORDER CANCELLATION
     * ========================================================
     *
     * Menggunakan concurrencyOrder yang sudah berhasil
     * pada TEST 12.
     *
     * Sebelum cancellation:
     *
     * - Order = PENDING
     * - FlashSalePurchase = 1
     * - FlashSaleItem.soldQuantity = 1
     * - ProductSku.stock = baseline - 1
     *
     * Setelah cancellation:
     *
     * - Order = CANCELLED
     * - FlashSalePurchase = 0
     * - FlashSaleItem.soldQuantity = 0
     * - ProductSku.stock kembali ke baseline
     * - StockLedger CANCEL = +1
     */

    section(
      13,
      "VERIFY ORDER CANCELLATION"
    );

    /**
     * ========================================================
     * BASELINE SEBELUM CANCELLATION
     * ========================================================
     */

    const skuBeforeCancellation =
      await prisma.productSku.findUnique({
        where: {
          id:
            sku.id,
        },

        select: {
          stock: true,
        },
      });

    assert(
      skuBeforeCancellation !== null,
      "FAIL: SKU tidak ditemukan sebelum cancellation test."
    );

    /**
     * Setelah concurrency:
     *
     * stock = skuBeforeConcurrency.stock - 1
     */

    const expectedStockBeforeCancellation =
      skuBeforeConcurrency.stock - 1;

    assert(
      skuBeforeCancellation.stock ===
        expectedStockBeforeCancellation,
      `FAIL: Stock sebelum cancellation seharusnya ${expectedStockBeforeCancellation}, tetapi ${skuBeforeCancellation.stock}.`
    );

    /**
     * Verify order masih PENDING sebelum cancellation.
     */

    const orderBeforeCancellation =
      await prisma.order.findUnique({
        where: {
          id:
            concurrencyOrder.id,
        },

        select: {
          id: true,
          status: true,
          paymentStatus: true,
        },
      });

    assert(
      orderBeforeCancellation !== null,
      "FAIL: Order concurrency tidak ditemukan sebelum cancellation."
    );

    assert(
      orderBeforeCancellation.status ===
        OrderStatus.PENDING,
      `FAIL: Status order sebelum cancellation seharusnya PENDING, tetapi ${orderBeforeCancellation.status}.`
    );

    console.log({
      orderId:
        concurrencyOrder.id,

      orderNumber:
        concurrencyOrder.orderNumber,

      statusBefore:
        orderBeforeCancellation.status,

      paymentStatus:
        orderBeforeCancellation.paymentStatus,

      skuStockBefore:
        skuBeforeCancellation.stock,

      expectedSkuStock:
        expectedStockBeforeCancellation,
    });

    /**
     * ========================================================
     * EXECUTE CANCELLATION
     * ========================================================
     */

    const cancelledOrder =
      await OrderService.cancelOrder(
        concurrencyOrder.id
      );

    assert(
      cancelledOrder !== null,
      "FAIL: cancelOrder() tidak mengembalikan order."
    );

    assert(
      cancelledOrder.id ===
        concurrencyOrder.id,
      "FAIL: Order yang dibatalkan tidak sesuai."
    );

    assert(
      cancelledOrder.status ===
        OrderStatus.CANCELLED,
      `FAIL: Status order setelah cancellation seharusnya CANCELLED, tetapi ${cancelledOrder.status}.`
    );

    console.log({
      orderId:
        cancelledOrder.id,

      orderNumber:
        cancelledOrder.orderNumber,

      status:
        cancelledOrder.status,
    });

    console.log(
      "PASS: Order berhasil dibatalkan melalui OrderService.cancelOrder()."
    );

    /**
     * ========================================================
     * VERIFY ORDER STATUS
     * ========================================================
     */

    const orderAfterCancellation =
      await prisma.order.findUnique({
        where: {
          id:
            concurrencyOrder.id,
        },

        select: {
          id: true,
          status: true,
          paymentStatus: true,
        },
      });

    assert(
      orderAfterCancellation !== null,
      "FAIL: Order tidak ditemukan setelah cancellation."
    );

    assert(
      orderAfterCancellation.status ===
        OrderStatus.CANCELLED,
      "FAIL: Status order tidak menjadi CANCELLED."
    );

    console.log(
      "PASS: Status order menjadi CANCELLED."
    );

    /**
     * ========================================================
     * VERIFY FLASH SALE PURCHASE RELEASE
     * ========================================================
     */

    const purchasesAfterCancellation =
      await prisma.flashSalePurchase.findMany({
        where: {
          orderId:
            concurrencyOrder.id,
        },

        select: {
          id: true,
          flashSaleItemId: true,
          userId: true,
          orderId: true,
          quantity: true,
          price: true,
        },
      });

    assert(
      purchasesAfterCancellation.length === 0,
      `FAIL: FlashSalePurchase seharusnya sudah dilepas setelah cancellation, tetapi masih ditemukan ${purchasesAfterCancellation.length}.`
    );

    console.log(
      "PASS: FlashSalePurchase berhasil dilepas setelah cancellation."
    );

    /**
     * ========================================================
     * VERIFY FLASH SALE QUOTA RELEASE
     * ========================================================
     */

    const flashSaleAfterCancellation =
      await prisma.flashSaleItem.findUnique({
        where: {
          id:
            concurrencyFlashSaleItemId!,
        },

        select: {
          stockLimit: true,
          soldQuantity: true,
          perUserLimit: true,
          isActive: true,
        },
      });

    assert(
      flashSaleAfterCancellation !== null,
      "FAIL: FlashSaleItem tidak ditemukan setelah cancellation."
    );

    assert(
      flashSaleAfterCancellation.stockLimit ===
        1,
      "FAIL: FlashSale stockLimit berubah setelah cancellation."
    );

    assert(
      flashSaleAfterCancellation.soldQuantity ===
        0,
      `FAIL: soldQuantity seharusnya kembali 0 setelah cancellation, tetapi ${flashSaleAfterCancellation.soldQuantity}.`
    );

    assert(
      flashSaleAfterCancellation.perUserLimit ===
        1,
      "FAIL: perUserLimit berubah setelah cancellation."
    );

    console.log(
      "PASS: Flash Sale quota dikembalikan setelah cancellation."
    );

    /**
     * ========================================================
     * VERIFY SKU STOCK RELEASE
     * ========================================================
     */

    const skuAfterCancellation =
      await prisma.productSku.findUnique({
        where: {
          id:
            sku.id,
        },

        select: {
          stock: true,
        },
      });

    assert(
      skuAfterCancellation !== null,
      "FAIL: SKU tidak ditemukan setelah cancellation."
    );

    assert(
      skuAfterCancellation.stock ===
        skuBeforeConcurrency.stock,
      `FAIL: Stock SKU seharusnya kembali ${skuBeforeConcurrency.stock}, tetapi ${skuAfterCancellation.stock}.`
    );

    console.log(
      "PASS: ProductSku.stock berhasil dikembalikan ke nilai sebelum concurrency."
    );

    /**
     * ========================================================
     * VERIFY CANCEL STOCK LEDGER
     * ========================================================
     */

    const cancellationLedgers =
      await prisma.stockLedger.findMany({
        where: {
          orderId:
            concurrencyOrder.id,

          skuId:
            sku.id,

          type:
            "CANCEL",
        },

        select: {
          id: true,
          orderId: true,
          skuId: true,
          type: true,
          quantity: true,
          stockBefore: true,
          stockAfter: true,
          note: true,
        },
      });

    assert(
      cancellationLedgers.length ===
        1,
      `FAIL: Seharusnya tepat 1 StockLedger CANCEL, tetapi ditemukan ${cancellationLedgers.length}.`
    );

    const cancellationLedger =
      cancellationLedgers[0];

    assert(
      cancellationLedger !== undefined,
      "FAIL: StockLedger CANCEL tidak tersedia."
    );

    assert(
      cancellationLedger.quantity ===
        1,
      `FAIL: StockLedger CANCEL quantity seharusnya +1, tetapi ${cancellationLedger.quantity}.`
    );

    assert(
      cancellationLedger.stockBefore ===
        expectedStockBeforeCancellation,
      `FAIL: StockLedger CANCEL stockBefore seharusnya ${expectedStockBeforeCancellation}, tetapi ${cancellationLedger.stockBefore}.`
    );

    assert(
      cancellationLedger.stockAfter ===
        skuBeforeConcurrency.stock,
      `FAIL: StockLedger CANCEL stockAfter seharusnya ${skuBeforeConcurrency.stock}, tetapi ${cancellationLedger.stockAfter}.`
    );

    console.log({
      ledgerId:
        cancellationLedger.id,

      quantity:
        cancellationLedger.quantity,

      stockBefore:
        cancellationLedger.stockBefore,

      stockAfter:
        cancellationLedger.stockAfter,
    });

    console.log(
      "PASS: StockLedger CANCEL tercatat dengan benar."
    );

    /**
     * ========================================================
     * TEST 14
     * VERIFY DOUBLE CANCELLATION REJECTION
     * ========================================================
     *
     * Order yang sudah CANCELLED tidak boleh dibatalkan
     * kembali.
     *
     * Tidak boleh terjadi:
     *
     * - stock +1 lagi
     * - soldQuantity berubah
     * - FlashSalePurchase baru
     * - StockLedger CANCEL kedua
     */

    section(
      14,
      "VERIFY DOUBLE CANCELLATION REJECTION"
    );

    let secondCancellationRejected =
      false;

    try {
      await OrderService.cancelOrder(
        concurrencyOrder.id
      );

      console.log(
        "FAIL: Cancellation kedua seharusnya ditolak."
      );
    } catch (error) {
      secondCancellationRejected =
        true;

      console.log(
        "Expected rejection:",
        getErrorMessage(error)
      );
    }

    assert(
      secondCancellationRejected,
      "FAIL: Order CANCELLED masih dapat dibatalkan kembali."
    );

    console.log(
      "PASS: Cancellation kedua customer/order yang sama ditolak."
    );

    /**
     * ========================================================
     * VERIFY STATE TETAP KONSISTEN
     * ========================================================
     */

    const finalOrderState =
      await prisma.order.findUnique({
        where: {
          id:
            concurrencyOrder.id,
        },

        select: {
          status: true,
        },
      });

    assert(
      finalOrderState !== null,
      "FAIL: Order tidak ditemukan saat final cancellation verification."
    );

    assert(
      finalOrderState.status ===
        OrderStatus.CANCELLED,
      "FAIL: Status order berubah setelah cancellation kedua ditolak."
    );

    const finalSkuState =
      await prisma.productSku.findUnique({
        where: {
          id:
            sku.id,
        },

        select: {
          stock: true,
        },
      });

    assert(
      finalSkuState !== null,
      "FAIL: SKU tidak ditemukan saat final cancellation verification."
    );

    assert(
      finalSkuState.stock ===
        skuBeforeConcurrency.stock,
      `FAIL: Stock SKU berubah setelah cancellation kedua. Expected ${skuBeforeConcurrency.stock}, actual ${finalSkuState.stock}.`
    );

    const finalFlashSaleState =
      await prisma.flashSaleItem.findUnique({
        where: {
          id:
            concurrencyFlashSaleItemId!,
        },

        select: {
          soldQuantity: true,
        },
      });

    assert(
      finalFlashSaleState !== null,
      "FAIL: FlashSaleItem tidak ditemukan saat final cancellation verification."
    );

    assert(
      finalFlashSaleState.soldQuantity ===
        0,
      `FAIL: soldQuantity berubah setelah cancellation kedua. Expected 0, actual ${finalFlashSaleState.soldQuantity}.`
    );

    const finalPurchaseCount =
      await prisma.flashSalePurchase.count({
        where: {
          orderId:
            concurrencyOrder.id,
        },
      });

    assert(
      finalPurchaseCount ===
        0,
      `FAIL: FlashSalePurchase muncul kembali setelah cancellation kedua. Count: ${finalPurchaseCount}.`
    );

    const finalCancelLedgerCount =
      await prisma.stockLedger.count({
        where: {
          orderId:
            concurrencyOrder.id,

          skuId:
            sku.id,

          type:
            "CANCEL",
        },
      });

    assert(
      finalCancelLedgerCount ===
        1,
      `FAIL: Cancellation kedua membuat StockLedger CANCEL tambahan. Count: ${finalCancelLedgerCount}.`
    );

    console.log(
      "PASS: State stock, Flash Sale, purchase, dan ledger tetap konsisten setelah cancellation kedua ditolak."
    );

        /**
     * ========================================================
     * TEST 15
     * VERIFY FLASH SALE PURCHASE IDEMPOTENCY
     * ========================================================
     *
     * Memastikan kombinasi:
     *
     *   orderId + flashSaleItemId
     *
     * hanya dapat memiliki satu FlashSalePurchase.
     *
     * Test ini terutama memverifikasi unique constraint:
     *
     *   @@unique([orderId, flashSaleItemId])
     *
     * Selain itu memastikan percobaan duplicate tidak
     * mengubah soldQuantity.
     */

    section(
      15,
      "VERIFY FLASH SALE PURCHASE IDEMPOTENCY"
    );

    /**
     * ========================================================
     * PREPARE IDEMPOTENCY CUSTOMER
     * ========================================================
     *
     * Jangan menggunakan TEST_USER_ID karena customer tersebut
     * sudah memiliki FlashSalePurchase dari TEST 5.
     *
     * secondUserId aman digunakan karena:
     *
     * - Jika menang pada TEST 12:
     *   TEST 13 sudah melakukan cancellation dan purchase
     *   sudah dilepas.
     *
     * - Jika kalah pada TEST 12:
     *   transaction checkout sudah rollback.
     *
     * Dengan demikian customer kedua tidak memiliki usage
     * Flash Sale aktif ketika TEST 15 dimulai.
     */

    assert(
      secondUserId !== null,
      "FAIL: Customer kedua tidak tersedia untuk idempotency test."
    );

    assert(
      secondAddressId !== null,
      "FAIL: Address customer kedua tidak tersedia untuk idempotency test."
    );

    console.log({
      idempotencyUserId:
        secondUserId,

      idempotencyAddressId:
        secondAddressId,
    });

    console.log(
      "PASS: Customer kedua siap digunakan untuk idempotency test."
    );

    /**
     * ========================================================
     * VERIFY NO EXISTING FLASH SALE USAGE
     * ========================================================
     */

    const existingIdempotencyUsage =
      await prisma.flashSalePurchase.aggregate({
        where: {
          flashSaleItemId:
            concurrencyFlashSaleItemId!,

          userId:
            secondUserId,
        },

        _sum: {
          quantity: true,
        },
      });

    const existingIdempotencyQuantity =
      existingIdempotencyUsage._sum.quantity ??
      0;

    assert(
      existingIdempotencyQuantity === 0,
      `FAIL: Customer kedua masih memiliki FlashSalePurchase aktif. Quantity: ${existingIdempotencyQuantity}.`
    );

    console.log(
      "PASS: Customer kedua tidak memiliki FlashSalePurchase aktif."
    );

    const debugFlashSale =
  await prisma.flashSaleItem.findMany({
    where: {
      productId: sku.productId,
      skuId: sku.id,
    },
    select: {
      id: true,
      productId: true,
      skuId: true,
      isActive: true,
      stockLimit: true,
      soldQuantity: true,
      flashPrice: true,
      flashSale: {
        select: {
          id: true,
          name: true,
          status: true,
          startAt: true,
          endAt: true,
          deletedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

console.log(
  "DEBUG TEST 15 - FLASH SALE ITEMS:",
  JSON.stringify(
    debugFlashSale,
    (_, value) =>
      value instanceof Prisma.Decimal
        ? value.toString()
        : value instanceof Date
          ? value.toISOString()
          : value,
    2
  )
);

    /**
     * ========================================================
     * PREPARE CURRENT STATE
     * ========================================================
     *
     * Order concurrency sudah CANCELLED pada TEST 13.
     *
     * Karena TEST 13 melakukan release:
     *
     * - FlashSalePurchase sudah dihapus
     * - soldQuantity kembali 0
     * - stock SKU kembali
     *
     * Oleh karena itu kita tidak dapat memakai order
     * yang sudah CANCELLED untuk test duplicate purchase.
     *
     * Buat order baru menggunakan production flow.
     */

        const idempotencyOrder =
      await OrderService.createOrder({
        userId:
          secondUserId,

        addressId:
          secondAddressId,

        paymentMethod:
          PaymentMethod.QRIS,

        shippingCost:
          0,

        items: [
          {
            productId:
              sku.productId,

            skuId:
              sku.id,

            quantity:
              1,

            customerNote:
              "Flash Sale idempotency integration test.",
          },
        ],
      });

    assert(
      idempotencyOrder !== null,
      "FAIL: Order idempotency tidak berhasil dibuat."
    );

    assert(
      idempotencyOrder.id,
      "FAIL: Order idempotency tidak memiliki ID."
    );

    const idempotencyOrderId =
      idempotencyOrder.id;

    additionalOrderIds.push(
      idempotencyOrderId
    );

    console.log({
      orderId:
        idempotencyOrder.id,

      orderNumber:
        idempotencyOrder.orderNumber,

      status:
        idempotencyOrder.status,

      paymentStatus:
        idempotencyOrder.paymentStatus,
    });

    console.log(
      "PASS: Order idempotency berhasil dibuat."
    );

    /**
     * ========================================================
     * VERIFY FIRST PURCHASE
     * ========================================================
     */

    /**
 * ========================================================
 * VERIFY FIRST PURCHASE
 * ========================================================
 *
 * Jangan mengasumsikan TEST 15 menggunakan
 * concurrencyFlashSaleItemId dari TEST 12.
 *
 * Production pricing menentukan FlashSaleItem.
 * Karena itu kita mengambil FlashSalePurchase aktual
 * berdasarkan orderId.
 */

const idempotencyPurchases =
  await prisma.flashSalePurchase.findMany({
    where: {
      orderId:
        idempotencyOrder.id,
    },

    select: {
      id: true,

      orderId: true,

      flashSaleItemId: true,

      userId: true,

      quantity: true,

      price: true,
    },
  });

assert(
  idempotencyPurchases.length === 1,
  `FAIL: Order idempotency seharusnya memiliki tepat 1 FlashSalePurchase, ditemukan ${idempotencyPurchases.length}.`
);

const firstPurchase =
  idempotencyPurchases[0];

assert(
  firstPurchase !== undefined,
  "FAIL: FlashSalePurchase pertama tidak ditemukan."
);

assert(
  firstPurchase.orderId ===
    idempotencyOrder.id,
  "FAIL: Purchase pertama memiliki orderId yang salah."
);

assert(
  firstPurchase.userId ===
    secondUserId,
  "FAIL: Purchase pertama memiliki userId yang salah."
);

assert(
  firstPurchase.quantity ===
    1,
  `FAIL: Purchase pertama seharusnya quantity 1, actual ${firstPurchase.quantity}.`
);

assert(
  firstPurchase.flashSaleItemId.length >
    0,
  "FAIL: Purchase pertama tidak memiliki flashSaleItemId."
);

console.log({
  purchaseId:
    firstPurchase.id,

  orderId:
    firstPurchase.orderId,

  flashSaleItemId:
    firstPurchase.flashSaleItemId,

  quantity:
    firstPurchase.quantity,

  price:
    firstPurchase.price.toString(),
});

console.log(
  "PASS: FlashSalePurchase pertama berhasil dibuat."
);

/**
 * ========================================================
 * RESOLVE ACTUAL FLASH SALE ITEM
 * ========================================================
 *
 * Ini adalah FlashSaleItem yang benar-benar dipakai
 * oleh production pricing + checkout flow.
 */

const idempotencyFlashSaleItemId =
  firstPurchase.flashSaleItemId;

assert(
  idempotencyFlashSaleItemId ===
    firstPurchase.flashSaleItemId,
  "FAIL: FlashSaleItem idempotency tidak konsisten."
);

    /**
     * ========================================================
     * SNAPSHOT SOLD QUANTITY
     * ========================================================
     */

    const beforeDuplicate =
  await prisma.flashSaleItem.findUnique({
    where: {
      id:
        idempotencyFlashSaleItemId,
    },

    select: {
      soldQuantity: true,

      stockLimit: true,
    },
  });

assert(
  beforeDuplicate !== null,
  "FAIL: FlashSaleItem tidak ditemukan sebelum duplicate test."
);

console.log(
  `PASS: Snapshot FlashSaleItem berhasil diambil. soldQuantity saat ini: ${beforeDuplicate.soldQuantity}, stockLimit: ${beforeDuplicate.stockLimit}.`
);

    /**
     * ========================================================
     * DUPLICATE PURCHASE
     * ========================================================
     *
     * Coba membuat FlashSalePurchase kedua dengan:
     *
     * orderId yang sama
     * +
     * flashSaleItemId yang sama
     *
     * Database harus menolak operasi ini melalui:
     *
     * @@unique([orderId, flashSaleItemId])
     */

    let duplicateRejected =
      false;

    try {
      await prisma.flashSalePurchase.create({
        data: {
          orderId:
            idempotencyOrder.id,

          flashSaleItemId:
            idempotencyFlashSaleItemId,

          userId:
  secondUserId,

          quantity:
            1,

          price:
            firstPurchase.price,
        },
      });

      console.log(
        "FAIL: Duplicate FlashSalePurchase berhasil dibuat."
      );
    } catch (error) {
      duplicateRejected =
        true;

      console.log(
        "Expected rejection:",
        getErrorMessage(error)
      );
    }

    assert(
      duplicateRejected,
      "FAIL: Database tidak menolak duplicate FlashSalePurchase."
    );

    console.log(
      "PASS: Duplicate FlashSalePurchase ditolak oleh unique constraint."
    );

    /**
     * ========================================================
     * VERIFY PURCHASE COUNT
     * ========================================================
     */

    const purchaseCountAfterDuplicate =
      await prisma.flashSalePurchase.count({
        where: {
          orderId:
            idempotencyOrder.id,

          flashSaleItemId:
            idempotencyFlashSaleItemId,
        },
      });

    assert(
      purchaseCountAfterDuplicate ===
        1,
      `FAIL: Purchase count seharusnya tetap 1, actual ${purchaseCountAfterDuplicate}.`
    );

    console.log(
      "PASS: FlashSalePurchase tetap tepat 1 record."
    );

    /**
     * ========================================================
     * VERIFY SOLD QUANTITY
     * ========================================================
     *
     * Penting:
     *
     * Duplicate database insert tidak boleh menyebabkan
     * soldQuantity berubah.
     *
     * Prisma create di atas tidak melakukan increment
     * soldQuantity, tetapi assertion ini memastikan state
     * database tetap sesuai ekspektasi.
     */

    const afterDuplicate =
      await prisma.flashSaleItem.findUnique({
        where: {
          id:
            idempotencyFlashSaleItemId,
        },

        select: {
          soldQuantity: true,

          stockLimit: true,
        },
      });

    assert(
      afterDuplicate !== null,
      "FAIL: FlashSaleItem tidak ditemukan setelah duplicate test."
    );

    assert(
      afterDuplicate.soldQuantity ===
        beforeDuplicate.soldQuantity,
      `FAIL: soldQuantity berubah setelah duplicate ditolak. Expected ${beforeDuplicate.soldQuantity}, actual ${afterDuplicate.soldQuantity}.`
    );

    assert(
      afterDuplicate.stockLimit ===
        beforeDuplicate.stockLimit,
      `FAIL: stockLimit berubah setelah duplicate ditolak. Expected ${beforeDuplicate.stockLimit}, actual ${afterDuplicate.stockLimit}.`
    );

    console.log(
      "PASS: soldQuantity dan stockLimit tetap konsisten setelah duplicate ditolak."
    );

    /**
     * ========================================================
     * VERIFY ORIGINAL PURCHASE
     * ========================================================
     */

    const finalPurchase =
      await prisma.flashSalePurchase.findUnique({
        where: {
          id:
            firstPurchase.id,
        },

        select: {
          id: true,

          orderId: true,

          flashSaleItemId: true,

          userId: true,

          quantity: true,

          price: true,
        },
      });

    assert(
      finalPurchase !== null,
      "FAIL: Purchase pertama hilang setelah duplicate ditolak."
    );

    assert(
      finalPurchase.id ===
        firstPurchase.id,
      "FAIL: Purchase original berubah setelah duplicate ditolak."
    );

    assert(
      finalPurchase.orderId ===
        idempotencyOrder.id,
      "FAIL: Purchase original orderId berubah."
    );

    assert(
  finalPurchase.flashSaleItemId ===
    firstPurchase.flashSaleItemId,
  "FAIL: Purchase original flashSaleItemId berubah setelah duplicate ditolak."
);

    assert(
      finalPurchase.quantity ===
        1,
      "FAIL: Purchase original quantity berubah."
    );

    console.log(
      "PASS: Original FlashSalePurchase tetap utuh setelah duplicate ditolak."
    );

    console.log(
      "PASS: Flash Sale Purchase idempotency berhasil diverifikasi."
    );
    
    /**
     * ========================================================
     * TEST 16
     * VERIFY ORDER EXPIRATION
     * ========================================================
     *
     * TEST 16 sengaja menggunakan Flash Sale khusus.
     *
     * Alasan: TEST 12-15 sudah memodifikasi state campaign
     * concurrency dan customer. Test expiration tidak boleh
     * bergantung pada state test sebelumnya.
     *
     * Production flow tetap digunakan:
     *
     * ProductPricingService
     *      ↓
     * OrderService.createOrder()
     *      ↓
     * FlashSaleCheckoutService.consume()
     *      ↓
     * OrderExpirationService.expireOrderById()
     *      ↓
     * OrderService.cancelOrder()
     *
     * Yang diverifikasi:
     * - order menjadi CANCELLED
     * - FlashSalePurchase dilepas
     * - soldQuantity kembali
     * - SKU stock kembali
     * - StockLedger CANCEL tepat 1
     */

    section(
      16,
      "VERIFY ORDER EXPIRATION"
    );

    // ========================================================
    // CREATE DEDICATED EXPIRATION FLASH SALE
    // ========================================================

    const expirationNow = new Date();

    const expirationFlashSale =
      await prisma.flashSale.create({
        data: {
          name: `TEST EXPIRATION ${Date.now()}`,
          slug: `test-expiration-${Date.now()}`,
          description:
            "Flash Sale khusus untuk Order Expiration integration test.",
          status: FlashSaleStatus.ACTIVE,
          startAt: new Date(
            expirationNow.getTime() - 60_000
          ),
          endAt: new Date(
            expirationNow.getTime() + 10 * 60_000
          ),
          // Priority tertinggi khusus integration test.
// ProductPricingService menggunakan ORDER BY sortOrder ASC.
sortOrder: -1000000,
          items: {
            create: {
              productId: sku.productId,
              skuId: sku.id,
              originalPrice: sku.price,
              flashPrice: new Prisma.Decimal(10000),
              stockLimit: 1,
              soldQuantity: 0,
              perUserLimit: 1,
              isActive: true,
              sortOrder: 0,
            },
          },
        },
        include: {
          items: true,
        },
      });

    expirationFlashSaleId =
      expirationFlashSale.id;

    assert(
      expirationFlashSale.items.length === 1,
      "FAIL: Expiration Flash Sale harus memiliki tepat 1 item."
    );

    expirationFlashSaleItemId =
      expirationFlashSale.items[0].id;

    assert(
      expirationFlashSale.items[0].stockLimit === 1,
      "FAIL: Expiration FlashSaleItem stockLimit harus 1."
    );

    assert(
      expirationFlashSale.items[0].soldQuantity === 0,
      "FAIL: Expiration FlashSaleItem soldQuantity awal harus 0."
    );

    console.log({
      expirationFlashSaleId,
      expirationFlashSaleItemId,
      flashPrice:
        expirationFlashSale.items[0].flashPrice.toString(),
      stockLimit:
        expirationFlashSale.items[0].stockLimit,
      soldQuantity:
        expirationFlashSale.items[0].soldQuantity,
    });

    console.log(
      "PASS: Dedicated Flash Sale untuk expiration berhasil dibuat."
    );

    const pricingCandidates =
  await prisma.flashSaleItem.findMany({
    where: {
      productId: sku.productId,
      skuId: sku.id,
      isActive: true,
      flashSale: {
        status:
          FlashSaleStatus.ACTIVE,

        deletedAt: null,

        startAt: {
          lte: new Date(),
        },

        endAt: {
          gt: new Date(),
        },
      },
    },

    select: {
      id: true,
      productId: true,
      skuId: true,
      stockLimit: true,
      soldQuantity: true,
      flashPrice: true,
      isActive: true,
      sortOrder: true,

      flashSale: {
        select: {
          id: true,
          name: true,
          status: true,
          sortOrder: true,
          startAt: true,
          endAt: true,
        },
      },
    },

    orderBy: [
  {
    flashSale: {
        sortOrder: "asc",
          },
        },
      {
      sortOrder: "asc",
        },
          {
      createdAt: "asc",
      },
    ],
});

console.log(
  "DEBUG TEST 16 - PRICING CANDIDATES:",
  JSON.stringify(
    pricingCandidates,
    (_, value) =>
      value instanceof Prisma.Decimal
        ? value.toString()
        : value instanceof Date
          ? value.toISOString()
          : value,
    2
  )
);

assert(
  pricingCandidates.length > 0,
  "FAIL: Tidak ada FlashSaleItem eligible untuk TEST 16."
);

assert(
  pricingCandidates[0].id ===
    expirationFlashSaleItemId,
  `FAIL: TEST 16 resolver akan memilih FlashSaleItem yang salah. Expected ${expirationFlashSaleItemId}, actual ${pricingCandidates[0].id}.`
);

console.log(
  "PASS: Dedicated Flash Sale TEST 16 menjadi kandidat pricing pertama."
);

    // ========================================================
    // PREPARE EXPIRATION ORDER MELALUI PRODUCTION FLOW
    // ========================================================

    const expirationOrder =
      await OrderService.createOrder({
        userId: TEST_USER_ID,
        addressId: TEST_ADDRESS_ID,
        paymentMethod: PaymentMethod.QRIS,
        shippingCost: 0,
        items: [
          {
            productId: sku.productId,
            skuId: sku.id,
            quantity: 1,
            customerNote:
              "Flash Sale expiration integration test.",
          },
        ],
      });

    assert(
      expirationOrder !== null,
      "FAIL: Order expiration tidak berhasil dibuat."
    );

    assert(
      expirationOrder.id,
      "FAIL: Order expiration tidak memiliki ID."
    );

    const expirationOrderId =
      expirationOrder.id;

    additionalOrderIds.push(
      expirationOrderId
    );

    console.log({
      orderId: expirationOrder.id,
      orderNumber: expirationOrder.orderNumber,
      status: expirationOrder.status,
      paymentStatus: expirationOrder.paymentStatus,
    });

    console.log(
      "PASS: Order expiration berhasil dibuat melalui production flow."
    );

    // ========================================================
    // VERIFY INITIAL ORDER STATE
    // ========================================================

    const expirationInitialOrder =
      await prisma.order.findUnique({
        where: {
          id: expirationOrderId,
        },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
        },
      });

    assert(
      expirationInitialOrder !== null,
      "FAIL: Order expiration tidak ditemukan."
    );

    assert(
      expirationInitialOrder.status !==
        OrderStatus.CANCELLED,
      "FAIL: Order expiration sudah CANCELLED sebelum expiration."
    );

    assert(
      expirationInitialOrder.paymentStatus !==
        PaymentStatus.VERIFIED,
      "FAIL: Order expiration sudah VERIFIED sebelum expiration."
    );

    // ========================================================
    // VERIFY ACTUAL FLASH SALE PURCHASE
    // ========================================================

    const expirationPurchaseBefore =
      await prisma.flashSalePurchase.findFirst({
        where: {
          orderId: expirationOrderId,
        },
        select: {
          id: true,
          flashSaleItemId: true,
          userId: true,
          quantity: true,
          price: true,
        },
      });

    assert(
      expirationPurchaseBefore !== null,
      "FAIL: FlashSalePurchase expiration tidak ditemukan."
    );

    assert(
      expirationPurchaseBefore.flashSaleItemId ===
        expirationFlashSaleItemId,
      `FAIL: Production pricing memilih FlashSaleItem yang salah. Expected ${expirationFlashSaleItemId}, actual ${expirationPurchaseBefore.flashSaleItemId}.`
    );

    assert(
      expirationPurchaseBefore.userId ===
        TEST_USER_ID,
      "FAIL: FlashSalePurchase expiration memiliki userId yang salah."
    );

    assert(
      expirationPurchaseBefore.quantity === 1,
      `FAIL: FlashSalePurchase expiration quantity seharusnya 1, actual ${expirationPurchaseBefore.quantity}.`
    );

    assert(
      expirationPurchaseBefore.price.toString() ===
        "10000",
      `FAIL: FlashSalePurchase expiration price seharusnya 10000, actual ${expirationPurchaseBefore.price.toString()}.`
    );

    console.log({
      purchaseId:
        expirationPurchaseBefore.id,
      flashSaleItemId:
        expirationPurchaseBefore.flashSaleItemId,
      quantity:
        expirationPurchaseBefore.quantity,
      price:
        expirationPurchaseBefore.price.toString(),
    });

    console.log(
      "PASS: Order menggunakan dedicated Flash Sale expiration."
    );

    // ========================================================
    // SNAPSHOT STATE SEBELUM EXPIRATION
    // ========================================================

    const expirationSkuBefore =
      await prisma.productSku.findUnique({
        where: {
          id: sku.id,
        },
        select: {
          stock: true,
        },
      });

    assert(
      expirationSkuBefore !== null,
      "FAIL: SKU tidak ditemukan sebelum expiration."
    );

    const expirationFlashSaleBefore =
      await prisma.flashSaleItem.findUnique({
        where: {
          id: expirationFlashSaleItemId!,
        },
        select: {
          soldQuantity: true,
          stockLimit: true,
        },
      });

    assert(
      expirationFlashSaleBefore !== null,
      "FAIL: FlashSaleItem expiration tidak ditemukan sebelum expiration."
    );

    assert(
      expirationFlashSaleBefore.soldQuantity === 1,
      `FAIL: soldQuantity sebelum expiration seharusnya 1, actual ${expirationFlashSaleBefore.soldQuantity}.`
    );

    console.log({
      orderId: expirationOrderId,
      stockBefore: expirationSkuBefore.stock,
      soldQuantityBefore:
        expirationFlashSaleBefore.soldQuantity,
      stockLimit:
        expirationFlashSaleBefore.stockLimit,
    });

    console.log(
      "PASS: State sebelum expiration valid."
    );

    // ========================================================
    // EXPIRE ORDER MELALUI SERVICE RESMI
    // ========================================================

    const expirationResult =
      await OrderExpirationService.expireOrderById(
        expirationOrderId
      );

    assert(
      expirationResult.success,
      `FAIL: expireOrderById gagal. ${expirationResult.message}`
    );

    assert(
      expirationResult.expired,
      "FAIL: expireOrderById tidak menandai order sebagai expired."
    );

    assert(
      expirationResult.orderId ===
        expirationOrderId,
      "FAIL: expireOrderById mengembalikan orderId yang salah."
    );

    console.log(
      "PASS: Order berhasil diexpire melalui OrderExpirationService."
    );

    // ========================================================
    // VERIFY ORDER STATUS
    // ========================================================

    const expirationFinalOrder =
      await prisma.order.findUnique({
        where: {
          id: expirationOrderId,
        },
        select: {
          status: true,
          paymentStatus: true,
        },
      });

    assert(
      expirationFinalOrder !== null,
      "FAIL: Order tidak ditemukan setelah expiration."
    );

    assert(
      expirationFinalOrder.status ===
        OrderStatus.CANCELLED,
      `FAIL: Status order setelah expiration seharusnya CANCELLED, actual ${expirationFinalOrder.status}.`
    );

    assert(
      expirationFinalOrder.paymentStatus !==
        PaymentStatus.VERIFIED,
      "FAIL: Order expiration berubah menjadi VERIFIED."
    );

    console.log(
      "PASS: Status order menjadi CANCELLED."
    );

    // ========================================================
    // VERIFY FLASH SALE PURCHASE RELEASE
    // ========================================================

    const expirationPurchaseAfter =
      await prisma.flashSalePurchase.count({
        where: {
          orderId: expirationOrderId,
          flashSaleItemId:
            expirationFlashSaleItemId!,
        },
      });

    assert(
      expirationPurchaseAfter === 0,
      `FAIL: FlashSalePurchase masih tersisa setelah expiration. Count: ${expirationPurchaseAfter}.`
    );

    console.log(
      "PASS: FlashSalePurchase berhasil dilepas setelah expiration."
    );

    // ========================================================
    // VERIFY FLASH SALE QUOTA RELEASE
    // ========================================================

    const expirationFlashSaleAfter =
      await prisma.flashSaleItem.findUnique({
        where: {
          id: expirationFlashSaleItemId!,
        },
        select: {
          soldQuantity: true,
          stockLimit: true,
        },
      });

    assert(
      expirationFlashSaleAfter !== null,
      "FAIL: FlashSaleItem tidak ditemukan setelah expiration."
    );

    assert(
      expirationFlashSaleAfter.soldQuantity ===
        expirationFlashSaleBefore.soldQuantity -
          expirationPurchaseBefore.quantity,
      `FAIL: Flash Sale quota tidak kembali. Expected ${expirationFlashSaleBefore.soldQuantity - expirationPurchaseBefore.quantity}, actual ${expirationFlashSaleAfter.soldQuantity}.`
    );

    assert(
      expirationFlashSaleAfter.stockLimit ===
        expirationFlashSaleBefore.stockLimit,
      "FAIL: Flash Sale stockLimit berubah setelah expiration."
    );

    console.log(
      "PASS: Flash Sale quota berhasil dikembalikan setelah expiration."
    );

    // ========================================================
    // VERIFY SKU STOCK RELEASE
    // ========================================================

    const expirationSkuAfter =
      await prisma.productSku.findUnique({
        where: {
          id: sku.id,
        },
        select: {
          stock: true,
        },
      });

    assert(
      expirationSkuAfter !== null,
      "FAIL: SKU tidak ditemukan setelah expiration."
    );

    assert(
      expirationSkuAfter.stock ===
        expirationSkuBefore.stock +
          expirationPurchaseBefore.quantity,
      `FAIL: Stock SKU tidak kembali. Expected ${expirationSkuBefore.stock + expirationPurchaseBefore.quantity}, actual ${expirationSkuAfter.stock}.`
    );

    console.log(
      "PASS: ProductSku.stock berhasil dikembalikan setelah expiration."
    );

    // ========================================================
    // VERIFY CANCEL LEDGER
    // ========================================================

    const expirationCancelLedgers =
      await prisma.stockLedger.findMany({
        where: {
          orderId: expirationOrderId,
          skuId: sku.id,
          type: "CANCEL",
        },
        select: {
          id: true,
          quantity: true,
          stockBefore: true,
          stockAfter: true,
          type: true,
        },
      });

    assert(
      expirationCancelLedgers.length === 1,
      `FAIL: StockLedger CANCEL seharusnya tepat 1, actual ${expirationCancelLedgers.length}.`
    );

    const expirationCancelLedger =
      expirationCancelLedgers[0];

    assert(
      expirationCancelLedger !== undefined,
      "FAIL: StockLedger CANCEL tidak tersedia."
    );

    assert(
      expirationCancelLedger.quantity ===
        expirationPurchaseBefore.quantity,
      `FAIL: StockLedger CANCEL quantity seharusnya ${expirationPurchaseBefore.quantity}, actual ${expirationCancelLedger.quantity}.`
    );

    assert(
      expirationCancelLedger.stockBefore ===
        expirationSkuBefore.stock,
      `FAIL: StockLedger CANCEL stockBefore seharusnya ${expirationSkuBefore.stock}, actual ${expirationCancelLedger.stockBefore}.`
    );

    assert(
      expirationCancelLedger.stockAfter ===
        expirationSkuAfter.stock,
      `FAIL: StockLedger CANCEL stockAfter seharusnya ${expirationSkuAfter.stock}, actual ${expirationCancelLedger.stockAfter}.`
    );

    console.log({
      ledgerId:
        expirationCancelLedger.id,
      quantity:
        expirationCancelLedger.quantity,
      stockBefore:
        expirationCancelLedger.stockBefore,
      stockAfter:
        expirationCancelLedger.stockAfter,
    });

    console.log(
      "PASS: StockLedger CANCEL tercatat tepat 1 kali."
    );

    console.log(
      "PASS: Order expiration lifecycle berhasil diverifikasi."
    );

        /**
     * ========================================================
     * TEST 17
     * VERIFY PAYMENT VS EXPIRATION CONCURRENCY
     * ========================================================
     *
     * Menguji dua lifecycle yang dapat terjadi bersamaan:
     *
     *   markAsPaid()
     *          VS
     *   expireOrderById()
     *
     * Target:
     *
     * 1. Tidak boleh terjadi state korup.
     * 2. Order hanya boleh berakhir pada state yang valid.
     * 3. Jika PAYMENT menang:
     *      paymentStatus = VERIFIED
     *      status != CANCELLED
     *
     * 4. Jika EXPIRATION menang:
     *      status = CANCELLED
     *      paymentStatus != VERIFIED
     *
     * 5. Tidak boleh terjadi double cancellation.
     *
     * Test ini sengaja TIDAK menggunakan Flash Sale agar
     * pengujian fokus pada payment lifecycle dan expiration
     * concurrency.
     */

    section(
      17,
      "VERIFY PAYMENT VS EXPIRATION CONCURRENCY"
    );

    /**
     * ========================================================
     * PREPARE RACE ORDER
     * ========================================================
     *
     * Order dibuat melalui production flow.
     */

    const raceOrder =
      await OrderService.createOrder({
        userId:
          TEST_USER_ID,

        addressId:
          TEST_ADDRESS_ID,

        paymentMethod:
          PaymentMethod.QRIS,

        shippingCost:
          0,

        items: [
          {
            productId:
              sku.productId,

            skuId:
              sku.id,

            quantity:
              1,

            customerNote:
              "Payment vs expiration concurrency integration test.",
          },
        ],
      });

    assert(
      raceOrder !== null,
      "FAIL: Race order tidak berhasil dibuat."
    );

    assert(
      raceOrder.id,
      "FAIL: Race order tidak memiliki ID."
    );

    const raceOrderId =
      raceOrder.id;

    additionalOrderIds.push(
      raceOrderId
    );

    console.log({
      orderId:
        raceOrder.id,

      orderNumber:
        raceOrder.orderNumber,

      status:
        raceOrder.status,

      paymentStatus:
        raceOrder.paymentStatus,
    });

    console.log(
      "PASS: Race order berhasil dibuat melalui production flow."
    );

    /**
     * ========================================================
     * VERIFY INITIAL STATE
     * ========================================================
     */

    const raceInitialOrder =
      await prisma.order.findUnique({
        where: {
          id:
            raceOrderId,
        },

        select: {
          id: true,

          status: true,

          paymentStatus: true,

          paidAt: true,
        },
      });

    assert(
      raceInitialOrder !== null,
      "FAIL: Race order tidak ditemukan."
    );

    assert(
      raceInitialOrder.status !==
        OrderStatus.CANCELLED,
      "FAIL: Race order sudah CANCELLED sebelum concurrency test."
    );

    assert(
      raceInitialOrder.paymentStatus ===
        PaymentStatus.PENDING,
      `FAIL: Race order seharusnya PENDING sebelum concurrency test, actual ${raceInitialOrder.paymentStatus}.`
    );

    console.log(
      "PASS: Initial payment state race order valid."
    );

    /**
     * ========================================================
     * SNAPSHOT STOCK + LEDGER
     * ========================================================
     */

    const raceSkuBefore =
      await prisma.productSku.findUnique({
        where: {
          id:
            sku.id,
        },

        select: {
          stock: true,
        },
      });

    assert(
      raceSkuBefore !== null,
      "FAIL: SKU race order tidak ditemukan."
    );

    const raceSaleLedgerBefore =
      await prisma.stockLedger.count({
        where: {
          orderId:
            raceOrderId,

          skuId:
            sku.id,

          type:
            "SALE",
        },
      });

    const raceCancelLedgerBefore =
      await prisma.stockLedger.count({
        where: {
          orderId:
            raceOrderId,

          skuId:
            sku.id,

          type:
            "CANCEL",
        },
      });

    /**
     * Production createOrder() seharusnya membuat tepat satu
     * SALE ledger.
     */

    assert(
      raceSaleLedgerBefore ===
        1,
      `FAIL: Race order seharusnya memiliki 1 StockLedger SALE, actual ${raceSaleLedgerBefore}.`
    );

    assert(
      raceCancelLedgerBefore ===
        0,
      `FAIL: Race order belum boleh memiliki StockLedger CANCEL, actual ${raceCancelLedgerBefore}.`
    );

    console.log(
      "PASS: Initial stock ledger state race order valid."
    );

    /**
     * ========================================================
     * RUN CONCURRENT OPERATIONS
     * ========================================================
     *
     * Promise.all sengaja digunakan untuk membuat kedua
     * operation masuk sedekat mungkin.
     *
     * Tidak ada artificial delay karena kita ingin menguji
     * synchronization mechanism production code sebenarnya:
     *
     * - markAsPaid()
     *   menggunakan conditional payment update.
     *
     * - cancelOrder()
     *   menggunakan FOR UPDATE.
     */

    const [
  paymentRaceResult,
  expirationRaceResult,
] =
  await Promise.all([
    OrderService.markAsPaid(
      raceOrderId
    )
      .then((order) => ({
        success:
          true as const,

        order,
      }))
      .catch((error) => ({
        success:
          false as const,

        error:
          getErrorMessage(error),
      })),

    OrderExpirationService.expireOrderById(
      raceOrderId
    )
      .then((result) => ({
        success:
          true as const,

        result,
      }))
      .catch((error) => ({
        success:
          false as const,

        error:
          getErrorMessage(error),
      })),
  ]);

    console.log(
  "RACE PAYMENT RESULT:",
  paymentRaceResult.success
    ? {
        success: true,
        paymentStatus:
          paymentRaceResult.order.paymentStatus,
        paidAt:
          paymentRaceResult.order.paidAt,
      }
    : {
        success: false,
        error:
          paymentRaceResult.error,
      }
);

console.log(
  "RACE EXPIRATION RESULT:",
  expirationRaceResult.success
    ? {
        success: true,
        expired:
          expirationRaceResult.result.expired,
        message:
          expirationRaceResult.result.message,
      }
    : {
        success: false,
        error:
          expirationRaceResult.error,
      }
);

    /**
     * ========================================================
     * READ FINAL ORDER STATE
     * ========================================================
     */

    const raceFinalOrder =
      await prisma.order.findUnique({
        where: {
          id:
            raceOrderId,
        },

        select: {
          id: true,

          status: true,

          paymentStatus: true,

          paidAt: true,
        },
      });

    assert(
      raceFinalOrder !== null,
      "FAIL: Race order tidak ditemukan setelah concurrency test."
    );

    /**
     * ========================================================
     * VALIDATE TERMINAL STATE
     * ========================================================
     *
     * Dua terminal state yang valid:
     *
     * A. PAYMENT MENANG
     *
     *    paymentStatus = VERIFIED
     *    status != CANCELLED
     *
     * B. EXPIRATION MENANG
     *
     *    status = CANCELLED
     *    paymentStatus != VERIFIED
     *
     * State:
     *
     *    CANCELLED + VERIFIED
     *
     * tidak boleh terjadi.
     */

    assert(
      !(
        raceFinalOrder.status ===
          OrderStatus.CANCELLED &&
        raceFinalOrder.paymentStatus ===
          PaymentStatus.VERIFIED
      ),
      "FAIL: Race menghasilkan state invalid CANCELLED + VERIFIED."
    );

    const paymentWon =
      raceFinalOrder.paymentStatus ===
      PaymentStatus.VERIFIED;

    const expirationWon =
      raceFinalOrder.status ===
      OrderStatus.CANCELLED;

    assert(
      paymentWon ||
        expirationWon,
      `FAIL: Race order tidak memiliki terminal state valid. status=${raceFinalOrder.status}, paymentStatus=${raceFinalOrder.paymentStatus}.`
    );

    /**
     * Jika payment menang, paidAt wajib tersedia.
     */

    if (paymentWon) {
      assert(
        raceFinalOrder.paidAt !==
          null,
        "FAIL: Payment VERIFIED tetapi paidAt null."
      );

      assert(
        raceFinalOrder.status !==
          OrderStatus.CANCELLED,
        "FAIL: Payment VERIFIED tetapi order CANCELLED."
      );

      console.log(
        "PASS: Payment memenangkan race secara valid."
      );
    }

    /**
     * Jika expiration menang, payment tidak boleh VERIFIED.
     */

    if (expirationWon) {
      assert(
        raceFinalOrder.paymentStatus !==
          PaymentStatus.VERIFIED,
        "FAIL: Expiration memenangkan race tetapi payment VERIFIED."
      );

      console.log(
        "PASS: Expiration memenangkan race secara valid."
      );
    }

    /**
     * ========================================================
     * VERIFY PAYMENT VS EXPIRATION RESULT CONSISTENCY
     * ========================================================
     */

    if (
  paymentRaceResult.success &&
  expirationRaceResult.success
) {
      /**
       * Kedua service boleh sama-sama return success dari
       * perspektif method masing-masing hanya jika lifecycle
       * memang tidak bertabrakan.
       *
       * Namun final database state tetap menjadi authority.
       */
      console.log(
        "PASS: Kedua operasi selesai tanpa exception."
      );
    }

    /**
     * ========================================================
     * VERIFY STOCK STATE
     * ========================================================
     */

    const raceSkuAfter =
      await prisma.productSku.findUnique({
        where: {
          id:
            sku.id,
        },

        select: {
          stock: true,
        },
      });

    assert(
      raceSkuAfter !== null,
      "FAIL: SKU race order tidak ditemukan setelah concurrency."
    );

    if (paymentWon) {
      /**
       * Payment menang:
       *
       * Order tetap aktif.
       * Stock TIDAK boleh direstore.
       */

      assert(
        raceSkuAfter.stock ===
          raceSkuBefore.stock,
        `FAIL: Payment memenangkan race tetapi stock berubah. Expected ${raceSkuBefore.stock}, actual ${raceSkuAfter.stock}.`
      );

      console.log(
        "PASS: Stock tetap terpakai ketika payment memenangkan race."
      );
    }

    if (expirationWon) {
      /**
       * Expiration menang:
       *
       * cancelOrder() harus restore stock tepat satu kali.
       */

      assert(
        raceSkuAfter.stock ===
          raceSkuBefore.stock + 1,
        `FAIL: Expiration memenangkan race tetapi stock tidak direstore tepat 1. Expected ${raceSkuBefore.stock + 1}, actual ${raceSkuAfter.stock}.`
      );

      console.log(
        "PASS: Stock direstore tepat satu kali ketika expiration memenangkan race."
      );
    }

    /**
     * ========================================================
     * VERIFY CANCEL LEDGER
     * ========================================================
     */

    const raceCancelLedgerAfter =
      await prisma.stockLedger.count({
        where: {
          orderId:
            raceOrderId,

          skuId:
            sku.id,

          type:
            "CANCEL",
        },
      });

    if (expirationWon) {
      assert(
        raceCancelLedgerAfter ===
          1,
        `FAIL: Expiration memenangkan race tetapi CANCEL ledger bukan 1. Actual ${raceCancelLedgerAfter}.`
      );

      console.log(
        "PASS: Tepat 1 StockLedger CANCEL dibuat."
      );
    } else {
      assert(
        raceCancelLedgerAfter ===
          0,
        `FAIL: Payment memenangkan race tetapi CANCEL ledger muncul. Count: ${raceCancelLedgerAfter}.`
      );

      console.log(
        "PASS: Tidak ada StockLedger CANCEL ketika payment memenangkan race."
      );
    }

    /**
     * ========================================================
     * VERIFY SALE LEDGER
     * ========================================================
     */

    const raceSaleLedgerAfter =
      await prisma.stockLedger.count({
        where: {
          orderId:
            raceOrderId,

          skuId:
            sku.id,

          type:
            "SALE",
        },
      });

    assert(
      raceSaleLedgerAfter ===
        1,
      `FAIL: Race order seharusnya memiliki tepat 1 SALE ledger. Actual ${raceSaleLedgerAfter}.`
    );

    console.log(
      "PASS: StockLedger SALE tetap tepat 1."
    );

    /**
     * ========================================================
     * FINAL TEST 17
     * ========================================================
     */

    console.log(
      "PASS: Payment vs expiration concurrency berhasil diverifikasi."
    );

     /**
 * ========================================================
 * TEST 18
 * VERIFY PAYMENT VS CANCELLATION CONCURRENCY
 * ========================================================
 *
 * Menguji race condition antara:
 *
 *   OrderService.markAsPaid()
 *             VS
 *   OrderService.cancelOrder()
 *
 * TEST 18 sengaja menggunakan dedicated Flash Sale
 * agar pricing tidak bergantung pada state TEST 4,
 * TEST 12, atau TEST 16.
 *
 * VALID TERMINAL STATE:
 *
 * A. PAYMENT MENANG
 *
 *    paymentStatus = VERIFIED
 *    status != CANCELLED
 *    paidAt != null
 *    stock tetap terpakai
 *    FlashSalePurchase tetap ada
 *    soldQuantity tetap
 *    tidak ada CANCEL ledger
 *
 * B. CANCELLATION MENANG
 *
 *    status = CANCELLED
 *    paymentStatus != VERIFIED
 *    paidAt = null
 *    stock dikembalikan
 *    FlashSalePurchase dilepas
 *    soldQuantity dikembalikan
 *    terdapat tepat satu CANCEL ledger
 *
 * INVALID:
 *
 *    paymentStatus = VERIFIED
 *    status = CANCELLED
 *
 * karena order yang sudah VERIFIED tidak boleh
 * menjadi CANCELLED.
 */

section(
  18,
  "VERIFY PAYMENT VS CANCELLATION CONCURRENCY"
);

// ========================================================
// ISOLATE TEST 18 FROM OTHER FLASH SALES
// ========================================================

/**
 * TEST 18 harus memiliki pricing candidate sendiri.
 *
 * Flash Sale lain yang dibuat oleh test sebelumnya
 * tidak boleh ikut dipilih oleh ProductPricingService.
 *
 * Karena semua campaign tersebut adalah bagian dari
 * integration test yang sama, kita boleh menonaktifkannya
 * sebelum membuat dedicated campaign TEST 18.
 */

const flashSalesToDisable = [
  flashSaleId,
  concurrencyFlashSaleId,
  expirationFlashSaleId,
].filter(
  (id): id is string => id !== null
);

if (flashSalesToDisable.length > 0) {
  await prisma.flashSale.updateMany({
    where: {
      id: {
        in: flashSalesToDisable,
      },
    },
    data: {
      status: FlashSaleStatus.ENDED,
    },
  });

  console.log(
    "PASS: Flash Sale dari test sebelumnya dinonaktifkan untuk TEST 18."
  );
}

// ========================================================
// CREATE DEDICATED FLASH SALE FOR TEST 18
// ========================================================

const paymentCancelNow = new Date();

const paymentCancelFlashSale =
  await prisma.flashSale.create({
    data: {
      name:
        `TEST PAYMENT CANCEL ${Date.now()}`,

      slug:
        `test-payment-cancel-${Date.now()}`,

      description:
        "Dedicated Flash Sale for payment vs cancellation concurrency integration test.",

      status:
        FlashSaleStatus.ACTIVE,

      startAt:
        new Date(
          paymentCancelNow.getTime() - 60_000
        ),

      endAt:
        new Date(
          paymentCancelNow.getTime() + 10 * 60_000
        ),

      /**
       * Priority paling tinggi untuk TEST 18.
       *
       * Campaign lain sudah di-END di atas, tetapi
       * priority ini tetap membuat intent test jelas.
       */
      sortOrder: 0,

      items: {
        create: {
          productId:
            sku.productId,

          skuId:
            sku.id,

          originalPrice:
            sku.price,

          flashPrice:
            new Prisma.Decimal(13000),

          /**
           * Quota 1 cukup karena hanya satu order
           * yang digunakan dalam payment/cancellation race.
           */
          stockLimit: 1,

          soldQuantity: 0,

          perUserLimit: 1,

          isActive: true,

          sortOrder: 0,
        },
      },
    },

    include: {
      items: true,
    },
  });

paymentCancelFlashSaleId =
  paymentCancelFlashSale.id;

assert(
  paymentCancelFlashSale.items.length === 1,
  "FAIL: TEST 18 Flash Sale harus memiliki tepat 1 item."
);

paymentCancelFlashSaleItemId =
  paymentCancelFlashSale.items[0].id;

assert(
  paymentCancelFlashSale.items[0].stockLimit === 1,
  "FAIL: TEST 18 Flash Sale stockLimit harus 1."
);

assert(
  paymentCancelFlashSale.items[0].soldQuantity === 0,
  "FAIL: TEST 18 Flash Sale soldQuantity awal harus 0."
);

console.log({
  paymentCancelFlashSaleId:
    paymentCancelFlashSaleId,

  paymentCancelFlashSaleItemId:
    paymentCancelFlashSaleItemId,

  flashPrice:
    paymentCancelFlashSale.items[0].flashPrice.toString(),

  stockLimit:
    paymentCancelFlashSale.items[0].stockLimit,

  soldQuantity:
    paymentCancelFlashSale.items[0].soldQuantity,

  perUserLimit:
    paymentCancelFlashSale.items[0].perUserLimit,
});

console.log(
  "PASS: Dedicated Flash Sale TEST 18 berhasil dibuat."
);

// ========================================================
// VERIFY PRICING RESOLVER CANDIDATE
// ========================================================

const paymentCancelPricingCandidates =
  await prisma.flashSaleItem.findMany({
    where: {
      productId:
        sku.productId,

      skuId:
        sku.id,

      isActive: true,

      flashSale: {
        status:
          FlashSaleStatus.ACTIVE,

        deletedAt: null,

        startAt: {
          lte: new Date(),
        },

        endAt: {
          gt: new Date(),
        },
      },
    },

    select: {
      id: true,
      productId: true,
      skuId: true,
      stockLimit: true,
      soldQuantity: true,
      flashPrice: true,
      isActive: true,
      sortOrder: true,

      flashSale: {
        select: {
          id: true,
          name: true,
          status: true,
          sortOrder: true,
          startAt: true,
          endAt: true,
        },
      },
    },

    orderBy: [
      {
        flashSale: {
          sortOrder: "asc",
        },
      },
      {
        sortOrder: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

console.log(
  "DEBUG TEST 18 - PRICING CANDIDATES:",
  JSON.stringify(
    paymentCancelPricingCandidates,
    (_, value) =>
      value instanceof Prisma.Decimal
        ? value.toString()
        : value instanceof Date
          ? value.toISOString()
          : value,
    2
  )
);

assert(
  paymentCancelPricingCandidates.length > 0,
  "FAIL: Tidak ada FlashSaleItem eligible untuk TEST 18."
);

assert(
  paymentCancelPricingCandidates[0].id ===
    paymentCancelFlashSaleItemId,
  `FAIL: TEST 18 resolver memilih FlashSaleItem yang salah. Expected ${paymentCancelFlashSaleItemId}, actual ${paymentCancelPricingCandidates[0].id}.`
);

console.log(
  "PASS: Dedicated Flash Sale TEST 18 menjadi pricing candidate pertama."
);

// ========================================================
// CREATE RACE ORDER THROUGH PRODUCTION FLOW
// ========================================================

const paymentCancelRaceOrder =
  await OrderService.createOrder({
    userId:
      TEST_USER_ID,

    addressId:
      TEST_ADDRESS_ID,

    paymentMethod:
      PaymentMethod.QRIS,

    shippingCost:
      0,

    items: [
      {
        productId:
          sku.productId,

        skuId:
          sku.id,

        quantity:
          1,

        customerNote:
          "Payment vs cancellation concurrency integration test.",
      },
    ],
  });

assert(
  paymentCancelRaceOrder !== null,
  "FAIL: Payment/cancellation race order gagal dibuat."
);

const paymentCancelRaceOrderId =
  paymentCancelRaceOrder.id;

additionalOrderIds.push(
  paymentCancelRaceOrderId
);

console.log({
  orderId:
    paymentCancelRaceOrder.id,

  orderNumber:
    paymentCancelRaceOrder.orderNumber,

  status:
    paymentCancelRaceOrder.status,

  paymentStatus:
    paymentCancelRaceOrder.paymentStatus,
});

console.log(
  "PASS: Payment/cancellation race order berhasil dibuat melalui production flow."
);

// ========================================================
// VERIFY ORDER USED TEST 18 FLASH SALE
// ========================================================

assert(
  paymentCancelRaceOrder.items.length === 1,
  "FAIL: TEST 18 race order harus memiliki tepat 1 item."
);

assert(
  paymentCancelRaceOrder.items[0].price.toString() ===
    "13000",
  `FAIL: TEST 18 order tidak menggunakan harga Flash Sale 13000. Actual ${paymentCancelRaceOrder.items[0].price.toString()}.`
);

console.log(
  "PASS: TEST 18 order menggunakan harga dedicated Flash Sale."
);

// ========================================================
// VERIFY FLASH SALE PURCHASE
// ========================================================

const paymentCancelPurchaseBefore =
  await prisma.flashSalePurchase.findFirst({
    where: {
      orderId:
        paymentCancelRaceOrderId,

      flashSaleItemId:
        paymentCancelFlashSaleItemId,
    },

    select: {
      id: true,
      orderId: true,
      flashSaleItemId: true,
      userId: true,
      quantity: true,
      price: true,
    },
  });

assert(
  paymentCancelPurchaseBefore !== null,
  "FAIL: TEST 18 order tidak memiliki FlashSalePurchase."
);

assert(
  paymentCancelPurchaseBefore.quantity === 1,
  `FAIL: TEST 18 FlashSalePurchase quantity harus 1, actual ${paymentCancelPurchaseBefore.quantity}.`
);

assert(
  paymentCancelPurchaseBefore.price.toString() ===
    "13000",
  `FAIL: TEST 18 FlashSalePurchase price harus 13000, actual ${paymentCancelPurchaseBefore.price.toString()}.`
);

console.log({
  purchaseId:
    paymentCancelPurchaseBefore.id,

  flashSaleItemId:
    paymentCancelPurchaseBefore.flashSaleItemId,

  quantity:
    paymentCancelPurchaseBefore.quantity,

  price:
    paymentCancelPurchaseBefore.price.toString(),
});

console.log(
  "PASS: TEST 18 FlashSalePurchase valid."
);

// ========================================================
// VERIFY FLASH SALE STATE BEFORE RACE
// ========================================================

const paymentCancelFlashSaleBefore =
  await prisma.flashSaleItem.findUnique({
    where: {
      id:
        paymentCancelFlashSaleItemId,
    },

    select: {
      id: true,
      stockLimit: true,
      soldQuantity: true,
      perUserLimit: true,
      flashPrice: true,
    },
  });

assert(
  paymentCancelFlashSaleBefore !== null,
  "FAIL: TEST 18 FlashSaleItem tidak ditemukan."
);

assert(
  paymentCancelFlashSaleBefore.stockLimit === 1,
  "FAIL: TEST 18 stockLimit harus tetap 1."
);

assert(
  paymentCancelFlashSaleBefore.soldQuantity === 1,
  `FAIL: TEST 18 soldQuantity setelah createOrder harus 1, actual ${paymentCancelFlashSaleBefore.soldQuantity}.`
);

console.log({
  stockLimit:
    paymentCancelFlashSaleBefore.stockLimit,

  soldQuantity:
    paymentCancelFlashSaleBefore.soldQuantity,

  perUserLimit:
    paymentCancelFlashSaleBefore.perUserLimit,
});

console.log(
  "PASS: Flash Sale quota TEST 18 terpakai tepat 1."
);

// ========================================================
// VERIFY INITIAL ORDER STATE
// ========================================================

const paymentCancelInitialOrder =
  await prisma.order.findUnique({
    where: {
      id:
        paymentCancelRaceOrderId,
    },

    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paidAt: true,
    },
  });

assert(
  paymentCancelInitialOrder !== null,
  "FAIL: Payment/cancellation race order tidak ditemukan."
);

assert(
  paymentCancelInitialOrder.status !==
    OrderStatus.CANCELLED,
  "FAIL: Race order sudah CANCELLED sebelum concurrency test."
);

assert(
  paymentCancelInitialOrder.paymentStatus ===
    PaymentStatus.PENDING,
  `FAIL: Race order seharusnya PENDING, actual ${paymentCancelInitialOrder.paymentStatus}.`
);

assert(
  paymentCancelInitialOrder.paidAt ===
    null,
  "FAIL: Race order sudah memiliki paidAt sebelum concurrency test."
);

console.log(
  "PASS: Initial payment/cancellation state valid."
);

// ========================================================
// SNAPSHOT STOCK + LEDGER
// ========================================================

const paymentCancelSkuBefore =
  await prisma.productSku.findUnique({
    where: {
      id:
        sku.id,
    },

    select: {
      stock: true,
    },
  });

assert(
  paymentCancelSkuBefore !== null,
  "FAIL: SKU payment/cancellation race tidak ditemukan."
);

const paymentCancelSaleLedgerBefore =
  await prisma.stockLedger.count({
    where: {
      orderId:
        paymentCancelRaceOrderId,

      skuId:
        sku.id,

      type:
        "SALE",
    },
  });

const paymentCancelCancelLedgerBefore =
  await prisma.stockLedger.count({
    where: {
      orderId:
        paymentCancelRaceOrderId,

      skuId:
        sku.id,

      type:
        "CANCEL",
    },
  });

assert(
  paymentCancelSaleLedgerBefore === 1,
  `FAIL: Race order seharusnya memiliki 1 SALE ledger, actual ${paymentCancelSaleLedgerBefore}.`
);

assert(
  paymentCancelCancelLedgerBefore === 0,
  `FAIL: Race order belum boleh memiliki CANCEL ledger, actual ${paymentCancelCancelLedgerBefore}.`
);

console.log({
  skuStockBefore:
    paymentCancelSkuBefore.stock,

  saleLedger:
    paymentCancelSaleLedgerBefore,

  cancelLedger:
    paymentCancelCancelLedgerBefore,
});

console.log(
  "PASS: Initial stock ledger state payment/cancellation valid."
);

// ========================================================
// RUN CONCURRENT PAYMENT + CANCELLATION
// ========================================================

const [
  paymentCancelPaymentResult,
  paymentCancelCancellationResult,
] =
  await Promise.all([
    OrderService.markAsPaid(
      paymentCancelRaceOrderId
    )
      .then((order) => ({
        success:
          true as const,

        order,
      }))
      .catch((error) => ({
        success:
          false as const,

        error:
          getErrorMessage(error),
      })),

    OrderService.cancelOrder(
      paymentCancelRaceOrderId
    )
      .then((order) => ({
        success:
          true as const,

        order,
      }))
      .catch((error) => ({
        success:
          false as const,

        error:
          getErrorMessage(error),
      })),
  ]);

console.log(
  "RACE PAYMENT RESULT:",
  paymentCancelPaymentResult.success
    ? {
        success: true,

        status:
          paymentCancelPaymentResult.order.status,

        paymentStatus:
          paymentCancelPaymentResult.order.paymentStatus,

        paidAt:
          paymentCancelPaymentResult.order.paidAt,
      }
    : {
        success: false,

        error:
          paymentCancelPaymentResult.error,
      }
);

console.log(
  "RACE CANCELLATION RESULT:",
  paymentCancelCancellationResult.success
    ? {
        success: true,

        status:
          paymentCancelCancellationResult.order.status,

        paymentStatus:
          paymentCancelCancellationResult.order.paymentStatus,
      }
    : {
        success: false,

        error:
          paymentCancelCancellationResult.error,
      }
);

// ========================================================
// READ FINAL ORDER STATE
// ========================================================

const paymentCancelFinalOrder =
  await prisma.order.findUnique({
    where: {
      id:
        paymentCancelRaceOrderId,
    },

    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paidAt: true,
    },
  });

assert(
  paymentCancelFinalOrder !== null,
  "FAIL: Race order tidak ditemukan setelah payment/cancellation concurrency."
);

// ========================================================
// DETERMINE WINNER
// ========================================================

const paymentCancelWon =
  paymentCancelFinalOrder.paymentStatus ===
    PaymentStatus.VERIFIED &&
  paymentCancelFinalOrder.status !==
    OrderStatus.CANCELLED;

const cancellationWon =
  paymentCancelFinalOrder.status ===
    OrderStatus.CANCELLED &&
  paymentCancelFinalOrder.paymentStatus !==
    PaymentStatus.VERIFIED;

assert(
  paymentCancelWon ||
    cancellationWon,
  `FAIL: Invalid payment/cancellation terminal state. status=${paymentCancelFinalOrder.status}, paymentStatus=${paymentCancelFinalOrder.paymentStatus}, paidAt=${paymentCancelFinalOrder.paidAt}`
);

console.log({
  finalStatus:
    paymentCancelFinalOrder.status,

  finalPaymentStatus:
    paymentCancelFinalOrder.paymentStatus,

  paidAt:
    paymentCancelFinalOrder.paidAt,

  winner:
    paymentCancelWon
      ? "PAYMENT"
      : "CANCELLATION",
});

// ========================================================
// READ FINAL FLASH SALE STATE
// ========================================================

const paymentCancelFlashSaleAfter =
  await prisma.flashSaleItem.findUnique({
    where: {
      id:
        paymentCancelFlashSaleItemId,
    },

    select: {
      stockLimit: true,
      soldQuantity: true,
      perUserLimit: true,
    },
  });

assert(
  paymentCancelFlashSaleAfter !== null,
  "FAIL: TEST 18 FlashSaleItem hilang setelah race."
);

// ========================================================
// READ FINAL PURCHASE
// ========================================================

const paymentCancelPurchaseAfter =
  await prisma.flashSalePurchase.findFirst({
    where: {
      orderId:
        paymentCancelRaceOrderId,

      flashSaleItemId:
        paymentCancelFlashSaleItemId,
    },

    select: {
      id: true,
      quantity: true,
      price: true,
    },
  });

// ========================================================
// READ FINAL STOCK
// ========================================================

const paymentCancelSkuAfter =
  await prisma.productSku.findUnique({
    where: {
      id:
        sku.id,
    },

    select: {
      stock: true,
    },
  });

assert(
  paymentCancelSkuAfter !== null,
  "FAIL: SKU tidak ditemukan setelah payment/cancellation race."
);

// ========================================================
// READ FINAL LEDGER
// ========================================================

const paymentCancelSaleLedgerAfter =
  await prisma.stockLedger.count({
    where: {
      orderId:
        paymentCancelRaceOrderId,

      skuId:
        sku.id,

      type:
        "SALE",
    },
  });

const paymentCancelCancelLedgerAfter =
  await prisma.stockLedger.count({
    where: {
      orderId:
        paymentCancelRaceOrderId,

      skuId:
        sku.id,

      type:
        "CANCEL",
    },
  });

// ========================================================
// PAYMENT WON
// ========================================================

if (paymentCancelWon) {
  assert(
    paymentCancelFinalOrder.paidAt !== null,
    "FAIL: Payment VERIFIED tetapi paidAt null."
  );

  assert(
    paymentCancelFinalOrder.status !==
      OrderStatus.CANCELLED,
    "FAIL: Payment VERIFIED tetapi order CANCELLED."
  );

  /**
   * Payment menang berarti cancellation tidak boleh
   * mengembalikan Flash Sale quota.
   */
  assert(
    paymentCancelFlashSaleAfter.soldQuantity === 1,
    `FAIL: Payment memenangkan race tetapi soldQuantity berubah. Expected 1, actual ${paymentCancelFlashSaleAfter.soldQuantity}.`
  );

  assert(
    paymentCancelPurchaseAfter !== null,
    "FAIL: Payment memenangkan race tetapi FlashSalePurchase hilang."
  );

  assert(
    paymentCancelPurchaseAfter.quantity === 1,
    "FAIL: FlashSalePurchase quantity berubah ketika payment memenangkan race."
  );

  assert(
    paymentCancelSkuAfter.stock ===
      paymentCancelSkuBefore.stock,
    `FAIL: Payment memenangkan race tetapi stock berubah. Expected ${paymentCancelSkuBefore.stock}, actual ${paymentCancelSkuAfter.stock}.`
  );

  assert(
    paymentCancelCancelLedgerAfter === 0,
    `FAIL: Payment memenangkan race tetapi CANCEL ledger ditemukan. Count: ${paymentCancelCancelLedgerAfter}.`
  );

  assert(
    paymentCancelSaleLedgerAfter === 1,
    `FAIL: SALE ledger seharusnya tetap 1. Actual ${paymentCancelSaleLedgerAfter}.`
  );

  console.log(
    "PASS: Payment memenangkan race secara valid."
  );

  console.log(
    "PASS: FlashSalePurchase tetap ada."
  );

  console.log(
    "PASS: Flash Sale soldQuantity tetap 1."
  );

  console.log(
    "PASS: Stock tetap terpakai."
  );

  console.log(
    "PASS: Tidak ada CANCEL ledger."
  );
}

// ========================================================
// CANCELLATION WON
// ========================================================

if (cancellationWon) {
  assert(
    paymentCancelFinalOrder.status ===
      OrderStatus.CANCELLED,
    "FAIL: Cancellation seharusnya menghasilkan CANCELLED."
  );

  assert(
    paymentCancelFinalOrder.paymentStatus !==
      PaymentStatus.VERIFIED,
    "FAIL: Cancellation memenangkan race tetapi paymentStatus VERIFIED."
  );

  assert(
    paymentCancelFinalOrder.paidAt === null,
    "FAIL: Cancellation memenangkan race tetapi paidAt terisi."
  );

  /**
   * Cancellation harus melepaskan Flash Sale purchase.
   */
  assert(
    paymentCancelPurchaseAfter === null,
    "FAIL: Cancellation memenangkan race tetapi FlashSalePurchase masih ada."
  );

  /**
   * soldQuantity harus kembali dari 1 menjadi 0.
   */
  assert(
    paymentCancelFlashSaleAfter.soldQuantity === 0,
    `FAIL: Cancellation memenangkan race tetapi soldQuantity tidak kembali 0. Actual ${paymentCancelFlashSaleAfter.soldQuantity}.`
  );

  assert(
    paymentCancelFlashSaleAfter.stockLimit === 1,
    "FAIL: stockLimit berubah setelah cancellation."
  );

  /**
   * Stock harus kembali tepat 1.
   */
  assert(
    paymentCancelSkuAfter.stock ===
      paymentCancelSkuBefore.stock + 1,
    `FAIL: Stock tidak dikembalikan ketika cancellation memenangkan race. Expected ${paymentCancelSkuBefore.stock + 1}, actual ${paymentCancelSkuAfter.stock}.`
  );

  /**
   * Tepat satu CANCEL ledger.
   */
  assert(
    paymentCancelCancelLedgerAfter === 1,
    `FAIL: Cancellation memenangkan race tetapi CANCEL ledger bukan 1. Actual ${paymentCancelCancelLedgerAfter}.`
  );

  /**
   * SALE ledger original tetap ada sebagai histori
   * transaksi penjualan.
   */
  assert(
    paymentCancelSaleLedgerAfter === 1,
    `FAIL: SALE ledger seharusnya tetap 1. Actual ${paymentCancelSaleLedgerAfter}.`
  );

  console.log(
    "PASS: Cancellation memenangkan race secara valid."
  );

  console.log(
    "PASS: FlashSalePurchase berhasil dilepas."
  );

  console.log(
    "PASS: Flash Sale soldQuantity kembali 0."
  );

  console.log(
    "PASS: Stock dikembalikan tepat 1."
  );

  console.log(
    "PASS: Tepat 1 CANCEL ledger dibuat."
  );
}

// ========================================================
// FINAL TEST 18 ASSERTIONS
// ========================================================

assert(
  paymentCancelFlashSaleAfter.stockLimit === 1,
  "FAIL: TEST 18 stockLimit berubah."
);

assert(
  paymentCancelSaleLedgerAfter === 1,
  `FAIL: TEST 18 harus memiliki tepat 1 SALE ledger. Actual ${paymentCancelSaleLedgerAfter}.`
);

assert(
  paymentCancelCancelLedgerAfter <= 1,
  `FAIL: TEST 18 menghasilkan lebih dari satu CANCEL ledger. Actual ${paymentCancelCancelLedgerAfter}.`
);

console.log(
  "PASS: Payment vs cancellation concurrency berhasil diverifikasi."
);

    /**
     * ========================================================
     * FINAL SUCCESS
     * ========================================================
     */

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "FLASH SALE ORDER FLOW TEST PASSED"
    );
    console.log(
      "============================================================"
    );

    console.log("");
    console.log(
      "Production flow yang berhasil diuji:"
    );
    console.log(
      "ProductPricingService → Flash Sale pricing"
    );
    console.log(
      "OrderService.createOrder() → Order"
    );
    console.log(
      "FlashSaleCheckoutService.consume() → FlashSalePurchase"
    );
    console.log(
      "ProductSku.stock → decrement"
    );
    console.log(
      "StockLedger → SALE"
    );
    console.log(
      "Per-user limit → rejected + rollback"
    );
    console.log(
      "Global quota concurrency → 1 winner + 1 rollback"
    );
    console.log(
      "Order cancellation → stock + quota released"
    );
    console.log(
      "Double cancellation → rejected"
    );

  } finally {
    // ==========================================================
    // CLEANUP
    // ==========================================================

    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log("CLEANUP");
    console.log(
      "------------------------------------------------------------"
    );

    try {
      /**
       * Semua order test yang berhasil harus dibersihkan.
       * StockLedger dan FlashSalePurchase dihapus dahulu
       * karena keduanya mereferensikan Order.
       */

      const orderIds = [
        ...(firstOrderId
          ? [firstOrderId]
          : []),
        ...additionalOrderIds,
      ];

      const uniqueOrderIds =
        Array.from(
          new Set(orderIds)
        );

      if (
        uniqueOrderIds.length > 0
      ) {
        await prisma.stockLedger.deleteMany({
          where: {
            orderId: {
              in: uniqueOrderIds,
            },
          },
        });

        console.log(
          "PASS: StockLedger test dihapus."
        );

        await prisma.flashSalePurchase.deleteMany({
          where: {
            orderId: {
              in: uniqueOrderIds,
            },
          },
        });

        console.log(
          "PASS: FlashSalePurchase test dihapus."
        );

        await prisma.order.deleteMany({
          where: {
            id: {
              in: uniqueOrderIds,
            },
          },
        });

        console.log(
          "PASS: Order test dihapus."
        );
      }

      /**
       * Restore SKU ke kondisi awal.
       *
       * Ini sengaja menggunakan nilai snapshot awal,
       * bukan increment berdasarkan jumlah order,
       * sehingga aman jika concurrency test menghasilkan
       * 1 atau lebih order sebelum test gagal.
       */

      if (
        skuId &&
        originalSkuStock !== null
      ) {
        await prisma.productSku.update({
          where: {
            id: skuId,
          },
          data: {
            stock:
              originalSkuStock,
          },
        });

        console.log(
          "PASS: Stock SKU dikembalikan ke nilai awal."
        );
      }

      /**
       * Hapus dedicated Flash Sale TEST 16 terlebih dahulu.
       * FlashSaleItem harus dihapus sebelum FlashSale.
       */

      if (
        expirationFlashSaleItemId
      ) {
        await prisma.flashSaleItem.delete({
          where: {
            id:
              expirationFlashSaleItemId,
          },
        });

        console.log(
          "PASS: Expiration FlashSaleItem dihapus."
        );
      }

      if (
        expirationFlashSaleId
      ) {
        await prisma.flashSale.delete({
          where: {
            id:
              expirationFlashSaleId,
          },
        });

        console.log(
          "PASS: Expiration FlashSale dihapus."
        );
      }

      /**
 * Hapus dedicated Flash Sale TEST 18.
 * FlashSaleItem harus dihapus terlebih dahulu.
 */
if (paymentCancelFlashSaleItemId) {
  await prisma.flashSaleItem.delete({
    where: {
      id:
        paymentCancelFlashSaleItemId,
    },
  });

  console.log(
    "PASS: Payment/cancellation FlashSaleItem dihapus."
  );
}

if (paymentCancelFlashSaleId) {
  await prisma.flashSale.delete({
    where: {
      id:
        paymentCancelFlashSaleId,
    },
  });

  console.log(
    "PASS: Payment/cancellation FlashSale dihapus."
  );
}

      /**
       * Hapus concurrency Flash Sale.
       * FlashSaleItem harus dihapus terlebih dahulu.
       */

      if (
        concurrencyFlashSaleItemId
      ) {
        await prisma.flashSaleItem.delete({
          where: {
            id:
              concurrencyFlashSaleItemId,
          },
        });

        console.log(
          "PASS: Concurrency FlashSaleItem dihapus."
        );
      }

      if (
        concurrencyFlashSaleId
      ) {
        await prisma.flashSale.delete({
          where: {
            id:
              concurrencyFlashSaleId,
          },
        });

        console.log(
          "PASS: Concurrency FlashSale dihapus."
        );
      }

      /**
       * Hapus Flash Sale utama.
       */

      if (
        flashSaleItemId
      ) {
        await prisma.flashSaleItem.delete({
          where: {
            id:
              flashSaleItemId,
          },
        });

        console.log(
          "PASS: FlashSaleItem test dihapus."
        );
      }

      if (flashSaleId) {
        await prisma.flashSale.delete({
          where: {
            id: flashSaleId,
          },
        });

        console.log(
          "PASS: FlashSale test dihapus."
        );
      }

      /**
       * Hapus temporary address customer kedua
       * setelah semua order sudah dihapus.
       */

      if (secondAddressId) {
        await prisma.address.delete({
          where: {
            id:
              secondAddressId,
          },
        });

        console.log(
          "PASS: Temporary address customer kedua dihapus."
        );
      }

      console.log(
        "CLEANUP SELESAI."
      );
    } catch (cleanupError) {
      console.error("");
      console.error(
        "WARNING: Cleanup test gagal."
      );
      console.error(
        getErrorMessage(
          cleanupError
        )
      );
    }
  }
}

main()
  .catch(async (error) => {
    console.error("");
    console.error(
      "============================================================"
    );
    console.error(
      "FLASH SALE ORDER FLOW TEST FAILED"
    );
    console.error(
      "============================================================"
    );
    console.error(
      getErrorMessage(error)
    );

    await prisma.$disconnect();

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  