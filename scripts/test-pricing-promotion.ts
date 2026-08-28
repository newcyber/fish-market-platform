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

const TEST_SKU = "TEST-TUNA-500GR";

async function main() {
  console.log("");
  console.log(
    "============================================================"
  );
  console.log(
    "PROMOTION PRICING INTEGRATION TEST"
  );
  console.log(
    "============================================================"
  );

  /**
   * ==========================================================
   * 1. LOAD TEST SKU
   * ==========================================================
   */

  const sku =
    await prisma.productSku.findUnique({
      where: {
        sku: TEST_SKU,
      },

      select: {
        id: true,
        sku: true,
        productId: true,
        price: true,
        isActive: true,

        isDiscountActive: true,
        discountType: true,
        discountValue: true,
        discountStartAt: true,
        discountEndAt: true,
      },
    });

  if (!sku) {
    throw new Error(
      `SKU ${TEST_SKU} tidak ditemukan.`
    );
  }

  if (!sku.isActive) {
    throw new Error(
      `SKU ${TEST_SKU} harus aktif.`
    );
  }

  console.log("");
  console.log("TEST SKU:");

  console.log({
    sku: sku.sku,
    productId: sku.productId,
    price: sku.price.toString(),
  });

  /**
   * ==========================================================
   * 2. BACKUP SKU DISCOUNT
   * ==========================================================
   */

  const previousSkuDiscount = {
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
   * ==========================================================
   * 3. TEST IDS
   * ==========================================================
   */

  const timestamp = Date.now();

  const promotionSlug =
    `test-pricing-promotion-${timestamp}`;

  const flashSaleSlug =
    `test-pricing-flash-${timestamp}`;

  let promotion:
    | {
        id: string;
      }
    | null = null;

  let flashSale:
    | {
        id: string;
      }
    | null = null;

  try {
    /**
     * ========================================================
     * 4. RESET SKU DISCOUNT
     * ========================================================
     */

    await prisma.productSku.update({
      where: {
        id: sku.id,
      },

      data: {
        isDiscountActive: false,
        discountType: null,
        discountValue: null,
        discountStartAt: null,
        discountEndAt: null,
      },
    });

    /**
     * ========================================================
     * 5. CREATE ACTIVE PROMOTION
     * ========================================================
     *
     * SKU price:
     * 20.000
     *
     * Promotion:
     * 40%
     *
     * Expected:
     * 20.000 -> 12.000
     */

    promotion =
      await prisma.promotion.create({
        data: {
          name:
            "TEST PRICING PROMOTION",

          slug:
            promotionSlug,

          status:
            PromotionStatus.ACTIVE,

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

          type:
            PromotionType.PRICE_DISCOUNT,

          discountType:
            PromotionDiscountType.PERCENTAGE,

          discountValue:
            new Prisma.Decimal(40),

          items: {
            create: {
              skuId:
                sku.id,
            },
          },
        },

        select: {
          id: true,
        },
      });

    console.log("");
    console.log(
      "Promotion aktif berhasil dibuat."
    );

    /**
     * ========================================================
     * TEST 1
     * PROMOTION ONLY
     * ========================================================
     */

    const promotionResult =
      await prisma.$transaction(
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

    console.log("");
    console.log(
      "TEST 1 - PROMOTION ONLY"
    );

    console.log({
      originalPrice:
        promotionResult.originalPrice.toString(),

      discountAmount:
        promotionResult.discountAmount.toString(),

      finalPrice:
        promotionResult.finalPrice.toString(),

      discountSource:
        promotionResult.discountSource,

      promotionId:
        promotionResult.promotionId,

      promotionDiscountApplied:
        promotionResult.promotionDiscountApplied,

      isFlashSaleApplied:
        promotionResult.isFlashSaleApplied,
    });

    if (
      promotionResult.finalPrice.toString() !==
      "12000"
    ) {
      throw new Error(
        `FAIL: Promotion finalPrice seharusnya 12000, tetapi ${promotionResult.finalPrice.toString()}`
      );
    }

    if (
      promotionResult.discountSource !==
      "PROMOTION"
    ) {
      throw new Error(
        `FAIL: discountSource seharusnya PROMOTION, tetapi ${promotionResult.discountSource}`
      );
    }

    if (
      promotionResult.promotionId !==
      promotion.id
    ) {
      throw new Error(
        "FAIL: promotionId tidak sesuai."
      );
    }

    if (
      !promotionResult.promotionDiscountApplied
    ) {
      throw new Error(
        "FAIL: promotionDiscountApplied seharusnya true."
      );
    }

    if (
      promotionResult.isFlashSaleApplied
    ) {
      throw new Error(
        "FAIL: Flash Sale seharusnya belum aktif."
      );
    }

    console.log(
      "PASS: Promotion menghasilkan harga 12.000."
    );

    /**
     * ========================================================
     * TEST 2
     * PROMOTION + PRODUCT SKU DISCOUNT
     * ========================================================
     *
     * SKU Discount:
     * 50% = 10.000
     *
     * Promotion:
     * 40% = 12.000
     *
     * Expected:
     * Promotion tetap menang.
     *
     * Tidak stacking.
     */

    await prisma.productSku.update({
      where: {
        id: sku.id,
      },

      data: {
        isDiscountActive:
          true,

        discountType:
          ProductDiscountType.PERCENTAGE,

        discountValue:
          new Prisma.Decimal(50),

        discountStartAt:
          new Date(
            Date.now() -
              60_000
          ),

        discountEndAt:
          new Date(
            Date.now() +
              3_600_000
          ),
      },
    });

    const promotionVsSkuResult =
      await prisma.$transaction(
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

    console.log("");
    console.log(
      "TEST 2 - PROMOTION + PRODUCT SKU DISCOUNT"
    );

    console.log({
      originalPrice:
        promotionVsSkuResult.originalPrice.toString(),

      discountAmount:
        promotionVsSkuResult.discountAmount.toString(),

      finalPrice:
        promotionVsSkuResult.finalPrice.toString(),

      discountSource:
        promotionVsSkuResult.discountSource,

      promotionId:
        promotionVsSkuResult.promotionId,

      promotionDiscountApplied:
        promotionVsSkuResult.promotionDiscountApplied,
    });

    if (
      promotionVsSkuResult.finalPrice.toString() !==
      "12000"
    ) {
      throw new Error(
        `FAIL: Promotion harus tetap menghasilkan 12000, tetapi ${promotionVsSkuResult.finalPrice.toString()}`
      );
    }

    if (
      promotionVsSkuResult.discountSource !==
      "PROMOTION"
    ) {
      throw new Error(
        "FAIL: Promotion harus mengalahkan ProductSku Discount."
      );
    }

    console.log(
      "PASS: Promotion mengalahkan ProductSku Discount."
    );

    /**
     * ========================================================
     * 6. CREATE ACTIVE FLASH SALE
     * ========================================================
     *
     * Flash Sale:
     * 12.000
     *
     * Promotion:
     * 40% = 12.000
     *
     * ProductSku Discount:
     * 50% = 10.000
     *
     * Expected:
     * Flash Sale = 12.000
     */

    flashSale =
      await prisma.flashSale.create({
        data: {
          name:
            "TEST PRICING FLASH SALE",

          slug:
            flashSaleSlug,

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

          items: {
            create: {
              productId:
                sku.productId,

              skuId:
                sku.id,

              originalPrice:
                new Prisma.Decimal(
                  20000
                ),

              flashPrice:
                new Prisma.Decimal(
                  12000
                ),

              stockLimit:
                100,

              soldQuantity:
                0,

              isActive:
                true,

              sortOrder:
                1,
            },
          },
        },

        select: {
          id: true,
        },
      });

    console.log("");
    console.log(
      "Flash Sale aktif berhasil dibuat."
    );

    /**
     * ========================================================
     * TEST 3
     * FLASH SALE + PROMOTION + SKU DISCOUNT
     * ========================================================
     */

    const flashSaleResult =
      await prisma.$transaction(
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

    console.log("");
    console.log(
      "TEST 3 - FLASH SALE + PROMOTION + SKU DISCOUNT"
    );

    console.log({
      originalPrice:
        flashSaleResult.originalPrice.toString(),

      discountAmount:
        flashSaleResult.discountAmount.toString(),

      finalPrice:
        flashSaleResult.finalPrice.toString(),

      discountSource:
        flashSaleResult.discountSource,

      promotionId:
        flashSaleResult.promotionId,

      promotionDiscountApplied:
        flashSaleResult.promotionDiscountApplied,

      isFlashSaleApplied:
        flashSaleResult.isFlashSaleApplied,

      flashSaleItemId:
        flashSaleResult.flashSaleItemId,

      flashSaleId:
        flashSaleResult.flashSaleId,
    });

    if (
      flashSaleResult.originalPrice.toString() !==
      "20000"
    ) {
      throw new Error(
        `FAIL: originalPrice seharusnya 20000, tetapi ${flashSaleResult.originalPrice.toString()}`
      );
    }

    if (
      flashSaleResult.finalPrice.toString() !==
      "12000"
    ) {
      throw new Error(
        `FAIL: Flash Sale finalPrice seharusnya 12000, tetapi ${flashSaleResult.finalPrice.toString()}`
      );
    }

    if (
      flashSaleResult.discountSource !==
      "FLASH_SALE"
    ) {
      throw new Error(
        `FAIL: discountSource seharusnya FLASH_SALE, tetapi ${flashSaleResult.discountSource}`
      );
    }

    if (
      !flashSaleResult.isFlashSaleApplied
    ) {
      throw new Error(
        "FAIL: isFlashSaleApplied seharusnya true."
      );
    }

    if (
      flashSaleResult.promotionDiscountApplied
    ) {
      throw new Error(
        "FAIL: Promotion tidak boleh diterapkan ketika Flash Sale aktif."
      );
    }

    if (
      flashSaleResult.promotionId !==
      null
    ) {
      throw new Error(
        "FAIL: promotionId harus null ketika Flash Sale aktif."
      );
    }

    if (
      flashSaleResult.flashSaleId !==
      flashSale.id
    ) {
      throw new Error(
        "FAIL: flashSaleId tidak sesuai."
      );
    }

    console.log(
      "PASS: Flash Sale mengalahkan Promotion."
    );

    console.log(
      "PASS: Flash Sale mengalahkan ProductSku Discount."
    );

    console.log(
      "PASS: Tidak terjadi discount stacking."
    );

    /**
     * ========================================================
     * TEST 4
     * FLASH SALE QUOTA HABIS
     * ========================================================
     *
     * Flash Sale:
     * stockLimit = 100
     * soldQuantity = 100
     *
     * Artinya:
     *
     * soldQuantity < stockLimit
     *
     * menjadi:
     *
     * 100 < 100 = false
     *
     * Maka Flash Sale harus dianggap tidak tersedia.
     *
     * Promotion tetap aktif.
     *
     * Expected:
     * Promotion = 12.000
     */

    await prisma.flashSaleItem.updateMany({
      where: {
        flashSaleId:
          flashSale.id,

        skuId:
          sku.id,
      },

      data: {
        soldQuantity:
          100,
      },
    });

    const quotaExhaustedResult =
      await prisma.$transaction(
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

    console.log("");
    console.log(
      "TEST 4 - FLASH SALE QUOTA HABIS"
    );

    console.log({
      originalPrice:
        quotaExhaustedResult.originalPrice.toString(),

      discountAmount:
        quotaExhaustedResult.discountAmount.toString(),

      finalPrice:
        quotaExhaustedResult.finalPrice.toString(),

      discountSource:
        quotaExhaustedResult.discountSource,

      promotionId:
        quotaExhaustedResult.promotionId,

      promotionDiscountApplied:
        quotaExhaustedResult.promotionDiscountApplied,

      isFlashSaleApplied:
        quotaExhaustedResult.isFlashSaleApplied,
    });

    if (
      quotaExhaustedResult.finalPrice.toString() !==
      "12000"
    ) {
      throw new Error(
        `FAIL: Ketika quota Flash Sale habis, harga seharusnya fallback ke Promotion 12000, tetapi ${quotaExhaustedResult.finalPrice.toString()}`
      );
    }

    if (
      quotaExhaustedResult.discountSource !==
      "PROMOTION"
    ) {
      throw new Error(
        "FAIL: Flash Sale quota habis seharusnya fallback ke PROMOTION."
      );
    }

    if (
      quotaExhaustedResult.isFlashSaleApplied
    ) {
      throw new Error(
        "FAIL: Flash Sale tidak boleh diterapkan ketika quota habis."
      );
    }

    if (
      !quotaExhaustedResult.promotionDiscountApplied
    ) {
      throw new Error(
        "FAIL: Promotion seharusnya diterapkan ketika quota Flash Sale habis."
      );
    }

    console.log(
      "PASS: Flash Sale quota habis melakukan fallback ke Promotion."
    );

    /**
     * ========================================================
     * TEST 5
     * FLASH SALE EXPIRED + PROMOTION EXPIRED
     * ========================================================
     *
     * SKU Discount:
     * aktif 50%
     *
     * Flash Sale:
     * expired
     *
     * Promotion:
     * expired
     *
     * Expected:
     * SKU Discount = 10.000
     */

    await prisma.flashSale.update({
      where: {
        id:
          flashSale.id,
      },

      data: {
        startAt:
          new Date(
            Date.now() -
              7_200_000
          ),

        endAt:
          new Date(
            Date.now() -
              3_600_000
          ),
      },
    });

    await prisma.promotion.update({
      where: {
        id:
          promotion.id,
      },

      data: {
        startAt:
          new Date(
            Date.now() -
              7_200_000
          ),

        endAt:
          new Date(
            Date.now() -
              3_600_000
          ),
      },
    });

    const expiredCampaignsResult =
      await prisma.$transaction(
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

    console.log("");
    console.log(
      "TEST 5 - FLASH SALE EXPIRED + PROMOTION EXPIRED"
    );

    console.log({
      originalPrice:
        expiredCampaignsResult.originalPrice.toString(),

      discountAmount:
        expiredCampaignsResult.discountAmount.toString(),

      finalPrice:
        expiredCampaignsResult.finalPrice.toString(),

      discountSource:
        expiredCampaignsResult.discountSource,

      promotionId:
        expiredCampaignsResult.promotionId,

      promotionDiscountApplied:
        expiredCampaignsResult.promotionDiscountApplied,

      isFlashSaleApplied:
        expiredCampaignsResult.isFlashSaleApplied,
    });

    if (
      expiredCampaignsResult.finalPrice.toString() !==
      "10000"
    ) {
      throw new Error(
        `FAIL: Setelah Flash Sale dan Promotion expired, SKU Discount seharusnya menghasilkan 10000, tetapi ${expiredCampaignsResult.finalPrice.toString()}`
      );
    }

    if (
      expiredCampaignsResult.discountSource !==
      "PRODUCT_DISCOUNT"
    ) {
      throw new Error(
        `FAIL: discountSource seharusnya PRODUCT_DISCOUNT, tetapi ${expiredCampaignsResult.discountSource}`
      );
    }

    if (
      expiredCampaignsResult.isFlashSaleApplied
    ) {
      throw new Error(
        "FAIL: Flash Sale expired tidak boleh diterapkan."
      );
    }

    if (
      expiredCampaignsResult.promotionDiscountApplied
    ) {
      throw new Error(
        "FAIL: Promotion expired tidak boleh diterapkan."
      );
    }

    console.log(
      "PASS: Flash Sale dan Promotion expired, fallback ke SKU Discount."
    );

    /**
     * ========================================================
     * TEST 6
     * SEMUA DISCOUNT EXPIRED
     * ========================================================
     *
     * Flash Sale:
     * expired
     *
     * Promotion:
     * expired
     *
     * SKU Discount:
     * expired
     *
     * Expected:
     * Harga normal SKU = 20.000
     */

    await prisma.productSku.update({
      where: {
        id:
          sku.id,
      },

      data: {
        isDiscountActive:
          true,

        discountType:
          ProductDiscountType.PERCENTAGE,

        discountValue:
          new Prisma.Decimal(50),

        discountStartAt:
          new Date(
            Date.now() -
              7_200_000
          ),

        discountEndAt:
          new Date(
            Date.now() -
              3_600_000
          ),
      },
    });

    const allExpiredResult =
      await prisma.$transaction(
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

    console.log("");
    console.log(
      "TEST 6 - ALL DISCOUNTS EXPIRED"
    );

    console.log({
      originalPrice:
        allExpiredResult.originalPrice.toString(),

      discountAmount:
        allExpiredResult.discountAmount.toString(),

      finalPrice:
        allExpiredResult.finalPrice.toString(),

      discountSource:
        allExpiredResult.discountSource,

      promotionId:
        allExpiredResult.promotionId,

      promotionDiscountApplied:
        allExpiredResult.promotionDiscountApplied,

      isFlashSaleApplied:
        allExpiredResult.isFlashSaleApplied,
    });

    if (
      allExpiredResult.finalPrice.toString() !==
      "20000"
    ) {
      throw new Error(
        `FAIL: Semua discount expired, harga normal seharusnya 20000, tetapi ${allExpiredResult.finalPrice.toString()}`
      );
    }

    if (
      allExpiredResult.discountSource !==
      "NONE"
    ) {
      throw new Error(
        `FAIL: discountSource seharusnya NONE, tetapi ${allExpiredResult.discountSource}`
      );
    }

    if (
      allExpiredResult.discountAmount.toString() !==
      "0"
    ) {
      throw new Error(
        `FAIL: discountAmount seharusnya 0, tetapi ${allExpiredResult.discountAmount.toString()}`
      );
    }

    if (
      allExpiredResult.isFlashSaleApplied
    ) {
      throw new Error(
        "FAIL: Flash Sale expired tidak boleh diterapkan."
      );
    }

    if (
      allExpiredResult.promotionDiscountApplied
    ) {
      throw new Error(
        "FAIL: Promotion expired tidak boleh diterapkan."
      );
    }

    if (
      allExpiredResult.promotionId !==
      null
    ) {
      throw new Error(
        "FAIL: promotionId harus null."
      );
    }

    console.log(
      "PASS: Semua discount expired, kembali ke harga normal SKU."
    );

    /**
     * ========================================================
     * FINAL
     * ========================================================
     */

    console.log("");
    console.log(
      "============================================================"
    );

    console.log(
      "ALL PROMOTION PRICING TESTS PASSED"
    );

    console.log(
      "============================================================"
    );
  } finally {
    /**
     * ========================================================
     * CLEANUP FLASH SALE
     * ========================================================
     */

    if (flashSale) {
      await prisma.flashSale.delete({
        where: {
          id:
            flashSale.id,
        },
      });
    }

    /**
     * ========================================================
     * CLEANUP PROMOTION
     * ========================================================
     */

    if (promotion) {
      await prisma.promotion.delete({
        where: {
          id:
            promotion.id,
        },
      });
    }

    /**
     * ========================================================
     * RESTORE SKU DISCOUNT
     * ========================================================
     */

    await prisma.productSku.update({
      where: {
        id:
          sku.id,
      },

      data: {
        isDiscountActive:
          previousSkuDiscount.isDiscountActive,

        discountType:
          previousSkuDiscount.discountType,

        discountValue:
          previousSkuDiscount.discountValue,

        discountStartAt:
          previousSkuDiscount.discountStartAt,

        discountEndAt:
          previousSkuDiscount.discountEndAt,
      },
    });

    console.log("");
    console.log(
      "Test data dibersihkan."
    );
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "PROMOTION PRICING TEST FAILED"
    );

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });