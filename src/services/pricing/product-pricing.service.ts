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
 * Priority:
 *
 * 1. Flash Sale
 * 2. Product Discount
 * 3. Normal Price
 *
 * Formula:
 *
 * Base Price
 * =
 * ProductWeightOption.price
 * OR
 * Product.price
 *
 * Original Price
 * =
 * Base Price
 * +
 * ProductVariantOption.priceAdjustment
 *
 * Final Price
 * =
 *
 * Flash Sale Price
 * OR
 *
 * Original Price
 * -
 * Product Discount
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
   *
   * Jika Flash Sale aktif:
   * originalPrice - flashPrice
   *
   * Jika Product Discount aktif:
   * nominal discount product.
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
     * RESOLVE VARIANT ADJUSTMENT
     * ==========================================================
     */

    let variantAdjustment =
      new Prisma.Decimal(
        0
      );

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

      variantAdjustment =
        new Prisma.Decimal(
          variantOption.priceAdjustment ??
            0
        );
    }

    /**
     * ==========================================================
     * CALCULATE ORIGINAL PRICE
     * ==========================================================
     */

    const originalPrice =
      basePrice.plus(
        variantAdjustment
      );

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
 * RESOLVE FLASH SALE
 * ==========================================================
 *
 * Flash Sale memiliki prioritas lebih tinggi
 * daripada Product Discount.
 *
 * IMPORTANT:
 *
 * Flash Price adalah harga dasar Flash Sale.
 *
 * Variant adjustment tetap ditambahkan.
 *
 * Contoh:
 *
 * Flash Price       Rp10.000
 * Dibersihkan       +Rp5.000
 *
 * Final Price       Rp15.000
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
   * Harga akhir Flash Sale:
   *
   * Flash Sale Base Price
   * +
   * Variant Adjustment
   */

  const finalFlashPrice =
    flashSaleBasePrice.plus(
      variantAdjustment
    );


  /**
   * ========================================================
   * VALIDATE FINAL FLASH PRICE
   * ========================================================
   *
   * Harga Flash Sale tidak boleh lebih besar
   * dari harga normal kombinasi produk.
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
      /**
       * Harga normal:
       *
       * Weight Price
       * +
       * Variant Adjustment
       */

      originalPrice,


      /**
       * Selisih harga normal dan Flash Sale.
       */

      discountAmount,


      /**
       * Harga akhir:
       *
       * Flash Sale Base Price
       * +
       * Variant Adjustment
       */

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
      new Prisma.Decimal(
        0
      );

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
       * Discount tidak boleh lebih besar
       * dari harga asli produk.
       */

      discountAmount =
        Prisma.Decimal.min(
          discountAmount,
          originalPrice
        );

      isDiscountApplied =
        discountAmount.greaterThan(
          0
        );
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