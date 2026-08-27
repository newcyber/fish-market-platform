import {
  FlashSaleStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "../src/lib/prisma";
import FlashSaleRepository from "../src/repositories/flash-sale/flash-sale.repository";

const TEST_PREFIX =
  `TEST CUSTOMER FLASH SALE ${Date.now()}`;

const assert: (
  condition: unknown,
  message: string
) => asserts condition = (
  condition,
  message
) => {
  if (!condition) {
    throw new Error(message);
  }
};

const section = (
  number: number,
  title: string
) => {
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
};

let skuId: string | undefined;

const flashSaleIds: string[] = [];

async function cleanup() {
  console.log("");
  console.log(
    "------------------------------------------------------------"
  );
  console.log(
    "CLEANUP"
  );
  console.log(
    "------------------------------------------------------------"
  );

  if (flashSaleIds.length > 0) {
    await prisma.flashSalePurchase.deleteMany({
      where: {
        flashSaleItem: {
          flashSaleId: {
            in: flashSaleIds,
          },
        },
      },
    });

    await prisma.flashSaleItem.deleteMany({
      where: {
        flashSaleId: {
          in: flashSaleIds,
        },
      },
    });

    await prisma.flashSale.deleteMany({
      where: {
        id: {
          in: flashSaleIds,
        },
      },
    });
  }

  console.log(
    "PASS: Fixture Flash Sale customer-read dibersihkan."
  );
}

async function createFlashSale(params: {
  name: string;
  startAt: Date;
  endAt: Date;
  status: FlashSaleStatus;
  stockLimit?: number;
  soldQuantity?: number;
  isActive?: boolean;
  skuId?: string | null;
}) {
  const {
    name,
    startAt,
    endAt,
    status,
    stockLimit = 10,
    soldQuantity = 0,
    isActive = true,
    skuId: itemSkuId = skuId,
  } = params;

  assert(
    itemSkuId,
    "SKU fixture wajib tersedia."
  );

  const flashSale =
    await prisma.flashSale.create({
      data: {
        name,

        slug:
          `${name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        description:
          "Integration test customer Flash Sale read model.",

        status,

        startAt,

        endAt,

        sortOrder:
          999999,

        items: {
          create: {
            productId:
              (
                await prisma.productSku.findUniqueOrThrow({
                  where: {
                    id:
                      itemSkuId,
                  },

                  select: {
                    productId: true,
                  },
                })
              ).productId,

            skuId:
              itemSkuId,

            originalPrice:
              new Prisma.Decimal(
                20000
              ),

            flashPrice:
              new Prisma.Decimal(
                12000
              ),

            stockLimit,

            soldQuantity,

            perUserLimit:
              1,

            isActive,
          },
        },
      },

      include: {
        items: true,
      },
    });

  flashSaleIds.push(
    flashSale.id
  );

  return flashSale;
}

async function main() {
  console.log(
    "============================================================"
  );
  console.log(
    "FLASH SALE CUSTOMER READ MODEL INTEGRATION TEST"
  );
  console.log(
    "============================================================"
  );

  try {
    /**
     * ========================================================
     * PREPARE SKU
     * ========================================================
     */

    section(
      1,
      "PREPARE SKU"
    );

    const sku =
      await prisma.productSku.findFirst({
        where: {
          isActive:
            true,
        },

        select: {
          id: true,
          sku: true,
          productId: true,
          price: true,
          isActive: true,
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

    assert(
      sku !== null,
      "FAIL: Tidak ditemukan SKU aktif untuk customer-read test."
    );

    skuId =
      sku.id;

    console.log({
      skuId:
        sku.id,

      sku:
        sku.sku,

      productId:
        sku.productId,

      price:
        sku.price.toString(),

      isActive:
        sku.isActive,
    });

    console.log(
      "PASS: SKU aktif tersedia."
    );

    /**
     * ========================================================
     * TEST 2
     * ACTIVE CAMPAIGN
     * ========================================================
     */

    section(
      2,
      "ACTIVE CAMPAIGN"
    );

    const now =
      new Date();

    const activeFlashSale =
      await createFlashSale({
        name:
          `${TEST_PREFIX} ACTIVE`,

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
              10 * 60_000
          ),

        stockLimit:
          10,

        soldQuantity:
          3,
      });

    const activeResult =
      await FlashSaleRepository.findActiveForCustomer();

    const activeCampaign =
      activeResult.find(
        (flashSale) =>
          flashSale.id ===
          activeFlashSale.id
      );

    assert(
      activeCampaign !== undefined,
      "FAIL: Active Flash Sale tidak ditemukan oleh customer read model."
    );

    assert(
      activeCampaign.items.length === 1,
      `FAIL: Active campaign seharusnya memiliki 1 item valid, ditemukan ${activeCampaign.items.length}.`
    );

    const activeItem =
      activeCampaign.items[0];

    assert(
      activeItem.skuId ===
        sku.id,
      "FAIL: SKU customer read model tidak sesuai."
    );

    assert(
      activeItem.remainingQuantity ===
        7,
      `FAIL: remainingQuantity seharusnya 7, tetapi ${activeItem.remainingQuantity}.`
    );

    assert(
      activeItem.discountPercent ===
        40,
      `FAIL: discountPercent seharusnya 40%, tetapi ${activeItem.discountPercent}%.`
    );

    console.log({
      flashSaleId:
        activeCampaign.id,

      itemId:
        activeItem.id,

      remainingQuantity:
        activeItem.remainingQuantity,

      discountPercent:
        activeItem.discountPercent,
    });

    console.log(
      "PASS: Active Flash Sale tampil dengan quota dan discount yang benar."
    );

    /**
     * ========================================================
     * TEST 3
     * NOT STARTED
     * ========================================================
     */

    section(
      3,
      "NOT STARTED CAMPAIGN"
    );

    const notStarted =
      await createFlashSale({
        name:
          `${TEST_PREFIX} NOT STARTED`,

        status:
          FlashSaleStatus.ACTIVE,

        startAt:
          new Date(
            now.getTime() +
              10 * 60_000
          ),

        endAt:
          new Date(
            now.getTime() +
              20 * 60_000
          ),
      });

    const notStartedResult =
      await FlashSaleRepository.findActiveForCustomer();

    assert(
      !notStartedResult.some(
        (flashSale) =>
          flashSale.id ===
          notStarted.id
      ),
      "FAIL: Flash Sale yang belum dimulai tidak boleh tampil."
    );

    console.log(
      "PASS: Campaign yang belum dimulai tidak tampil."
    );

    /**
     * ========================================================
     * TEST 4
     * EXPIRED
     * ========================================================
     */

    section(
      4,
      "EXPIRED CAMPAIGN"
    );

    const expired =
      await createFlashSale({
        name:
          `${TEST_PREFIX} EXPIRED`,

        status:
          FlashSaleStatus.ACTIVE,

        startAt:
          new Date(
            now.getTime() -
              20 * 60_000
          ),

        endAt:
          new Date(
            now.getTime() -
              10 * 60_000
          ),
      });

    const expiredResult =
      await FlashSaleRepository.findActiveForCustomer();

    assert(
      !expiredResult.some(
        (flashSale) =>
          flashSale.id ===
          expired.id
      ),
      "FAIL: Flash Sale yang sudah expired tidak boleh tampil."
    );

    console.log(
      "PASS: Campaign expired tidak tampil."
    );

    /**
     * ========================================================
     * TEST 5
     * CANCELLED
     * ========================================================
     */

    section(
      5,
      "CANCELLED CAMPAIGN"
    );

    const cancelled =
      await createFlashSale({
        name:
          `${TEST_PREFIX} CANCELLED`,

        status:
          FlashSaleStatus.CANCELLED,

        startAt:
          new Date(
            now.getTime() -
              60_000
          ),

        endAt:
          new Date(
            now.getTime() +
              10 * 60_000
          ),
      });

    const cancelledResult =
      await FlashSaleRepository.findActiveForCustomer();

    assert(
      !cancelledResult.some(
        (flashSale) =>
          flashSale.id ===
          cancelled.id
      ),
      "FAIL: Campaign CANCELLED tidak boleh tampil."
    );

    console.log(
      "PASS: Campaign CANCELLED tidak tampil."
    );

    /**
     * ========================================================
     * TEST 6
     * SOLD OUT ITEM
     * ========================================================
     */

    section(
      6,
      "SOLD OUT ITEM"
    );

    const soldOut =
      await createFlashSale({
        name:
          `${TEST_PREFIX} SOLD OUT`,

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
              10 * 60_000
          ),

        stockLimit:
          5,

        soldQuantity:
          5,
      });

    const soldOutResult =
      await FlashSaleRepository.findActiveForCustomer();

    assert(
      !soldOutResult.some(
        (flashSale) =>
          flashSale.id ===
          soldOut.id
      ),
      "FAIL: Campaign yang seluruh item-nya sold out tidak boleh tampil."
    );

    console.log(
      "PASS: Sold-out campaign tidak tampil."
    );

    /**
     * ========================================================
     * TEST 7
     * INACTIVE ITEM
     * ========================================================
     */

    section(
      7,
      "INACTIVE ITEM"
    );

    const inactiveItem =
      await createFlashSale({
        name:
          `${TEST_PREFIX} INACTIVE ITEM`,

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
              10 * 60_000
          ),

        isActive:
          false,
      });

    const inactiveItemResult =
      await FlashSaleRepository.findActiveForCustomer();

    assert(
      !inactiveItemResult.some(
        (flashSale) =>
          flashSale.id ===
          inactiveItem.id
      ),
      "FAIL: Campaign yang hanya memiliki item inactive tidak boleh tampil."
    );

    console.log(
      "PASS: Item Flash Sale inactive tidak tampil."
    );

    /**
     * ========================================================
     * TEST 8
     * FINAL VALIDATION
     * ========================================================
     */

    section(
      8,
      "FINAL CUSTOMER READ MODEL VALIDATION"
    );

    const finalResult =
      await FlashSaleRepository.findActiveForCustomer();

    const finalActive =
      finalResult.find(
        (flashSale) =>
          flashSale.id ===
          activeFlashSale.id
      );

    assert(
      finalActive !== undefined,
      "FAIL: Active fixture hilang dari final customer read model."
    );

    assert(
      finalActive.items.length === 1,
      "FAIL: Active fixture harus memiliki tepat 1 item customer-facing."
    );

    const finalItem =
      finalActive.items[0];

    assert(
      finalItem.sku !== null,
      "FAIL: Customer read model mengembalikan item tanpa SKU."
    );

    assert(
      finalItem.sku.isActive,
      "FAIL: Customer read model mengembalikan SKU inactive."
    );

    assert(
      finalItem.stockLimit >
        finalItem.soldQuantity,
      "FAIL: Customer read model mengembalikan item sold out."
    );

    assert(
      finalItem.remainingQuantity >
        0,
      "FAIL: remainingQuantity harus lebih besar dari 0."
    );

    console.log(
      "PASS: Customer read model hanya mengembalikan Flash Sale yang valid."
    );

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "FLASH SALE CUSTOMER READ MODEL TEST PASSED"
    );
    console.log(
      "============================================================"
    );
  } catch (error) {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "FLASH SALE CUSTOMER READ MODEL TEST FAILED"
    );
    console.log(
      "============================================================"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    try {
      await cleanup();
    } finally {
      await prisma.$disconnect();
    }
  }
}

main();
