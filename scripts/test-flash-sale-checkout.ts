import {
  FlashSaleStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import FlashSaleCheckoutService, {
  FlashSaleCheckoutRequirement,
} from "@/services/flash-sale/flash-sale-checkout.service";

const TEST_SKU =
  "TEST-TUNA-500GR";

const TEST_USER_ID =
  "436d434a-64d9-4abf-80ed-33179ef3e4ab";

const TEST_FLASH_SALE_PREFIX =
  "TEST-FS-CHECKOUT-";

function assert(
  condition: unknown,
  message: string
) {
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

async function cleanup() {
  await prisma.flashSalePurchase.deleteMany({
    where: {
      orderId: {
        startsWith:
          "test-order-fs-",
      },
    },
  });

  await prisma.flashSaleItem.deleteMany({
    where: {
      flashSale: {
        name: {
          startsWith:
            TEST_FLASH_SALE_PREFIX,
        },
      },
    },
  });

  await prisma.flashSale.deleteMany({
    where: {
      name: {
        startsWith:
          TEST_FLASH_SALE_PREFIX,
      },
    },
  });
}

async function main() {
  console.log("");
  console.log(
    "============================================================"
  );
  console.log(
    "FLASH SALE CHECKOUT INTEGRATION TEST"
  );
  console.log(
    "============================================================"
  );

  /**
   * ==========================================================
   * CLEAN OLD TEST DATA
   * ==========================================================
   */

  await cleanup();

  /**
   * ==========================================================
   * 1. PREPARE USER
   * ==========================================================
   */

  const user =
    await prisma.user.findUniqueOrThrow({
      where: {
        id:
          TEST_USER_ID,
      },

      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

  assert(
    user.role === "CUSTOMER",
    `User test harus CUSTOMER, tetapi ${user.role}.`
  );

  assert(
    user.isActive,
    "User test harus aktif."
  );

  console.log("");
  console.log(
    "TEST 1 - PREPARE CUSTOMER"
  );

  console.log({
    userId:
      user.id,

    email:
      user.email,

    role:
      user.role,

    isActive:
      user.isActive,
  });

  console.log(
    "PASS: Customer test tersedia."
  );

  /**
   * ==========================================================
   * 2. PREPARE SKU
   * ==========================================================
   */

  const sku =
    await prisma.productSku.findUniqueOrThrow({
      where: {
        sku:
          TEST_SKU,
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
    sku.isActive,
    `SKU ${TEST_SKU} harus aktif.`
  );

  console.log("");
  console.log(
    "TEST 2 - PREPARE SKU"
  );

  console.log({
    sku:
      sku.sku,

    price:
      sku.price.toString(),

    stock:
      sku.stock,

    isActive:
      sku.isActive,
  });

  console.log(
    "PASS: SKU test tersedia."
  );

  /**
   * ==========================================================
   * 3. CREATE ACTIVE FLASH SALE
   * ==========================================================
   */

  const now =
    new Date();

  const flashSale =
    await prisma.flashSale.create({
      data: {
        name:
          `${TEST_FLASH_SALE_PREFIX}${Date.now()}`,

        slug:
          `${TEST_FLASH_SALE_PREFIX.toLowerCase()}${Date.now()}`,

        description:
          "Integration test Flash Sale checkout.",

        status:
          FlashSaleStatus.ACTIVE,

        startAt:
          new Date(
            now.getTime() -
              60_000
          ),

        endAt:
          new Date(
            now.getTime() +
              3_600_000
          ),
      },
    });

  const flashSaleItem =
    await prisma.flashSaleItem.create({
      data: {
        flashSaleId:
          flashSale.id,

        productId:
          sku.productId,

        skuId:
          sku.id,

        originalPrice:
          new Prisma.Decimal(
            sku.price
          ),

        flashPrice:
          new Prisma.Decimal(
            12_000
          ),

        stockLimit:
          2,

        soldQuantity:
          0,

        perUserLimit:
          1,

        isActive:
          true,

        sortOrder:
          0,
      },
    });

  console.log("");
  console.log(
    "TEST 3 - CREATE ACTIVE FLASH SALE"
  );

  console.log({
    flashSaleId:
      flashSale.id,

    flashSaleItemId:
      flashSaleItem.id,

    originalPrice:
      flashSaleItem.originalPrice.toString(),

    flashPrice:
      flashSaleItem.flashPrice.toString(),

    stockLimit:
      flashSaleItem.stockLimit,

    soldQuantity:
      flashSaleItem.soldQuantity,

    perUserLimit:
      flashSaleItem.perUserLimit,
  });

  console.log(
    "PASS: Active Flash Sale berhasil dibuat."
  );

  /**
   * ==========================================================
   * 4. SUCCESSFUL CONSUMPTION
   * ==========================================================
   */

  console.log("");
  console.log(
    "TEST 4 - SUCCESSFUL CONSUMPTION"
  );

  const orderA =
    `test-order-fs-a-${Date.now()}`;

  const requirementA:
    FlashSaleCheckoutRequirement = {
    flashSaleItemId:
      flashSaleItem.id,

    quantity:
      1,

    price:
      new Prisma.Decimal(
        12_000
      ),
  };

  await prisma.$transaction(
    async (tx) => {
      await FlashSaleCheckoutService.consume(
        {
          userId:
            TEST_USER_ID,

          orderId:
            orderA,

          requirements: [
            requirementA,
          ],
        },

        tx
      );
    }
  );

  const afterConsume =
    await prisma.flashSaleItem.findUniqueOrThrow(
      {
        where: {
          id:
            flashSaleItem.id,
        },

        select: {
          soldQuantity: true,
          stockLimit: true,
        },
      }
    );

  assert(
    afterConsume.soldQuantity === 1,
    `FAIL: soldQuantity seharusnya 1, tetapi ${afterConsume.soldQuantity}.`
  );

  const purchaseA =
    await prisma.flashSalePurchase.findFirstOrThrow(
      {
        where: {
          flashSaleItemId:
            flashSaleItem.id,

          userId:
            TEST_USER_ID,

          orderId:
            orderA,
        },

        select: {
          id: true,
          quantity: true,
          price: true,
        },
      }
    );

  assert(
    purchaseA.quantity === 1,
    `FAIL: FlashSalePurchase.quantity seharusnya 1, tetapi ${purchaseA.quantity}.`
  );

  assert(
    purchaseA.price.toString() ===
      "12000",
    `FAIL: FlashSalePurchase.price seharusnya 12000, tetapi ${purchaseA.price.toString()}.`
  );

  console.log(
    "PASS: soldQuantity bertambah menjadi 1."
  );

  console.log(
    "PASS: FlashSalePurchase berhasil dibuat."
  );

  console.log(
    "PASS: Harga FlashSalePurchase = 12.000."
  );

  /**
   * ==========================================================
   * 5. PER USER LIMIT
   * ==========================================================
   */

  console.log("");
  console.log(
    "TEST 5 - PER USER LIMIT"
  );

  let perUserLimitRejected =
    false;

  const orderB =
    `test-order-fs-b-${Date.now()}`;

  try {
    await prisma.$transaction(
      async (tx) => {
        await FlashSaleCheckoutService.consume(
          {
            userId:
              TEST_USER_ID,

            orderId:
              orderB,

            requirements: [
              requirementA,
            ],
          },

          tx
        );
      }
    );

    console.error(
      "FAIL: Checkout kedua user yang sama seharusnya ditolak."
    );
  } catch (error) {
    const message =
      getErrorMessage(error);

    if (
      message.includes(
        "Batas pembelian Flash Sale"
      )
    ) {
      perUserLimitRejected =
        true;

      console.log(
        "PASS: Per-user limit berhasil mencegah pembelian kedua."
      );

      console.log(
        "Message:",
        message
      );
    } else {
      throw error;
    }
  }

  assert(
    perUserLimitRejected,
    "TEST 5 gagal."
  );

  const afterLimitAttempt =
    await prisma.flashSaleItem.findUniqueOrThrow(
      {
        where: {
          id:
            flashSaleItem.id,
        },

        select: {
          soldQuantity: true,
        },
      }
    );

  assert(
    afterLimitAttempt.soldQuantity === 1,
    `FAIL: soldQuantity berubah setelah per-user limit ditolak. Nilai: ${afterLimitAttempt.soldQuantity}`
  );

  console.log(
    "PASS: soldQuantity tetap 1 setelah rejection."
  );

  /**
   * ==========================================================
   * 6. QUOTA CONSUMPTION
   * ==========================================================
   *
   * Untuk menguji quota, kita membutuhkan customer kedua.
   */

  console.log("");
  console.log(
    "TEST 6 - QUOTA CONSUMPTION"
  );

  const secondUser =
    await prisma.user.findFirstOrThrow({
      where: {
        role:
          "CUSTOMER",

        isActive:
          true,

        id: {
          not:
            TEST_USER_ID,
        },
      },

      select: {
        id: true,
        email: true,
      },
    });

  const orderC =
    `test-order-fs-c-${Date.now()}`;

  await prisma.$transaction(
    async (tx) => {
      await FlashSaleCheckoutService.consume(
        {
          userId:
            secondUser.id,

          orderId:
            orderC,

          requirements: [
            requirementA,
          ],
        },

        tx
      );
    }
  );

  const afterSecondUser =
    await prisma.flashSaleItem.findUniqueOrThrow(
      {
        where: {
          id:
            flashSaleItem.id,
        },

        select: {
          soldQuantity: true,
          stockLimit: true,
        },
      }
    );

  assert(
    afterSecondUser.soldQuantity === 2,
    `FAIL: soldQuantity seharusnya 2, tetapi ${afterSecondUser.soldQuantity}.`
  );

  console.log(
    "PASS: Customer kedua berhasil menggunakan quota terakhir."
  );

  console.log(
    "Customer kedua:",
    secondUser.email
  );

  /**
   * ==========================================================
   * 7. QUOTA EXHAUSTED
   * ==========================================================
   */

  console.log("");
  console.log(
    "TEST 7 - QUOTA EXHAUSTED"
  );

  const thirdUser =
    await prisma.user.findFirstOrThrow({
      where: {
        role:
          "CUSTOMER",

        isActive:
          true,

        id: {
          notIn: [
            TEST_USER_ID,
            secondUser.id,
          ],
        },
      },

      select: {
        id: true,
        email: true,
      },
    });

  const orderD =
    `test-order-fs-d-${Date.now()}`;

  let quotaRejected =
    false;

  try {
    await prisma.$transaction(
      async (tx) => {
        await FlashSaleCheckoutService.consume(
          {
            userId:
              thirdUser.id,

            orderId:
              orderD,

            requirements: [
              requirementA,
            ],
          },

          tx
        );
      }
    );

    console.error(
      "FAIL: Checkout seharusnya ditolak karena quota habis."
    );
  } catch (error) {
    const message =
      getErrorMessage(error);

    if (
      message.includes(
        "Kuota Flash Sale"
      )
    ) {
      quotaRejected =
        true;

      console.log(
        "PASS: Checkout ditolak ketika quota habis."
      );

      console.log(
        "Message:",
        message
      );
    } else {
      throw error;
    }
  }

  assert(
    quotaRejected,
    "TEST 7 gagal."
  );

  const afterQuotaRejected =
    await prisma.flashSaleItem.findUniqueOrThrow(
      {
        where: {
          id:
            flashSaleItem.id,
        },

        select: {
          soldQuantity: true,
        },
      }
    );

  assert(
    afterQuotaRejected.soldQuantity === 2,
    `FAIL: soldQuantity berubah setelah quota rejection. Nilai: ${afterQuotaRejected.soldQuantity}`
  );

  console.log(
    "PASS: soldQuantity tetap 2 setelah quota habis."
  );

  /**
   * ==========================================================
   * 8. TRANSACTION ROLLBACK
   * ==========================================================
   */

  console.log("");
  console.log(
    "TEST 8 - TRANSACTION ROLLBACK"
  );

  const rollbackFlashSale =
    await prisma.flashSale.create({
      data: {
        name:
          `${TEST_FLASH_SALE_PREFIX}ROLLBACK-${Date.now()}`,

        slug:
          `${TEST_FLASH_SALE_PREFIX.toLowerCase()}rollback-${Date.now()}`,

        status:
          FlashSaleStatus.ACTIVE,

        startAt:
          new Date(
            Date.now() -
              60_000
          ),

        endAt:
          new Date(
            Date.now() +
              3_600_000
          ),
      },
    });

  const rollbackItem =
    await prisma.flashSaleItem.create({
      data: {
        flashSaleId:
          rollbackFlashSale.id,

        productId:
          sku.productId,

        skuId:
          sku.id,

        originalPrice:
          new Prisma.Decimal(
            sku.price
          ),

        flashPrice:
          new Prisma.Decimal(
            12_000
          ),

        stockLimit:
          1,

        soldQuantity:
          0,

        perUserLimit:
          1,

        isActive:
          true,

        sortOrder:
          0,
      },
    });

  const rollbackOrder =
    `test-order-fs-rollback-${Date.now()}`;

  let rollbackTriggered =
    false;

  try {
    await prisma.$transaction(
      async (tx) => {
        await FlashSaleCheckoutService.consume(
          {
            userId:
              TEST_USER_ID,

            orderId:
              rollbackOrder,

            requirements: [
              {
                flashSaleItemId:
                  rollbackItem.id,

                quantity:
                  1,

                price:
                  new Prisma.Decimal(
                    12_000
                  ),
              },
            ],
          },

          tx
        );

        throw new Error(
          "TEST_ROLLBACK"
        );
      }
    );
  } catch (error) {
    if (
      getErrorMessage(error) ===
      "TEST_ROLLBACK"
    ) {
      rollbackTriggered =
        true;
    } else {
      throw error;
    }
  }

  assert(
    rollbackTriggered,
    "FAIL: Rollback test tidak terpicu."
  );

  const rollbackAfter =
    await prisma.flashSaleItem.findUniqueOrThrow(
      {
        where: {
          id:
            rollbackItem.id,
        },

        select: {
          soldQuantity: true,
        },
      }
    );

  assert(
    rollbackAfter.soldQuantity === 0,
    `FAIL: soldQuantity tidak rollback. Nilai: ${rollbackAfter.soldQuantity}`
  );

  const rollbackPurchase =
    await prisma.flashSalePurchase.findFirst({
      where: {
        flashSaleItemId:
          rollbackItem.id,

        orderId:
          rollbackOrder,
      },
    });

  assert(
    rollbackPurchase === null,
    "FAIL: FlashSalePurchase tetap tersimpan setelah transaction rollback."
  );

  console.log(
    "PASS: soldQuantity berhasil rollback ke 0."
  );

  console.log(
    "PASS: FlashSalePurchase ikut rollback."
  );

  /**
   * ==========================================================
   * 9. FINAL STATE
   * ==========================================================
   */

  const finalItem =
    await prisma.flashSaleItem.findUniqueOrThrow(
      {
        where: {
          id:
            flashSaleItem.id,
        },

        select: {
          soldQuantity: true,
          stockLimit: true,
        },
      }
    );

  const purchases =
    await prisma.flashSalePurchase.count({
      where: {
        flashSaleItemId:
          flashSaleItem.id,
      },
    });

  console.log("");
  console.log(
    "TEST 9 - FINAL STATE"
  );

  console.log({
    soldQuantity:
      finalItem.soldQuantity,

    stockLimit:
      finalItem.stockLimit,

    purchaseCount:
      purchases,
  });

  assert(
    finalItem.soldQuantity === 2,
    `FAIL: Final soldQuantity seharusnya 2, tetapi ${finalItem.soldQuantity}.`
  );

  assert(
    purchases === 2,
    `FAIL: Final purchaseCount seharusnya 2, tetapi ${purchases}.`
  );

  console.log(
    "PASS: Final soldQuantity = 2."
  );

  console.log(
    "PASS: Final FlashSalePurchase count = 2."
  );

  /**
   * ==========================================================
   * FINAL
   * ==========================================================
   */

  console.log("");
  console.log(
    "============================================================"
  );

  console.log(
    "FLASH SALE CHECKOUT TEST PASSED"
  );

  console.log(
    "============================================================"
  );
}

main()
  .catch(async (error) => {
    console.error("");
    console.error(
      "============================================================"
    );

    console.error(
      "FLASH SALE CHECKOUT TEST FAILED"
    );

    console.error(
      "============================================================"
    );

    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });