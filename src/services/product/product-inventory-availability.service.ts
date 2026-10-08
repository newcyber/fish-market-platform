import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { parseWeightLabelToGrams } from "@/services/reward-point/reward-point.service";

export interface ProductSkuAvailability {
  skuId: string;
  sku: string;
  productId: string;

  usesPhysicalPool: boolean;

  poolId: string | null;
  sizeVariantOptionId: string | null;
  sizeLabel: string | null;

  weightGrams: number | null;
  stockGrams: number | null;

  availableQuantity: number;

  reason:
    | "PHYSICAL_POOL"
    | "LEGACY_SKU_STOCK"
    | "MISSING_SIZE_MAPPING"
    | "MISSING_WEIGHT_MAPPING"
    | "POOL_NOT_FOUND";
}

type AvailabilityDb =
  | typeof prisma
  | Prisma.TransactionClient;

type SkuAvailabilityRecord = {
  id: string;
  sku: string;
  productId: string;
  stock: number;
  isActive: boolean;

  skuOptions: Array<{
    variantOption: {
      id: string;
      label: string;
      group: {
        name: string;
      };
    };
  }>;

  product: {
    inventoryPools: Array<{
      id: string;
      sizeVariantOptionId: string;
      stockGrams: number;
    }>;
  };
};

export class ProductInventoryAvailabilityService {
  /**
   * ============================================================
   * BUILD AVAILABILITY
   * ============================================================
   *
   * Pure calculation.
   *
   * Tidak melakukan database query.
   */
  private static buildAvailability(
    sku: SkuAvailabilityRecord,
  ): ProductSkuAvailability {
    if (!sku.isActive) {
      return {
        skuId: sku.id,
        sku: sku.sku,
        productId: sku.productId,

        usesPhysicalPool: false,

        poolId: null,
        sizeVariantOptionId: null,
        sizeLabel: null,

        weightGrams: null,
        stockGrams: null,

        availableQuantity: 0,

        reason: "LEGACY_SKU_STOCK",
      };
    }

    const sizeOption =
      sku.skuOptions.find(
        (option) =>
          option.variantOption.group.name
            .trim()
            .toLowerCase() === "ukuran",
      );

    const weightOption =
      sku.skuOptions.find(
        (option) =>
          option.variantOption.group.name
            .trim()
            .toLowerCase() === "berat",
      );

    const weightGrams = weightOption
      ? parseWeightLabelToGrams(
          weightOption.variantOption.label,
        )
      : null;

    /**
     * ==========================================================
     * LEGACY PRODUCT
     * ==========================================================
     *
     * Tidak mempunyai physical inventory pool.
     *
     * ProductSku.stock tetap menjadi source of truth.
     */
    if (sku.product.inventoryPools.length === 0) {
      return {
        skuId: sku.id,
        sku: sku.sku,
        productId: sku.productId,

        usesPhysicalPool: false,

        poolId: null,
        sizeVariantOptionId: null,
        sizeLabel: null,

        weightGrams,
        stockGrams: null,

        availableQuantity: Math.max(
          0,
          sku.stock,
        ),

        reason: "LEGACY_SKU_STOCK",
      };
    }

    /**
     * ==========================================================
     * POOL-BACKED PRODUCT
     * ==========================================================
     *
     * Begitu product mempunyai inventory pool,
     * ProductSku.stock TIDAK BOLEH menjadi fallback.
     */
    if (!sizeOption) {
      return {
        skuId: sku.id,
        sku: sku.sku,
        productId: sku.productId,

        usesPhysicalPool: true,

        poolId: null,
        sizeVariantOptionId: null,
        sizeLabel: null,

        weightGrams,
        stockGrams: null,

        availableQuantity: 0,

        reason: "MISSING_SIZE_MAPPING",
      };
    }

    if (!weightGrams || weightGrams <= 0) {
      return {
        skuId: sku.id,
        sku: sku.sku,
        productId: sku.productId,

        usesPhysicalPool: true,

        poolId: null,
        sizeVariantOptionId:
          sizeOption.variantOption.id,
        sizeLabel:
          sizeOption.variantOption.label,

        weightGrams: null,
        stockGrams: null,

        availableQuantity: 0,

        reason: "MISSING_WEIGHT_MAPPING",
      };
    }

    const pool =
      sku.product.inventoryPools.find(
        (item) =>
          item.sizeVariantOptionId ===
          sizeOption.variantOption.id,
      );

    if (!pool) {
      return {
        skuId: sku.id,
        sku: sku.sku,
        productId: sku.productId,

        usesPhysicalPool: true,

        poolId: null,
        sizeVariantOptionId:
          sizeOption.variantOption.id,
        sizeLabel:
          sizeOption.variantOption.label,

        weightGrams,
        stockGrams: null,

        availableQuantity: 0,

        reason: "POOL_NOT_FOUND",
      };
    }

    const availableQuantity =
      Math.floor(
        Math.max(pool.stockGrams, 0) /
          weightGrams,
      );

    return {
      skuId: sku.id,
      sku: sku.sku,
      productId: sku.productId,

      usesPhysicalPool: true,

      poolId: pool.id,
      sizeVariantOptionId:
        sizeOption.variantOption.id,
      sizeLabel:
        sizeOption.variantOption.label,

      weightGrams,
      stockGrams: pool.stockGrams,

      availableQuantity,

      reason: "PHYSICAL_POOL",
    };
  }

