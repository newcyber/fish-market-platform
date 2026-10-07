import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ProductPricingResult } from "@/services/pricing/product-pricing.service";

export interface ProductCardPricing {
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  isDiscountApplied: boolean;
  isFlashSaleApplied: boolean;
  promotionDiscountApplied: boolean;
  promotionId: string | null;
  promotionName: string | null;
  flashSaleName: string | null;
  discountSource: ProductPricingResult["discountSource"];
  flashSaleItemId: string | null;
  flashSaleId: string | null;
  skuId: string;
}

type CardSku = Awaited<ReturnType<typeof loadCardSkus>>[number];
type CardPromotion = Awaited<ReturnType<typeof loadCardPromotions>>[number];
type CardFlashSaleItem = Awaited<ReturnType<typeof loadCardFlashSales>>[number];

/**
 * Homepage/product-list pricing is read-only.
 *
 * IMPORTANT:
 * ProductPricingService.resolve() remains the canonical transactional
 * pricing path for checkout/order flows. Product cards use this dedicated
 * batch read model so one page does not execute N x pricing queries inside
 * an interactive Prisma transaction.
 */
export async function getProductCardPricing(
  productIds: string[],
): Promise<Map<string, ProductCardPricing>> {
  const ids = Array.from(
    new Set(productIds.filter((id) => typeof id === "string" && id.trim())),
  );

  if (ids.length === 0) {
    return new Map();
  }

  const now = new Date();

  const [skus, products] = await Promise.all([
    loadCardSkus(ids),
    prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        isPreOrder: true,
      },
    }),
  ]);

  if (skus.length === 0) {
    return new Map();
  }

  const skuIds = skus.map((sku) => sku.id);

  // These are the only pricing overrides that can change a product card.
  // They are loaded in bulk, not once per SKU.
  const [promotions, flashSaleItems] = await Promise.all([
    loadCardPromotions(skuIds, now),
    loadCardFlashSales(ids, skuIds, now),
  ]);

  const productMap = new Map(products.map((product) => [product.id, product]));
  const skuById = new Map(skus.map((sku) => [sku.id, sku]));

  const lowestNormalSkuByProduct = new Map<string, CardSku>();
  for (const sku of skus) {
    if (!lowestNormalSkuByProduct.has(sku.productId)) {
      lowestNormalSkuByProduct.set(sku.productId, sku);
    }
  }

  const promotionBySku = buildPromotionMap(promotions);
  const flashSaleBySku = buildFlashSaleMap(flashSaleItems, productMap);
  const legacyFlashSaleByProduct = buildLegacyFlashSaleMap(
    flashSaleItems,
    productMap,
  );

  const candidateSkuIds = new Set<string>();

  // Same candidate strategy as before, but membership checks are O(1).
  for (const sku of lowestNormalSkuByProduct.values()) {
    if (sku.stock > 0) {
      candidateSkuIds.add(sku.id);
    }
  }

  for (const sku of skus) {
    if (sku.stock <= 0) {
      continue;
    }

    if (isDiscountCurrentlyActive(sku, now)) {
      candidateSkuIds.add(sku.id);
    }

    if (promotionBySku.has(sku.id)) {
      candidateSkuIds.add(sku.id);
    }

    if (flashSaleBySku.has(sku.id)) {
      // Pre-order products are explicitly excluded from Flash Sale pricing.
      if (!productMap.get(sku.productId)?.isPreOrder) {
        candidateSkuIds.add(sku.id);
      }
    }

    // Product-wide legacy Flash Sale follows the previous candidate rule:
    // only the lowest normal-price SKU represents the product card.
  }

  if (candidateSkuIds.size === 0) {
    return new Map();
  }

  const result = new Map<string, ProductCardPricing>();

  for (const skuId of candidateSkuIds) {
    const sku = skuById.get(skuId);
    if (!sku || sku.stock <= 0) {
      continue;
    }

    const product = productMap.get(sku.productId);
    const pricing = resolveCardSkuPricing({
      sku,
      product,
      now,
      promotion: promotionBySku.get(sku.id) ?? null,
      flashSale:
        product?.isPreOrder
          ? null
          : flashSaleBySku.get(sku.id) ??
            (lowestNormalSkuByProduct.get(sku.productId)?.id === sku.id
              ? legacyFlashSaleByProduct.get(sku.productId) ?? null
              : null),
    });

    const current = result.get(sku.productId);

    if (
      !current ||
      pricing.finalPrice < current.finalPrice ||
      (pricing.finalPrice === current.finalPrice &&
        pricing.discountAmount > current.discountAmount)
    ) {
      result.set(sku.productId, {
        ...pricing,
        skuId: sku.id,
      });
    }
  }

  return result;
}

