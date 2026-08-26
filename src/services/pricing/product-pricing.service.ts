import {
  Prisma,
  ProductDiscountType,
} from "@prisma/client";

/**
 * ============================================================
 * PRODUCT PRICING SERVICE V2 - SKU BASED
 * ============================================================
 *
 * Canonical pricing flow:
 *
 * ProductSku.price
 *       ↓
 * Product Discount
 *       ↓
 * Flash Sale (if active)
 *       ↓
 * Final Price
 *
 * VariantOption tidak lagi memiliki:
 * - productId
 * - priceAdjustment
 *
 * Weight juga bukan lagi pricing entity khusus.
 * Berat hanyalah salah satu VariantGroup.
 *
 * IMPORTANT:
 * `skuId` adalah canonical input.
 *
 * `productVariant` / `productWeight` dipertahankan sementara
 * hanya agar consumer lama tetap dapat dikompilasi. Jika caller
 * masih mengirim variant/weight tanpa skuId, service akan menolak
 * dengan error yang jelas. Jangan deploy sebelum caller lama
 * dimigrasikan ke skuId.
 */

export interface ResolveProductPriceInput {
  productId: string;

  /**
   * Canonical sellable unit.
   */
  skuId?: string | null;

  /**
   * Legacy inputs - temporary compatibility only.
   */
  productVariant?: string | null;
  productWeight?: string | null;

  /**
   * Legacy fallback for products without SKU.
   * Untuk product dengan SKU, canonical price berasal dari SKU.
   */
  fallbackPrice?: Prisma.Decimal | number;
}

export interface ProductPricingResult {
  /**
   * Harga SKU sebelum Product Discount / Flash Sale.
   */
  originalPrice: Prisma.Decimal;

  /**
   * Nominal discount yang benar-benar diterapkan.
   */
  discountAmount: Prisma.Decimal;

  /**
   * Harga final.
   */
  finalPrice: Prisma.Decimal;

  isDiscountApplied: boolean;
  isFlashSaleApplied: boolean;

  flashSaleItemId: string | null;
  flashSaleId: string | null;
}

