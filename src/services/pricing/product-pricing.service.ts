import {
  Prisma,
  ProductDiscountType,
} from "@prisma/client";

/**
 * ============================================================
 * PRODUCT PRICING SERVICE
 * ============================================================
 *
 * Single source of truth untuk seluruh perhitungan harga produk.
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
 * Discount Amount
 * =
 * Product Discount
 *
 * Final Price
 * =
 * Original Price
 * -
 * Discount Amount
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
   * Harga sebelum diskon.
   */
  originalPrice: Prisma.Decimal;

  /**
   * Nominal diskon yang diterapkan.
   */
  discountAmount: Prisma.Decimal;

  /**
   * Harga akhir setelah diskon.
   */
  finalPrice: Prisma.Decimal;

  /**
   * Menandakan apakah diskon produk aktif.
   */
  isDiscountApplied: boolean;
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
     * GET PRODUCT DISCOUNT CONFIGURATION
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
        /**
         * Clamp percentage between 0 and 100.
         */

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
    };
  }
}