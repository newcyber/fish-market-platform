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
 * - Get item
 * - Create item
 * - Update item
 * - Delete item
 * - Validasi Flash Sale
 * - Validasi product
 * - Validasi weight option
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
    if (
      !Number.isInteger(value)
    ) {
      throw new Error(
        `${fieldName} harus berupa angka bulat.`
      );
    }

    if (
      value < minimum
    ) {
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
    if (
      !flashSaleId?.trim()
    ) {
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
    const product =
      await prisma.product.findFirst({
        where: {
          id: productId,

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
   * ENSURE WEIGHT OPTION EXISTS
   * ==========================================================
   *
   * Weight option harus benar-benar milik product.
   *
   * ==========================================================
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

          isActive: true,
        },

        select: {
          id: true,

          productId: true,

          label: true,
        },
      });

    if (!weightOption) {
      throw new Error(
        "Weight option tidak ditemukan atau tidak aktif untuk produk tersebut."
      );
    }

    return weightOption;
  }

  /**
   * ==========================================================
   * VALIDATE ITEM ACTIVE STATE
   * ==========================================================
   *
   * Item boleh aktif pada:
   *
   * - DRAFT
   * - SCHEDULED
   * - ACTIVE
   *
   * Tetapi tidak boleh diaktifkan kembali pada:
   *
   * - ENDED
   * - CANCELLED
   *
   * Untuk campaign ACTIVE, periode harus masih valid.
   *
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

    /**
     * --------------------------------------------------------
     * TERMINAL CAMPAIGN
     * --------------------------------------------------------
     */

    if (
      flashSale.status ===
        "ENDED" ||
      flashSale.status ===
        "CANCELLED"
    ) {
      throw new Error(
        "Item tidak dapat diaktifkan karena Flash Sale sudah berakhir atau dibatalkan."
      );
    }

    /**
     * --------------------------------------------------------
     * ACTIVE CAMPAIGN
     * --------------------------------------------------------
     */

    if (
      flashSale.status ===
      "ACTIVE"
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

    if (
      !itemId?.trim()
    ) {
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

    const product =
      await this.ensureProductExists(
        productId
      );

    /**
     * --------------------------------------------------------
     * VALIDATE WEIGHT
     * --------------------------------------------------------
     */

    const weightOptionId =
      input.weightOptionId
        ?.trim() || null;

    await this.ensureWeightOptionExists(
      productId,
      weightOptionId
    );

    /**
     * --------------------------------------------------------
     * DUPLICATE PROTECTION
     * --------------------------------------------------------
     *
     * Satu produk hanya boleh mempunyai:
     *
     * - satu item product-wide
     * - satu item per weight
     *
     * dalam campaign yang sama.
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

    if (
      originalPrice <= 0
    ) {
      throw new Error(
        "Harga normal harus lebih besar dari 0."
      );
    }

    if (
      flashPrice <= 0
    ) {
      throw new Error(
        "Harga Flash Sale harus lebih besar dari 0."
      );
    }

    if (
      flashPrice >=
      originalPrice
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
     *
     * Schema/database saat ini menggunakan angka.
     *
     * 0 = tidak ada batas khusus.
     *
     * --------------------------------------------------------
     */

    const perUserLimit =
  this.validateInteger(
    input.perUserLimit ?? 0,
    "Per user limit",
    0
  );

if (
  perUserLimit > 0 &&
  perUserLimit >
    stockLimit
) {
  throw new Error(
    "Batas pembelian per user tidak boleh lebih besar dari stock limit."
  );
}

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
     * VALIDATE ACTIVE STATE
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
     * PRODUCT
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
      input.productId !==
      undefined
    ) {
      await this.ensureProductExists(
        productId
      );
    }

    /**
     * --------------------------------------------------------
     * WEIGHT
     * --------------------------------------------------------
     */

    const weightOptionId =
      input.weightOptionId !==
      undefined
        ? input.weightOptionId?.trim() ||
          null
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
      input.productId !==
        undefined ||
      input.weightOptionId !==
        undefined
    ) {
      const duplicate =
        await FlashSaleRepository.findDuplicateItem({
          flashSaleId,

          productId,

          weightOptionId,

          excludeItemId:
            itemId,
        });

      if (duplicate) {
        throw new Error(
          "Produk atau weight option tersebut sudah ada dalam Flash Sale ini."
        );
      }
    }

    /**
     * --------------------------------------------------------
     * PRICES
     * --------------------------------------------------------
     */

    const originalPrice =
      input.originalPrice !==
      undefined
        ? this.validateNumber(
            input.originalPrice,
            "Harga normal"
          )
        : Number(
            current.originalPrice
          );

    const flashPrice =
      input.flashPrice !==
      undefined
        ? this.validateNumber(
            input.flashPrice,
            "Harga Flash Sale"
          )
        : Number(
            current.flashPrice
          );

    if (
      originalPrice <= 0
    ) {
      throw new Error(
        "Harga normal harus lebih besar dari 0."
      );
    }

    if (
      flashPrice <= 0
    ) {
      throw new Error(
        "Harga Flash Sale harus lebih besar dari 0."
      );
    }

    if (
      flashPrice >=
      originalPrice
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
      input.stockLimit !==
      undefined
        ? this.validateInteger(
            input.stockLimit,
            "Stock limit",
            1
          )
        : current.stockLimit;

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
    : current.perUserLimit ?? 0;

    if (
      perUserLimit > 0 &&
      perUserLimit >
        stockLimit
    ) {
      throw new Error(
        "Batas pembelian per user tidak boleh lebih besar dari stock limit."
      );
    }

    /**
     * --------------------------------------------------------
     * SORT ORDER
     * --------------------------------------------------------
     */

    const sortOrder =
      input.sortOrder !==
      undefined
        ? this.validateInteger(
            input.sortOrder,
            "Sort order",
            0
          )
        : current.sortOrder;

    /**
     * --------------------------------------------------------
     * ACTIVE STATE
     * --------------------------------------------------------
     *
     * Jika tidak dikirim, pertahankan state sebelumnya.
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
     * PREVENT EMPTY UPDATE
     * --------------------------------------------------------
     */

    if (
      Object.keys(input)
        .length === 0
    ) {
      throw new Error(
        "Tidak ada data yang diperbarui."
      );
    }

    /**
     * --------------------------------------------------------
     * BUILD UPDATE DATA
     * --------------------------------------------------------
     */

    const data:
      Prisma.FlashSaleItemUpdateInput =
      {
        ...(input.productId !==
        undefined
          ? {
              product: {
                connect: {
                  id: productId,
                },
              },
            }
          : {}),

        ...(input.weightOptionId !==
        undefined
          ? {
              weightOption:
                weightOptionId
                  ? {
                      connect: {
                        id: weightOptionId,
                      },
                    }
                  : {
                      disconnect:
                        true,
                    },
            }
          : {}),

        ...(input.originalPrice !==
        undefined
          ? {
              originalPrice,
            }
          : {}),

        ...(input.flashPrice !==
        undefined
          ? {
              flashPrice,
            }
          : {}),

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
   *     DELETE ❌
   *     isActive=false ✅
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
     *
     * Aman karena belum memiliki purchase history.
     */

    return FlashSaleRepository.deleteItem(
      flashSaleId,
      itemId
    );
  }
}