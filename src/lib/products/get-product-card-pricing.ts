import { prisma } from "@/lib/prisma";
import ProductPricingService, {
  type ProductPricingResult,
} from "@/services/pricing/product-pricing.service";

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

/**
 * Resolve the best currently sellable price for product cards.
 *
 * Pricing remains canonical in ProductPricingService. To avoid an
 * N x SKU pricing query explosion on listing pages, only SKUs that
 * can affect the product-level minimum are resolved:
 *
 * - lowest normal-price SKU;
 * - SKU with an active SKU-level discount;
 * - SKU targeted by an active PRICE_DISCOUNT promotion;
 * - SKU targeted by an active Flash Sale.
 *
 * Product-wide discounts are monotonic against the normal price, so
 * resolving the lowest normal-price SKU is sufficient for that path.
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

  const skus = await prisma.productSku.findMany({
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
      discountStartAt: true,
      discountEndAt: true,
    },
  });

  if (skus.length === 0) {
    return new Map();
  }

  const skuIds = skus.map((sku) => sku.id);

  const [promotionItems, flashSaleItems] = await Promise.all([
    prisma.promotionItem.findMany({
      where: {
        skuId: { in: skuIds },
        promotion: {
          deletedAt: null,
          type: "PRICE_DISCOUNT",
          status: "ACTIVE",
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
      },
      select: { skuId: true },
    }),

    prisma.flashSaleItem.findMany({
      where: {
        isActive: true,
        stockLimit: { gt: 0 },
        OR: [
          { skuId: { in: skuIds } },
          {
            productId: { in: ids },
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
        skuId: true,
        productId: true,
        stockLimit: true,
        soldQuantity: true,
      },
    }),
  ]);

  const lowestNormalSkuByProduct = new Map<string, (typeof skus)[number]>();
  for (const sku of skus) {
    if (!lowestNormalSkuByProduct.has(sku.productId)) {
      lowestNormalSkuByProduct.set(sku.productId, sku);
    }
  }

  const candidateSkuIds = new Set<string>();

  for (const sku of lowestNormalSkuByProduct.values()) {
    if (sku.stock > 0) {
      candidateSkuIds.add(sku.id);
    }
  }

  for (const sku of skus) {
    const skuDiscountActive =
      sku.isDiscountActive &&
      (!sku.discountStartAt || now >= sku.discountStartAt) &&
      (!sku.discountEndAt || now < sku.discountEndAt);

    if (sku.stock > 0 && skuDiscountActive) {
      candidateSkuIds.add(sku.id);
    }
  }

  for (const item of promotionItems) {
    const sku = skus.find((candidate) => candidate.id === item.skuId);
    if (sku && sku.stock > 0) {
      candidateSkuIds.add(sku.id);
    }
  }

  for (const item of flashSaleItems) {
    if (item.soldQuantity >= item.stockLimit) {
      continue;
    }

    if (item.skuId) {
      const sku = skus.find((candidate) => candidate.id === item.skuId);
      if (sku && sku.stock > 0) {
        candidateSkuIds.add(sku.id);
      }
    } else {
      const lowestSku = lowestNormalSkuByProduct.get(item.productId);
      if (lowestSku && lowestSku.stock > 0) {
        candidateSkuIds.add(lowestSku.id);
      }
    }
  }

  if (candidateSkuIds.size === 0) {
    return new Map();
  }

  const candidates = skus.filter((sku) => candidateSkuIds.has(sku.id));

  const resolved = await prisma.$transaction(async (tx) =>
    Promise.all(
      candidates.map(async (candidate) => ({
        productId: candidate.productId,
        skuId: candidate.id,
        pricing: await ProductPricingService.resolve(tx, {
          productId: candidate.productId,
          skuId: candidate.id,
        }),
      })),
    ),
  );

  const result = new Map<string, ProductCardPricing>();

  for (const entry of resolved) {
    const pricing = entry.pricing;
    const normalized: ProductCardPricing = {
      originalPrice: Number(pricing.originalPrice),
      finalPrice: Number(pricing.finalPrice),
      discountAmount: Number(pricing.discountAmount),
      isDiscountApplied: pricing.isDiscountApplied,
      isFlashSaleApplied: pricing.isFlashSaleApplied,
      promotionDiscountApplied: pricing.promotionDiscountApplied,
      promotionId: pricing.promotionId,
      promotionName: pricing.promotionName,
      flashSaleName: pricing.flashSaleName,
      discountSource: pricing.discountSource,
      flashSaleItemId: pricing.flashSaleItemId,
      flashSaleId: pricing.flashSaleId,
      skuId: entry.skuId,
    };

    const current = result.get(entry.productId);

    if (
      !current ||
      normalized.finalPrice < current.finalPrice ||
      (normalized.finalPrice === current.finalPrice &&
        normalized.discountAmount > current.discountAmount)
    ) {
      result.set(entry.productId, normalized);
    }
  }

  return result;
}
