import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { parseWeightLabelToGrams } from "@/services/reward-point/reward-point.service";

export interface PhysicalInventoryConsumeItem {
  skuId: string;
  quantity: number;
}

type InventoryDb = typeof prisma | Prisma.TransactionClient;

type PhysicalSkuRecord = {
  id: string;
  sku: string;
  productId: string;
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

interface PhysicalPoolRequirement {
  poolId: string;
  productId: string;
  sizeVariantOptionId: string;
  quantityGrams: number;
  skuLabels: string[];
}

/**
 * Physical inventory mutation service.
 *
 * ProductSku.stock tetap dipakai oleh legacy products.
 * Product yang mempunyai ProductInventoryPool menggunakan pool gram
 * sebagai source of truth untuk checkout.
 */
export class ProductPhysicalInventoryService {
  /**
   * Consume physical grams for a set of order items.
   *
   * IMPORTANT:
   * - Caller wajib menjalankan method ini di dalam Prisma transaction.
   * - Multiple SKUs yang menunjuk pool yang sama digabung menjadi satu
   *   requirement pool agar stok fisik tidak dihitung per SKU.
   * - UPDATE ... WHERE stockGrams >= required memakai row-level locking
   *   PostgreSQL sehingga concurrent checkout tidak dapat oversell.
   */
  static async consumeForOrder(
    items: PhysicalInventoryConsumeItem[],
    options: {
      orderNumber: string;
      actorUserId?: string | null;
    },
    db: InventoryDb = prisma,
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const normalizedItems = items.filter(
      (item) =>
        typeof item.skuId === "string" &&
        item.skuId.trim().length > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );

    if (normalizedItems.length === 0) {
      return;
    }

    const skuIds = [
      ...new Set(normalizedItems.map((item) => item.skuId)),
    ];

    const skus = await db.productSku.findMany({
      where: {
        id: {
          in: skuIds,
        },
        isActive: true,
      },
      select: {
        id: true,
        sku: true,
        productId: true,
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

    const skuMap = new Map(
      skus.map((sku) => [sku.id, sku as PhysicalSkuRecord]),
    );

    const poolRequirements = new Map<string, PhysicalPoolRequirement>();

    for (const item of normalizedItems) {
      const sku = skuMap.get(item.skuId);

      if (!sku) {
        throw new Error(
          `SKU "${item.skuId}" tidak ditemukan saat mengurangi stok fisik.`,
        );
      }

      /**
       * Hanya pool-backed product yang boleh masuk ke service ini.
       * Legacy SKU tetap ditangani oleh ProductSku.stock di OrderService.
       */
      if (sku.product.inventoryPools.length === 0) {
        continue;
      }

      const sizeOption = sku.skuOptions.find(
        (option) =>
          option.variantOption.group.name.trim().toLowerCase() ===
          "ukuran",
      );

      if (!sizeOption) {
        throw new Error(
          `SKU "${sku.sku}" tidak memiliki mapping Ukuran untuk stok fisik.`,
        );
      }

      const weightOption = sku.skuOptions.find(
        (option) =>
          option.variantOption.group.name.trim().toLowerCase() ===
          "berat",
      );

      const weightGrams = weightOption
        ? parseWeightLabelToGrams(weightOption.variantOption.label)
        : null;

      if (!weightGrams || weightGrams <= 0) {
        throw new Error(
          `SKU "${sku.sku}" tidak memiliki mapping berat yang valid untuk stok fisik.`,
        );
      }

      const pool = sku.product.inventoryPools.find(
        (candidate) =>
          candidate.sizeVariantOptionId ===
          sizeOption.variantOption.id,
      );

      if (!pool) {
        throw new Error(
          `Pool stok fisik untuk ukuran "${sizeOption.variantOption.label}" pada SKU "${sku.sku}" tidak ditemukan.`,
        );
      }

      const quantityGrams = weightGrams * item.quantity;
      const existing = poolRequirements.get(pool.id);

      if (existing) {
        existing.quantityGrams += quantityGrams;
        existing.skuLabels.push(sku.sku);
      } else {
        poolRequirements.set(pool.id, {
          poolId: pool.id,
          productId: sku.productId,
          sizeVariantOptionId: pool.sizeVariantOptionId,
          quantityGrams,
          skuLabels: [sku.sku],
        });
      }
    }

    for (const requirement of poolRequirements.values()) {
      /**
       * Atomic decrement + exact before/after snapshot.
       *
       * UPDATE menunggu row lock bila ada checkout lain yang sedang
       * memodifikasi pool yang sama. Setelah lock diperoleh, predicate
       * stockGrams >= quantityGrams dievaluasi terhadap nilai terbaru.
       */
      const rows = await db.$queryRaw<
        Array<{
          stockBeforeGrams: number | bigint;
          stockAfterGrams: number | bigint;
        }>
      >(Prisma.sql`
        UPDATE "ProductInventoryPool"
        SET "stockGrams" = "stockGrams" - ${requirement.quantityGrams},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${requirement.poolId}
          AND "stockGrams" >= ${requirement.quantityGrams}
        RETURNING
          "stockGrams" + ${requirement.quantityGrams} AS "stockBeforeGrams",
          "stockGrams" AS "stockAfterGrams"
      `);

      if (rows.length !== 1) {
        const currentPool = await db.productInventoryPool.findUnique({
          where: {
            id: requirement.poolId,
          },
          select: {
            stockGrams: true,
          },
        });

        const availableGrams = currentPool?.stockGrams ?? 0;

        throw new Error(
          `Stok fisik tidak mencukupi. Dibutuhkan ${requirement.quantityGrams} gram, tersedia ${availableGrams} gram. Silakan perbarui checkout Anda.`,
        );
      }

      const result = rows[0];

      const stockBeforeGrams = Number(result.stockBeforeGrams);
      const stockAfterGrams = Number(result.stockAfterGrams);

      await db.productInventoryPoolLedger.create({
        data: {
          poolId: requirement.poolId,
          productId: requirement.productId,
          sizeVariantOptionId: requirement.sizeVariantOptionId,
          quantityGrams: -requirement.quantityGrams,
          stockBeforeGrams,
          stockAfterGrams,
          type: "SALE",
          actorUserId: options.actorUserId ?? null,
          note: `Penjualan ${options.orderNumber} - SKU ${[
            ...new Set(requirement.skuLabels),
          ].join(", ")}`,
        },
      });
    }
  }

  /**
   * Reconcile the physical inventory reservation of an order after its
   * items/quantities/SKUs have changed.
   *
   * The current reservation is derived from physical inventory ledgers:
   *
   *   SALE          = negative
   *   UPDATE_SALE   = negative
   *   CANCEL        = positive
   *   UPDATE_RETURN = positive
   *
   * The desired reservation is derived from the final order items.
   *
   * The delta is then applied atomically per pool.
   *
   * This method must run inside the same transaction that updates OrderItems.
   */
  static async reconcileForOrder(
    items: PhysicalInventoryConsumeItem[],
    options: {
      orderNumber: string;
      actorUserId?: string | null;
    },
    db: InventoryDb = prisma,
  ): Promise<void> {
    const normalizedOrderNumber = options.orderNumber?.trim();

    if (!normalizedOrderNumber) {
      throw new Error("Order number wajib diisi untuk rekonsiliasi stok fisik.");
    }

    const normalizedItems = items.filter(
      (item) =>
        typeof item.skuId === "string" &&
        item.skuId.trim().length > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );

    const skuIds = [
      ...new Set(normalizedItems.map((item) => item.skuId)),
    ];

    const skus =
      skuIds.length > 0
        ? await db.productSku.findMany({
            where: {
              id: {
                in: skuIds,
              },
            },
            select: {
              id: true,
              sku: true,
              productId: true,
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
                  isPreOrder: true,
                  inventoryPools: {
                    select: {
                      id: true,
                      sizeVariantOptionId: true,
                    },
                  },
                },
              },
            },
          })
        : [];

    const skuMap = new Map(
      skus.map((sku) => [sku.id, sku]),
    );

    /**
     * Desired physical reservation grouped by pool.
     */
    const desiredByPool = new Map<
      string,
      {
        poolId: string;
        productId: string;
        sizeVariantOptionId: string;
        quantityGrams: number;
        skuLabels: string[];
      }
    >();

    for (const item of normalizedItems) {
      const sku = skuMap.get(item.skuId);

      if (!sku) {
        throw new Error(
          `SKU "${item.skuId}" tidak ditemukan saat merekonsiliasi stok fisik.`,
        );
      }

      /**
       * A pool-backed product uses physical grams.
       * Legacy products remain handled by ProductSku.stock.
       */
      if (sku.product.inventoryPools.length === 0) {
        continue;
      }

      /**
       * Pre-order has no physical reservation.
       */
      if (sku.product.isPreOrder) {
        continue;
      }

      const sizeOption = sku.skuOptions.find(
        (option) =>
          option.variantOption.group.name.trim().toLowerCase() ===
          "ukuran",
      );

      if (!sizeOption) {
        throw new Error(
          `SKU "${sku.sku}" tidak memiliki mapping Ukuran untuk stok fisik.`,
        );
      }

      const weightOption = sku.skuOptions.find(
        (option) =>
          option.variantOption.group.name.trim().toLowerCase() ===
          "berat",
      );

      const weightGrams = weightOption
        ? parseWeightLabelToGrams(weightOption.variantOption.label)
        : null;

      if (!weightGrams || weightGrams <= 0) {
        throw new Error(
          `SKU "${sku.sku}" tidak memiliki mapping berat yang valid untuk stok fisik.`,
        );
      }

      const pool = sku.product.inventoryPools.find(
        (candidate) =>
          candidate.sizeVariantOptionId ===
          sizeOption.variantOption.id,
      );

      if (!pool) {
        throw new Error(
          `Pool stok fisik untuk ukuran "${sizeOption.variantOption.label}" pada SKU "${sku.sku}" tidak ditemukan.`,
        );
      }

      const quantityGrams = weightGrams * item.quantity;
      const existing = desiredByPool.get(pool.id);

      if (existing) {
        existing.quantityGrams += quantityGrams;
        existing.skuLabels.push(sku.sku);
      } else {
        desiredByPool.set(pool.id, {
          poolId: pool.id,
          productId: sku.productId,
          sizeVariantOptionId: pool.sizeVariantOptionId,
          quantityGrams,
          skuLabels: [sku.sku],
        });
      }
    }

    const prefixes = [
      `Penjualan ${normalizedOrderNumber} - `,
      `Penyesuaian ${normalizedOrderNumber} - `,
      `Pembatalan ${normalizedOrderNumber} - `,
    ];

    const existingLedgers = await db.productInventoryPoolLedger.findMany({
      where: {
        OR: prefixes.map((prefix) => ({
          note: {
            startsWith: prefix,
          },
        })),
        type: {
          in: ["SALE", "UPDATE_SALE", "UPDATE_RETURN", "CANCEL"],
        },
      },
      select: {
        poolId: true,
        productId: true,
        sizeVariantOptionId: true,
        quantityGrams: true,
      },
    });

    const currentByPool = new Map<
      string,
      {
        poolId: string;
        productId: string;
        sizeVariantOptionId: string;
        quantityGrams: number;
      }
    >();

    for (const ledger of existingLedgers) {
      const current = currentByPool.get(ledger.poolId);

      if (current) {
        current.quantityGrams += ledger.quantityGrams;
      } else {
        currentByPool.set(ledger.poolId, {
          poolId: ledger.poolId,
          productId: ledger.productId,
          sizeVariantOptionId: ledger.sizeVariantOptionId,
          quantityGrams: ledger.quantityGrams,
        });
      }
    }

    const affectedPoolIds = new Set<string>([
      ...currentByPool.keys(),
      ...desiredByPool.keys(),
    ]);

    for (const poolId of affectedPoolIds) {
      const current = currentByPool.get(poolId);
      const desired = desiredByPool.get(poolId);

      /**
       * Ledger quantity uses reservation semantics:
       *
       *   SALE / UPDATE_SALE  = negative (grams reserved)
       *   UPDATE_RETURN/CANCEL = positive (grams released)
       *
       * Therefore the net ledger quantity is the inverse of the
       * currently-held reservation. Convert it back to positive grams
       * before comparing it with the desired reservation.
       */
      const currentQuantityGrams = -(current?.quantityGrams ?? 0);
      const desiredQuantityGrams = desired?.quantityGrams ?? 0;
      const deltaGrams = desiredQuantityGrams - currentQuantityGrams;

      if (deltaGrams === 0) {
        continue;
      }

      const productId =
        desired?.productId ??
        current?.productId;

      const sizeVariantOptionId =
        desired?.sizeVariantOptionId ??
        current?.sizeVariantOptionId;

      if (!productId || !sizeVariantOptionId) {
        throw new Error(
          `Metadata pool stok fisik "${poolId}" tidak lengkap saat rekonsiliasi.`,
        );
      }

      const skuLabels = [
        ...new Set([
          ...(desired?.skuLabels ?? []),
        ]),
      ];

      if (deltaGrams > 0) {
        const rows = await db.$queryRaw<
          Array<{
            stockBeforeGrams: number;
            stockAfterGrams: number;
          }>
        >(Prisma.sql`
          UPDATE "ProductInventoryPool"
          SET "stockGrams" = "stockGrams" - ${deltaGrams},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${poolId}
            AND "stockGrams" >= ${deltaGrams}
          RETURNING
            "stockGrams" + ${deltaGrams} AS "stockBeforeGrams",
            "stockGrams" AS "stockAfterGrams"
        `);

        if (rows.length !== 1) {
          const pool = await db.productInventoryPool.findUnique({
            where: {
              id: poolId,
            },
            select: {
              stockGrams: true,
            },
          });

          throw new Error(
            `Stok fisik tidak mencukupi untuk update order ${normalizedOrderNumber}. Dibutuhkan tambahan ${deltaGrams} gram, tersedia ${pool?.stockGrams ?? 0} gram.`,
          );
        }

        const result = rows[0];

        const stockBeforeGrams = Number(result.stockBeforeGrams);
        const stockAfterGrams = Number(result.stockAfterGrams);

        await db.productInventoryPoolLedger.create({
          data: {
            poolId,
            productId,
            sizeVariantOptionId,
            quantityGrams: -deltaGrams,
            stockBeforeGrams,
            stockAfterGrams,
            type: "UPDATE_SALE",
            actorUserId: options.actorUserId ?? null,
            note: `Penyesuaian ${normalizedOrderNumber} - tambah ${deltaGrams} gram${skuLabels.length > 0 ? ` - SKU ${skuLabels.join(", ")}` : ""}`,
          },
        });

        continue;
      }

      const restoreQuantityGrams = Math.abs(deltaGrams);

      const rows = await db.$queryRaw<
        Array<{
          stockBeforeGrams: number | bigint;
          stockAfterGrams: number | bigint;
        }>
      >(Prisma.sql`
        UPDATE "ProductInventoryPool"
        SET "stockGrams" = "stockGrams" + ${restoreQuantityGrams},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${poolId}
        RETURNING
          "stockGrams" - ${restoreQuantityGrams} AS "stockBeforeGrams",
          "stockGrams" AS "stockAfterGrams"
      `);

      if (rows.length !== 1) {
        throw new Error(
          `Pool stok fisik "${poolId}" tidak ditemukan saat mengembalikan perubahan order ${normalizedOrderNumber}.`,
        );
      }

      const result = rows[0];

      const stockBeforeGrams = Number(result.stockBeforeGrams);
      const stockAfterGrams = Number(result.stockAfterGrams);

      await db.productInventoryPoolLedger.create({
        data: {
          poolId,
          productId,
          sizeVariantOptionId,
          quantityGrams: restoreQuantityGrams,
          stockBeforeGrams,
          stockAfterGrams,
          type: "UPDATE_RETURN",
          actorUserId: options.actorUserId ?? null,
          note: `Penyesuaian ${normalizedOrderNumber} - kembalikan ${restoreQuantityGrams} gram${skuLabels.length > 0 ? ` - SKU ${skuLabels.join(", ")}` : ""}`,
        },
      });
    }
  }

  /**
   * Restore the physical reservation that is still held by an order.
   *
   * The net reservation is calculated from all physical inventory
   * mutations belonging to the order. This is important because an
   * order may have been edited before cancellation.
   *
   * Net negative grams = still reserved by the order.
   */
  static async restoreForOrder(
    orderNumber: string,
    options: {
      actorUserId?: string | null;
    },
    db: InventoryDb = prisma,
  ): Promise<void> {
    const normalizedOrderNumber = orderNumber?.trim();

    if (!normalizedOrderNumber) {
      return;
    }

    const prefixes = [
      `Penjualan ${normalizedOrderNumber} - `,
      `Penyesuaian ${normalizedOrderNumber} - `,
      `Pembatalan ${normalizedOrderNumber} - `,
    ];

    const ledgers = await db.productInventoryPoolLedger.findMany({
      where: {
        OR: prefixes.map((prefix) => ({
          note: {
            startsWith: prefix,
          },
        })),
        type: {
          in: ["SALE", "UPDATE_SALE", "UPDATE_RETURN", "CANCEL"],
        },
      },
      select: {
        poolId: true,
        productId: true,
        sizeVariantOptionId: true,
        quantityGrams: true,
      },
    });

    const netByPool = new Map<
      string,
      {
        poolId: string;
        productId: string;
        sizeVariantOptionId: string;
        quantityGrams: number;
      }
    >();

    for (const ledger of ledgers) {
      const current = netByPool.get(ledger.poolId);

      if (current) {
        current.quantityGrams += ledger.quantityGrams;
      } else {
        netByPool.set(ledger.poolId, {
          poolId: ledger.poolId,
          productId: ledger.productId,
          sizeVariantOptionId: ledger.sizeVariantOptionId,
          quantityGrams: ledger.quantityGrams,
        });
      }
    }

    for (const reservation of netByPool.values()) {
      if (reservation.quantityGrams >= 0) {
        continue;
      }

      const restoreQuantityGrams = Math.abs(
        reservation.quantityGrams,
      );

      const rows = await db.$queryRaw<
        Array<{
          stockBeforeGrams: number | bigint;
          stockAfterGrams: number | bigint;
        }>
      >(Prisma.sql`
        UPDATE "ProductInventoryPool"
        SET "stockGrams" = "stockGrams" + ${restoreQuantityGrams},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${reservation.poolId}
        RETURNING
          "stockGrams" - ${restoreQuantityGrams} AS "stockBeforeGrams",
          "stockGrams" AS "stockAfterGrams"
      `);

      if (rows.length !== 1) {
        throw new Error(
          `Pool stok fisik "${reservation.poolId}" tidak ditemukan saat restore order ${normalizedOrderNumber}.`,
        );
      }

      const result = rows[0];

      const stockBeforeGrams = Number(result.stockBeforeGrams);
      const stockAfterGrams = Number(result.stockAfterGrams);

      await db.productInventoryPoolLedger.create({
        data: {
          poolId: reservation.poolId,
          productId: reservation.productId,
          sizeVariantOptionId: reservation.sizeVariantOptionId,
          quantityGrams: restoreQuantityGrams,
          stockBeforeGrams,
          stockAfterGrams,
          type: "CANCEL",
          actorUserId: options.actorUserId ?? null,
          note: `Pembatalan ${normalizedOrderNumber} - restore ${restoreQuantityGrams} gram`,
        },
      });
    }
  }

}

export default ProductPhysicalInventoryService;
