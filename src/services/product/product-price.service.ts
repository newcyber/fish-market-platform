import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface ProductPriceUpdateItem {
  skuId: string;
  price: number;
}

export interface ProductPriceUpdateInput {
  productId: string;
  items: ProductPriceUpdateItem[];
}

const MAX_PRICE = Number.MAX_SAFE_INTEGER;

export class ProductPriceService {
  static async updateProductPrice(input: ProductPriceUpdateInput) {
    if (typeof input.productId !== "string" || !input.productId.trim()) {
      throw new Error("ID produk tidak valid.");
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new Error("Minimal satu SKU harus dikirim untuk diperbarui.");
    }

    const seenSkuIds = new Set<string>();

    for (const item of input.items) {
      if (typeof item.skuId !== "string" || !item.skuId.trim()) {
        throw new Error("ID SKU tidak valid.");
      }

      if (seenSkuIds.has(item.skuId)) {
        throw new Error(`SKU "${item.skuId}" dikirim lebih dari satu kali.`);
      }
      seenSkuIds.add(item.skuId);

      if (
        !Number.isSafeInteger(item.price) ||
        item.price < 0 ||
        item.price > MAX_PRICE
      ) {
        throw new Error("Harga harus berupa angka bulat >= 0 yang valid.");
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

        const sortedItems = [...input.items].sort((a, b) =>
          a.skuId.localeCompare(b.skuId)
        );

        const changed: Array<{
          skuId: string;
          sku: string;
          priceBefore: number;
          priceAfter: number;
        }> = [];

        for (const item of sortedItems) {
          const lockedRows = await tx.$queryRaw<
            Array<{
              id: string;
              sku: string;
              productId: string;
              price: Prisma.Decimal;
              isActive: boolean;
            }>
          >(Prisma.sql`
            SELECT
              "id",
              "sku",
              "productId",
              "price",
              "isActive"
            FROM "ProductSku"
            WHERE
              "id" = ${item.skuId}
              AND "productId" = ${input.productId}
            FOR UPDATE
          `);

          const currentSku = lockedRows[0];

          if (!currentSku) {
            throw new Error("Salah satu SKU tidak ditemukan pada produk ini.");
          }

          if (!currentSku.isActive) {
            throw new Error(
              `SKU "${currentSku.sku}" tidak aktif sehingga harga tidak dapat diperbarui.`
            );
          }

          const priceBefore = Number(currentSku.price);

          if (priceBefore === item.price) continue;

          await tx.productSku.update({
            where: {
              id: currentSku.id,
            },
            data: {
              price: item.price,
            },
          });

          changed.push({
            skuId: currentSku.id,
            sku: currentSku.sku,
            priceBefore,
            priceAfter: item.price,
          });
        }

        const activeSkus = await tx.productSku.findMany({
          where: {
            productId: input.productId,
            isActive: true,
          },
          select: {
            price: true,
          },
          orderBy: {
            price: "asc",
          },
          take: 1,
        });

        if (activeSkus.length === 0) {
          throw new Error("Produk tidak memiliki SKU aktif.");
        }

        // Product.price tetap menjadi mirror untuk listing/display.
        // Untuk produk bervarian, gunakan harga SKU aktif terendah.
        await tx.product.update({
          where: {
            id: input.productId,
          },
          data: {
            price: activeSkus[0].price,
          },
        });

        return {
          productId: product.id,
          productName: product.name,
          productPrice: Number(activeSkus[0].price),
          changed,
          changedCount: changed.length,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
  }
}

export default ProductPriceService;
