import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import CartRepository from "@/repositories/cart/cart.repository";

import ProductPricingService from "@/services/pricing/product-pricing.service";

import { CartError } from "@/services/cart/cart.error";

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

/**
 * ============================================================
 * TYPES
 * ============================================================
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

/**
 * ============================================================
 * CART SERVICE
 * ============================================================
 */

export default class CartService {
  /**
   * ============================================================
   * VALIDATE USER ID
   * ============================================================
   */

  private static validateUserId(
    userId: string
  ) {
    if (!userId?.trim()) {
      throw new CartError(
        "INVALID_USER",
        "Customer tidak valid."
      );
    }
  }

  /**
   * ============================================================
   * VALIDATE CART ITEM ID
   * ============================================================
   */

  private static validateCartItemId(
    cartItemId: string
  ) {
    if (!cartItemId?.trim()) {
      throw new CartError(
        "INVALID_CART_ITEM",
        "Item keranjang tidak valid."
      );
    }
  }

  /**
   * ============================================================
   * VALIDATE QUANTITY
   * ============================================================
   */

  private static validateQuantity(
    quantity: number
  ) {
    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new CartError(
        "INVALID_QUANTITY",
        "Jumlah produk minimal 1."
      );
    }
  }

  /**
   * ============================================================
   * NORMALIZE CUSTOMER NOTE
   * ============================================================
   */

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
   * Query canonical Cart + Product + ProductSku.
   *
   * Legacy fields tetap dapat dibaca dari database untuk
   * compatibility, tetapi tidak digunakan sebagai sumber
   * kebenaran identity.
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
   *
   * Mengembalikan jumlah BARIS item di cart.
   *
   * Contoh:
   *
   * Product A - SKU 500gr
   * Product A - SKU 1kg
   * Product B - SKU 500gr
   *
   * Hasil = 3
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
      throw new CartError(
        "PRODUCT_NOT_AVAILABLE",
        "Produk tidak ditemukan atau tidak tersedia."
      );
    }

    return product;
  }

  /**
   * ============================================================
   * RESOLVE SELLABLE STOCK / SKU
   * ============================================================
   *
   * Rules:
   *
   * 1. Product memiliki active SKU
   *    → skuId wajib diberikan.
   *
   * 2. Product tidak memiliki active SKU
   *    → skuId boleh null selama migration.
   *
   * 3. skuId harus benar-benar milik product yang diminta.
   *
   * 4. SKU harus aktif.
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
      throw new CartError(
        "SKU_REQUIRED",
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

    /**
     * SKU harus:
     *
     * - benar-benar ada
     * - milik product
     * - aktif
     */

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
      throw new CartError(
        "SKU_NOT_AVAILABLE",
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
   *
   * quantity yang diterima method ini adalah FINAL quantity.
   *
   * Jangan menambahkan quantity existing item lagi.
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

    /**
     * Flash Sale quota habis.
     */

    if (remainingQuota <= 0) {
      throw new CartError(
        "FLASH_SALE_QUOTA_EXHAUSTED",
        `Maaf, kuota ${messagePrefix} sudah habis.`
      );
    }

    /**
     * Quantity melebihi remaining quota.
     */

    if (
      quantity >
      remainingQuota
    ) {
      throw new CartError(
        "FLASH_SALE_QUOTA_INSUFFICIENT",
        `Kuota ${messagePrefix} tidak mencukupi. Sisa kuota: ${remainingQuota}.`
      );
    }

    /**
     * Per-user limit.
     */

    if (
      flashSaleItem.perUserLimit !== null &&
      quantity >
        flashSaleItem.perUserLimit
    ) {
      throw new CartError(
        "FLASH_SALE_USER_LIMIT",
        `Batas pembelian ${messagePrefix} untuk satu customer adalah ${flashSaleItem.perUserLimit} produk.`
      );
    }
  }

  /**
   * ============================================================
   * ADD ITEM
   * ============================================================
   *
   * Canonical identity:
   *
   *   cartId + productId + skuId
   *
   * customerNote BUKAN identity.
   */

static async addItem({
  userId,
  productId,
  skuId,
  quantity,
  customerNote,
}: AddCartItemInput) {
  this.validateUserId(userId);

  /**
   * Product ID wajib valid.
   */
  if (!productId?.trim()) {
    throw new CartError(
      "PRODUCT_NOT_AVAILABLE",
      "Produk tidak valid."
    );
  }

  this.validateQuantity(quantity);

  const normalizedSkuId = skuId?.trim() || null;
  const normalizedCustomerNote =
    this.normalizeCustomerNote(customerNote);

  /**
   * Pastikan customer masih aktif.
   */
  const user = await prisma.user.findFirst({
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
    throw new CartError(
      "INVALID_USER",
      "Customer tidak ditemukan atau tidak aktif."
    );
  }

  /**
   * ============================================================
   * CONCURRENCY CONTROL
   * ============================================================
   *
   * ADD bersifat incremental:
   *
   *   current quantity + requested quantity
   *
   * Karena beberapa request ADD dapat datang secara bersamaan,
   * kita harus memastikan pembacaan dan perubahan quantity
   * dilakukan secara serialized pada level Cart.
   *
   * PostgreSQL row-level lock pada Cart digunakan sebagai
   * serialization point untuk seluruh operasi ADD dalam cart
   * customer yang sama.
   *
   * Dengan demikian:
   *
   *   Request A -> lock Cart -> baca quantity -> update -> commit
   *   Request B -> menunggu lock Cart
   *             -> baca quantity terbaru -> update -> commit
   *
   * Unique constraint CartItem tetap menjadi protection layer
   * untuk canonical identity:
   *
   *   cartId + productId + skuId
   *
   * Retry P2002 tetap dipertahankan sebagai defensive layer
   * terhadap unique constraint race yang mungkin terjadi pada
   * kondisi tertentu.
   */
  const MAX_CONCURRENCY_RETRIES = 5;

  for (
    let attempt = 0;
    attempt <= MAX_CONCURRENCY_RETRIES;
    attempt++
  ) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          /**
           * ======================================================
           * RESOLVE PRODUCT + SKU
           * ======================================================
           */
          const { product, sku } = await this.resolveSku(tx, {
            productId,
            skuId: normalizedSkuId,
          });

          /**
           * ======================================================
           * STOCK CANONICAL
           * ======================================================
           *
           * Jika menggunakan SKU:
           *   gunakan sku.stock
           *
           * Jika product belum menggunakan SKU:
           *   gunakan product.stock
           */
          const availableStock =
            sku?.stock ?? product.stock;

          /**
           * Stock habis.
           */
          if (availableStock <= 0) {
            throw new CartError(
              "OUT_OF_STOCK",
              `Stok ${sku?.sku ?? product.name} sedang habis.`
            );
          }

          /**
           * ======================================================
           * GET / CREATE CART
           * ======================================================
           *
           * Cart bersifat unique berdasarkan userId.
           */
          const currentCart = await tx.cart.upsert({
            where: {
              userId,
            },
            create: {
              userId,
            },
            update: {},
          });

          /**
           * ======================================================
           * CART-LEVEL ROW LOCK
           * ======================================================
           *
           * Cart digunakan sebagai serialization point.
           *
           * Semua concurrent ADD untuk customer yang sama
           * akan diproses satu per satu.
           *
           * Penting:
           * Lock dilakukan SEBELUM membaca CartItem.
           *
           * Jadi request berikutnya tidak akan membaca quantity
           * lama ketika request sebelumnya masih melakukan
           * update.
           */
          await tx.$queryRaw`
            SELECT "id"
            FROM "Cart"
            WHERE "id" = ${currentCart.id}
            FOR UPDATE
          `;

          /**
           * ======================================================
           * FIND EXISTING CART ITEM
           * ======================================================
           *
           * Dilakukan setelah Cart terkunci.
           *
           * Canonical identity:
           *
           *   cartId + productId + skuId
           *
           * customerNote BUKAN identity.
           */
          const existingItem =
            await tx.cartItem.findFirst({
              where: {
                cartId: currentCart.id,
                productId: product.id,
                skuId: normalizedSkuId,
              },
            });

          /**
           * ======================================================
           * CALCULATE FINAL QUANTITY
           * ======================================================
           *
           * ADD bersifat incremental.
           *
           * Contoh:
           *
           * current = 3
           * request = 2
           * result = 5
           */
          const newQuantity =
            (existingItem?.quantity ?? 0) + quantity;

          /**
           * ======================================================
           * STOCK VALIDATION
           * ======================================================
           *
           * Validasi dilakukan terhadap FINAL quantity.
           */
          if (newQuantity > availableStock) {
            throw new CartError(
              "INSUFFICIENT_STOCK",
              `Jumlah melebihi stok tersedia. Stok ${
                sku?.sku ?? product.name
              } hanya ${availableStock}.`
            );
          }

          /**
           * ======================================================
           * CANONICAL PRICING
           * ======================================================
           *
           * ProductPricingService tetap menjadi sumber kebenaran
           * seluruh pricing Cart.
           */
          const pricing =
            await ProductPricingService.resolve(tx, {
              productId: product.id,
              skuId: normalizedSkuId,

              /**
               * Jika item sudah memiliki Flash Sale,
               * pertahankan sebagai preferred candidate
               * selama masih valid.
               */
              preferredFlashSaleItemId:
                existingItem?.flashSaleItemId ?? null,

              fallbackPrice: product.price,
            });

          /**
           * ======================================================
           * UPDATE EXISTING ITEM
           * ======================================================
           */
          if (existingItem) {
            return tx.cartItem.update({
              where: {
                id: existingItem.id,
              },
              data: {
                quantity: newQuantity,

                /**
                 * Note baru hanya menggantikan note jika
                 * request memang mengirim note.
                 *
                 * Jika tidak ada note:
                 * pertahankan note sebelumnya.
                 */
                ...(normalizedCustomerNote !== null
                  ? {
                      customerNote:
                        normalizedCustomerNote,
                    }
                  : {}),

                /**
                 * Pricing snapshot.
                 */
                price: pricing.finalPrice,
                isFlashSaleApplied:
                  pricing.isFlashSaleApplied,
                flashSaleId: pricing.flashSaleId,
                flashSaleItemId:
                  pricing.flashSaleItemId,
              },
            });
          }

          /**
           * ======================================================
           * CREATE NEW ITEM
           * ======================================================
           *
           * Legacy fields sengaja tidak digunakan.
           *
           * Canonical identity:
           *
           *   cartId + productId + skuId
           */
          return tx.cartItem.create({
            data: {
              cartId: currentCart.id,
              productId: product.id,

              /**
               * Canonical SKU.
               */
              skuId: normalizedSkuId,

              /**
               * Legacy fields:
               *
               *   productVariant
               *   productWeight
               *   weightSku
               *
               * tidak lagi digunakan sebagai identity.
               */
              customerNote:
                normalizedCustomerNote,

              quantity,

              /**
               * Final price snapshot.
               */
              price: pricing.finalPrice,

              /**
               * Flash Sale snapshot.
               */
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
    } catch (error) {
      /**
       * ==========================================================
       * HANDLE CONCURRENCY P2002
       * ==========================================================
       *
       * P2002 dapat terjadi apabila terdapat unique constraint
       * conflict pada transaksi concurrent.
       *
       * Cart-level locking seharusnya mencegah race normal
       * pada CartItem, tetapi unique constraint database tetap
       * menjadi protection layer terakhir.
       *
       * Hanya P2002 yang boleh masuk retry.
       * CartError dan error lainnya langsung diteruskan.
       */
      const isUniqueConstraintError =
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (
        !isUniqueConstraintError ||
        attempt === MAX_CONCURRENCY_RETRIES
      ) {
        throw error;
      }

      /**
       * Exponential backoff sederhana.
       *
       * attempt 0 -> 10 ms
       * attempt 1 -> 20 ms
       * attempt 2 -> 30 ms
       * attempt 3 -> 40 ms
       * attempt 4 -> 50 ms
       */
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          10 * (attempt + 1)
        )
      );
    }
  }

  /**
   * Secara normal tidak pernah tercapai karena setiap attempt
   * akan menghasilkan return atau throw.
   */
  throw new Error(
    "Unexpected addItem retry termination."
  );
}
  /**
   * ============================================================
   * UPDATE ITEM QUANTITY
   * ============================================================
   *
   * quantity adalah FINAL quantity.
   *
   * Contoh:
   *
   * current = 3
   * request = 5
   *
   * hasil = 5
   *
   * BUKAN 3 + 5.
   */

static async updateItem({
  userId,
  cartItemId,
  quantity,
}: UpdateCartItemInput) {
  this.validateUserId(
    userId
  );

  this.validateCartItemId(
    cartItemId
  );

  this.validateQuantity(
    quantity
  );

  /**
   * ============================================================
   * UPDATE CART ITEM
   * ============================================================
   *
   * Seluruh proses dilakukan dalam satu transaction.
   *
   * Cart di-lock menggunakan FOR UPDATE agar concurrent
   * mutation terhadap cart yang sama diserialisasikan.
   *
   * Quantity di sini adalah FINAL quantity, bukan additive.
   *
   * ============================================================
   */

  await prisma.$transaction(
    async (tx) => {
      /**
       * ==========================================================
       * FIND CART ITEM
       * ==========================================================
       *
       * Lookup dilakukan di dalam transaction agar state item
       * yang digunakan untuk update merupakan state yang dibaca
       * pada transaction yang sama.
       */

      const cartItem =
        await tx.cartItem.findUnique({
          where: {
            id:
              cartItemId,
          },

          select: {
            id: true,

            cartId: true,

            productId: true,

            skuId: true,

            flashSaleItemId: true,

            cart: {
              select: {
                userId: true,
              },
            },
          },
        });

      /**
       * Item tidak ditemukan.
       */

      if (!cartItem) {
        throw new CartError(
          "INVALID_CART_ITEM",
          "Item keranjang tidak ditemukan."
        );
      }

      /**
       * ==========================================================
       * LOCK CART
       * ==========================================================
       *
       * Cart adalah parent dari seluruh CartItem milik user.
       *
       * Lock ini memastikan dua mutation concurrent terhadap
       * cart yang sama tidak berjalan bebas satu sama lain.
       *
       * Pola ini sama dengan protection yang sudah terbukti
       * berhasil pada addItem().
       */

      await tx.$queryRaw`
        SELECT "id"
        FROM "Cart"
        WHERE "id" = ${cartItem.cartId}
        FOR UPDATE
      `;

const currentItem = await tx.cartItem.findUnique({
  where: {
    id: cartItem.id,
  },
  select: {
    id: true,
    cartId: true,
    productId: true,
    skuId: true,
    flashSaleItemId: true,
  },
});

if (!currentItem) {
  throw new CartError(
    "INVALID_CART_ITEM",
    "Cart item tidak ditemukan."
  );
}

if (currentItem.cartId !== cartItem.cartId) {
  throw new CartError(
    "INVALID_CART_ITEM",
    "Cart item tidak valid."
  );
}

      /**
       * ==========================================================
       * OWNERSHIP VALIDATION
       * ==========================================================
       */

      if (
        cartItem.cart.userId !==
        userId
      ) {
        throw new CartError(
          "INVALID_CART_ITEM",
          "Anda tidak memiliki akses ke item keranjang ini."
        );
      }

      /**
       * ==========================================================
       * RE-RESOLVE PRODUCT + SKU
       * ==========================================================
       *
       * Product/SKU wajib divalidasi ulang karena kondisi produk
       * dapat berubah setelah item masuk ke cart.
       */

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

      /**
       * ==========================================================
       * STOCK CANONICAL
       * ==========================================================
       */

      const availableStock =
        sku?.stock ??
        product.stock;

      /**
       * ==========================================================
       * STOCK HABIS
       * ==========================================================
       */

      if (
        availableStock <= 0
      ) {
        throw new CartError(
          "OUT_OF_STOCK",
          `Stok ${
            sku?.sku ??
            product.name
          } sedang habis.`
        );
      }

      /**
       * ==========================================================
       * FINAL QUANTITY VALIDATION
       * ==========================================================
       *
       * quantity adalah FINAL quantity.
       */

      if (
        quantity >
        availableStock
      ) {
        throw new CartError(
          "INSUFFICIENT_STOCK",
          `Jumlah melebihi stok tersedia. Stok ${
            sku?.sku ??
            product.name
          } hanya ${availableStock}.`
        );
      }

      /**
       * ==========================================================
       * RESOLVE CANONICAL PRICING
       * ==========================================================
       *
       * Harga cart adalah snapshot.
       * Namun setiap update harus menghitung ulang pricing
       * agar perubahan harga / promotion / flash sale tetap
       * diperhitungkan.
       */

      const pricing =
        await ProductPricingService.resolve(
          tx,
          {
            productId:
              product.id,

            skuId:
              cartItem.skuId,

            /**
             * Pertahankan Flash Sale sebelumnya jika masih valid.
             */

            preferredFlashSaleItemId:
              cartItem.flashSaleItemId,

            fallbackPrice:
              product.price,
          }
        );

      /**
       * ==========================================================
       * VALIDATE FINAL FLASH SALE QUOTA
       * ==========================================================
       *
       * Cart tidak melakukan reservation Flash Sale.
       *
       * Di sini kita hanya memastikan FINAL quantity masih
       * memenuhi quota Flash Sale yang sedang dipakai.
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

        if (
          !selectedFlashSaleItem
        ) {
          throw new CartError(
            "FLASH_SALE_QUOTA_EXHAUSTED",
            "Flash Sale yang digunakan untuk pricing tidak ditemukan."
          );
        }

        this.validateFlashSaleQuota(
          selectedFlashSaleItem,
          quantity
        );
      }

      /**
       * ==========================================================
       * UPDATE CART ITEM
       * ==========================================================
       */

      await tx.cartItem.update({
        where: {
          id:
            cartItemId,
        },

        data: {
          /**
           * FINAL quantity.
           */

          quantity,

          /**
           * Final pricing snapshot.
           */

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

  /**
   * ============================================================
   * RETURN CANONICAL CART
   * ============================================================
   *
   * Setelah transaction selesai, ambil ulang cart agar response
   * selalu menggunakan DTO/state terbaru.
   */

  return this.getCart(
    userId
  );
}

  /**
   * ============================================================
   * UPDATE ITEM QUANTITY - LEGACY WRAPPER
   * ============================================================
   *
   * Method ini dipertahankan agar service lama tidak langsung
   * rusak.
   *
   * API mobile sebaiknya menggunakan updateItem().
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
  this.validateUserId(
    userId
  );

  this.validateCartItemId(
    cartItemId
  );

  /**
   * ============================================================
   * REMOVE CART ITEM
   * ============================================================
   *
   * Seluruh proses dilakukan dalam satu transaction.
   *
   * Cart di-lock menggunakan FOR UPDATE agar mutation
   * terhadap cart yang sama diserialisasikan.
   *
   * Dengan demikian removeItem() aman terhadap concurrent:
   *
   *   - addItem()
   *   - updateItem()
   *   - removeItem()
   *
   * ============================================================
   */

  await prisma.$transaction(
    async (tx) => {
      /**
       * ==========================================================
       * FIND CART ITEM
       * ==========================================================
       *
       * Lookup dilakukan di dalam transaction.
       */
      const cartItem =
        await tx.cartItem.findUnique({
          where: {
            id:
              cartItemId,
          },

          select: {
            id: true,

            cartId: true,

            cart: {
              select: {
                userId: true,
              },
            },
          },
        });

      /**
       * Item tidak ditemukan.
       */
      if (!cartItem) {
        throw new CartError(
          "INVALID_CART_ITEM",
          "Item keranjang tidak ditemukan."
        );
      }

      /**
       * ==========================================================
       * LOCK CART
       * ==========================================================
       *
       * Cart menjadi serialization point untuk seluruh
       * mutation terhadap cart milik customer yang sama.
       *
       * Lock dilakukan sebelum DELETE.
       */
      await tx.$queryRaw`
        SELECT "id"
        FROM "Cart"
        WHERE "id" = ${cartItem.cartId}
        FOR UPDATE
      `;

      /**
       * ==========================================================
       * OWNERSHIP VALIDATION
       * ==========================================================
       */
      if (
        cartItem.cart.userId !==
        userId
      ) {
        throw new CartError(
          "INVALID_CART_ITEM",
          "Anda tidak memiliki akses ke item keranjang ini."
        );
      }

      /**
       * ==========================================================
       * RE-CHECK CART ITEM
       * ==========================================================
       *
       * Setelah Cart terkunci, baca kembali item.
       *
       * Ini penting untuk memastikan item yang akan dihapus
       * masih ada setelah menunggu concurrent mutation.
       */
      const currentItem =
        await tx.cartItem.findUnique({
          where: {
            id:
              cartItemId,
          },

          select: {
            id: true,

            cartId: true,
          },
        });

      if (!currentItem) {
        throw new CartError(
          "INVALID_CART_ITEM",
          "Item keranjang tidak ditemukan."
        );
      }

      /**
       * Pastikan item masih berada pada Cart yang sama.
       */
      if (
        currentItem.cartId !==
        cartItem.cartId
      ) {
        throw new CartError(
          "INVALID_CART_ITEM",
          "Item keranjang tidak valid."
        );
      }

      /**
       * ==========================================================
       * DELETE
       * ==========================================================
       */
      await tx.cartItem.delete({
        where: {
          id:
            cartItemId,
        },
      });
    }
  );

  /**
   * Setelah transaction selesai, ambil ulang cart agar response
   * selalu menggunakan DTO/state terbaru.
   */
  return this.getCart(
    userId
  );
}

  /**
   * ============================================================
   * DELETE ITEM - LEGACY WRAPPER
   * ============================================================
   *
   * Dipertahankan untuk compatibility dengan caller lama.
   *
   * API mobile menggunakan removeItem().
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

  await prisma.$transaction(
    async (tx) => {
      /**
       * ==========================================================
       * FIND CART
       * ==========================================================
       */
      const cart =
        await tx.cart.findUnique({
          where: {
            userId,
          },
          select: {
            id: true,
          },
        });

      /**
       * Cart belum pernah dibuat.
       *
       * Tidak ada yang perlu dihapus.
       */
      if (!cart) {
        return;
      }

      /**
       * ==========================================================
       * LOCK CART
       * ==========================================================
       *
       * Cart menjadi serialization point untuk seluruh
       * mutation terhadap cart milik customer yang sama.
       *
       * Dengan lock ini, clearCart() akan terserialisasi
       * terhadap addItem(), updateItem(), dan removeItem().
       */
      await tx.$queryRaw`
        SELECT "id"
        FROM "Cart"
        WHERE "id" = ${cart.id}
        FOR UPDATE
      `;

      /**
       * ==========================================================
       * CLEAR CART ITEMS
       * ==========================================================
       *
       * Jangan menggunakan CartRepository.clear() di sini
       * karena repository menggunakan global prisma dan tidak
       * ikut dalam transaction ini.
       */
      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });
    }
  );

  return this.getCart(
    userId
  );
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
      return new Prisma.Decimal(
        0
      );
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

      new Prisma.Decimal(
        0
      )
    );
  }
}
