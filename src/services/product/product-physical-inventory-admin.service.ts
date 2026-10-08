import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/services/audit/audit-log.service";

type InventoryAdminDb = typeof prisma | Prisma.TransactionClient;

export interface PhysicalInventoryAdminAdjustment {
  poolId: string;
  quantityGrams: number;
  note: string;
}

export interface AdjustProductPhysicalInventoryInput {
  productId: string;
  adjustments: PhysicalInventoryAdminAdjustment[];
}

/**
 * Admin write path for physical inventory.
 *
 * ProductInventoryPool.stockGrams is the canonical physical stock.
 * ProductSku.stock is deliberately not touched here.
 */
export class ProductPhysicalInventoryAdminService {
  static async adjust(
    input: AdjustProductPhysicalInventoryInput,
    actorUserId: string,
    db: InventoryAdminDb = prisma,
  ) {
    if (!input.productId?.trim()) {
      throw new Error("ID produk tidak valid.");
    }

    if (!actorUserId?.trim()) {
      throw new Error("Admin tidak valid.");
    }

    if (!Array.isArray(input.adjustments) || input.adjustments.length === 0) {
      throw new Error("Minimal satu penyesuaian stok fisik harus dikirim.");
    }

    const normalized = input.adjustments.map((item) => ({
      poolId: item.poolId?.trim(),
      quantityGrams: item.quantityGrams,
      note: item.note?.trim(),
    }));

    const seenPoolIds = new Set<string>();

    for (const item of normalized) {
      if (!item.poolId) {
        throw new Error("ID inventory pool tidak valid.");
      }

      if (seenPoolIds.has(item.poolId)) {
        throw new Error(
          `Inventory pool "${item.poolId}" dikirim lebih dari satu kali.`,
        );
      }

      seenPoolIds.add(item.poolId);

      if (!Number.isInteger(item.quantityGrams) || item.quantityGrams === 0) {
        throw new Error(
          "Penyesuaian stok harus berupa angka gram bulat dan tidak boleh 0.",
        );
      }

      if (Math.abs(item.quantityGrams) > 1_000_000_000) {
        throw new Error("Penyesuaian stok terlalu besar.");
      }

      if (!item.note || item.note.length < 3) {
        throw new Error("Catatan penyesuaian wajib diisi.");
      }

      if (item.note.length > 500) {
        throw new Error("Catatan penyesuaian maksimal 500 karakter.");
      }
    }

    const run = async (tx: Prisma.TransactionClient) => {
      const product = await tx.product.findFirst({
        where: {
          id: input.productId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!product) {
        throw new Error("Produk tidak ditemukan.");
      }

      const changed: Array<{
        poolId: string;
        sizeVariantOptionId: string;
        stockBeforeGrams: number;
        stockAfterGrams: number;
        quantityGrams: number;
        note: string;
      }> = [];

      const sorted = [...normalized].sort((a, b) =>
        a.poolId.localeCompare(b.poolId),
      );

      for (const adjustment of sorted) {
        const pools = await tx.$queryRaw<
          Array<{
            id: string;
            productId: string;
            sizeVariantOptionId: string;
            stockGrams: number | bigint;
          }>
        >(Prisma.sql`
          SELECT
            "id",
            "productId",
            "sizeVariantOptionId",
            "stockGrams"
          FROM "ProductInventoryPool"
          WHERE
            "id" = ${adjustment.poolId}
            AND "productId" = ${input.productId}
          FOR UPDATE
        `);

        const pool = pools[0];

        if (!pool) {
          throw new Error(
            "Inventory pool tidak ditemukan pada produk ini.",
          );
        }

        const rows = await tx.$queryRaw<
          Array<{
            stockBeforeGrams: number | bigint;
            stockAfterGrams: number | bigint;
          }>
        >(Prisma.sql`
          UPDATE "ProductInventoryPool"
          SET
            "stockGrams" = "stockGrams" + ${adjustment.quantityGrams},
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE
            "id" = ${adjustment.poolId}
            AND "productId" = ${input.productId}
            AND "stockGrams" + ${adjustment.quantityGrams} >= 0
          RETURNING
            "stockGrams" - ${adjustment.quantityGrams} AS "stockBeforeGrams",
            "stockGrams" AS "stockAfterGrams"
        `);

        if (rows.length !== 1) {
          const current = await tx.productInventoryPool.findUnique({
            where: { id: adjustment.poolId },
            select: { stockGrams: true },
          });

          throw new Error(
            `Penyesuaian ditolak karena stok fisik tidak boleh negatif. Stok tersedia ${current?.stockGrams ?? 0} gram.`,
          );
        }

        const stockBeforeGrams = Number(rows[0].stockBeforeGrams);
        const stockAfterGrams = Number(rows[0].stockAfterGrams);

        await tx.productInventoryPoolLedger.create({
          data: {
            poolId: pool.id,
            productId: pool.productId,
            sizeVariantOptionId: pool.sizeVariantOptionId,
            quantityGrams: adjustment.quantityGrams,
            stockBeforeGrams,
            stockAfterGrams,
            type: "ADMIN_ADJUSTMENT",
            actorUserId,
            note: adjustment.note,
          },
        });

        await createAuditLog(
          {
            eventType: "PHYSICAL_STOCK_ADJUSTED",
            entityType: "PRODUCT_INVENTORY_POOL",
            entityId: pool.id,
            action: "ADJUST_PHYSICAL_STOCK",
            actorType: "ADMIN",
            actorId: actorUserId,
            beforeData: {
              stockGrams: stockBeforeGrams,
            },
            afterData: {
              stockGrams: stockAfterGrams,
            },
            metadata: {
              productId: pool.productId,
              poolId: pool.id,
              sizeVariantOptionId: pool.sizeVariantOptionId,
              quantityGrams: adjustment.quantityGrams,
              note: adjustment.note,
            },
          },
          tx,
        );

        changed.push({
          poolId: pool.id,
          sizeVariantOptionId: pool.sizeVariantOptionId,
          stockBeforeGrams,
          stockAfterGrams,
          quantityGrams: adjustment.quantityGrams,
          note: adjustment.note,
        });
      }

      return {
        productId: product.id,
        productName: product.name,
        changed,
        changedCount: changed.length,
      };
    };

    if (db === prisma) {
      return prisma.$transaction(run, {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      });
    }

    return run(db);
  }

  static async setByUnits(
    input: {
      productId: string;
      unitEdits: Array<{ skuId: string; desiredUnits: number }>;
      note: string;
    },
    actorUserId: string,
    db: InventoryAdminDb = prisma,
  ) {
    if (!input.productId?.trim()) {
      throw new Error("ID produk tidak valid.");
    }
    if (!actorUserId?.trim()) {
      throw new Error("Admin tidak valid.");
    }
    if (!Array.isArray(input.unitEdits) || input.unitEdits.length === 0) {
      throw new Error("Minimal satu stok unit harus diubah.");
    }

    const note = input.note?.trim();
    if (!note || note.length < 3) {
      throw new Error("Catatan penyesuaian wajib diisi.");
    }
    if (note.length > 500) {
      throw new Error("Catatan penyesuaian maksimal 500 karakter.");
    }

    const normalized = input.unitEdits.map((item) => ({
      skuId: item.skuId?.trim(),
      desiredUnits: item.desiredUnits,
    }));
    const seenSkuIds = new Set<string>();

    for (const item of normalized) {
      if (!item.skuId) {
        throw new Error("ID SKU tidak valid.");
      }
      if (seenSkuIds.has(item.skuId)) {
        throw new Error(`SKU "${item.skuId}" dikirim lebih dari satu kali.`);
      }
      seenSkuIds.add(item.skuId);
      if (!Number.isInteger(item.desiredUnits) || item.desiredUnits < 0) {
        throw new Error("Stok unit harus berupa angka bulat >= 0.");
      }
      if (item.desiredUnits > 1_000_000) {
        throw new Error("Stok unit terlalu besar.");
      }
    }

    const run = async (tx: Prisma.TransactionClient) => {
      const product = await tx.product.findFirst({
        where: { id: input.productId, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!product) throw new Error("Produk tidak ditemukan.");

      const skus = await tx.productSku.findMany({
        where: { id: { in: normalized.map((item) => item.skuId) }, productId: input.productId, isActive: true },
        select: {
          id: true,
          sku: true,
          skuOptions: {
            select: {
              variantOption: {
                select: {
                  id: true,
                  label: true,
                  group: { select: { name: true } },
                },
              },
            },
          },
          product: {
            select: {
              inventoryPools: {
                select: { id: true, sizeVariantOptionId: true, stockGrams: true },
              },
            },
          },
        },
      });

      if (skus.length !== normalized.length) {
        throw new Error("Salah satu SKU tidak ditemukan atau tidak aktif.");
      }

      const skuMap = new Map(skus.map((sku) => [sku.id, sku]));
      const desiredByPool = new Map<string, { desiredGrams: number; skuIds: string[] }>();

      for (const edit of normalized) {
        const sku = skuMap.get(edit.skuId);
        if (!sku) throw new Error("SKU tidak ditemukan.");
        if (sku.product.inventoryPools.length === 0) {
          throw new Error(`SKU "${sku.sku}" bukan bagian dari Physical Inventory Pool.`);
        }

        const sizeOption = sku.skuOptions.find(
          (option) => option.variantOption.group.name.trim().toLowerCase() === "ukuran",
        );
        const weightOption = sku.skuOptions.find(
          (option) => option.variantOption.group.name.trim().toLowerCase() === "berat",
        );
        if (!sizeOption || !weightOption) {
          throw new Error(`SKU "${sku.sku}" tidak memiliki mapping Ukuran/Berat yang valid.`);
        }

        const weightLabel = weightOption.variantOption.label.trim().toLowerCase();
        const match = weightLabel.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilogram|gram|gr|g)?/i);
        let weightGrams: number | null = null;
        if (match) {
          const value = Number(match[1].replace(",", "."));
          const unit = (match[2] ?? "gram").toLowerCase();
          if (Number.isFinite(value) && value > 0) {
            weightGrams = unit === "kg" || unit === "kilogram" ? Math.round(value * 1000) : Math.round(value);
          }
        }
        if (!weightGrams || weightGrams <= 0) {
          throw new Error(`Berat SKU "${sku.sku}" tidak valid.`);
        }

        const pool = sku.product.inventoryPools.find(
          (candidate) => candidate.sizeVariantOptionId === sizeOption.variantOption.id,
        );
        if (!pool) {
          throw new Error(`Pool ukuran untuk SKU "${sku.sku}" tidak ditemukan.`);
        }

        const desiredGrams = weightGrams * edit.desiredUnits;
        const existing = desiredByPool.get(pool.id);
        if (existing && existing.desiredGrams !== desiredGrams) {
          throw new Error(
            `Stok unit untuk beberapa SKU pada pool yang sama menghasilkan target gram yang berbeda. Ubah satu SKU per pool atau gunakan Stok Fisik (gram).`,
          );
        }
        desiredByPool.set(pool.id, {
          desiredGrams,
          skuIds: [...(existing?.skuIds ?? []), sku.id],
        });
      }

      const changed: Array<{
        poolId: string;
        stockBeforeGrams: number;
        stockAfterGrams: number;
        quantityGrams: number;
      }> = [];

      for (const [poolId, target] of [...desiredByPool.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        const pools = await tx.$queryRaw<Array<{
          id: string;
          productId: string;
          sizeVariantOptionId: string;
          stockGrams: number | bigint;
        }>>(Prisma.sql`
          SELECT "id", "productId", "sizeVariantOptionId", "stockGrams"
          FROM "ProductInventoryPool"
          WHERE "id" = ${poolId} AND "productId" = ${input.productId}
          FOR UPDATE
        `);
        const pool = pools[0];
        if (!pool) throw new Error("Inventory pool tidak ditemukan pada produk ini.");

        const before = Number(pool.stockGrams);
        const delta = target.desiredGrams - before;
        if (delta === 0) continue;

        const rows = await tx.$queryRaw<Array<{
          stockBeforeGrams: number | bigint;
          stockAfterGrams: number | bigint;
        }>>(Prisma.sql`
          UPDATE "ProductInventoryPool"
          SET "stockGrams" = "stockGrams" + ${delta}, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${poolId}
            AND "productId" = ${input.productId}
            AND "stockGrams" + ${delta} >= 0
          RETURNING
            "stockGrams" - ${delta} AS "stockBeforeGrams",
            "stockGrams" AS "stockAfterGrams"
        `);
        if (rows.length !== 1) {
          throw new Error("Stok fisik hasil pengaturan unit tidak boleh negatif.");
        }

        const stockBeforeGrams = Number(rows[0].stockBeforeGrams);
        const stockAfterGrams = Number(rows[0].stockAfterGrams);
        await tx.productInventoryPoolLedger.create({
          data: {
            poolId: pool.id,
            productId: pool.productId,
            sizeVariantOptionId: pool.sizeVariantOptionId,
            quantityGrams: delta,
            stockBeforeGrams,
            stockAfterGrams,
            type: "ADMIN_ADJUSTMENT",
            actorUserId,
            note: `Set stok unit: ${note}`,
          },
        });
        await createAuditLog(
          {
            eventType: "PHYSICAL_STOCK_ADJUSTED",
            entityType: "PRODUCT_INVENTORY_POOL",
            entityId: pool.id,
            action: "SET_PHYSICAL_STOCK_BY_UNITS",
            actorType: "ADMIN",
            actorId: actorUserId,
            beforeData: { stockGrams: stockBeforeGrams },
            afterData: { stockGrams: stockAfterGrams },
            metadata: {
              productId: pool.productId,
              poolId: pool.id,
              quantityGrams: delta,
              targetStockGrams: target.desiredGrams,
              skuIds: target.skuIds,
              note,
            },
          },
          tx,
        );
        changed.push({ poolId, stockBeforeGrams, stockAfterGrams, quantityGrams: delta });
      }

      return { productId: product.id, productName: product.name, changed, changedCount: changed.length };
    };

    if (db === prisma) {
      return prisma.$transaction(run, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    }
    return run(db);
  }
}

export default ProductPhysicalInventoryAdminService;