export default class ProductPricingService {
  /**
   * ============================================================
   * RESOLVE PRODUCT PRICE
   * ============================================================
   */
  static async resolve(
    tx: Prisma.TransactionClient,
    input: ResolveProductPriceInput
  ): Promise<ProductPricingResult> {
    const {
      productId,
      skuId,
      productVariant,
      productWeight,
      fallbackPrice,
    } = input;

    /**
     * ----------------------------------------------------------
     * LEGACY GUARD
     * ----------------------------------------------------------
     *
     * Kita sengaja tidak mencoba menebak SKU dari label variant
     * lama. Pada sistem baru satu produk bisa memiliki lebih dari
     * dua VariantGroup, sehingga pasangan:
     *
     * productVariant + productWeight
     *
     * tidak cukup untuk menentukan SKU secara unik.
     */
    if (
      !skuId &&
      (productVariant || productWeight)
    ) {
      throw new Error(
        "Pricing sekarang berbasis SKU. skuId wajib dikirim untuk produk dengan variant."
      );
    }

    /**
     * ==========================================================
     * GET PRODUCT
     * ==========================================================
     */
    const product =
      await tx.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          id: true,
          price: true,
          isDiscountActive: true,
          discountType: true,
          discountValue: true,
          discountStartAt: true,
          discountEndAt: true,
        },
      });

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    /**
     * ==========================================================
     * RESOLVE CANONICAL SKU
     * ==========================================================
     */
    let originalPrice: Prisma.Decimal;

    if (skuId) {
      const sku =
        await tx.productSku.findFirst({
          where: {
            id: skuId,
            productId,
          },
          select: {
            id: true,
            price: true,
            stock: true,
            isActive: true,
          },
        });

      if (!sku) {
        throw new Error(
          "SKU produk tidak ditemukan."
        );
      }

      if (!sku.isActive) {
        throw new Error(
          "SKU produk sudah tidak tersedia."
        );
      }

      originalPrice =
        new Prisma.Decimal(sku.price);

      if (originalPrice.lessThan(0)) {
        throw new Error(
          "Harga SKU tidak valid."
        );
      }
    } else {
      /**
       * Product tanpa variant/SKU lama.
       *
       * Setelah seluruh consumer dimigrasikan, fallback ini dapat
       * dihapus dan skuId dibuat wajib.
       */
      originalPrice =
        fallbackPrice !== undefined
          ? new Prisma.Decimal(
              fallbackPrice
            )
          : new Prisma.Decimal(
              product.price
            );

      if (originalPrice.lessThan(0)) {
        throw new Error(
          "Harga produk tidak valid."
        );
      }
    }

    /**
     * ==========================================================
     * FIND ACTIVE FLASH SALE
     * ==========================================================
     *
     * Canonical priority:
     *
     * 1. Flash Sale yang menunjuk SKU ini.
     * 2. Legacy/product-wide Flash Sale tanpa skuId.
     *
     * Kita tidak lagi menggunakan weightOptionId.
     */
    const now = new Date();

    const flashSaleScope = {
      isActive: true,
      flashSale: {
        status: "ACTIVE" as const,
        deletedAt: null,
        startAt: {
          lte: now,
        },
        endAt: {
          gt: now,
        },
      },
    };

    let flashSaleItem:
      | {
          id: string;
          flashSaleId: string;
          flashPrice: Prisma.Decimal;
        }
      | null = null;

    if (skuId) {
      flashSaleItem =
        await tx.flashSaleItem.findFirst({
          where: {
            ...flashSaleScope,
            productId,
            skuId,
          },
          select: {
            id: true,
            flashSaleId: true,
            flashPrice: true,
          },
          orderBy: [
            {
              sortOrder: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        });

      /**
       * Product-wide fallback.
       *
       * Dipakai hanya sebagai compatibility path selama Flash Sale
       * lama masih ada. Item SKU-specific tetap memiliki prioritas.
       */
      if (!flashSaleItem) {
        flashSaleItem =
          await tx.flashSaleItem.findFirst({
            where: {
              ...flashSaleScope,
              productId,
              skuId: null,
              weightOptionId: null,
            },
            select: {
              id: true,
              flashSaleId: true,
              flashPrice: true,
            },
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
          });
      }
    }

    /**
     * ==========================================================
     * FLASH SALE
     * ==========================================================
     *
     * Flash Sale memiliki prioritas lebih tinggi daripada
     * Product Discount.
     */
    if (flashSaleItem) {
      const flashPrice =
        new Prisma.Decimal(
          flashSaleItem.flashPrice
        );

      if (flashPrice.lessThan(0)) {
        throw new Error(
          "Harga Flash Sale tidak valid."
        );
      }

      if (
        flashPrice.greaterThan(
          originalPrice
        )
      ) {
        throw new Error(
          "Harga Flash Sale tidak boleh lebih tinggi dari harga SKU."
        );
      }

      const discountAmount =
        originalPrice.minus(
          flashPrice
        );

      return {
        originalPrice,
        discountAmount,
        finalPrice: flashPrice,
        isDiscountApplied: false,
        isFlashSaleApplied: true,
        flashSaleItemId:
          flashSaleItem.id,
        flashSaleId:
          flashSaleItem.flashSaleId,
      };
    }

    /**
     * ==========================================================
     * PRODUCT DISCOUNT
     * ==========================================================
     */
    const hasDiscountConfiguration =
      product.isDiscountActive &&
      product.discountType !== null &&
      product.discountValue !== null;

    const hasStarted =
      !product.discountStartAt ||
      now >= product.discountStartAt;

    const hasNotEnded =
      !product.discountEndAt ||
      now < product.discountEndAt;

    const isDiscountCurrentlyActive =
      hasDiscountConfiguration &&
      hasStarted &&
      hasNotEnded;

    let discountAmount =
      new Prisma.Decimal(0);

    let isDiscountApplied =
      false;

    if (
      isDiscountCurrentlyActive &&
      product.discountValue !== null &&
      product.discountType !== null
    ) {
      const discountValue =
        new Prisma.Decimal(
          product.discountValue
        );

      if (
        product.discountType ===
        ProductDiscountType.PERCENTAGE
      ) {
        const percentage =
          Prisma.Decimal.max(
            new Prisma.Decimal(0),
            Prisma.Decimal.min(
              discountValue,
              new Prisma.Decimal(100)
            )
          );

        discountAmount =
          originalPrice
            .mul(percentage)
            .div(100);
      }

      if (
        product.discountType ===
        ProductDiscountType.FIXED_AMOUNT
      ) {
        discountAmount =
          Prisma.Decimal.max(
            new Prisma.Decimal(0),
            discountValue
          );
      }

      discountAmount =
        Prisma.Decimal.min(
          discountAmount,
          originalPrice
        );

      isDiscountApplied =
        discountAmount.greaterThan(0);
    }

    /**
     * ==========================================================
     * FINAL PRICE
     * ==========================================================
     */
    const finalPrice =
      originalPrice.minus(
        discountAmount
      );

    if (finalPrice.lessThan(0)) {
      throw new Error(
        "Harga final produk tidak boleh kurang dari nol."
      );
    }

    return {
      originalPrice,
      discountAmount,
      finalPrice,
      isDiscountApplied,
      isFlashSaleApplied: false,
      flashSaleItemId: null,
      flashSaleId: null,
    };
  }
}
