import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import FlashSaleRepository from "@/repositories/flash-sale/flash-sale.repository";

import { createAuditLog } from "@/services/audit/audit-log.service";
import { ProductInventoryAvailabilityService } from "@/services/product/product-inventory-availability.service";

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

type FlashSaleBulkPreparedItem = {
  input: CreateFlashSaleItemInput & {
    productId: string;
    skuId: string;
  };
  product: {
    id: string;
    name: string;
    price: Prisma.Decimal;
    isPublished: boolean;
  };
  sku: ProductSkuRecord;
  originalPrice: number;
  flashPrice: number;
  stockLimit: number;
  perUserLimit: number;
  sortOrder: number;
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
    availableQuantity: number
  ) {
    const normalizedStockLimit =
      this.validateInteger(
        stockLimit,
        "Stock limit",
        1
      );

    if (
      normalizedStockLimit >
      availableQuantity
    ) {
      throw new Error(
        `Stock limit Flash Sale tidak boleh lebih besar dari availability SKU (${availableQuantity}).`
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
    input: CreateFlashSaleItemInput,
    actorId: string
  ) {
    if (!flashSaleId?.trim()) {
      throw new Error(
        "Flash Sale ID wajib diisi."
      );
    }

    if (!actorId?.trim()) {
      throw new Error(
        "Actor ID admin wajib diisi untuk audit Flash Sale."
      );
    }

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
    const availability =
      await ProductInventoryAvailabilityService.getSkuAvailability(
        sku.id
      );

    const stockLimit =
      this.validateStockLimit(
        input.stockLimit,
        availability.availableQuantity
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
     * CREATE ITEM + DUPLICATE PROTECTION + AUDIT
     * --------------------------------------------------------
     *
     * Duplicate check harus berada di transaction yang sama
     * dengan mutation. Database UNIQUE constraint menjadi
     * final concurrency guard.
     */
    return prisma.$transaction(async (tx) => {
      const duplicate =
        await FlashSaleRepository.findDuplicateItem(
          tx,
          {
            flashSaleId,
            productId: product.id,
            skuId,
          }
        );

      if (duplicate) {
        throw new Error(
          "SKU tersebut sudah ada di Flash Sale ini."
        );
      }

      const createdItem =
        await FlashSaleRepository.createItem(
          tx,
          {
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
          }
        );

      await createAuditLog(
        {
          eventType:
            "FLASH_SALE_LIFECYCLE",
          entityType:
            "FLASH_SALE_ITEM",
          entityId:
            createdItem.id,
          action:
            "CREATED",
          actorType:
            "ADMIN",
          actorId:
            actorId.trim(),
          beforeData: null,
          afterData: {
            flashSaleId,
            productId:
              createdItem.productId,
            skuId:
              createdItem.skuId,
            originalPrice:
              Number(
                createdItem.originalPrice
              ),
            flashPrice:
              Number(
                createdItem.flashPrice
              ),
            stockLimit:
              createdItem.stockLimit,
            soldQuantity:
              createdItem.soldQuantity,
            perUserLimit:
              createdItem.perUserLimit,
            isActive:
              createdItem.isActive,
            sortOrder:
              createdItem.sortOrder,
          },
          metadata: {
            flashSaleId,
          },
        },
        tx
      );

      return createdItem;
    });
  }

  /**
   * ==========================================================
   * CREATE MANY
   * ==========================================================
   *
   * Bulk create untuk admin SKU matrix. Seluruh input tetap
   * melewati validation canonical yang sama dengan create().
   * Mutation dilakukan dalam satu transaction agar bulk action
   * tidak meninggalkan sebagian item ketika salah satu SKU gagal.
   * ==========================================================
   */
  static async createMany(
    flashSaleId: string,
    inputs: CreateFlashSaleItemInput[],
    actorId: string
  ) {
    if (!flashSaleId?.trim()) {
      throw new Error("Flash Sale ID wajib diisi.");
    }
    if (!actorId?.trim()) {
      throw new Error("Actor ID admin wajib diisi untuk audit Flash Sale.");
    }
    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw new Error("Minimal satu SKU harus dipilih.");
    }
    if (inputs.length > 100) {
      throw new Error("Maksimal 100 SKU dapat ditambahkan dalam satu bulk action.");
    }

    const flashSale = await this.ensureFlashSaleExists(flashSaleId);
    const normalized = inputs.map((input) => ({
      ...input,
      productId: input.productId?.trim(),
      skuId: input.skuId?.trim(),
    }));

    const duplicateInput = new Set<string>();
    for (const input of normalized) {
      if (!input.productId || !input.skuId) {
        throw new Error("Product ID dan SKU ID wajib diisi.");
      }
      if (duplicateInput.has(input.skuId)) {
        throw new Error("SKU yang sama tidak boleh dipilih lebih dari satu kali.");
      }
      duplicateInput.add(input.skuId);
      if (input.isActive === false) {
        throw new Error("SKU Flash Sale bulk harus aktif.");
      }
    }

    const prepared: FlashSaleBulkPreparedItem[] = [];
    for (const input of normalized) {
      const { product, sku } = await this.resolveSku(input.productId!, input.skuId!);
      const originalPrice = this.getCanonicalOriginalPrice(sku);
      const flashPrice = this.validateFlashPrice(input.flashPrice, originalPrice);
      const availability =
        await ProductInventoryAvailabilityService.getSkuAvailability(
          sku.id
        );
      const stockLimit = this.validateStockLimit(
        input.stockLimit,
        availability.availableQuantity
      );
      const perUserLimit = this.validatePerUserLimit(input.perUserLimit ?? 0, stockLimit);
      const sortOrder = this.validateSortOrder(input.sortOrder ?? 0);
      const isActive = input.isActive ?? true;
      this.validateActiveState(flashSale, isActive);

      prepared.push({
        input,
        product,
        sku,
        originalPrice,
        flashPrice,
        stockLimit,
        perUserLimit,
        sortOrder,
        isActive,
      });
    }

    return prisma.$transaction(async (tx) => {
      const createdItems = [];

      for (const item of prepared) {
        const duplicate = await FlashSaleRepository.findDuplicateItem(tx, {
          flashSaleId,
          productId: item.product.id,
          skuId: item.sku.id,
        });

        if (duplicate) {
          throw new Error(`SKU ${item.sku.sku} sudah ada di Flash Sale ini.`);
        }

        const createdItem = await FlashSaleRepository.createItem(tx, {
          flashSale: { connect: { id: flashSaleId } },
          product: { connect: { id: item.product.id } },
          sku: { connect: { id: item.sku.id } },
          originalPrice: item.originalPrice,
          flashPrice: item.flashPrice,
          stockLimit: item.stockLimit,
          soldQuantity: 0,
          perUserLimit: item.perUserLimit,
          isActive: item.isActive,
          sortOrder: item.sortOrder,
        });

        await createAuditLog({
          eventType: "FLASH_SALE_LIFECYCLE",
          entityType: "FLASH_SALE_ITEM",
          entityId: createdItem.id,
          action: "CREATED",
          actorType: "ADMIN",
          actorId: actorId.trim(),
          beforeData: null,
          afterData: {
            flashSaleId,
            productId: createdItem.productId,
            skuId: createdItem.skuId,
            originalPrice: Number(createdItem.originalPrice),
            flashPrice: Number(createdItem.flashPrice),
            stockLimit: createdItem.stockLimit,
            soldQuantity: createdItem.soldQuantity,
            perUserLimit: createdItem.perUserLimit,
            isActive: createdItem.isActive,
            sortOrder: createdItem.sortOrder,
          },
          metadata: { flashSaleId, bulk: true },
        }, tx);

        createdItems.push(createdItem);
      }

      return createdItems;
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
    input: UpdateFlashSaleItemInput,
    actorId: string
  ) {
    if (!flashSaleId?.trim()) {
      throw new Error(
        "Flash Sale ID wajib diisi."
      );
    }

    if (!itemId?.trim()) {
      throw new Error(
        "Item Flash Sale ID wajib diisi."
      );
    }

    if (!actorId?.trim()) {
      throw new Error(
        "Actor ID admin wajib diisi untuk audit Flash Sale."
      );
    }

    if (
      Object.keys(input).length ===
      0
    ) {
      throw new Error(
        "Tidak ada data yang diperbarui."
      );
    }

    /**
     * ========================================================
     * ATOMIC UPDATE + AUDIT TRANSACTION
     * ========================================================
     *
     * Seluruh critical mutation flow berada dalam transaction:
     *
     * 1. Read Flash Sale state
     * 2. Read current FlashSaleItem state
     * 3. Resolve Product + SKU
     * 4. Validate business rules
     * 5. Duplicate protection
     * 6. Update FlashSaleItem
     * 7. Create immutable AuditLog
     *
     * Dengan demikian beforeData selalu berasal dari state yang
     * dibaca pada transaction yang sama dengan mutation.
     * Jika mutation atau audit gagal, seluruh transaction rollback.
     */
    return prisma.$transaction(async (tx) => {
      /**
       * --------------------------------------------------------
       * READ FLASH SALE INSIDE TRANSACTION
       * --------------------------------------------------------
       */
      const flashSale =
        await tx.flashSale.findUnique({
          where: {
            id: flashSaleId,
          },
          select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
          },
        });

      if (!flashSale) {
        throw new Error(
          "Flash Sale tidak ditemukan."
        );
      }

      /**
       * --------------------------------------------------------
       * READ CURRENT ITEM INSIDE TRANSACTION
       * --------------------------------------------------------
       *
       * Ini sengaja tidak menggunakan getById(), karena method
       * tersebut membaca melalui Prisma client global di luar
       * transaction.
       */
      const current =
        await tx.flashSaleItem.findFirst({
          where: {
            id: itemId,
            flashSaleId,
          },
          include: {
            product: true,
            sku: true,
            _count: {
              select: {
                purchases: true,
              },
            },
          },
        });

      if (!current) {
        throw new Error(
          "Item Flash Sale tidak ditemukan."
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
        await tx.product.findFirst({
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

      /**
       * --------------------------------------------------------
       * RESOLVE SKU
       * --------------------------------------------------------
       *
       * SKU adalah canonical sellable unit.
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
        await tx.productSku.findFirst({
          where: {
            id: nextSkuId,
            productId: product.id,
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

      /**
       * --------------------------------------------------------
       * CANONICAL ORIGINAL PRICE
       * --------------------------------------------------------
       */
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
       * CHANGE DETECTION
       * --------------------------------------------------------
       */
      const productChanged =
        input.productId !== undefined &&
        input.productId.trim() !==
          current.productId;

      const skuChanged =
        input.skuId !== undefined &&
        input.skuId.trim() !==
          current.skuId;

      /**
       * --------------------------------------------------------
       * STOCK LIMIT
       * --------------------------------------------------------
       */
      const availability =
        await ProductInventoryAvailabilityService.getSkuAvailability(
          sku.id,
          tx,
        );

      const stockLimit =
        input.stockLimit !== undefined
          ? this.validateStockLimit(
              input.stockLimit,
              availability.availableQuantity
            )
          : (productChanged || skuChanged)
            ? this.validateStockLimit(
                current.stockLimit,
                availability.availableQuantity
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
        input.sortOrder !== undefined
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
        input.isActive !== undefined
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
       * Check dilakukan di transaction yang sama dengan update.
       */
      if (
        productChanged ||
        skuChanged
      ) {
        const duplicate =
          await tx.flashSaleItem.findFirst({
            where: {
              flashSaleId,
              productId: product.id,
              skuId: sku.id,
              id: {
                not: itemId,
              },
            },
            select: {
              id: true,
            },
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

          sku: {
            connect: {
              id: sku.id,
            },
          },

          originalPrice,
          flashPrice,

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
       * BEFORE SNAPSHOT
       * --------------------------------------------------------
       */
      const beforeData = {
        productId: current.productId,
        skuId: current.skuId,
        originalPrice: Number(
          current.originalPrice
        ),
        flashPrice: Number(
          current.flashPrice
        ),
        stockLimit: current.stockLimit,
        soldQuantity:
          current.soldQuantity,
        perUserLimit:
          current.perUserLimit,
        isActive: current.isActive,
        sortOrder: current.sortOrder,
      };

      /**
       * --------------------------------------------------------
       * MUTATION
       * --------------------------------------------------------
       */
      const updatedItem =
        await FlashSaleRepository.updateItem(
          tx,
          flashSaleId,
          itemId,
          data
        );

      /**
       * --------------------------------------------------------
       * AUDIT
       * --------------------------------------------------------
       *
       * Audit menggunakan tx yang sama. Jika audit gagal,
       * mutation FlashSaleItem ikut rollback.
       */
      await createAuditLog(
        {
          eventType:
            "FLASH_SALE_LIFECYCLE",
          entityType:
            "FLASH_SALE_ITEM",
          entityId:
            updatedItem.id,
          action: "UPDATED",
          actorType: "ADMIN",
          actorId: actorId.trim(),
          beforeData,
          afterData: {
            productId:
              updatedItem.productId,
            skuId:
              updatedItem.skuId,
            originalPrice:
              Number(
                updatedItem.originalPrice
              ),
            flashPrice:
              Number(
                updatedItem.flashPrice
              ),
            stockLimit:
              updatedItem.stockLimit,
            soldQuantity:
              updatedItem.soldQuantity,
            perUserLimit:
              updatedItem.perUserLimit,
            isActive:
              updatedItem.isActive,
            sortOrder:
              updatedItem.sortOrder,
          },
          metadata: {
            flashSaleId,
          },
        },
        tx
      );

      return updatedItem;
    });
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
    itemId: string,
    actorId: string
  ) {
    if (!flashSaleId?.trim()) {
      throw new Error(
        "Flash Sale ID wajib diisi."
      );
    }

    if (!itemId?.trim()) {
      throw new Error(
        "Item Flash Sale ID wajib diisi."
      );
    }

    if (!actorId?.trim()) {
      throw new Error(
        "Actor ID admin wajib diisi untuk audit Flash Sale."
      );
    }

    return prisma.$transaction(async (tx) => {
      const item =
        await tx.flashSaleItem.findFirst({
          where: {
            id: itemId,
            flashSaleId,
          },
          include: {
            flashSale: true,
            product: true,
            sku: true,
            _count: {
              select: {
                purchases: true,
              },
            },
          },
        });

      if (!item) {
        throw new Error(
          "Item Flash Sale tidak ditemukan."
        );
      }

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
       * BEFORE SNAPSHOT
       * --------------------------------------------------------
       */
      const beforeData = {
        flashSaleId:
          item.flashSaleId,
        productId:
          item.productId,
        skuId:
          item.skuId,
        originalPrice:
          Number(
            item.originalPrice
          ),
        flashPrice:
          Number(
            item.flashPrice
          ),
        stockLimit:
          item.stockLimit,
        soldQuantity:
          item.soldQuantity,
        perUserLimit:
          item.perUserLimit,
        isActive:
          item.isActive,
        sortOrder:
          item.sortOrder,
      };

      /**
       * --------------------------------------------------------
       * HARD DELETE
       * --------------------------------------------------------
       */
      await FlashSaleRepository.deleteItem(
        tx,
        flashSaleId,
        itemId
      );

      /**
       * --------------------------------------------------------
       * AUDIT
       * --------------------------------------------------------
       */
      await createAuditLog(
        {
          eventType:
            "FLASH_SALE_LIFECYCLE",
          entityType:
            "FLASH_SALE_ITEM",
          entityId:
            item.id,
          action:
            "DELETED",
          actorType:
            "ADMIN",
          actorId:
            actorId.trim(),
          beforeData,
          afterData: null,
          metadata: {
            flashSaleId,
          },
        },
        tx
      );

      return item;
    });
  }
}