  /**
   * ============================================================
   * GET SINGLE SKU
   * ============================================================
   *
   * Satu SKU = satu query.
   *
   * Cocok untuk CartService yang hanya sedang memvalidasi
   * satu SKU.
   */
  static async getSkuAvailability(
    skuId: string,
    db: AvailabilityDb = prisma,
  ): Promise<ProductSkuAvailability> {
    const sku =
      await db.productSku.findUnique({
        where: {
          id: skuId,
        },

        select: {
          id: true,
          sku: true,
          productId: true,
          stock: true,
          isActive: true,

          skuOptions: {
            select: {
              variantOption: {
                select: {
                  id: true,
                  label: true,

                  group: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },

          product: {
            select: {
              inventoryPools: {
                select: {
                  id: true,
                  sizeVariantOptionId: true,
                  stockGrams: true,
                },
              },
            },
          },
        },
      });

    if (!sku) {
      throw new Error(
        "SKU tidak ditemukan.",
      );
    }

    return this.buildAvailability(
      sku as SkuAvailabilityRecord,
    );
  }

  /**
   * ============================================================
   * GET MULTIPLE SKU AVAILABILITY
   * ============================================================
   *
   * IMPORTANT:
   *
   * Sebelumnya method ini melakukan:
   *
   *   Promise.all(
   *     skuIds.map(getSkuAvailability)
   *   )
   *
   * sehingga N SKU = N database query.
   *
   * Sekarang seluruh SKU diambil dalam SATU query.
   */
  static async getSkuAvailabilities(
    skuIds: string[],
    db: AvailabilityDb = prisma,
  ): Promise<ProductSkuAvailability[]> {
    const uniqueSkuIds = [
      ...new Set(
        skuIds.filter(
          (skuId) =>
            typeof skuId === "string" &&
            skuId.trim().length > 0,
        ),
      ),
    ];

    if (uniqueSkuIds.length === 0) {
      return [];
    }

    const skus =
      await db.productSku.findMany({
        where: {
          id: {
            in: uniqueSkuIds,
          },
        },

        select: {
          id: true,
          sku: true,
          productId: true,
          stock: true,
          isActive: true,

          skuOptions: {
            select: {
              variantOption: {
                select: {
                  id: true,
                  label: true,

                  group: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },

          product: {
            select: {
              inventoryPools: {
                select: {
                  id: true,
                  sizeVariantOptionId: true,
                  stockGrams: true,
                },
              },
            },
          },
        },
      });

    const availabilityMap =
      new Map<
        string,
        ProductSkuAvailability
      >();

    for (const sku of skus) {
      availabilityMap.set(
        sku.id,
        this.buildAvailability(
          sku as SkuAvailabilityRecord,
        ),
      );
    }

    /**
     * Preserve input order.
     *
     * Ini penting untuk consumer yang mengharapkan
     * urutan skuIds yang dikirim.
     */
    return uniqueSkuIds
      .map((skuId) =>
        availabilityMap.get(skuId),
      )
      .filter(
        (
          item,
        ): item is ProductSkuAvailability =>
          Boolean(item),
      );
  }
}

export default ProductInventoryAvailabilityService;