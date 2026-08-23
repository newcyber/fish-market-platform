import {
  Prisma,
  ProductDiscountType,
} from "@prisma/client";

import FlashSaleRepository from "@/repositories/flash-sale/flash-sale.repository";

/**
 * ============================================================
 * PRODUCT PRICING SERVICE
 * ============================================================
 *
 * Single source of truth untuk seluruh perhitungan harga produk.
 *
 * PRIORITY:
 *
 * 1. Flash Sale
 * 2. Product Discount
 * 3. Normal Price
 *
 * NORMAL PRICE PRIORITY:
 *
 * 1. ProductWeightVariantPrice
 *    = harga spesifik kombinasi berat + varian
 *
 * 2. ProductWeightOption.price
 *    +
 *    ProductVariantOption.priceAdjustment
 *
 * 3. Product.price
 *
 * ============================================================
 */

export interface ResolveProductPriceInput {
  productId: string;

  productVariant?: string | null;

  productWeight?: string | null;

  fallbackPrice: Prisma.Decimal;
}

export interface ProductPricingResult {
  /**
   * Harga sebelum Flash Sale atau Product Discount.
   */
  originalPrice: Prisma.Decimal;

  /**
   * Nominal diskon yang diterapkan.
   */
  discountAmount: Prisma.Decimal;

  /**
   * Harga akhir yang harus digunakan.
   */
  finalPrice: Prisma.Decimal;

  /**
   * Menandakan apakah Product Discount diterapkan.
   */
  isDiscountApplied: boolean;

  /**
   * Menandakan apakah Flash Sale diterapkan.
   */
  isFlashSaleApplied: boolean;

  /**
   * Flash Sale Item yang digunakan.
   */
  flashSaleItemId: string | null;

