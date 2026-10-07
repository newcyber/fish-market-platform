import {
  Prisma,
  type PrismaClient,
  ProductDiscountType,
  PromotionDiscountType,
  PromotionStatus,
  PromotionType,
  FlashSaleStatus,
} from "@prisma/client";

/**
 * ============================================================
 * PRODUCT PRICING SERVICE V2 - SKU BASED
 * ============================================================
 *
 * Canonical pricing priority:
 *
 * ProductSku.price
 *       ↓
 * Flash Sale
 *       ↓
 * Promotion PRICE_DISCOUNT
 *       ↓
 * ProductSku Discount
 *       ↓
 * Final Price
 *
 * IMPORTANT:
 *
 * Pricing tidak melakukan stacking discount.
 *
 * Priority:
 *
 * 1. Flash Sale
 * 2. Promotion PRICE_DISCOUNT
 * 3. ProductSku Discount
 * 4. Normal Price
 *
 * Flash Sale dan Promotion sama-sama merupakan
 * pricing override.
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
 * hanya agar consumer lama tetap dapat dikompilasi.
 *
 * Jika caller masih mengirim variant/weight tanpa skuId,
 * service akan menolak dengan error yang jelas.
 *
 * Legacy product tanpa SKU masih didukung sementara.
 */

export interface ResolveProductPriceInput {
  productId: string;

  /**
   * Canonical sellable unit.
   *
   * Untuk product dengan SKU,
   * harga dan discount menggunakan ProductSku.
   */
  skuId?: string | null;

  /**
   * Flash Sale Item yang dipilih oleh caller.
   *
   * Jika tersedia:
   *
   * - Pricing TIDAK boleh memilih FlashSaleItem lain
   * - Pricing harus memvalidasi FlashSaleItem ini
   * - FlashSaleItem harus cocok dengan productId + skuId
   * - FlashSaleItem harus aktif
   * - Campaign harus aktif
   * - Campaign harus berada dalam periode aktif
   * - quota harus masih tersedia
   *
   * Ini penting untuk mencegah race / salah campaign
   * ketika checkout concurrency terjadi.
   */
  preferredFlashSaleItemId?: string | null;

  /** Customer yang meminta pricing. Digunakan untuk eligibility Flash Sale per customer. */
  customerId?: string | null;

  /** Final quantity SKU yang sedang dihitung. */
  quantity?: number;

  /**
   * Saat update order, purchase lama order tersebut masih ada
   * sampai tahap reconcile. Purchase ini harus dikeluarkan dari
   * perhitungan quota dan limit customer sementara.
   */
  excludeOrderId?: string | null;

  /**
   * Legacy inputs.
   *
   * Dipertahankan sementara agar consumer lama
   * tetap dapat dikompilasi.
   */
  productVariant?: string | null;

  productWeight?: string | null;

  /**
   * Legacy fallback.
   *
   * Hanya digunakan untuk product tanpa SKU.
   */
  fallbackPrice?:
    | Prisma.Decimal
    | number;
}

export type ProductDiscountSource =
  | "NONE"
  | "PRODUCT_DISCOUNT"
  | "PROMOTION"
  | "FLASH_SALE";

export interface ProductPricingResult {
  /**
   * Harga SKU/Product sebelum pricing override.
   */
  originalPrice:
    Prisma.Decimal;

  /**
   * Nominal discount yang benar-benar diterapkan.
   */
  discountAmount:
    Prisma.Decimal;

  /**
   * Harga final.
   */
  finalPrice:
    Prisma.Decimal;

  /**
   * Backward compatibility.
   *
   * true jika discount berasal dari ProductSku/Product
   * atau Promotion.
   *
   * Flash Sale menggunakan flag tersendiri.
   */
  isDiscountApplied:
    boolean;

  /**
   * True jika Flash Sale menjadi pricing source.
   */
  isFlashSaleApplied:
    boolean;

  /**
   * True jika Promotion PRICE_DISCOUNT menjadi
   * pricing source.
   */
  promotionDiscountApplied:
    boolean;

  /**
   * Promotion yang menghasilkan harga final.
   *
   * null jika tidak ada Promotion yang diterapkan.
   */
  promotionId:
    string | null;

  /**
   * Nama promotion yang menghasilkan harga final.
   */
  promotionName:
    string | null;

  /**
   * Nama Flash Sale yang menghasilkan harga final.
   */
  flashSaleName:
    string | null;

  /**
   * Sumber pricing final.
   */
  discountSource:
    ProductDiscountSource;

  /**
   * Flash Sale metadata.
   */
  flashSaleItemId:
    string | null;

  flashSaleId:
    string | null;
}

export default class ProductPricingService {
  /**
   * ============================================================
   * RESOLVE PRODUCT PRICE
   * ============================================================
   */
  static async resolve(
    tx: Prisma.TransactionClient | PrismaClient,
    input: ResolveProductPriceInput
  ): Promise<ProductPricingResult> {
    const {
      productId,

      skuId,

      preferredFlashSaleItemId,

      customerId,

      quantity = 1,

      excludeOrderId = null,

      productVariant,

      productWeight,

      fallbackPrice,
    } = input;

    /**
     * ----------------------------------------------------------
     * LEGACY GUARD
     * ----------------------------------------------------------
     *
     * Kita sengaja tidak mencoba menebak SKU dari label
     * variant lama.
     *
     * Pada sistem baru satu product dapat memiliki lebih
     * dari dua VariantGroup sehingga pasangan:
     *
     * productVariant + productWeight
     *
     * tidak cukup untuk menentukan SKU secara unik.
     */
    if (
      !skuId &&
      (
        productVariant ||
        productWeight
      )
    ) {
      throw new Error(
        "Pricing sekarang berbasis SKU. skuId wajib dikirim untuk produk dengan variant."
      );
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        "Quantity pricing harus berupa angka bulat lebih dari 0."
      );
    }

/**
 * ==========================================================
 * GET PRODUCT
 * ==========================================================
 *
 * Product tetap diambil karena masih diperlukan untuk
 * compatibility path produk legacy tanpa SKU.
 *
 * Untuk product dengan SKU:
 *
 * - price menggunakan ProductSku.price
 * - discount menggunakan ProductSku.discount*
 *
 * Pre-Order:
 *
 * - isPreOrder digunakan untuk menentukan apakah produk
 *   boleh mengikuti Flash Sale.
 * - preOrderMinDays / preOrderMaxDays digunakan untuk
 *   informasi estimasi Pre-Order di layer berikutnya.
 */
const product =
  await tx.product.findUnique({
    where: {
      id:
        productId,
    },

    select: {
      id:
        true,

      price:
        true,

      /**
       * ======================================================
       * PRE-ORDER
       * ======================================================
       *
       * Digunakan oleh pricing layer untuk memastikan
       * produk Pre-Order tidak mengikuti Flash Sale.
       */
      isPreOrder:
        true,

      preOrderMinDays:
        true,

      preOrderMaxDays:
        true,

      /**
       * ======================================================
       * LEGACY PRODUCT DISCOUNT
       * ======================================================
       *
       * Hanya digunakan ketika skuId
       * tidak tersedia.
       */
      isDiscountActive:
        true,

      discountType:
        true,

      discountValue:
        true,

      discountStartAt:
        true,

      discountEndAt:
        true,
    },
  });

if (!product) {
  throw new Error(
    "Produk tidak ditemukan."
  );
}

/**
 * ==========================================================
 * RESOLVE CANONICAL PRICE + DISCOUNT SOURCE
 * ==========================================================
 */

    let originalPrice:
      Prisma.Decimal;

    let discountIsActive:
      boolean;

    let discountType:
      | ProductDiscountType
      | null;

    let discountValue:
      | Prisma.Decimal
      | null;

    let discountStartAt:
      | Date
      | null;

    let discountEndAt:
      | Date
      | null;

    if (skuId) {
      /**
       * --------------------------------------------------------
       * CANONICAL SKU PATH
       * --------------------------------------------------------
       */

      const sku =
        await tx.productSku.findFirst({
          where: {
            id:
              skuId,

            productId:
              productId,
          },

          select: {
            id:
              true,

            price:
              true,

            stock:
              true,

            isActive:
              true,

            /**
             * Canonical SKU Product Discount.
             */
            isDiscountActive:
              true,

            discountType:
              true,

            discountValue:
              true,

            discountStartAt:
              true,

            discountEndAt:
              true,
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

      /**
       * ProductSku adalah canonical price source.
       */
      originalPrice =
        new Prisma.Decimal(
          sku.price
        );

      if (
        originalPrice.lessThan(0)
      ) {
        throw new Error(
          "Harga SKU tidak valid."
        );
      }

      /**
       * ProductSku adalah canonical discount source.
       */
      discountIsActive =
        sku.isDiscountActive;

      discountType =
        sku.discountType;

      discountValue =
        sku.discountValue !== null
          ? new Prisma.Decimal(
              sku.discountValue
            )
          : null;

      discountStartAt =
        sku.discountStartAt;

      discountEndAt =
        sku.discountEndAt;
    } else {
      /**
       * --------------------------------------------------------
       * LEGACY PRODUCT PATH
       * --------------------------------------------------------
       *
       * Dipakai hanya untuk product tanpa SKU.
       *
       * Setelah seluruh consumer legacy dimigrasikan,
       * fallback ini dapat dihapus dan skuId dibuat wajib.
       */

      originalPrice =
        fallbackPrice !==
        undefined
          ? new Prisma.Decimal(
              fallbackPrice
            )
          : new Prisma.Decimal(
              product.price
            );

      if (
        originalPrice.lessThan(0)
      ) {
        throw new Error(
          "Harga produk tidak valid."
        );
      }

      /**
       * Legacy Product discount.
       */
      discountIsActive =
        product.isDiscountActive;

      discountType =
        product.discountType;

      discountValue =
        product.discountValue !== null
          ? new Prisma.Decimal(
              product.discountValue
            )
          : null;

      discountStartAt =
        product.discountStartAt;

      discountEndAt =
        product.discountEndAt;
    }

        /**
     * ==========================================================
     * CURRENT TIME
     * ==========================================================
     */
    const now =
      new Date();

    /**
     * ==========================================================
     * FIND FLASH SALE
     * ==========================================================
     *
     * Canonical priority:
     *
     * 1. preferredFlashSaleItemId
     * 2. SKU-specific Flash Sale
     * 3. Legacy/product-wide Flash Sale
     *
     * Flash Sale memiliki priority tertinggi terhadap:
     *
     * - Promotion PRICE_DISCOUNT
     * - ProductSku Discount
     *
     * Pricing TIDAK melakukan stacking discount.
     *
     * IMPORTANT:
     *
     * ProductSku.stock TIDAK digunakan sebagai quota
     * Flash Sale.
     *
     * Quota Flash Sale:
     *
     *     soldQuantity < stockLimit
     *
     * ----------------------------------------------------------
     *
     * preferredFlashSaleItemId digunakan ketika caller sudah
     * mengetahui FlashSaleItem tertentu yang harus digunakan.
     *
     * Contoh:
     *
     * TEST concurrency:
     *
     * Checkout A
     *       ↓
     * preferredFlashSaleItemId = X
     *
     * Checkout B
     *       ↓
     * preferredFlashSaleItemId = X
     *
     * Dengan demikian kedua checkout mengacu pada
     * FlashSaleItem yang SAMA.
     *
     * Jika preferredFlashSaleItemId diberikan tetapi tidak valid,
     * JANGAN diam-diam menggantinya dengan Flash Sale lain.
     *
     * Ini penting agar pricing dan FlashSaleCheckoutService
     * menggunakan sumber Flash Sale yang konsisten.
     */

    const flashSaleScope = {
      isActive: true,

      flashSale: {
        status: {
          in: [
            FlashSaleStatus.SCHEDULED,
            FlashSaleStatus.ACTIVE,
          ],
        },

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

          flashSale: {
            name: string;
          };

          flashPrice:
            Prisma.Decimal;

          stockLimit: number;

          soldQuantity: number;

          perUserLimit: number | null;
        }
      | null = null;

    /**
     * ==========================================================
     * 1. PREFERRED FLASH SALE ITEM
     * ==========================================================
     *
     * Jika caller mengirim preferredFlashSaleItemId,
     * gunakan item tersebut setelah seluruh validasi.
     *
     * TIDAK boleh fallback ke Flash Sale lain jika
     * preferred item ternyata tidak valid.
     */

    if (
  !product.isPreOrder &&
  preferredFlashSaleItemId
    ) {
      const preferredItem =
        await tx.flashSaleItem.findFirst({
          where: {
            id:
              preferredFlashSaleItemId,

            ...flashSaleScope,

            productId,

            ...(skuId
              ? {
                  skuId,
                }
              : {
                  skuId: null,
                  weightOptionId:
                    null,
                }),

          },

          select: {
            id: true,

            flashSaleId: true,

            flashSale: {
              select: {
                name: true,
              },
            },

            flashPrice: true,

            stockLimit: true,

            soldQuantity: true,

            perUserLimit: true,
          },
        });

      /**
       * preferredFlashSaleItemId diberikan oleh caller,
       * tetapi item tersebut tidak lagi valid.
       *
       * Jangan memilih Flash Sale lain secara diam-diam.
       */
      if (!preferredItem) {
        /**
         * Preferred Flash Sale yang sudah tidak valid tidak boleh
         * diam-diam diganti dengan campaign lain.
         * Pricing kembali ke harga normal SKU.
         */
        return {
          originalPrice,
          discountAmount: new Prisma.Decimal(0),
          finalPrice: originalPrice,
          isDiscountApplied: false,
          isFlashSaleApplied: false,
          promotionDiscountApplied: false,
          promotionId: null,
          promotionName: null,
          flashSaleName: null,
          discountSource: "NONE" as const,
          flashSaleItemId: null,
          flashSaleId: null,
        };
      }

      flashSaleItem = preferredItem;
    }

    /**
     * ==========================================================
     * 2. NORMAL SKU-SPECIFIC FLASH SALE
     * ==========================================================
     *
     * Hanya dilakukan jika caller TIDAK memberikan
     * preferredFlashSaleItemId.
     *
     * SKU-specific Flash Sale memiliki prioritas lebih tinggi
     * daripada legacy product-wide Flash Sale.
     */

    if (
  !product.isPreOrder &&
  !preferredFlashSaleItemId &&
  !flashSaleItem &&
  skuId
    ) {
      const skuFlashSaleItems =
        await tx.flashSaleItem.findMany({
          where: {
            ...flashSaleScope,

            productId,

            skuId,

          },

          select: {
            id: true,

            flashSaleId: true,

            flashSale: {
              select: {
                name: true,
              },
            },

            flashPrice: true,

            stockLimit: true,

            soldQuantity: true,

            perUserLimit: true,
          },

          orderBy: [
            {
              flashSale: {
                sortOrder:
                  "asc",
              },
            },

            {
              sortOrder:
                "asc",
            },

            {
              createdAt:
                "asc",
            },
          ],
        });

      /**
       * Hanya Flash Sale yang benar-benar masih mempunyai
       * quota yang boleh menjadi pricing source.
       *
       * Formula:
       *
       *     soldQuantity < stockLimit
       */
      flashSaleItem =
        skuFlashSaleItems.find(
          (item) =>
            item.soldQuantity <
            item.stockLimit
        ) ?? skuFlashSaleItems[0] ?? null;
    }

    /**
     * ==========================================================
     * 3. LEGACY PRODUCT-WIDE FLASH SALE
     * ==========================================================
     *
     * Compatibility path untuk FlashSaleItem lama yang:
     *
     *     skuId = null
     *     weightOptionId = null
     *
     * Hanya digunakan jika:
     *
     * - tidak ada preferred Flash Sale
     * - tidak ada SKU-specific Flash Sale yang tersedia
     */

    if (
  !product.isPreOrder &&
  !preferredFlashSaleItemId &&
  !flashSaleItem &&
  skuId
    ) {
      const legacyFlashSaleItems =
        await tx.flashSaleItem.findMany({
          where: {
            ...flashSaleScope,

            productId,

            skuId: null,

            weightOptionId:
              null,
          },

          select: {
            id: true,

            flashSaleId: true,

            flashSale: {
              select: {
                name: true,
              },
            },

            flashPrice: true,

            stockLimit: true,

            soldQuantity: true,

            perUserLimit: true,
          },

          orderBy: [
            {
              flashSale: {
                sortOrder:
                  "asc",
              },
            },

            {
              sortOrder:
                "asc",
            },

            {
              createdAt:
                "asc",
            },
          ],
        });

      flashSaleItem =
        legacyFlashSaleItems.find(
          (item) =>
            item.soldQuantity <
            item.stockLimit
        ) ?? legacyFlashSaleItems[0] ?? null;
    }

    /**
     * ==========================================================
     * FLASH SALE OVERRIDE
     * ==========================================================
     *
     * Flash Sale memiliki priority tertinggi.
     *
     * Priority final:
     *
     *     Flash Sale
     *          >
     *     Promotion PRICE_DISCOUNT
     *          >
     *     ProductSku Discount
     *          >
     *     Normal Price
     *
     * Tidak terjadi stacking.
     */

    if (flashSaleItem) {
      const flashPrice =
        new Prisma.Decimal(
          flashSaleItem.flashPrice
        );

      /**
       * Harga Flash Sale tidak boleh negatif.
       */
      if (
        flashPrice.lessThan(0)
      ) {
        throw new Error(
          "Harga Flash Sale tidak valid."
        );
      }

      /**
       * Flash Sale tidak boleh lebih mahal daripada
       * harga normal SKU/Product.
       */
      if (
        flashPrice.greaterThan(
          originalPrice
        )
      ) {
        throw new Error(
          "Harga Flash Sale tidak boleh lebih tinggi dari harga SKU."
        );
      }

      /**
       * ========================================================
       * ALL OR NOTHING ELIGIBILITY
       * ========================================================
       *
       * Flash Sale hanya berlaku jika seluruh quantity memenuhi:
       *
       * - quota global masih cukup
       * - customer masih memiliki hak promo
       *
       * Jika satu syarat gagal, SELURUH quantity menggunakan
       * harga normal SKU. Tidak ada harga campuran.
       */
      const campaignItems =
        await tx.flashSaleItem.findMany({
          where: {
            flashSaleId: flashSaleItem.flashSaleId,
            skuId: skuId ?? null,
          },
          select: {
            id: true,
          },
        });

      const campaignItemIds =
        campaignItems.map((item) => item.id);

      const excludedOrderUsage =
        excludeOrderId && campaignItemIds.length > 0
          ? await tx.flashSalePurchase.aggregate({
              where: {
                orderId: excludeOrderId,
                flashSaleItemId: {
                  in: campaignItemIds,
                },
              },
              _sum: {
                quantity: true,
              },
            })
          : {
              _sum: {
                quantity: null,
              },
            };

      const excludedOrderQuantity =
        excludedOrderUsage._sum.quantity ?? 0;

      const effectiveSoldQuantity = Math.max(
        0,
        flashSaleItem.soldQuantity -
          excludedOrderQuantity
      );

      const remainingQuota = Math.max(
        0,
        flashSaleItem.stockLimit -
          effectiveSoldQuantity
      );

      let remainingCustomerLimit =
        flashSaleItem.perUserLimit ??
        Number.MAX_SAFE_INTEGER;

      if (
        customerId &&
        flashSaleItem.perUserLimit !== null
      ) {
        const usage =
          campaignItemIds.length > 0
            ? await tx.flashSalePurchase.aggregate({
                where: {
                  userId: customerId,
                  flashSaleItemId: {
                    in: campaignItemIds,
                  },
                  ...(excludeOrderId
                    ? {
                        orderId: {
                          not: excludeOrderId,
                        },
                      }
                    : {}),
                },
                _sum: {
                  quantity: true,
                },
              })
            : {
                _sum: {
                  quantity: null,
                },
              };

        const purchasedQuantity =
          usage._sum.quantity ?? 0;

        remainingCustomerLimit =
          Math.max(
            0,
            flashSaleItem.perUserLimit -
              purchasedQuantity
          );
      }

      const flashSaleEligible =
        remainingQuota >= quantity &&
        remainingCustomerLimit >= quantity;

      if (!flashSaleEligible) {
        return {
          originalPrice,
          discountAmount: new Prisma.Decimal(0),
          finalPrice: originalPrice,
          isDiscountApplied: false,
          isFlashSaleApplied: false,
          promotionDiscountApplied: false,
          promotionId: null,
          promotionName: null,
          flashSaleName: null,
          discountSource: "NONE" as const,
          flashSaleItemId: null,
          flashSaleId: null,
        };
      }

      const discountAmount =
        originalPrice.minus(
          flashPrice
        );

      return {
        originalPrice,

        discountAmount,

        finalPrice:
          flashPrice,

        /**
         * ProductSku/Product Discount
         * tidak diterapkan ketika Flash Sale aktif.
         */
        isDiscountApplied:
          false,

        isFlashSaleApplied:
          true,

        promotionDiscountApplied:
          false,

        promotionId:
          null,

        promotionName:
          null,

        flashSaleName:
          flashSaleItem.flashSale.name,

        discountSource:
          "FLASH_SALE",

        flashSaleItemId:
          flashSaleItem.id,

        flashSaleId:
          flashSaleItem.flashSaleId,
      };
    }

    /**
     * ==========================================================
     * FIND ACTIVE PROMOTION
     * ==========================================================
     *
     * Promotion hanya mempengaruhi harga jika:
     *
     * - skuId tersedia
     * - promotion belum soft deleted
     * - type = PRICE_DISCOUNT
     * - status = ACTIVE
     * - startAt null atau sudah dimulai
     * - endAt null atau belum berakhir
     * - SKU termasuk dalam PromotionItem
     *
     * MARKETING tidak pernah masuk pricing engine.
     */
    let activePromotion:
      | {
          id: string;
          name: string;
          discountType: PromotionDiscountType | null;
          discountValue: Prisma.Decimal | null;
          items: Array<{
            normalPriceSnapshot: Prisma.Decimal;
            promoPrice: Prisma.Decimal;
            discountType: PromotionDiscountType | null;
            discountValue: Prisma.Decimal | null;
          }>;
        }
      | null = null;

    if (skuId) {
      const promotionRecord =
        await tx.promotion.findFirst({
          where: {
            deletedAt: null,
            type: PromotionType.PRICE_DISCOUNT,
            status: PromotionStatus.ACTIVE,
            items: {
              some: { skuId },
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
            items: {
              where: { skuId },
              take: 1,
              select: {
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

      activePromotion = promotionRecord;
    }

    /**
     * ==========================================================
     * PROMOTION PRICE DISCOUNT
     * ==========================================================
     *
     * New promotions use PromotionItem.promoPrice as the
     * authoritative SKU-specific price. Legacy records that do
     * not yet have item pricing fall back to the campaign-level
     * discount fields so existing data keeps working.
     */
    if (activePromotion) {
      const promotionItem = activePromotion.items[0] ?? null;

      if (promotionItem) {
        const promoPrice = new Prisma.Decimal(promotionItem.promoPrice);

        if (!promoPrice.greaterThan(0)) {
          throw new Error(
            "Harga promo promotion harus lebih besar dari 0."
          );
        }

        if (!promoPrice.lessThan(originalPrice)) {
          throw new Error(
            "Harga promo promotion harus lebih kecil dari harga normal SKU."
          );
        }

        const discountAmount = originalPrice.minus(promoPrice);

        return {
          originalPrice,
          discountAmount,
          finalPrice: promoPrice,
          isDiscountApplied: discountAmount.greaterThan(0),
          isFlashSaleApplied: false,
          promotionDiscountApplied: discountAmount.greaterThan(0),
          promotionId: activePromotion.id,
          promotionName: activePromotion.name,
          flashSaleName: null,
          discountSource: "PROMOTION",
          flashSaleItemId: null,
          flashSaleId: null,
        };
      }

      if (
        activePromotion.discountType === null ||
        activePromotion.discountValue === null
      ) {
        throw new Error(
          "Promotion PRICE_DISCOUNT aktif memiliki konfigurasi discount yang tidak lengkap."
        );
      }

      const promotionDiscountValue =
        new Prisma.Decimal(activePromotion.discountValue);

      if (!promotionDiscountValue.greaterThan(0)) {
        throw new Error(
          "Nilai discount promotion harus lebih besar dari 0."
        );
      }

      let promotionDiscountAmount = new Prisma.Decimal(0);

      if (
        activePromotion.discountType ===
        PromotionDiscountType.PERCENTAGE
      ) {
        if (promotionDiscountValue.greaterThan(100)) {
          throw new Error(
            "Discount percentage promotion tidak boleh lebih dari 100%."
          );
        }

        promotionDiscountAmount = originalPrice
          .mul(promotionDiscountValue)
          .div(100);
      } else if (
        activePromotion.discountType ===
        PromotionDiscountType.FIXED_AMOUNT
      ) {
        promotionDiscountAmount = promotionDiscountValue;
      } else if (
        activePromotion.discountType ===
        PromotionDiscountType.FIXED_PRICE
      ) {
        const legacyPromoPrice = promotionDiscountValue;

        if (!legacyPromoPrice.lessThan(originalPrice)) {
          throw new Error(
            "Harga promo promotion harus lebih kecil dari harga normal SKU."
          );
        }

        promotionDiscountAmount = originalPrice.minus(legacyPromoPrice);
      }

      promotionDiscountAmount = Prisma.Decimal.max(
        new Prisma.Decimal(0),
        promotionDiscountAmount
      );

      promotionDiscountAmount = Prisma.Decimal.min(
        promotionDiscountAmount,
        originalPrice
      );

      const promotionFinalPrice = originalPrice.minus(
        promotionDiscountAmount
      );

      if (promotionFinalPrice.lessThan(0)) {
        throw new Error(
          "Harga final promotion tidak boleh kurang dari nol."
        );
      }

      return {
        originalPrice,
        discountAmount: promotionDiscountAmount,
        finalPrice: promotionFinalPrice,
        isDiscountApplied: promotionDiscountAmount.greaterThan(0),
        isFlashSaleApplied: false,
        promotionDiscountApplied: promotionDiscountAmount.greaterThan(0),
        promotionId: activePromotion.id,
        promotionName: activePromotion.name,
        flashSaleName: null,
        discountSource: "PROMOTION",
        flashSaleItemId: null,
        flashSaleId: null,
      };
    }

    /**
     * ==========================================================
     * PRODUCT DISCOUNT
     * ==========================================================
     *
     * Promotion tidak aktif/tidak ditemukan.
     *
     * Maka fallback ke:
     *
     * ProductSku.discount*
     *
     * atau legacy Product.discount*.
     */
    const hasDiscountConfiguration =
      discountIsActive &&
      discountType !== null &&
      discountValue !== null;

    const hasStarted =
      !discountStartAt ||
      now >= discountStartAt;

    const hasNotEnded =
      !discountEndAt ||
      now < discountEndAt;

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
      discountValue !== null &&
      discountType !== null
    ) {
      /**
       * --------------------------------------------------------
       * PERCENTAGE DISCOUNT
       * --------------------------------------------------------
       */
      if (
        discountType ===
        ProductDiscountType.PERCENTAGE
      ) {
        /**
         * Defensive clamp.
         *
         * Business validation tetap dilakukan ketika
         * discount dikonfigurasi oleh admin.
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
        discountType ===
        ProductDiscountType.FIXED_AMOUNT
      ) {
        discountAmount =
          Prisma.Decimal.max(
            new Prisma.Decimal(0),
            discountValue
          );
      }

      /**
       * Discount tidak boleh melebihi harga original.
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

    /**
     * ==========================================================
     * RESULT
     * ==========================================================
     */
    return {
      originalPrice,

      discountAmount,

      finalPrice,

      isDiscountApplied,

      isFlashSaleApplied:
        false,

      promotionDiscountApplied:
        false,

      promotionId: null,
      promotionName: null,
      flashSaleName: null,

      discountSource:
        isDiscountApplied
          ? "PRODUCT_DISCOUNT"
          : "NONE",

      flashSaleItemId: null,
      flashSaleId: null,
    };
  }
}