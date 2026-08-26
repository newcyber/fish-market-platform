import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import FlashSaleRepository from "@/repositories/flash-sale/flash-sale.repository";

/**
 * ============================================================
 * FLASH SALE ITEM SERVICE
 * ============================================================
 *
 * Business logic untuk item di dalam Flash Sale campaign.
 *
 * Canonical sellable unit:
 *
 *   Product
 *      ↓
 *   ProductSku
 *      ↓
 *   FlashSaleItem
 *
 * Legacy weightOptionId masih dipertahankan di database untuk
 * kebutuhan migration, tetapi application service baru tidak
 * lagi menggunakan weight option sebagai sumber kebenaran.
 *
 * Responsibilities:
 * - List item
 * - Get item
 * - Create item
 * - Update item
 * - Delete item
 * - Validasi Flash Sale
 * - Validasi Product
 * - Validasi Product SKU
 * - Duplicate protection
 * - Price validation
 * - Stock validation
 * - Per-user limit validation
 * - Sold quantity protection
 * - Campaign lifecycle protection
 *
 * ============================================================
 */

/**
 * ============================================================
 * CREATE FLASH SALE ITEM INPUT
 * ============================================================
 */
export interface CreateFlashSaleItemInput {
  productId: string;

  /**
   * Canonical sellable SKU.
   */
  skuId: string;

  /**
   * Legacy compatibility.
   *
   * Nilai ini tidak lagi menjadi sumber harga.
   * Harga normal selalu diambil dari ProductSku.price.
   *
   * Tetap optional agar caller lama yang masih mengirim field
   * ini tidak langsung rusak selama migration.
   */
  originalPrice?: number;

  flashPrice: number;

  stockLimit: number;

  perUserLimit?: number;

  isActive?: boolean;

  sortOrder?: number;
}

/**
 * ============================================================
 * UPDATE FLASH SALE ITEM INPUT
 * ============================================================
 */
export interface UpdateFlashSaleItemInput {
  productId?: string;

  /**
   * Jika dikirim, SKU akan diganti.
   * Jika undefined, SKU existing dipertahankan.
   */
  skuId?: string;

  /**
   * Legacy compatibility only.
   *
   * Tidak digunakan sebagai sumber harga canonical.
   */
  originalPrice?: number;

  flashPrice?: number;

  stockLimit?: number;

  perUserLimit?: number;

  isActive?: boolean;

  sortOrder?: number;
}

/**
 * ============================================================
 * INTERNAL SKU TYPE
 * ============================================================
 */
type ProductSkuRecord = {
  id: string;
  productId: string;
  sku: string;
  price: Prisma.Decimal;
  stock: number;
  isActive: boolean;
};

/**
 * ============================================================
 * FLASH SALE ITEM SERVICE
 * ============================================================
 */
export default class FlashSaleItemService {
  /**
   * ==========================================================
   * VALIDATE NUMBER
   * ==========================================================
   */
  private static validateNumber(
    value: number,
    fieldName: string
  ) {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value)
    ) {
      throw new Error(
        `${fieldName} harus berupa angka yang valid.`
      );
    }

    return value;
  }

  /**
   * ==========================================================
   * VALIDATE INTEGER
   * ==========================================================
   */
  private static validateInteger(
    value: number,
    fieldName: string,
    minimum = 0
  ) {
    if (!Number.isInteger(value)) {
      throw new Error(
        `${fieldName} harus berupa angka bulat.`
      );
    }

    if (value < minimum) {
      throw new Error(
        `${fieldName} tidak boleh kurang dari ${minimum}.`
      );
    }

    return value;
  }

  /**
   * ==========================================================
   * ENSURE FLASH SALE EXISTS
   * ==========================================================
   */
  private static async ensureFlashSaleExists(
    flashSaleId: string
  ) {
    if (!flashSaleId?.trim()) {
      throw new Error(
        "Flash Sale ID wajib diisi."
      );
    }

    const flashSale =
      await FlashSaleRepository.findById(
        flashSaleId
      );

    if (!flashSale) {
      throw new Error(
        "Flash Sale tidak ditemukan."
      );
    }

    return flashSale;
  }

  /**
   * ==========================================================
   * ENSURE PRODUCT EXISTS
   * ==========================================================
   */
  private static async ensureProductExists(
    productId: string
  ) {
    const normalizedProductId =
      productId?.trim();

    if (!normalizedProductId) {
      throw new Error(
        "Product ID wajib diisi."
      );
    }

    const product =
      await prisma.product.findFirst({
        where: {
          id: normalizedProductId,
          deletedAt: null,
        },

        select: {
          id: true,
          name: true,
          price: true,
          isPublished: true,
        },
      });

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    return product;
  }

  /**
   * ==========================================================
   * ENSURE PRODUCT SKU EXISTS
   * ==========================================================
   *
   * SKU adalah canonical sellable unit.
   *
   * Validasi:
   * - SKU harus ada
   * - SKU harus aktif
   * - SKU harus milik productId
   *
   * Harga canonical:
   * - sku.price
   *
   * Stock canonical:
   * - sku.stock
   *
   * ==========================================================
   */
  private static async ensureProductSkuExists(
    productId: string,
    skuId: string
  ): Promise<ProductSkuRecord> {
    const normalizedProductId =
      productId?.trim();

    const normalizedSkuId =
      skuId?.trim();

    if (!normalizedProductId) {
      throw new Error(
        "Product ID wajib diisi."
      );
    }

    if (!normalizedSkuId) {
      throw new Error(
        "SKU ID wajib diisi."
      );
    }

    const sku =
      await prisma.productSku.findFirst({
        where: {
          id: normalizedSkuId,
          productId: normalizedProductId,
          isActive: true,
        },

        select: {
          id: true,
          productId: true,
          sku: true,
          price: true,
          stock: true,
          isActive: true,
        },
      });

    if (!sku) {
      throw new Error(
        "SKU tidak ditemukan, tidak aktif, atau bukan milik produk tersebut."
      );
    }

    if (sku.stock < 0) {
      throw new Error(
        "Stock SKU tidak valid."
      );
    }

    return sku;
  }

  /**
   * ==========================================================
   * RESOLVE SKU + PRODUCT
   * ==========================================================
   *
   * Digunakan ketika productId dan skuId datang dari request.
   *
   * ProductId tetap dipertahankan pada FlashSaleItem untuk
   * compatibility dan query existing, tetapi SKU menjadi
   * canonical sellable unit.
   * ==========================================================
   */
  private static async resolveSku(
    productId: string,
    skuId: string
  ) {
    const product =
      await this.ensureProductExists(
        productId
      );

    const sku =
      await this.ensureProductSkuExists(
        product.id,
        skuId
      );

    return {
      product,
      sku,
    };
  }

  /**
   * ==========================================================
   * GET CANONICAL ORIGINAL PRICE
   * ==========================================================
   */
  private static getCanonicalOriginalPrice(
    sku: ProductSkuRecord
  ) {
    const originalPrice =
      Number(sku.price);

    if (
      !Number.isFinite(originalPrice) ||
      originalPrice <= 0
    ) {
      throw new Error(
        "Harga SKU tidak valid."
      );
    }

    return originalPrice;
  }

  /**
   * ==========================================================
   * VALIDATE FLASH PRICE
   * ==========================================================
   */
  private static validateFlashPrice(
    flashPrice: number,
    originalPrice: number
  ) {
    const normalizedFlashPrice =
      this.validateNumber(
        flashPrice,
        "Harga Flash Sale"
      );

    if (normalizedFlashPrice <= 0) {
      throw new Error(
        "Harga Flash Sale harus lebih besar dari 0."
      );
    }

    if (
      normalizedFlashPrice >=
      originalPrice
    ) {
      throw new Error(
        "Harga Flash Sale harus lebih kecil dari harga normal SKU."
      );
    }

    return normalizedFlashPrice;
  }

  /**
   * ==========================================================
   * VALIDATE STOCK LIMIT
   * ==========================================================
   */
  private static validateStockLimit(
    stockLimit: number,
    skuStock: number
  ) {
    const normalizedStockLimit =
      this.validateInteger(
        stockLimit,
        "Stock limit",
        1
      );

    if (
      normalizedStockLimit >
      skuStock
    ) {
      throw new Error(
        `Stock limit Flash Sale tidak boleh lebih besar dari stock SKU (${skuStock}).`
      );
    }

    return normalizedStockLimit;
  }

  /**
   * ==========================================================
   * VALIDATE PER USER LIMIT
   * ==========================================================
   *
   * 0 = tidak ada batas khusus.
   * ==========================================================
   */
  private static validatePerUserLimit(
    perUserLimit: number,
    stockLimit: number
  ) {
    const normalizedPerUserLimit =
      this.validateInteger(
        perUserLimit,
        "Per user limit",
        0
      );

    if (
      normalizedPerUserLimit > 0 &&
      normalizedPerUserLimit >
        stockLimit
    ) {
      throw new Error(
        "Batas pembelian per user tidak boleh lebih besar dari stock limit."
      );
    }

    return normalizedPerUserLimit;
  }

  /**
   * ==========================================================
   * VALIDATE SORT ORDER
   * ==========================================================
   */
  private static validateSortOrder(
    sortOrder: number
  ) {
    return this.validateInteger(
      sortOrder,
      "Sort order",
      0
    );
  }

  /**
   * ==========================================================
   * VALIDATE ACTIVE STATE
   * ==========================================================
   *
   * Item boleh aktif pada:
   * - DRAFT
   * - SCHEDULED
   * - ACTIVE
   *
   * Tidak boleh diaktifkan kembali pada:
   * - ENDED
   * - CANCELLED
   *
   * Untuk campaign ACTIVE, periode harus masih valid.
   * ==========================================================
   */
  private static validateActiveState(
    flashSale: {
      status: string;
      startAt: Date;
      endAt: Date;
    },
    isActive: boolean
  ) {
    if (!isActive) {
      return;
    }

    if (
      flashSale.status === "ENDED" ||
      flashSale.status === "CANCELLED"
    ) {
      throw new Error(
        "Item tidak dapat diaktifkan karena Flash Sale sudah berakhir atau dibatalkan."
      );
    }

    if (
      flashSale.status === "ACTIVE"
    ) {
      const now =
        new Date();

      if (
        now.getTime() <
          flashSale.startAt.getTime() ||
        now.getTime() >=
          flashSale.endAt.getTime()
      ) {
        throw new Error(
          "Item tidak dapat diaktifkan karena periode Flash Sale sudah tidak valid."
        );
      }
    }
  }

  /**
   * ==========================================================
   * GET MANY
   * ==========================================================
   */
  static async getMany(
    flashSaleId: string
  ) {
    await this.ensureFlashSaleExists(
      flashSaleId
    );

    return FlashSaleRepository.findItemsByFlashSaleId(
      flashSaleId
    );
  }

  /**
   * ==========================================================
   * GET BY ID
   * ==========================================================
   */
  static async getById(
    flashSaleId: string,
    itemId: string
  ) {
    await this.ensureFlashSaleExists(
      flashSaleId
    );

    if (!itemId?.trim()) {
      throw new Error(
        "Item Flash Sale ID wajib diisi."
      );
    }

    const item =
      await FlashSaleRepository.findItemById(
        flashSaleId,
        itemId
      );

    if (!item) {
      throw new Error(
        "Item Flash Sale tidak ditemukan."
      );
    }

    return item;
  }

  /**
   * ==========================================================
   * CREATE
   * ==========================================================
   */
  static async create(
    flashSaleId: string,
    input: CreateFlashSaleItemInput
  ) {
    const flashSale =
      await this.ensureFlashSaleExists(
        flashSaleId
      );

    if (!input.productId?.trim()) {
      throw new Error(
        "Product ID wajib diisi."
      );
    }

    if (!input.skuId?.trim()) {
      throw new Error(
        "SKU ID wajib diisi."
      );
    }

    /**
     * --------------------------------------------------------
     * RESOLVE PRODUCT + SKU
     * --------------------------------------------------------
     */
    const productId =
      input.productId.trim();

    const skuId =
      input.skuId.trim();

    const {
      product,
      sku,
    } =
      await this.resolveSku(
        productId,
        skuId
      );

    /**
     * --------------------------------------------------------
     * CANONICAL ORIGINAL PRICE
     * --------------------------------------------------------
     *
     * Jangan percaya originalPrice dari client.
     */
    const originalPrice =
      this.getCanonicalOriginalPrice(
        sku
      );

    /**
     * Jika caller masih mengirim originalPrice,
     * kita validasi formatnya saja. Nilai database SKU
     * tetap menjadi sumber kebenaran.
     */
    if (
      input.originalPrice !==
      undefined
    ) {
      this.validateNumber(
        input.originalPrice,
        "Harga normal"
      );
    }

    /**
     * --------------------------------------------------------
     * FLASH PRICE
     * --------------------------------------------------------
     */
    const flashPrice =
      this.validateFlashPrice(
        input.flashPrice,
        originalPrice
      );

    /**
     * --------------------------------------------------------
     * STOCK LIMIT
     * --------------------------------------------------------
     */
    const stockLimit =
      this.validateStockLimit(
        input.stockLimit,
        sku.stock
      );

    /**
     * --------------------------------------------------------
     * PER USER LIMIT
     * --------------------------------------------------------
     */
    const perUserLimit =
      this.validatePerUserLimit(
        input.perUserLimit ?? 0,
        stockLimit
      );

    /**
     * --------------------------------------------------------
     * SORT ORDER
     * --------------------------------------------------------
     */
    const sortOrder =
      this.validateSortOrder(
        input.sortOrder ?? 0
      );

    /**
     * --------------------------------------------------------
     * ACTIVE STATE
     * --------------------------------------------------------
     */
    const isActive =
      input.isActive ??
      true;

    this.validateActiveState(
      flashSale,
      isActive
    );

    /**
     * --------------------------------------------------------
     * DUPLICATE PROTECTION
     * --------------------------------------------------------
     *
     * Canonical uniqueness:
     *
     *   flashSaleId + skuId
     *
     * ProductId tetap dikirim karena masih menjadi field
     * compatibility pada FlashSaleItem.
     */
    const duplicate =
      await FlashSaleRepository.findDuplicateItem({
        flashSaleId,
        productId: product.id,
        skuId,
      });

    if (duplicate) {
      throw new Error(
        "SKU tersebut sudah ada di Flash Sale ini."
      );
    }

    /**
     * --------------------------------------------------------
     * CREATE ITEM
     * --------------------------------------------------------
     */
    return FlashSaleRepository.createItem({
      flashSale: {
        connect: {
          id: flashSaleId,
        },
      },

      product: {
        connect: {
          id: product.id,
        },
      },

      sku: {
        connect: {
          id: sku.id,
        },
      },

      originalPrice,

      flashPrice,

      stockLimit,

      soldQuantity: 0,

      perUserLimit,

      isActive,

      sortOrder,
    });
  }

  /**
   * ==========================================================
   * UPDATE
   * ==========================================================
   */
  static async update(
    flashSaleId: string,
    itemId: string,
    input: UpdateFlashSaleItemInput
  ) {
    const flashSale =
      await this.ensureFlashSaleExists(
        flashSaleId
      );

    const current =
      await this.getById(
        flashSaleId,
        itemId
      );

    /**
     * --------------------------------------------------------
     * PREVENT EMPTY UPDATE
     * --------------------------------------------------------
     */
    if (
      Object.keys(input).length ===
      0
    ) {
      throw new Error(
        "Tidak ada data yang diperbarui."
      );
    }

    /**
     * --------------------------------------------------------
     * RESOLVE PRODUCT
     * --------------------------------------------------------
     *
     * ProductId dapat berubah hanya jika SKU juga sesuai
     * dengan product tersebut.
     */
    const productId =
      input.productId !== undefined
        ? input.productId.trim()
        : current.productId;

    if (!productId) {
      throw new Error(
        "Product ID wajib diisi."
      );
    }

    const product =
      await this.ensureProductExists(
        productId
      );

    /**
     * --------------------------------------------------------
     * RESOLVE SKU
     * --------------------------------------------------------
     *
     * Jika skuId tidak dikirim:
     * - gunakan SKU existing.
     *
     * Jika existing item masih legacy tanpa skuId:
     * - update tidak boleh diam-diam membuat item menjadi
     *   SKU-less lagi.
     * - caller wajib menyediakan skuId.
     */
    const nextSkuId =
      input.skuId !== undefined
        ? input.skuId.trim()
        : current.skuId;

    if (!nextSkuId) {
      throw new Error(
        "Item Flash Sale legacy belum memiliki SKU. Kirim skuId untuk melakukan migration."
      );
    }

    const sku =
      await this.ensureProductSkuExists(
        product.id,
        nextSkuId
      );

    /**
     * --------------------------------------------------------
     * CANONICAL ORIGINAL PRICE
     * --------------------------------------------------------
     *
     * Jika SKU berubah, snapshot harga harus mengikuti harga
     * SKU baru.
     *
     * Jika SKU tidak berubah, tetap ambil dari SKU saat ini
     * sehingga originalPrice tidak berasal dari browser.
     */
    const originalPrice =
      this.getCanonicalOriginalPrice(
        sku
      );

    /**
     * Caller lama boleh mengirim originalPrice, tetapi tidak
     * boleh menentukan nilai canonical.
     */
    if (
      input.originalPrice !==
      undefined
    ) {
      this.validateNumber(
        input.originalPrice,
        "Harga normal"
      );
    }

    /**
     * --------------------------------------------------------
     * FLASH PRICE
     * --------------------------------------------------------
     */
    const flashPrice =
      input.flashPrice !== undefined
        ? this.validateFlashPrice(
            input.flashPrice,
            originalPrice
          )
        : this.validateFlashPrice(
            Number(current.flashPrice),
            originalPrice
          );

    /**
     * --------------------------------------------------------
     * STOCK LIMIT
     * --------------------------------------------------------
     *
     * Jika stockLimit tidak dikirim, pertahankan nilai existing.
     *
     * Tetap pastikan quota tidak melebihi stock SKU.
     */
    const stockLimit =
      input.stockLimit !== undefined
        ? this.validateStockLimit(
            input.stockLimit,
            sku.stock
          )
        : this.validateStockLimit(
            current.stockLimit,
            sku.stock
          );

    /**
     * Jangan pernah menurunkan quota di bawah quantity
     * yang sudah terjual.
     */
    if (
      stockLimit <
      current.soldQuantity
    ) {
      throw new Error(
        "Stock limit tidak boleh lebih kecil dari jumlah yang sudah terjual."
      );
    }

    /**
     * --------------------------------------------------------
     * PER USER LIMIT
     * --------------------------------------------------------
     */
    const perUserLimit =
      input.perUserLimit !==
      undefined
        ? this.validatePerUserLimit(
            input.perUserLimit,
            stockLimit
          )
        : this.validatePerUserLimit(
            current.perUserLimit ??
              0,
            stockLimit
          );

    /**
     * --------------------------------------------------------
     * SORT ORDER
     * --------------------------------------------------------
     */
    const sortOrder =
      input.sortOrder !==
      undefined
        ? this.validateSortOrder(
            input.sortOrder
          )
        : current.sortOrder;

    /**
     * --------------------------------------------------------
     * ACTIVE STATE
     * --------------------------------------------------------
     */
    const nextIsActive =
      input.isActive !==
      undefined
        ? input.isActive
        : current.isActive;

    this.validateActiveState(
      flashSale,
      nextIsActive
    );

    /**
     * --------------------------------------------------------
     * DUPLICATE PROTECTION
     * --------------------------------------------------------
     *
     * Cek duplicate jika:
     * - product berubah
     * - SKU berubah
     *
     * ProductId + SKU harus konsisten.
     */
    const productChanged =
      input.productId !==
      undefined &&
      input.productId.trim() !==
        current.productId;

    const skuChanged =
      input.skuId !==
      undefined &&
      input.skuId.trim() !==
        current.skuId;

    if (
      productChanged ||
      skuChanged
    ) {
      const duplicate =
        await FlashSaleRepository.findDuplicateItem({
          flashSaleId,
          productId: product.id,
          skuId: sku.id,
          excludeItemId: itemId,
        });

      if (duplicate) {
        throw new Error(
          "SKU tersebut sudah ada di Flash Sale ini."
        );
      }
    }

    /**
     * --------------------------------------------------------
     * BUILD UPDATE DATA
     * --------------------------------------------------------
     */
    const data:
      Prisma.FlashSaleItemUpdateInput =
      {
        ...(productChanged
          ? {
              product: {
                connect: {
                  id: product.id,
                },
              },
            }
          : {}),

        /**
         * SKU selalu di-connect pada update ini.
         *
         * Ini juga melakukan migration otomatis terhadap
         * FlashSaleItem lama yang masih skuId = null.
         */
        sku: {
          connect: {
            id: sku.id,
          },
        },

        /**
         * Harga normal selalu mengikuti ProductSku.price.
         */
        originalPrice,

        ...(input.flashPrice !==
        undefined
          ? {
              flashPrice,
            }
          : {
              flashPrice,
            }),

        ...(input.stockLimit !==
        undefined
          ? {
              stockLimit,
            }
          : {}),

        ...(input.perUserLimit !==
        undefined
          ? {
              perUserLimit,
            }
          : {}),

        ...(input.isActive !==
        undefined
          ? {
              isActive:
                nextIsActive,
            }
          : {}),

        ...(input.sortOrder !==
        undefined
          ? {
              sortOrder,
            }
          : {}),
      };

    /**
     * --------------------------------------------------------
     * UPDATE
     * --------------------------------------------------------
     */
    return FlashSaleRepository.updateItem(
      flashSaleId,
      itemId,
      data
    );
  }

  /**
   * ==========================================================
   * DELETE
   * ==========================================================
   *
   * Hard delete hanya diperbolehkan jika item belum pernah
   * mempunyai purchase history.
   *
   * Jika sudah pernah dibeli:
   *
   *   DELETE ❌
   *   isActive=false ✅
   *
   * ==========================================================
   */
  static async delete(
    flashSaleId: string,
    itemId: string
  ) {
    const item =
      await this.getById(
        flashSaleId,
        itemId
      );

    /**
     * --------------------------------------------------------
     * PURCHASE HISTORY PROTECTION
     * --------------------------------------------------------
     */
    if (
      item._count.purchases > 0
    ) {
      throw new Error(
        "Item Flash Sale yang sudah memiliki riwayat pembelian tidak dapat dihapus. Nonaktifkan item jika ingin menghentikan Flash Sale."
      );
    }

    /**
     * --------------------------------------------------------
     * HARD DELETE
     * --------------------------------------------------------
     */
    return FlashSaleRepository.deleteItem(
      flashSaleId,
      itemId
    );
  }
}