async function loadCardSkus(ids: string[]) {
  return prisma.productSku.findMany({
    where: {
      productId: { in: ids },
      isActive: true,
    },
    orderBy: [
      { productId: "asc" },
      { price: "asc" },
    ],
    select: {
      id: true,
      productId: true,
      price: true,
      stock: true,
      isDiscountActive: true,
      discountType: true,
      discountValue: true,
      discountStartAt: true,
      discountEndAt: true,
    },
  });
}

async function loadCardPromotions(
  skuIds: string[],
  now: Date,
) {
  return prisma.promotion.findMany({
    where: {
      deletedAt: null,
      type: "PRICE_DISCOUNT",
      status: "ACTIVE",
      items: {
        some: {
          skuId: { in: skuIds },
        },
      },
      AND: [
        {
          OR: [
            { startAt: null },
            { startAt: { lte: now } },
          ],
        },
        {
          OR: [
            { endAt: null },
            { endAt: { gt: now } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      discountType: true,
      discountValue: true,
      sortOrder: true,
      isFeatured: true,
      createdAt: true,
      items: {
        where: {
          skuId: { in: skuIds },
        },
        select: {
          skuId: true,
          normalPriceSnapshot: true,
          promoPrice: true,
          discountType: true,
          discountValue: true,
        },
      },
    },
    orderBy: [
      { sortOrder: "asc" },
      { isFeatured: "desc" },
      { createdAt: "asc" },
    ],
  });
}

async function loadCardFlashSales(
  productIds: string[],
  skuIds: string[],
  now: Date,
) {
  return prisma.flashSaleItem.findMany({
    where: {
      isActive: true,
      stockLimit: { gt: 0 },
      OR: [
        { skuId: { in: skuIds } },
        {
          productId: { in: productIds },
          skuId: null,
          weightOptionId: null,
        },
      ],
      flashSale: {
        status: "ACTIVE",
        deletedAt: null,
        startAt: { lte: now },
        endAt: { gt: now },
      },
    },
    select: {
      id: true,
      flashSaleId: true,
      productId: true,
      skuId: true,
      weightOptionId: true,
      flashPrice: true,
      stockLimit: true,
      soldQuantity: true,
      flashSale: {
        select: {
          name: true,
          sortOrder: true,
        },
      },
      sortOrder: true,
      createdAt: true,
    },
    orderBy: [
      {
        flashSale: {
          sortOrder: "asc",
        },
      },
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });
}

function buildPromotionMap(
  promotions: CardPromotion[],
): Map<string, CardPromotion> {
  const result = new Map<string, CardPromotion>();

  for (const promotion of promotions) {
    for (const item of promotion.items) {
      if (!result.has(item.skuId)) {
        result.set(item.skuId, promotion);
      }
    }
  }

  return result;
}

function buildFlashSaleMap(
  items: CardFlashSaleItem[],
  products: Map<string, { id: string; isPreOrder: boolean }>,
): Map<string, CardFlashSaleItem> {
  const grouped = new Map<string, CardFlashSaleItem[]>();

  for (const item of items) {
    if (!item.skuId || products.get(item.productId)?.isPreOrder) {
      continue;
    }

    const bucket = grouped.get(item.skuId) ?? [];
    bucket.push(item);
    grouped.set(item.skuId, bucket);
  }

  const result = new Map<string, CardFlashSaleItem>();

  for (const [skuId, bucket] of grouped) {
    // Match ProductPricingService: prefer the first item with remaining
    // quota; if every item is exhausted, retain the first item so the
    // pricing path can deliberately fall back to normal price.
    result.set(
      skuId,
      bucket.find((item) => item.soldQuantity < item.stockLimit) ?? bucket[0],
    );
  }

  return result;
}

function buildLegacyFlashSaleMap(
  items: CardFlashSaleItem[],
  products: Map<string, { id: string; isPreOrder: boolean }>,
): Map<string, CardFlashSaleItem> {
  const grouped = new Map<string, CardFlashSaleItem[]>();

  for (const item of items) {
    if (
      item.skuId !== null ||
      item.weightOptionId !== null ||
      products.get(item.productId)?.isPreOrder
    ) {
      continue;
    }

    const bucket = grouped.get(item.productId) ?? [];
    bucket.push(item);
    grouped.set(item.productId, bucket);
  }

  const result = new Map<string, CardFlashSaleItem>();

  for (const [productId, bucket] of grouped) {
    result.set(
      productId,
      bucket.find((item) => item.soldQuantity < item.stockLimit) ?? bucket[0],
    );
  }

  return result;
}

function isDiscountCurrentlyActive(
  sku: CardSku,
  now: Date,
): boolean {
  return (
    sku.isDiscountActive &&
    (!sku.discountStartAt || now >= sku.discountStartAt) &&
    (!sku.discountEndAt || now < sku.discountEndAt)
  );
}

function resolveCardSkuPricing({
  sku,
  product,
  now,
  promotion,
  flashSale,
}: {
  sku: CardSku;
  product: { id: string; isPreOrder: boolean } | undefined;
  now: Date;
  promotion: CardPromotion | null;
  flashSale: CardFlashSaleItem | null;
}): Omit<ProductCardPricing, "skuId"> {
  const originalPrice = new Prisma.Decimal(sku.price);

  if (originalPrice.lessThan(0)) {
    throw new Error("Harga SKU tidak valid.");
  }

  if (flashSale && !product?.isPreOrder) {
    // Match ProductPricingService: an existing active Flash Sale item
    // with exhausted quota blocks lower pricing sources for that SKU.
    if (flashSale.soldQuantity >= flashSale.stockLimit) {
      return {
        originalPrice: Number(originalPrice),
        finalPrice: Number(originalPrice),
        discountAmount: 0,
        isDiscountApplied: false,
        isFlashSaleApplied: false,
        promotionDiscountApplied: false,
        promotionId: null,
        promotionName: null,
        flashSaleName: null,
        discountSource: "NONE",
        flashSaleItemId: null,
        flashSaleId: null,
      };
    }

    const flashPrice = new Prisma.Decimal(flashSale.flashPrice);

    if (flashPrice.lessThan(0)) {
      throw new Error("Harga Flash Sale tidak valid.");
    }

    if (flashPrice.greaterThan(originalPrice)) {
      throw new Error(
        "Harga Flash Sale tidak boleh lebih tinggi dari harga SKU.",
      );
    }

    const discountAmount = originalPrice.minus(flashPrice);

    return {
      originalPrice: Number(originalPrice),
      finalPrice: Number(flashPrice),
      discountAmount: Number(discountAmount),
      isDiscountApplied: false,
      isFlashSaleApplied: true,
      promotionDiscountApplied: false,
      promotionId: null,
      promotionName: null,
      flashSaleName: flashSale.flashSale.name,
      discountSource: "FLASH_SALE",
      flashSaleItemId: flashSale.id,
      flashSaleId: flashSale.flashSaleId,
    };
  }

  if (promotion) {
    const promotionItem = promotion.items.find((item) => item.skuId === sku.id);

    if (promotionItem) {
      const promoPrice = new Prisma.Decimal(promotionItem.promoPrice);

      if (!promoPrice.greaterThan(0)) {
        throw new Error(
          "Harga promo promotion harus lebih besar dari 0.",
        );
      }

      if (!promoPrice.lessThan(originalPrice)) {
        throw new Error(
          "Harga promo promotion harus lebih kecil dari harga normal SKU.",
        );
      }

      const discountAmount = originalPrice.minus(promoPrice);

      return {
        originalPrice: Number(originalPrice),
        finalPrice: Number(promoPrice),
        discountAmount: Number(discountAmount),
        isDiscountApplied: discountAmount.greaterThan(0),
        isFlashSaleApplied: false,
        promotionDiscountApplied: discountAmount.greaterThan(0),
        promotionId: promotion.id,
        promotionName: promotion.name,
        flashSaleName: null,
        discountSource: "PROMOTION",
        flashSaleItemId: null,
        flashSaleId: null,
      };
    }

    if (
      promotion.discountType === null ||
      promotion.discountValue === null
    ) {
      throw new Error(
        "Promotion PRICE_DISCOUNT aktif memiliki konfigurasi discount yang tidak lengkap.",
      );
    }

    const promotionDiscountValue = new Prisma.Decimal(promotion.discountValue);
    let promotionDiscountAmount = new Prisma.Decimal(0);

    if (promotion.discountType === "PERCENTAGE") {
      if (promotionDiscountValue.greaterThan(100)) {
        throw new Error(
          "Discount percentage promotion tidak boleh lebih dari 100%.",
        );
      }

      promotionDiscountAmount = originalPrice
        .mul(promotionDiscountValue)
        .div(100);
    } else if (promotion.discountType === "FIXED_AMOUNT") {
      promotionDiscountAmount = promotionDiscountValue;
    } else if (promotion.discountType === "FIXED_PRICE") {
      if (!promotionDiscountValue.lessThan(originalPrice)) {
        throw new Error(
          "Harga promo promotion harus lebih kecil dari harga normal SKU.",
        );
      }

      promotionDiscountAmount = originalPrice.minus(promotionDiscountValue);
    }

    promotionDiscountAmount = Prisma.Decimal.max(
      new Prisma.Decimal(0),
      promotionDiscountAmount,
    );
    promotionDiscountAmount = Prisma.Decimal.min(
      promotionDiscountAmount,
      originalPrice,
    );

    const finalPrice = originalPrice.minus(promotionDiscountAmount);

    return {
      originalPrice: Number(originalPrice),
      finalPrice: Number(finalPrice),
      discountAmount: Number(promotionDiscountAmount),
      isDiscountApplied: promotionDiscountAmount.greaterThan(0),
      isFlashSaleApplied: false,
      promotionDiscountApplied: promotionDiscountAmount.greaterThan(0),
      promotionId: promotion.id,
      promotionName: promotion.name,
      flashSaleName: null,
      discountSource: "PROMOTION",
      flashSaleItemId: null,
      flashSaleId: null,
    };
  }

  const hasDiscountConfiguration =
    sku.isDiscountActive &&
    sku.discountType !== null &&
    sku.discountValue !== null;

  const hasStarted =
    !sku.discountStartAt || now >= sku.discountStartAt;
  const hasNotEnded =
    !sku.discountEndAt || now < sku.discountEndAt;

  if (
    hasDiscountConfiguration &&
    hasStarted &&
    hasNotEnded &&
    sku.discountValue !== null &&
    sku.discountType !== null
  ) {
    let discountAmount = new Prisma.Decimal(0);

    if (sku.discountType === "PERCENTAGE") {
      const percentage = Prisma.Decimal.max(
        new Prisma.Decimal(0),
        Prisma.Decimal.min(sku.discountValue, new Prisma.Decimal(100)),
      );
      discountAmount = originalPrice.mul(percentage).div(100);
    } else if (sku.discountType === "FIXED_AMOUNT") {
      discountAmount = Prisma.Decimal.max(
        new Prisma.Decimal(0),
        sku.discountValue,
      );
    }

    discountAmount = Prisma.Decimal.min(discountAmount, originalPrice);

    return {
      originalPrice: Number(originalPrice),
      finalPrice: Number(originalPrice.minus(discountAmount)),
      discountAmount: Number(discountAmount),
      isDiscountApplied: discountAmount.greaterThan(0),
      isFlashSaleApplied: false,
      promotionDiscountApplied: false,
      promotionId: null,
      promotionName: null,
      flashSaleName: null,
      discountSource: discountAmount.greaterThan(0)
        ? "PRODUCT_DISCOUNT"
        : "NONE",
      flashSaleItemId: null,
      flashSaleId: null,
    };
  }

  return {
    originalPrice: Number(originalPrice),
    finalPrice: Number(originalPrice),
    discountAmount: 0,
    isDiscountApplied: false,
    isFlashSaleApplied: false,
    promotionDiscountApplied: false,
    promotionId: null,
    promotionName: null,
    flashSaleName: null,
    discountSource: "NONE",
    flashSaleItemId: null,
    flashSaleId: null,
  };
}
