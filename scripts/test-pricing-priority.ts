import {
  Prisma,
  ProductDiscountType,
  PromotionDiscountType,
  PromotionStatus,
  PromotionType,
  FlashSaleStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import ProductPricingService from "@/services/pricing/product-pricing.service";
import PromotionService from "@/services/promotion/promotion.service";

const TEST_SKU = "TEST-TUNA-500GR";
const TEST_PREFIX = "TEST-PRICING-";

function assert(
  condition: boolean,
  message: string
) {
  if (!condition) {
    throw new Error(message);
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : String(error);
}

async function main() {
  console.log("");
  console.log(
    "============================================================"
  );
  console.log(
    "PRICING PRIORITY INTEGRATION TEST"
  );
  console.log(
    "============================================================"
  );

  /**
   * ============================================================
   * TEST STATE
   * ============================================================
   */

  const createdPromotionIds: string[] = [];
  const createdFlashSaleIds: string[] = [];

  /**
   * ============================================================
   * RESOLVE TEST SKU
   * ============================================================
   */

  const sku =
  await prisma.productSku.findUniqueOrThrow({
    where: {
      sku: TEST_SKU,
    },

    select: {
      id: true,
      sku: true,
      productId: true,
      price: true,
      stock: true,
      isActive: true,

      isDiscountActive: true,
      discountType: true,
      discountValue: true,
      discountStartAt: true,
      discountEndAt: true,
    },
  });

  /**
   * Simpan konfigurasi SKU asli.
   *
   * WAJIB dikembalikan pada finally.
   */
  const originalSkuDiscount = {
    isDiscountActive:
      sku.isDiscountActive,

    discountType:
      sku.discountType,

    discountValue:
      sku.discountValue,

    discountStartAt:
      sku.discountStartAt,

    discountEndAt:
      sku.discountEndAt,
  };

  /**
   * ============================================================
   * HELPERS
   * ============================================================
   */

  async function resolvePricing() {
    return prisma.$transaction(
      async (tx) =>
        ProductPricingService.resolve(
          tx,
          {
            productId:
              sku.productId,

            skuId:
              sku.id,
          }
        )
    );
  }

  async function setSkuDiscount(
    enabled: boolean,
    type:
      | ProductDiscountType
      | null = null,
    value:
      | number
      | null = null
  ) {
    await prisma.productSku.update({
      where: {
        id: sku.id,
      },

      data: {
        isDiscountActive:
          enabled,

        discountType:
          enabled ? type : null,

        discountValue:
          enabled ? value : null,

        discountStartAt:
          enabled
            ? new Date(
                Date.now() - 60_000
              )
            : null,

        discountEndAt:
          enabled
            ? new Date(
                Date.now() + 3_600_000
              )
            : null,
      },
    });
  }

  async function createPromotion(
    name: string,
    discountValue: number
  ) {
    const unique =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    const promotion =
      await PromotionService.create({
        name,

        slug:
          `${TEST_PREFIX.toLowerCase()}promotion-${unique}`,

        type:
          PromotionType.PRICE_DISCOUNT,

        discountType:
          PromotionDiscountType.PERCENTAGE,

        discountValue,

        status:
          PromotionStatus.ACTIVE,

        startAt:
          new Date(
            Date.now() - 60_000
          ),

        endAt:
          new Date(
            Date.now() + 3_600_000
          ),
      });

    createdPromotionIds.push(
      promotion.id
    );

    await PromotionService.addSku(
      promotion.id,
      sku.id
    );

    return promotion;
  }

  async function createFlashSale(
    flashPrice: number
  ) {
    const unique =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    const flashSale =
      await prisma.flashSale.create({
        data: {
          name:
            `${TEST_PREFIX}FLASH-${unique}`,

          slug:
            `${TEST_PREFIX.toLowerCase()}flash-${unique}`,

          status:
            FlashSaleStatus.ACTIVE,

          startAt:
            new Date(
              Date.now() - 60_000
            ),

          endAt:
            new Date(
              Date.now() + 3_600_000
            ),

          items: {
            create: {
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
                  flashPrice
                ),

              stockLimit: 100,

              soldQuantity: 0,

              perUserLimit: null,

              isActive: true,

              sortOrder: 0,
            },
          },
        },
      });

    createdFlashSaleIds.push(
      flashSale.id
    );

    return flashSale;
  }

  /**
   * ============================================================
   * CLEANUP
   * ============================================================
   *
   * Cleanup dilakukan langsung melalui Prisma karena
   * integration test boleh membersihkan data test tanpa
   * melewati business lifecycle.
   *
   * Urutan:
   *
   * FlashSale
   * Promotion
   * SKU Discount
   *
   * PromotionItem dan FlashSaleItem akan ikut terhapus
   * berdasarkan onDelete Cascade pada schema.
   */
  async function cleanup() {
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "CLEANUP TEST DATA"
    );
    console.log(
      "------------------------------------------------------------"
    );

    /**
     * ----------------------------------------------------------
     * FLASH SALE
     * ----------------------------------------------------------
     */

    for (
      const flashSaleId of createdFlashSaleIds
    ) {
      try {
        await prisma.flashSale.delete({
          where: {
            id: flashSaleId,
          },
        });

        console.log(
          `Cleanup Flash Sale: ${flashSaleId}`
        );
      } catch (error) {
        console.error(
          `Cleanup Flash Sale gagal ${flashSaleId}:`,
          getErrorMessage(error)
        );
      }
    }

    /**
     * ----------------------------------------------------------
     * PROMOTION
     * ----------------------------------------------------------
     */

    for (
      const promotionId of createdPromotionIds
    ) {
      try {
        await prisma.promotion.delete({
          where: {
            id: promotionId,
          },
        });

        console.log(
          `Cleanup Promotion: ${promotionId}`
        );
      } catch (error) {
        console.error(
          `Cleanup Promotion gagal ${promotionId}:`,
          getErrorMessage(error)
        );
      }
    }

    /**
     * ----------------------------------------------------------
     * RESTORE SKU DISCOUNT
     * ----------------------------------------------------------
     */

    try {
      await prisma.productSku.update({
        where: {
          id: sku.id,
        },

        data: {
          isDiscountActive:
            originalSkuDiscount.isDiscountActive,

          discountType:
            originalSkuDiscount.discountType,

          discountValue:
            originalSkuDiscount.discountValue,

          discountStartAt:
            originalSkuDiscount.discountStartAt,

          discountEndAt:
            originalSkuDiscount.discountEndAt,
        },
      });

      console.log(
        `SKU ${TEST_SKU} dikembalikan ke konfigurasi awal.`
      );
    } catch (error) {
      console.error(
        "Restore SKU discount gagal:",
        getErrorMessage(error)
      );
    }
  }

  /**
   * ============================================================
   * MAIN TEST FLOW
   * ============================================================
   */

  try {
    /**
     * ==========================================================
     * TEST 1
     * NO DISCOUNT
     * ==========================================================
     */

    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 1 - NO DISCOUNT"
    );
    console.log(
      "------------------------------------------------------------"
    );

    await setSkuDiscount(false);

    const noDiscount =
      await resolvePricing();

    console.log({
      originalPrice:
        noDiscount.originalPrice.toString(),

      discountAmount:
        noDiscount.discountAmount.toString(),

      finalPrice:
        noDiscount.finalPrice.toString(),

      discountSource:
        noDiscount.discountSource,
    });

    assert(
      noDiscount.originalPrice.toString() ===
        "20000",
      `FAIL: originalPrice seharusnya 20000, tetapi ${noDiscount.originalPrice.toString()}`
    );

    assert(
      noDiscount.discountAmount.toString() ===
        "0",
      `FAIL: discountAmount seharusnya 0, tetapi ${noDiscount.discountAmount.toString()}`
    );

    assert(
      noDiscount.finalPrice.toString() ===
        "20000",
      `FAIL: finalPrice seharusnya 20000, tetapi ${noDiscount.finalPrice.toString()}`
    );

    assert(
      noDiscount.discountSource ===
        "NONE",
      `FAIL: discountSource seharusnya NONE, tetapi ${noDiscount.discountSource}`
    );

    console.log(
      "PASS: Harga normal tanpa discount = 20.000."
    );

    /**
     * ==========================================================
     * TEST 2
     * PRODUCT SKU DISCOUNT
     * ==========================================================
     */

    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 2 - PRODUCT SKU DISCOUNT"
    );
    console.log(
      "------------------------------------------------------------"
    );

    await setSkuDiscount(
      true,
      ProductDiscountType.PERCENTAGE,
      50
    );

    const skuDiscount =
      await resolvePricing();

    console.log({
      originalPrice:
        skuDiscount.originalPrice.toString(),

      discountAmount:
        skuDiscount.discountAmount.toString(),

      finalPrice:
        skuDiscount.finalPrice.toString(),

      discountSource:
        skuDiscount.discountSource,
    });

    assert(
      skuDiscount.originalPrice.toString() ===
        "20000",
      "FAIL: originalPrice SKU discount harus 20000."
    );

    assert(
      skuDiscount.discountAmount.toString() ===
        "10000",
      `FAIL: discountAmount seharusnya 10000, tetapi ${skuDiscount.discountAmount.toString()}`
    );

    assert(
      skuDiscount.finalPrice.toString() ===
        "10000",
      `FAIL: finalPrice seharusnya 10000, tetapi ${skuDiscount.finalPrice.toString()}`
    );

    assert(
      skuDiscount.discountSource ===
        "PRODUCT_DISCOUNT",
      `FAIL: discountSource seharusnya PRODUCT_DISCOUNT, tetapi ${skuDiscount.discountSource}`
    );

    assert(
      skuDiscount.isDiscountApplied,
      "FAIL: isDiscountApplied seharusnya true."
    );

    console.log(
      "PASS: ProductSku Discount 50% = 10.000."
    );

    /**
     * ==========================================================
     * TEST 3
     * PROMOTION OVERRIDES SKU DISCOUNT
     * ==========================================================
     */

    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 3 - PROMOTION OVERRIDES SKU DISCOUNT"
    );
    console.log(
      "------------------------------------------------------------"
    );

    const promotion =
      await createPromotion(
        "TEST PROMOTION 40%",
        40
      );

    const promotionPricing =
      await resolvePricing();

    console.log({
      originalPrice:
        promotionPricing.originalPrice.toString(),

      discountAmount:
        promotionPricing.discountAmount.toString(),

      finalPrice:
        promotionPricing.finalPrice.toString(),

      discountSource:
        promotionPricing.discountSource,

      promotionId:
        promotionPricing.promotionId,
    });

    assert(
      promotionPricing.originalPrice.toString() ===
        "20000",
      "FAIL: originalPrice promotion harus 20000."
    );

    assert(
      promotionPricing.discountAmount.toString() ===
        "8000",
      `FAIL: discountAmount seharusnya 8000, tetapi ${promotionPricing.discountAmount.toString()}`
    );

    assert(
      promotionPricing.finalPrice.toString() ===
        "12000",
      `FAIL: finalPrice seharusnya 12000, tetapi ${promotionPricing.finalPrice.toString()}`
    );

    assert(
      promotionPricing.discountSource ===
        "PROMOTION",
      `FAIL: discountSource seharusnya PROMOTION, tetapi ${promotionPricing.discountSource}`
    );

    assert(
      promotionPricing.promotionDiscountApplied,
      "FAIL: promotionDiscountApplied seharusnya true."
    );

    assert(
      promotionPricing.promotionId ===
        promotion.id,
      "FAIL: promotionId tidak sesuai."
    );

    console.log(
      "PASS: Promotion 40% mengalahkan ProductSku Discount 50%."
    );

    console.log(
      "PASS: Tidak terjadi stacking."
    );

    /**
     * ==========================================================
     * TEST 4
     * FLASH SALE OVERRIDES PROMOTION
     * ==========================================================
     */

    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 4 - FLASH SALE OVERRIDES PROMOTION"
    );
    console.log(
      "------------------------------------------------------------"
    );

    const flashSale =
      await createFlashSale(
        12000
      );

    const flashPricing =
      await resolvePricing();

    console.log({
      originalPrice:
        flashPricing.originalPrice.toString(),

      discountAmount:
        flashPricing.discountAmount.toString(),

      finalPrice:
        flashPricing.finalPrice.toString(),

      discountSource:
        flashPricing.discountSource,

      promotionId:
        flashPricing.promotionId,

      promotionDiscountApplied:
        flashPricing.promotionDiscountApplied,

      isFlashSaleApplied:
        flashPricing.isFlashSaleApplied,

      flashSaleItemId:
        flashPricing.flashSaleItemId,

      flashSaleId:
        flashPricing.flashSaleId,
    });

    assert(
      flashPricing.originalPrice.toString() ===
        "20000",
      "FAIL: originalPrice Flash Sale harus 20000."
    );

    assert(
      flashPricing.discountAmount.toString() ===
        "8000",
      `FAIL: discountAmount seharusnya 8000, tetapi ${flashPricing.discountAmount.toString()}`
    );

    assert(
      flashPricing.finalPrice.toString() ===
        "12000",
      `FAIL: finalPrice seharusnya 12000, tetapi ${flashPricing.finalPrice.toString()}`
    );

    assert(
      flashPricing.discountSource ===
        "FLASH_SALE",
      `FAIL: discountSource seharusnya FLASH_SALE, tetapi ${flashPricing.discountSource}`
    );

    assert(
      flashPricing.isFlashSaleApplied,
      "FAIL: isFlashSaleApplied seharusnya true."
    );

    assert(
      !flashPricing.promotionDiscountApplied,
      "FAIL: Promotion tidak boleh diterapkan ketika Flash Sale aktif."
    );

    assert(
      flashPricing.promotionId ===
        null,
      "FAIL: promotionId harus null ketika Flash Sale aktif."
    );

    assert(
      flashPricing.flashSaleItemId !==
        null,
      "FAIL: flashSaleItemId harus terisi."
    );

    assert(
      flashPricing.flashSaleId ===
        flashSale.id,
      "FAIL: flashSaleId tidak sesuai."
    );

    console.log(
      "PASS: Flash Sale mengalahkan Promotion."
    );

    console.log(
      "PASS: Promotion tidak stacking dengan Flash Sale."
    );

    /**
     * ==========================================================
     * TEST 5
     * FLASH SALE OVERRIDES PRODUCT SKU DISCOUNT
     * ==========================================================
     */

    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 5 - FLASH SALE OVERRIDES PRODUCT SKU DISCOUNT"
    );
    console.log(
      "------------------------------------------------------------"
    );

    /**
     * Promotion masih aktif.
     *
     * Kita tidak perlu menghapusnya.
     *
     * Test ini menguji priority:
     *
     * Flash Sale > ProductSku Discount
     *
     * sekaligus membiarkan Promotion tetap aktif
     * untuk TEST 6.
     */

    const skuFlashPricing =
      await resolvePricing();

    console.log({
      originalPrice:
        skuFlashPricing.originalPrice.toString(),

      discountAmount:
        skuFlashPricing.discountAmount.toString(),

      finalPrice:
        skuFlashPricing.finalPrice.toString(),

      discountSource:
        skuFlashPricing.discountSource,

      promotionId:
        skuFlashPricing.promotionId,

      isFlashSaleApplied:
        skuFlashPricing.isFlashSaleApplied,
    });

    assert(
      skuFlashPricing.finalPrice.toString() ===
        "12000",
      `FAIL: finalPrice seharusnya 12000, tetapi ${skuFlashPricing.finalPrice.toString()}`
    );

    assert(
      skuFlashPricing.discountSource ===
        "FLASH_SALE",
      `FAIL: discountSource seharusnya FLASH_SALE, tetapi ${skuFlashPricing.discountSource}`
    );

    assert(
      skuFlashPricing.isFlashSaleApplied,
      "FAIL: Flash Sale seharusnya aktif."
    );

    assert(
      skuFlashPricing.promotionId ===
        null,
      "FAIL: promotionId harus null ketika Flash Sale menang."
    );

    assert(
      !skuFlashPricing.promotionDiscountApplied,
      "FAIL: Promotion tidak boleh diterapkan ketika Flash Sale aktif."
    );

    console.log(
      "PASS: Flash Sale mengalahkan ProductSku Discount."
    );

    /**
     * ==========================================================
     * TEST 6
     * ALL DISCOUNTS / NO STACKING
     * ==========================================================
     *
     * Kondisi:
     *
     * Harga normal      = 20.000
     * ProductSku        = 50%
     * Promotion         = 40%
     * Flash Sale        = 12.000
     *
     * Expected:
     *
     * Flash Sale menang.
     *
     * Final price = 12.000
     *
     * Tidak boleh:
     *
     * 6.000
     * 7.200
     * 10.000
     * atau stacking lainnya.
     */

    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 6 - ALL DISCOUNTS / NO STACKING"
    );
    console.log(
      "------------------------------------------------------------"
    );

    const allDiscountPricing =
      await resolvePricing();

    console.log({
      originalPrice:
        allDiscountPricing.originalPrice.toString(),

      discountAmount:
        allDiscountPricing.discountAmount.toString(),

      finalPrice:
        allDiscountPricing.finalPrice.toString(),

      discountSource:
        allDiscountPricing.discountSource,

      promotionId:
        allDiscountPricing.promotionId,

      promotionDiscountApplied:
        allDiscountPricing.promotionDiscountApplied,

      isFlashSaleApplied:
        allDiscountPricing.isFlashSaleApplied,
    });

    assert(
      allDiscountPricing.originalPrice.toString() ===
        "20000",
      "FAIL: originalPrice harus 20000."
    );

    assert(
      allDiscountPricing.finalPrice.toString() ===
        "12000",
      `FAIL: finalPrice seharusnya 12000, tetapi ${allDiscountPricing.finalPrice.toString()}`
    );

    assert(
      allDiscountPricing.discountAmount.toString() ===
        "8000",
      `FAIL: discountAmount seharusnya 8000, tetapi ${allDiscountPricing.discountAmount.toString()}`
    );

    assert(
      allDiscountPricing.discountSource ===
        "FLASH_SALE",
      `FAIL: discountSource seharusnya FLASH_SALE, tetapi ${allDiscountPricing.discountSource}`
    );

    assert(
      allDiscountPricing.isFlashSaleApplied,
      "FAIL: Flash Sale seharusnya diterapkan."
    );

    assert(
      !allDiscountPricing.promotionDiscountApplied,
      "FAIL: Promotion tidak boleh stacking."
    );

    assert(
      allDiscountPricing.promotionId ===
        null,
      "FAIL: promotionId harus null ketika Flash Sale menang."
    );

    console.log(
      "PASS: Flash Sale mengalahkan Promotion."
    );

    console.log(
      "PASS: Flash Sale mengalahkan ProductSku Discount."
    );

    console.log(
      "PASS: Tidak terjadi discount stacking."
    );

    console.log(
      "PASS: 20.000 -> Flash Sale 12.000."
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
      "PRICING PRIORITY TEST PASSED"
    );
    console.log(
      "============================================================"
    );
  } finally {
    /**
     * ==========================================================
     * ALWAYS CLEANUP
     * ==========================================================
     *
     * Cleanup tetap dijalankan walaupun salah satu assertion
     * gagal.
     */

    await cleanup();
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "============================================================"
    );
    console.error(
      "PRICING PRIORITY TEST FAILED"
    );
    console.error(
      "============================================================"
    );
    console.error(
      getErrorMessage(error)
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });