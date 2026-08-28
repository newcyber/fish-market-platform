import {
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import CartRepository from "@/repositories/cart/cart.repository";

import ProductPricingService from "@/services/pricing/product-pricing.service";

/**
 * ============================================================
 * CART SERVICE - SKU BASED
 * ============================================================
 *
 * Canonical cart identity:
 *
 *   Product
 *      ↓
 *   ProductSku
 *      ↓
 *   CartItem.skuId
 *
 * Untuk product TANPA variant/SKU, skuId boleh null selama
 * migration dan Product.stock/Product.price tetap digunakan.
 *
 * Untuk product YANG MEMILIKI active SKU, skuId WAJIB.
 *
 * Legacy fields:
 *   productVariant
 *   productWeight
 *   weightSku
 *
 * tidak lagi menjadi sumber kebenaran.
 */

export interface AddCartItemInput {
  userId: string;
  productId: string;
  skuId?: string | null;
  quantity: number;
  customerNote?: string | null;
}

export interface UpdateCartItemInput {
  userId: string;
  cartItemId: string;
  quantity: number;
}

export interface RemoveCartItemInput {
  userId: string;
  cartItemId: string;
}

export default class CartService {
  private static validateUserId(
    userId: string
  ) {
    if (!userId?.trim()) {
      throw new Error(
        "Customer tidak valid."
      );
    }
  }

  private static validateCartItemId(
    cartItemId: string
  ) {
    if (!cartItemId?.trim()) {
      throw new Error(
        "Item keranjang tidak valid."
      );
    }
  }

  private static validateQuantity(
    quantity: number
  ) {
    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error(
        "Jumlah produk minimal 1."
      );
    }
  }

  private static normalizeCustomerNote(
    value?: string | null
  ) {
    const normalized =
      value?.trim();

    return normalized || null;
  }

  /**
   * ============================================================
   * GET CART
   * ============================================================
   *
   * Repository lama belum include ProductSku pada CartItem.
   * Karena SKU sekarang menjadi data penting untuk cart,
   * query canonical dilakukan di sini.
   */
  static async getCart(
    userId: string
  ) {
    this.validateUserId(userId);

    return prisma.cart.findUnique({
      where: {
        userId,
      },
      include: {
        items: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            product: {
              include: {
                category: true,
                images: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
            sku: {
              include: {
                skuOptions: {
                  include: {
                    variantOption: {
                      include: {
                        group: true,
                      },
                    },
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * GET OR CREATE CART
   * ============================================================
   */
  static async getOrCreateCart(
    userId: string
  ) {
    this.validateUserId(userId);

    const existingCart =
      await this.getCart(userId);

    if (existingCart) {
      return existingCart;
    }

    try {
      await CartRepository.create(
        userId
      );
    } catch (error) {
      if (
        !(
          error instanceof
          Prisma.PrismaClientKnownRequestError
        ) ||
        error.code !== "P2002"
      ) {
        throw error;
      }
    }

    return this.getCart(userId);
  }

  /**
   * ============================================================
   * ITEM COUNT
   * ============================================================
   */
  static async getItemCount(
    userId: string
  ) {
    if (!userId?.trim()) {
      return 0;
    }

    return CartRepository.countItems(
      userId
    );
  }

  /**
   * ============================================================
   * GET ACTIVE PRODUCT
   * ============================================================
   *
   * Product.stock hanya dipakai jika product tidak mempunyai
   * active SKU.
   */
  private static async getAvailableProduct(
    tx: Prisma.TransactionClient,
    productId: string
  ) {
    const product =
      await tx.product.findFirst({
        where: {
          id: productId,
          deletedAt: null,
          isPublished: true,
        },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          skus: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              sku: true,
              price: true,
              stock: true,
              isActive: true,
            },
          },
        },
      });

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan atau tidak tersedia."
      );
    }

    return product;
  }

  /**
   * ============================================================
   * RESOLVE SELLABLE STOCK / SKU
   * ============================================================
   */
  private static async resolveSku(
    tx: Prisma.TransactionClient,
    input: {
      productId: string;
      skuId?: string | null;
    }
  ) {
    const {
      productId,
      skuId,
    } = input;

    const product =
      await this.getAvailableProduct(
        tx,
        productId
      );

    /**
     * Product dengan active SKU wajib memilih SKU.
     */
    if (
      product.skus.length > 0 &&
      !skuId
    ) {
      throw new Error(
        "Silakan pilih varian produk terlebih dahulu."
      );
    }

    /**
     * Product tanpa SKU tetap didukung selama migration.
     */
    if (!skuId) {
      return {
        product,
        sku: null,
      };
    }

    const sku =
      await tx.productSku.findFirst({
        where: {
          id: skuId,
          productId,
          isActive: true,
        },
        select: {
          id: true,
          sku: true,
          price: true,
          stock: true,
          isActive: true,
        },
      });

    if (!sku) {
      throw new Error(
        "SKU produk tidak ditemukan atau sudah tidak tersedia."
      );
    }

    return {
      product,
      sku,
    };
  }

  /**
   * ============================================================
   * VALIDATE FLASH SALE QUOTA
   * ============================================================
   */
  private static validateFlashSaleQuota(
    flashSaleItem: {
      stockLimit: number;
      soldQuantity: number;
      perUserLimit: number | null;
    } | null,
    quantity: number,
    messagePrefix = "Flash Sale"
  ) {
    if (!flashSaleItem) {
      return;
    }

    const remainingQuota =
      Math.max(
        0,
        flashSaleItem.stockLimit -
          flashSaleItem.soldQuantity
      );

    if (remainingQuota <= 0) {
      throw new Error(
        `Maaf, kuota ${messagePrefix} sudah habis.`
      );
    }

    if (
      quantity >
      remainingQuota
    ) {
      throw new Error(
        `Kuota ${messagePrefix} tidak mencukupi. Sisa kuota: ${remainingQuota}.`
      );
    }

    if (
      flashSaleItem.perUserLimit !== null &&
      quantity >
        flashSaleItem.perUserLimit
    ) {
      throw new Error(
        `Batas pembelian ${messagePrefix} untuk satu customer adalah ${flashSaleItem.perUserLimit} produk.`
      );
    }
  }

  /**
   * ============================================================
   * ADD ITEM
   * ============================================================
   */
  static async addItem({
    userId,
    productId,
    skuId,
    quantity,
    customerNote,
  }: AddCartItemInput) {
    this.validateUserId(userId);

    if (!productId?.trim()) {
      throw new Error(
        "Produk tidak valid."
      );
    }

    this.validateQuantity(quantity);

    const normalizedSkuId =
      skuId?.trim() || null;

    const normalizedCustomerNote =
      this.normalizeCustomerNote(
        customerNote
      );

    const user =
      await prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

    if (!user) {
      throw new Error(
        "Customer tidak ditemukan atau tidak aktif."
      );
    }

    return prisma.$transaction(
      async (tx) => {
        const {
          product,
          sku,
        } =
          await this.resolveSku(
            tx,
            {
              productId,
              skuId:
                normalizedSkuId,
            }
          );

        const availableStock =
          sku?.stock ??
          product.stock;

        if (
          availableStock <= 0
        ) {
          throw new Error(
            `Stok ${product.name} sedang habis.`
          );
        }

        /**
         * Existing cart item diidentifikasi oleh SKU.
         *
         * customerNote BUKAN identitas item.
         */
        const currentCart =
          await tx.cart.upsert({
            where: {
              userId,
            },
            create: {
              userId,
            },
            update: {},
          });

        const existingItem =
          await tx.cartItem.findFirst({
            where: {
              cartId:
                currentCart.id,
              productId:
                product.id,
              skuId:
                normalizedSkuId,
            },
          });

        const newQuantity =
          (existingItem?.quantity ?? 0) +
          quantity;

        if (
          newQuantity >
          availableStock
        ) {
          throw new Error(
            `Jumlah melebihi stok tersedia. Stok ${
              sku?.sku ??
              product.name
            } hanya ${availableStock}.`
          );
        }

        /**
         * Harga canonical berasal dari SKU.
         *
         * Untuk product tanpa SKU, fallback Product.price masih
         * diperbolehkan selama migration.
         */
        const pricing =
  await ProductPricingService.resolve(
    tx,
    {
      productId:
        product.id,

      skuId:
        normalizedSkuId,

      /**
       * Jika item sudah ada di Cart,
       * pertahankan FlashSaleItem yang sebelumnya
       * dipilih sebagai preferred candidate.
       *
       * ProductPricingService tetap melakukan validasi ulang
       * terhadap status, waktu, SKU, dan quota Flash Sale.
       */
      preferredFlashSaleItemId:
        existingItem?.flashSaleItemId ??
        null,

      fallbackPrice:
        product.price,
    }
  );

        if (existingItem) {
          return tx.cartItem.update({
            where: {
              id:
                existingItem.id,
            },
            data: {
              quantity:
                newQuantity,

              /**
               * Note baru hanya menggantikan note jika dikirim.
               * Note lama tidak dihapus hanya karena request tidak
               * membawa note.
               */
              ...(normalizedCustomerNote !==
              null
                ? {
                    customerNote:
                      normalizedCustomerNote,
                  }
                : {}),

              price:
                pricing.finalPrice,

              isFlashSaleApplied:
                pricing.isFlashSaleApplied,

              flashSaleId:
                pricing.flashSaleId,

              flashSaleItemId:
                pricing.flashSaleItemId,
            },
          });
        }

        return tx.cartItem.create({
          data: {
            cartId:
              currentCart.id,

            productId:
              product.id,

            /**
             * Canonical SKU.
             */
            skuId:
              normalizedSkuId,

            /**
             * Legacy fields sengaja tidak diisi.
             *
             * productVariant
             * productWeight
             * weightSku
             *
             * bukan lagi sumber kebenaran.
             */

            customerNote:
              normalizedCustomerNote,

            quantity,

            price:
              pricing.finalPrice,

            isFlashSaleApplied:
              pricing.isFlashSaleApplied,

            flashSaleId:
              pricing.flashSaleId,

            flashSaleItemId:
              pricing.flashSaleItemId,
          },
        });
      }
    );
  }

  /**
   * ============================================================
   * UPDATE ITEM QUANTITY
   * ============================================================
   *
   * quantity adalah FINAL quantity.
   *
   * Harga dihitung ulang karena Product Discount / Flash Sale
   * dapat berubah sejak item masuk cart.
   */
  static async updateItem({
    userId,
    cartItemId,
    quantity,
  }: UpdateCartItemInput) {
    this.validateUserId(userId);
    this.validateCartItemId(cartItemId);
    this.validateQuantity(quantity);

    const cartItem =
      await CartRepository.findItemById(
        cartItemId
      );

    if (!cartItem) {
      throw new Error(
        "Item keranjang tidak ditemukan."
      );
    }

    if (
      cartItem.cart.userId !==
      userId
    ) {
      throw new Error(
        "Anda tidak memiliki akses ke item keranjang ini."
      );
    }

    await prisma.$transaction(
      async (tx) => {
        const {
          product,
          sku,
        } =
          await this.resolveSku(
            tx,
            {
              productId:
                cartItem.productId,
              skuId:
                cartItem.skuId,
            }
          );

        const availableStock =
          sku?.stock ??
          product.stock;

        if (
          availableStock <= 0
        ) {
          throw new Error(
            `Stok ${
              sku?.sku ??
              product.name
            } sedang habis.`
          );
        }

                if (
          quantity >
          availableStock
        ) {
          throw new Error(
            `Jumlah melebihi stok tersedia. Stok ${
              sku?.sku ??
              product.name
            } hanya ${availableStock}.`
          );
        }

        /**
         * ======================================================
         * RESOLVE CANONICAL PRICING
         * ======================================================
         *
         * ProductPricingService menjadi satu-satunya sumber
         * untuk menentukan Flash Sale dan harga final.
         *
         * CartItem.flashSaleItemId digunakan sebagai
         * preferred candidate agar Flash Sale yang sebelumnya
         * dipakai oleh CartItem tetap dipertahankan selama
         * masih valid.
         */
        const pricing =
          await ProductPricingService.resolve(
            tx,
            {
              productId:
                product.id,

              skuId:
                cartItem.skuId,

              preferredFlashSaleItemId:
                cartItem.flashSaleItemId,

              fallbackPrice:
                product.price,
            }
          );

        /**
         * ======================================================
         * VALIDATE FINAL FLASH SALE QUOTA
         * ======================================================
         */
        if (
          pricing.isFlashSaleApplied &&
          pricing.flashSaleItemId
        ) {
          const selectedFlashSaleItem =
            await tx.flashSaleItem.findUnique({
              where: {
                id:
                  pricing.flashSaleItemId,
              },

              select: {
                stockLimit: true,

                soldQuantity: true,

                perUserLimit: true,
              },
            });

          if (!selectedFlashSaleItem) {
            throw new Error(
              "Flash Sale yang digunakan untuk pricing tidak ditemukan."
            );
          }

          this.validateFlashSaleQuota(
            selectedFlashSaleItem,
            quantity
          );
        }

        /**
         * ======================================================
         * UPDATE CART ITEM
         * ======================================================
         */
        await tx.cartItem.update({
          where: {
            id:
              cartItemId,
          },

          data: {
            quantity,

            price:
              pricing.finalPrice,

            isFlashSaleApplied:
              pricing.isFlashSaleApplied,

            flashSaleId:
              pricing.flashSaleId,

            flashSaleItemId:
              pricing.flashSaleItemId,
          },
        });
      }
    );

    return this.getCart(userId);
  }

  /**
   * ============================================================
   * UPDATE ITEM QUANTITY
   * ============================================================
   */
  static async updateItemQuantity(
    userId: string,
    cartItemId: string,
    quantity: number
  ) {
    try {
      await this.updateItem({
        userId,
        cartItemId,
        quantity,
      });

      return {
        success: true,
        message:
          "Jumlah produk berhasil diperbarui.",
      };
    } catch (error) {
      console.error(
        "[CART_UPDATE_QUANTITY_ERROR]",
        error
      );

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui jumlah produk.",
      };
    }
  }

  /**
   * ============================================================
   * REMOVE ITEM
   * ============================================================
   */
  static async removeItem({
    userId,
    cartItemId,
  }: RemoveCartItemInput) {
    this.validateUserId(userId);
    this.validateCartItemId(
      cartItemId
    );

    const cartItem =
      await CartRepository.findItemById(
        cartItemId
      );

    if (!cartItem) {
      throw new Error(
        "Item keranjang tidak ditemukan."
      );
    }

    if (
      cartItem.cart.userId !==
      userId
    ) {
      throw new Error(
        "Anda tidak memiliki akses ke item keranjang ini."
      );
    }

    await CartRepository.deleteItem(
      cartItemId
    );

    return this.getCart(userId);
  }

  /**
   * ============================================================
   * DELETE ITEM
   * ============================================================
   */
  static async deleteItem(
    userId: string,
    cartItemId: string
  ) {
    try {
      await this.removeItem({
        userId,
        cartItemId,
      });

      return {
        success: true,
        message:
          "Produk berhasil dihapus dari keranjang.",
      };
    } catch (error) {
      console.error(
        "[CART_DELETE_ITEM_ERROR]",
        error
      );

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal menghapus produk dari keranjang.",
      };
    }
  }

  /**
   * ============================================================
   * CLEAR CART
   * ============================================================
   */
  static async clearCart(
    userId: string
  ) {
    this.validateUserId(userId);

    const cart =
      await prisma.cart.findUnique({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      });

    if (!cart) {
      return null;
    }

    await CartRepository.clear(
      cart.id
    );

    return this.getCart(userId);
  }

  /**
   * ============================================================
   * CALCULATE CART TOTAL
   * ============================================================
   */
  static calculateTotal(
    cart:
      | {
          items: Array<{
            quantity: number;
            price: Prisma.Decimal;
          }>;
        }
      | null
  ) {
    if (!cart) {
      return new Prisma.Decimal(0);
    }

    return cart.items.reduce(
      (
        total,
        item
      ) =>
        total.add(
          item.price.mul(
            item.quantity
          )
        ),
      new Prisma.Decimal(0)
    );
  }
}
