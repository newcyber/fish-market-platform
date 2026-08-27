import {
  FlashSaleStatus,
  ProductDiscountType,
  PromotionDiscountType,
  PromotionStatus,
  PromotionType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import ProductPricingService from "@/services/pricing/product-pricing.service";
import PromotionService from "@/services/promotion/promotion.service";

const TEST_SKU = "TEST-TUNA-500GR";

async function main() {
  console.log(
    "============================================================"
  );
  console.log(
    "TEST FLASH SALE > PROMOTION > PRODUCT DISCOUNT"
  );
  console.log(
    "============================================================"
  );

  /**
   * ============================================================
   * 1. RESOLVE TEST SKU
   * ============================================================
   */
  const sku =
    await prisma.productSku.findUniqueOrThrow({
      where: {
        sku: TEST_SKU,
      },
      select: {
        id: true,
        productId: true,
        price: true,
        isActive: true,
      },
    });

  console.log("\nSKU:");
  console.log({
    sku: TEST_SKU,
    id: sku.id,
    productId: sku.productId,
    price: sku.price.toString(),
    isActive: sku.isActive,
  });

  if (!sku.isActive) {
    throw new Error(
      "SKU test tidak aktif."
    );
  }

  /**
   * ============================================================
   * 2. CLEANUP TEST PROMOTION LAMA
   * ============================================================
   */
  const promotionSlug =
    `test-flash-vs-promotion-${Date.now()}`;

  /**
   * ============================================================
   * 3. BUAT PROMOTION ACTIVE
   * ============================================================
   *
   * Harga normal:
   * 20.000
   *
   * Promotion:
   * 20%
   *
   * Seharusnya:
   * 20.000 - 20% = 16.000
   */
  const now = new Date();

  const promotion =
    await PromotionService.create({
      name:
        "TEST Flash Sale vs Promotion",
      slug: promotionSlug,

      status:
        PromotionStatus.ACTIVE,

      startAt:
        new Date(
          now.getTime() - 60_000
        ),

      endAt:
        new Date(
          now.getTime() + 3_600_000
        ),

      type:
        PromotionType.PRICE_DISCOUNT,

      discountType:
        PromotionDiscountType.PERCENTAGE,

      discountValue: 20,

      sortOrder: 1,

      isFeatured: false,
    });

  console.log(
    "\nPromotion dibuat:"
  );

  console.log({
    id: promotion.id,
    status: promotion.status,
    type: promotion.type,
    discountType:
      promotion.discountType,
    discountValue:
      promotion.discountValue?.toString(),
    startAt:
      promotion.startAt,
    endAt:
      promotion.endAt,
  });

  /**
   * ============================================================
   * 4. TAMBAHKAN SKU KE PROMOTION
   * ============================================================
   */
  await PromotionService.addSku(
    promotion.id,
    sku.id
  );

  console.log(
    "\nSKU berhasil ditambahkan ke Promotion."
  );

  /**
   * ============================================================
   * 5. SET PRODUCT SKU DISCOUNT
   * ============================================================
   *
   * Kita sengaja membuat ProductSku Discount
   * lebih besar daripada Promotion.
   *
   * ProductSku Discount:
   * 50%
   *
   * Promotion:
   * 20%
   *
   * Kalau tidak stacking:
   *
   * Promotion = 16.000
   *
   * ============================================================
   */
  const previousSkuDiscount =
    await prisma.productSku.findUniqueOrThrow({
      where: {
        id: sku.id,
      },
      select: {
        isDiscountActive: true,
        discountType: true,
        discountValue: true,
        discountStartAt: true,
        discountEndAt: true,
      },
    });

  await prisma.productSku.update({
    where: {
      id: sku.id,
    },

    data: {
      isDiscountActive: true,

      discountType:
        ProductDiscountType.PERCENTAGE,

      discountValue: 50,

      discountStartAt:
        new Date(
          now.getTime() - 60_000
        ),

      discountEndAt:
        new Date(
          now.getTime() + 3_600_000
        ),
    },
  });

  /**
   * ============================================================
   * 6. BUAT FLASH SALE ACTIVE
   * ============================================================
   *
   * Flash Sale price:
   * 12.000
   *
   * Priority yang kita inginkan:
   *
   * Flash Sale  = 12.000
   * Promotion   = 16.000
   * SKU Discount = 10.000
   *
   * Tetapi karena Flash Sale adalah priority tertinggi,
   * hasil FINAL harus:
   *
   * 12.000
   */
  const flashSaleSlug =
    `test-flash-vs-promotion-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

  const flashSale =
    await prisma.flashSale.create({
      data: {
        name:
          "TEST Flash Sale Priority",

        slug:
          flashSaleSlug,

        status:
          FlashSaleStatus.ACTIVE,

        startAt:
          new Date(
            now.getTime() - 60_000
          ),

        endAt:
          new Date(
            now.getTime() + 3_600_000
          ),

        sortOrder: 1,
      },
    });

  console.log(
    "\nFlash Sale dibuat:"
  );

  console.log({
    id: flashSale.id,
    status: flashSale.status,
    startAt: flashSale.startAt,
    endAt: flashSale.endAt,
  });

  /**
   * ============================================================
   * 7. TAMBAHKAN FLASH SALE ITEM
   * ============================================================
   *
   * originalPrice harus berasal dari SKU.
   */
  await prisma.flashSaleItem.create({
    data: {
      flashSaleId:
        flashSale.id,

      productId:
        sku.productId,

      skuId:
        sku.id,

      originalPrice:
        sku.price,

      flashPrice:
        12000,

      stockLimit:
        10,

      soldQuantity:
        0,

      perUserLimit:
        null,

      isActive:
        true,

      sortOrder:
        1,
    },
  });

  console.log(
    "\nFlash Sale Item berhasil dibuat."
  );

  /**
   * ============================================================
   * 8. RESOLVE PRICING
   * ============================================================
   */
  const result =
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

  console.log(
    "\nHASIL PRICING:"
  );

  console.log({
    originalPrice:
      result.originalPrice.toString(),

    discountAmount:
      result.discountAmount.toString(),

    finalPrice:
      result.finalPrice.toString(),

    discountSource:
      result.discountSource,

    promotionId:
      result.promotionId,

    promotionDiscountApplied:
      result.promotionDiscountApplied,

    isFlashSaleApplied:
      result.isFlashSaleApplied,

    flashSaleItemId:
      result.flashSaleItemId,

    flashSaleId:
      result.flashSaleId,
  });

  /**
   * ============================================================
   * 9. ASSERTION
   * ============================================================
   */
  if (
    result.originalPrice.toString() !==
    "20000"
  ) {
    throw new Error(
      `FAIL: originalPrice seharusnya 20000, tetapi ${result.originalPrice.toString()}`
    );
  }

  if (
    result.finalPrice.toString() !==
    "12000"
  ) {
    throw new Error(
      `FAIL: finalPrice seharusnya 12000 karena Flash Sale, tetapi ${result.finalPrice.toString()}`
    );
  }

  if (
    result.discountSource !==
    "FLASH_SALE"
  ) {
    throw new Error(
      `FAIL: discountSource seharusnya FLASH_SALE, tetapi ${result.discountSource}`
    );
  }

  if (
    !result.isFlashSaleApplied
  ) {
    throw new Error(
      "FAIL: isFlashSaleApplied seharusnya true."
    );
  }

  if (
    result.promotionDiscountApplied
  ) {
    throw new Error(
      "FAIL: Promotion tidak boleh diterapkan ketika Flash Sale aktif."
    );
  }

  if (
    result.promotionId !== null
  ) {
    throw new Error(
      "FAIL: promotionId harus null ketika Flash Sale aktif."
    );
  }

  /**
   * ============================================================
   * 10. PASS
   * ============================================================
   */
  console.log(
    "\n============================================================"
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
    "20.000 -> Flash Sale 12.000"
  );

  console.log(
    "============================================================"
  );

  /**
   * ============================================================
   * 11. CLEANUP
   * ============================================================
   */
  await prisma.productSku.update({
    where: {
      id: sku.id,
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

  await prisma.flashSale.delete({
    where: {
      id: flashSale.id,
    },
  });

  await prisma.promotion.delete({
    where: {
      id: promotion.id,
    },
  });

  console.log(
    "\nTest data dibersihkan."
  );
}

main()
  .catch(async (error) => {
    console.error(
      "\n============================================================"
    );

    console.error(
      "TEST FAILED"
    );

    console.error(
      "============================================================"
    );

    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });