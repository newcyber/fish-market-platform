import {
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import FlashSaleRepository from "@/repositories/flash-sale/flash-sale.repository";

/**
 * ============================================================
 * FLASH SALE ITEM SERVICE
 * ============================================================
 *
 * Business logic untuk item di dalam Flash Sale campaign.
 *
 * Responsibilities:
 *
 * - List item
 * - Create item
 * - Update item
 * - Delete item
 * - Validasi product
 * - Validasi weight option
 * - Duplicate protection
 * - Price validation
 * - Stock validation
 * - Per-user limit validation
 * - Sold quantity protection
 * ============================================================
 */

/**
 * ============================================================
 * CREATE FLASH SALE ITEM INPUT
 * ============================================================
 */

export interface CreateFlashSaleItemInput {
  productId: string;

  weightOptionId?: string | null;

  originalPrice: number;

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

  weightOptionId?: string | null;

  originalPrice?: number;

  flashPrice?: number;

  stockLimit?: number;

  perUserLimit?: number;

  isActive?: boolean;

  sortOrder?: number;
}

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
    if (
      !Number.isInteger(value)
    ) {
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
    return FlashSaleRepository.findById(
      flashSaleId
    ).then((flashSale) => {
      if (!flashSale) {
        throw new Error(
          "Flash Sale tidak ditemukan."
        );
      }

      return flashSale;
    });
  }

  /**
   * ==========================================================
   * ENSURE PRODUCT EXISTS
   * ==========================================================
   */

  private static async ensureProductExists(
    productId: string
  ) {
    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
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
   * ENSURE WEIGHT OPTION EXISTS
   * ==========================================================
   *
   * Weight option harus benar-benar milik product.
   */

  private static async ensureWeightOptionExists(
    productId: string,
    weightOptionId?: string | null
  ) {
    if (!weightOptionId) {
      return null;
    }

    const weightOption =
      await prisma.productWeightOption.findFirst({
        where: {
          id: weightOptionId,
          productId,
        },
      });

    if (!weightOption) {
      throw new Error(
        "Weight option tidak ditemukan atau tidak milik produk tersebut."
      );
    }

    return weightOption;
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
    await this.ensureFlashSaleExists(
      flashSaleId
    );

    /**
     * --------------------------------------------------------
     * VALIDATE PRODUCT
     * --------------------------------------------------------
     */

    if (
      !input.productId?.trim()
    ) {
      throw new Error(
        "Product ID wajib diisi."
      );
    }

    const productId =
      input.productId.trim();

    await this.ensureProductExists(
      productId
    );

    /**
     * --------------------------------------------------------
     * VALIDATE WEIGHT OPTION
     * --------------------------------------------------------
     */

    const weightOptionId =
      input.weightOptionId?.trim() ||
      null;

    await this.ensureWeightOptionExists(
      productId,
      weightOptionId
    );

    /**
     * --------------------------------------------------------
     * DUPLICATE PROTECTION
     * --------------------------------------------------------
     */

    const duplicate =
      await FlashSaleRepository.findDuplicateItem({
        flashSaleId,
        productId,
        weightOptionId,
      });

    if (duplicate) {
      throw new Error(
        "Produk atau weight option tersebut sudah ada dalam Flash Sale ini."
      );
    }

    /**
     * --------------------------------------------------------
     * VALIDATE PRICES
     * --------------------------------------------------------
     */

    const originalPrice =
      this.validateNumber(
        input.originalPrice,
        "Harga normal"
      );

    const flashPrice =
      this.validateNumber(
        input.flashPrice,
        "Harga Flash Sale"
      );

    if (originalPrice <= 0) {
      throw new Error(
        "Harga normal harus lebih besar dari 0."
      );
    }

    if (flashPrice <= 0) {
      throw new Error(
        "Harga Flash Sale harus lebih besar dari 0."
      );
    }

    if (
      flashPrice >= originalPrice
    ) {
      throw new Error(
        "Harga Flash Sale harus lebih kecil dari harga normal."
      );
    }

    /**
     * --------------------------------------------------------
     * VALIDATE STOCK LIMIT
     * --------------------------------------------------------
     */

    const stockLimit =
      this.validateInteger(
        input.stockLimit,
        "Stock limit",
        1
      );

    /**
     * --------------------------------------------------------
     * VALIDATE PER USER LIMIT
     * --------------------------------------------------------
     */

    const perUserLimit =
      this.validateInteger(
        input.perUserLimit ?? 0,
        "Per user limit",
        0
      );

    /**
     * --------------------------------------------------------
     * VALIDATE SORT ORDER
     * --------------------------------------------------------
     */

    const sortOrder =
      this.validateInteger(
        input.sortOrder ?? 0,
        "Sort order",
        0
      );

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
          id: productId,
        },
      },

      ...(weightOptionId
        ? {
            weightOption: {
              connect: {
                id: weightOptionId,
              },
            },
          }
        : {}),

      originalPrice,

      flashPrice,

      stockLimit,

      soldQuantity: 0,

      perUserLimit,

      isActive:
        input.isActive ?? true,

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
    const current =
      await this.getById(
        flashSaleId,
        itemId
      );

    /**
     * --------------------------------------------------------
     * PREPARE PRODUCT
     * --------------------------------------------------------
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

    if (
      input.productId !== undefined
    ) {
      await this.ensureProductExists(
        productId
      );
    }

    /**
     * --------------------------------------------------------
     * PREPARE WEIGHT OPTION
     * --------------------------------------------------------
     */

    const weightOptionId =
      input.weightOptionId !== undefined
        ? input.weightOptionId?.trim() || null
        : current.weightOptionId;

    await this.ensureWeightOptionExists(
      productId,
      weightOptionId
    );

    /**
     * --------------------------------------------------------
     * DUPLICATE PROTECTION
     * --------------------------------------------------------
     */

    if (
      input.productId !== undefined ||
      input.weightOptionId !== undefined
    ) {
      const duplicate =
        await FlashSaleRepository.findDuplicateItem({
          flashSaleId,
          productId,
          weightOptionId,
          excludeItemId: itemId,
        });

      if (duplicate) {
        throw new Error(
          "Produk atau weight option tersebut sudah ada dalam Flash Sale ini."
        );
      }
    }

    /**
     * --------------------------------------------------------
     * PREPARE PRICES
     * --------------------------------------------------------
     */

    const originalPrice =
      input.originalPrice !== undefined
        ? this.validateNumber(
            input.originalPrice,
            "Harga normal"
          )
        : Number(
            current.originalPrice
          );

    const flashPrice =
      input.flashPrice !== undefined
        ? this.validateNumber(
            input.flashPrice,
            "Harga Flash Sale"
          )
        : Number(
            current.flashPrice
          );

    if (originalPrice <= 0) {
      throw new Error(
        "Harga normal harus lebih besar dari 0."
      );
    }

    if (flashPrice <= 0) {
      throw new Error(
        "Harga Flash Sale harus lebih besar dari 0."
      );
    }

    if (
      flashPrice >= originalPrice
    ) {
      throw new Error(
        "Harga Flash Sale harus lebih kecil dari harga normal."
      );
    }

    /**
     * --------------------------------------------------------
     * STOCK LIMIT
     * --------------------------------------------------------
     */

    const stockLimit =
      input.stockLimit !== undefined
        ? this.validateInteger(
            input.stockLimit,
            "Stock limit",
            1
          )
        : current.stockLimit;

    /**
     * Tidak boleh menurunkan quota di bawah jumlah
     * yang sudah berhasil terjual.
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
      input.perUserLimit !== undefined
        ? this.validateInteger(
            input.perUserLimit,
            "Per user limit",
            0
          )
        : current.perUserLimit;

    /**
     * --------------------------------------------------------
     * SORT ORDER
     * --------------------------------------------------------
     */

    const sortOrder =
      input.sortOrder !== undefined
        ? this.validateInteger(
            input.sortOrder,
            "Sort order",
            0
          )
        : current.sortOrder;

    /**
     * --------------------------------------------------------
     * PREVENT EMPTY UPDATE
     * --------------------------------------------------------
     */

    if (
      Object.keys(input).length === 0
    ) {
      throw new Error(
        "Tidak ada data yang diperbarui."
      );
    }

    /**
     * --------------------------------------------------------
     * UPDATE DATA
     * --------------------------------------------------------
     */

    const data: Prisma.FlashSaleItemUpdateInput = {
      ...(input.productId !== undefined
        ? {
            product: {
              connect: {
                id: productId,
              },
            },
          }
        : {}),

      ...(input.weightOptionId !== undefined
        ? {
            weightOption: weightOptionId
              ? {
                  connect: {
                    id: weightOptionId,
                  },
                }
              : {
                  disconnect: true,
                },
          }
        : {}),

      ...(input.originalPrice !== undefined
        ? {
            originalPrice,
          }
        : {}),

      ...(input.flashPrice !== undefined
        ? {
            flashPrice,
          }
        : {}),

      ...(input.stockLimit !== undefined
        ? {
            stockLimit,
          }
        : {}),

      ...(input.perUserLimit !== undefined
        ? {
            perUserLimit,
          }
        : {}),

      ...(input.isActive !== undefined
        ? {
            isActive: input.isActive,
          }
        : {}),

      ...(input.sortOrder !== undefined
        ? {
            sortOrder,
          }
        : {}),
    };

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
     * Jika sudah memiliki purchase, jangan hapus item karena
     * berpotensi merusak relasi histori transaksi.
     */

    if (
      item._count.purchases > 0
    ) {
      throw new Error(
        "Item Flash Sale yang sudah memiliki riwayat pembelian tidak dapat dihapus."
      );
    }

    return FlashSaleRepository.deleteItem(
      flashSaleId,
      itemId
    );
  }
}