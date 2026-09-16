import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface ProductStockUpdateItem {
  skuId: string;
  stock: number;
}

export interface ProductStockUpdateInput {
  productId: string;
  items: ProductStockUpdateItem[];
}

export class ProductStockService {
  static async updateProductStock(
    input: ProductStockUpdateInput
  ) {
    if (
      typeof input.productId !== "string" ||
      !input.productId.trim()
    ) {
      throw new Error("ID produk tidak valid.");
    }

    if (
      !Array.isArray(input.items) ||
      input.items.length === 0
    ) {
      throw new Error(
        "Minimal satu SKU harus dikirim untuk diperbarui."
      );
    }

    const seenSkuIds = new Set<string>();

    for (const item of input.items) {
      if (
        typeof item.skuId !== "string" ||
        !item.skuId.trim()
      ) {
        throw new Error("ID SKU tidak valid.");
      }

      if (seenSkuIds.has(item.skuId)) {
        throw new Error(
          `SKU "${item.skuId}" dikirim lebih dari satu kali.`
        );
      }

      seenSkuIds.add(item.skuId);

      if (
        !Number.isInteger(item.stock) ||
        item.stock < 0
      ) {
        throw new Error(
          "Stock harus berupa angka bulat lebih dari atau sama dengan 0."
        );
      }
    }

    return prisma.$transaction(
      async (tx) => {
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

        const sortedItems = [...input.items].sort(
          (a, b) => a.skuId.localeCompare(b.skuId)
        );

        const changed: Array<{
          skuId: string;
          sku: string;
          stockBefore: number;
          stockAfter: number;
          quantity: number;
        }> = [];

        for (const item of sortedItems) {
          const lockedRows =
            await tx.$queryRaw<
              Array<{
                id: string;
                sku: string;
                productId: string;
                stock: number;
                isActive: boolean;
              }>
            >(Prisma.sql`
              SELECT
                "id",
                "sku",
                "productId",
                "stock",
                "isActive"
              FROM "ProductSku"
              WHERE
                "id" = ${item.skuId}
                AND "productId" = ${input.productId}
              FOR UPDATE
            `);

          const currentSku = lockedRows[0];

          if (!currentSku) {
            throw new Error(
              "Salah satu SKU tidak ditemukan pada produk ini."
            );
          }

          if (!currentSku.isActive) {
            throw new Error(
              `SKU "${currentSku.sku}" tidak aktif sehingga stock tidak dapat diperbarui.`
            );
          }

          if (currentSku.stock === item.stock) {
            continue;
          }

          const stockBefore = currentSku.stock;
          const stockAfter = item.stock;
          const quantity = stockAfter - stockBefore;

          const updated =
            await tx.productSku.updateMany({
              where: {
                id: currentSku.id,
                productId: input.productId,
                stock: stockBefore,
                isActive: true,
              },
              data: {
                stock: stockAfter,
              },
            });

          if (updated.count !== 1) {
            throw new Error(
              `Stock SKU "${currentSku.sku}" berubah sebelum diperbarui. Silakan muat ulang halaman dan coba lagi.`
            );
          }

          await tx.stockLedger.create({
            data: {
              productId: input.productId,
              skuId: currentSku.id,
              type: "ADJUSTMENT",
              quantity,
              stockBefore,
              stockAfter,
              note: `Penyesuaian stock SKU ${currentSku.sku} melalui Atur Stok Admin.`,
            },
          });

          changed.push({
            skuId: currentSku.id,
            sku: currentSku.sku,
            stockBefore,
            stockAfter,
            quantity,
          });
        }

        const stockAggregate =
          await tx.productSku.aggregate({
            where: {
              productId: input.productId,
              isActive: true,
            },
            _sum: {
              stock: true,
            },
          });

        const totalStock =
          stockAggregate._sum.stock ?? 0;

        await tx.product.update({
          where: {
            id: input.productId,
          },
          data: {
            stock: totalStock,
          },
        });

        return {
          productId: product.id,
          productName: product.name,
          totalStock,
          changed,
          changedCount: changed.length,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
  }
}

export default ProductStockService;