  /**
   * Flash Sale campaign yang digunakan.
   */
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
      productVariant,
      productWeight,
      fallbackPrice,
    } = input;

    /**
     * ==========================================================
     * GET PRODUCT CONFIGURATION
     * ==========================================================
     */

    const product =
      await tx.product.findUnique({
        where: {
          id: productId,
        },

        select: {
          id: true,

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
     * RESOLVE BASE PRICE
     * ==========================================================
     *
     * Fallback:
     *
     * ProductWeightOption.price
     * OR
     * Product.price
     */

    let basePrice =
      new Prisma.Decimal(
        fallbackPrice
      );

    let weightOptionId:
      | string
      | null = null;

    if (productWeight) {
      const weightOption =
        await tx.productWeightOption.findFirst({
          where: {
            productId,

            label:
              productWeight,

            isActive:
              true,
          },

          select: {
            id: true,

            label: true,

            price: true,
          },
        });

      if (!weightOption) {
        throw new Error(
          "Pilihan berat produk tidak valid atau sudah tidak tersedia."
        );
      }

      if (
        weightOption.price === null ||
        weightOption.price === undefined
      ) {
        throw new Error(
          `Harga untuk pilihan berat "${weightOption.label}" belum diatur.`
        );
      }

      weightOptionId =
        weightOption.id;

      basePrice =
        new Prisma.Decimal(
          weightOption.price
        );
    }

    /**
     * ==========================================================
     * RESOLVE VARIANT
     * ==========================================================
     *
     * Variant adjustment tetap digunakan
     * sebagai fallback untuk produk lama.
     */

    let variantAdjustment =
      new Prisma.Decimal(0);

    let variantOptionId:
      | string
      | null = null;

    if (productVariant) {
      const variantOption =
        await tx.productVariantOption.findFirst({
          where: {
            productId,

            label:
              productVariant,

            isActive:
              true,
          },

          select: {
            id: true,

            label: true,

            priceAdjustment: true,
          },
        });

      if (!variantOption) {
        throw new Error(
          "Varian produk yang dipilih tidak valid atau sudah tidak tersedia."
        );
      }

      variantOptionId =
        variantOption.id;

      variantAdjustment =
        new Prisma.Decimal(
          variantOption.priceAdjustment ?? 0
        );
    }

    /**
     * ==========================================================
     * RESOLVE WEIGHT × VARIANT PRICE
     * ==========================================================
     *
     * PRIORITY:
     *
     * ProductWeightVariantPrice
     *
     * Contoh:
     *
     * Kakap 1 KG + Utuh
     * = Rp100.000
     *
     * Kakap 1 KG + Dibersihkan
     * = Rp105.000
     *
     * Kakap 2 KG + Utuh
     * = Rp200.000
     *
     * Kakap 2 KG + Dibersihkan
     * = Rp207.000
     */

    let originalPrice =
      basePrice.plus(
        variantAdjustment
      );

    let hasSpecificWeightVariantPrice =
      false;

    if (
      weightOptionId &&
      variantOptionId
    ) {
      const specificPrice =
        await tx.productWeightVariantPrice.findUnique({
          where: {
            productId_weightOptionId_variantOptionId: {
              productId,

              weightOptionId,

              variantOptionId,
            },
          },

          select: {
            price: true,
          },
        });

      if (specificPrice) {
        originalPrice =
          new Prisma.Decimal(
            specificPrice.price
          );

        hasSpecificWeightVariantPrice =
          true;
      }
    }

    /**
     * ==========================================================
     * VALIDATE ORIGINAL PRICE
     * ==========================================================
     */

    if (
      originalPrice.lessThan(0)
    ) {
      throw new Error(
        "Harga normal produk tidak boleh kurang dari nol."
      );
    }

    /**
     * ==========================================================
     * RESOLVE FLASH SALE
     * ==========================================================
     *
     * Flash Sale memiliki prioritas lebih tinggi
     * daripada Product Discount.
     */

    const flashSaleItem =
      await FlashSaleRepository.findActiveItem(
        tx,
        {
          productId,

          weightOptionId,
        }
      );

    /**
     * ==========================================================
     * FLASH SALE
     * ==========================================================
     *
     * Flash Sale Base Price
     * +
     * Variant Adjustment
     *
     * Untuk produk lama:
     *
     * weight price
     * +
     * variant adjustment
     *
     * Untuk produk dengan harga kombinasi:
     *
     * kita tetap gunakan variantAdjustment
     * untuk menjaga kompatibilitas dengan
     * mekanisme Flash Sale yang sudah ada.
     */

    if (flashSaleItem) {
      /**
       * ========================================================
       * FLASH SALE BASE PRICE
       * ========================================================
       */

      const flashSaleBasePrice =
        new Prisma.Decimal(
          flashSaleItem.flashPrice
        );

      /**
       * ========================================================
       * VALIDATE FLASH SALE PRICE
       * ========================================================
       */

      if (
        flashSaleBasePrice.lessThan(0)
      ) {
        throw new Error(
          "Harga Flash Sale tidak valid."
        );
      }

      /**
       * ========================================================
       * APPLY VARIANT ADJUSTMENT
       * ========================================================
       *
       * Untuk kombinasi harga baru:
       *
       * specificPrice
       * -
       * basePrice
       *
       * digunakan sebagai effective adjustment.
       *
       * Contoh:
       *
       * Weight 2 KG:
       * Base       = 200.000
       * Dibersihkan = 207.000
       *
       * Effective adjustment:
       *
       * 207.000 - 200.000
       * = 7.000
       *
       * Dengan begitu Flash Sale tetap
       * mengikuti perbedaan harga varian.
       */

      let effectiveVariantAdjustment =
        variantAdjustment;

      if (
        hasSpecificWeightVariantPrice
      ) {
        effectiveVariantAdjustment =
          originalPrice.minus(
            basePrice
          );
      }

      /**
       * ========================================================
       * FINAL FLASH SALE PRICE
       * ========================================================
       */

      const finalFlashPrice =
        flashSaleBasePrice.plus(
          effectiveVariantAdjustment
        );

      /**
       * ========================================================
       * VALIDATE FINAL FLASH PRICE
       * ========================================================
       *
       * Flash Sale tidak boleh lebih mahal
       * daripada harga normal kombinasi.
       */

      if (
        finalFlashPrice.lessThanOrEqualTo(
          originalPrice
        )
      ) {
        const discountAmount =
          originalPrice.minus(
            finalFlashPrice
          );

        return {
          originalPrice,

          discountAmount,

          finalPrice:
            finalFlashPrice,

          isDiscountApplied:
            false,

          isFlashSaleApplied:
            true,

          flashSaleItemId:
            flashSaleItem.id,

          flashSaleId:
            flashSaleItem.flashSaleId,
        };
      }
    }

    /**
     * ==========================================================
     * CALCULATE PRODUCT DISCOUNT
     * ==========================================================
     */

    const now =
      new Date();

    let discountAmount =
      new Prisma.Decimal(0);

    let isDiscountApplied =
      false;

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

    if (
      isDiscountCurrentlyActive &&
      product.discountValue !== null &&
      product.discountType !== null
    ) {
      const discountValue =
        new Prisma.Decimal(
          product.discountValue
        );

      /**
       * --------------------------------------------------------
       * PERCENTAGE DISCOUNT
       * --------------------------------------------------------
       */

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

      /**
       * --------------------------------------------------------
       * FIXED AMOUNT DISCOUNT
       * --------------------------------------------------------
       */

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

      /**
       * --------------------------------------------------------
       * LIMIT DISCOUNT
       * --------------------------------------------------------
       *
       * Discount tidak boleh lebih besar
       * dari harga asli kombinasi.
       */

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
     * CALCULATE FINAL PRICE
     * ==========================================================
     */

    const finalPrice =
      originalPrice.minus(
        discountAmount
      );

    if (
      finalPrice.lessThan(0)
    ) {
      throw new Error(
        "Harga final produk tidak boleh kurang dari nol."
      );
    }

    /**
     * ==========================================================
     * RETURN RESULT
     * ==========================================================
     */

    return {
      originalPrice,

      discountAmount,

      finalPrice,

      isDiscountApplied,

      isFlashSaleApplied:
        false,

      flashSaleItemId:
        null,

      flashSaleId:
        null,
    };
  }
}