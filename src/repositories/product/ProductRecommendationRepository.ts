import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export class ProductRecommendationRepository {
  /**
   * ============================================================
   * FREQUENTLY BOUGHT TOGETHER
   * ============================================================
   *
   * Product lain yang paling sering muncul dalam order COMPLETED
   * yang juga mengandung productId target.
   *
   * Ranking berdasarkan jumlah ORDER, bukan quantity.
   */
  static async findFrequentlyBoughtTogether(
    productId: string,
    limit = 8
  ) {
    const safeLimit = Math.min(
      20,
      Math.max(1, Math.floor(limit))
    );

    const sourceItems =
      await prisma.orderItem.findMany({
        where: {
          productId,

          order: {
            status: OrderStatus.COMPLETED,
          },
        },

        select: {
          orderId: true,
        },

        distinct: ["orderId"],
      });

    const orderIds = sourceItems.map(
      (item) => item.orderId
    );

    if (orderIds.length === 0) {
      return [];
    }

    const candidateItems =
      await prisma.orderItem.findMany({
        where: {
          orderId: {
            in: orderIds,
          },

          productId: {
            not: productId,
          },

          product: {
            deletedAt: null,
            isPublished: true,
          },
        },

        select: {
          orderId: true,
          productId: true,
        },
      });

    /**
     * Satu product hanya dihitung satu kali per order.
     */
    const productOrders =
      new Map<string, Set<string>>();

    for (const item of candidateItems) {
      let orders =
        productOrders.get(
          item.productId
        );

      if (!orders) {
        orders = new Set<string>();

        productOrders.set(
          item.productId,
          orders
        );
      }

      orders.add(item.orderId);
    }

    const ranked =
      [...productOrders.entries()]
        .map(
          ([candidateProductId, orders]) => ({
            productId:
              candidateProductId,

            purchaseCount:
              orders.size,
          })
        )
        .sort(
          (a, b) =>
            b.purchaseCount -
            a.purchaseCount
        )
        .slice(0, safeLimit);

    if (ranked.length === 0) {
      return [];
    }

    /**
     * Ambil data product dalam satu query.
     */
    const products =
      await prisma.product.findMany({
        where: {
          id: {
            in: ranked.map(
              (item) => item.productId
            ),
          },

          deletedAt: null,
          isPublished: true,
        },

        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },

            take: 1,
          },

          skus: {
            where: {
              isActive: true,
            },

            select: {
              id: true,
              price: true,
              stock: true,
            },

            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    const productMap =
      new Map(
        products.map(
          (product) => [
            product.id,
            product,
          ]
        )
      );

    return ranked
      .map((item) => {
        const product =
          productMap.get(
            item.productId
          );

        if (!product) {
          return null;
        }

        const prices =
          product.skus
            .map((sku) =>
              Number(sku.price)
            )
            .filter(
              (price) =>
                Number.isFinite(price) &&
                price >= 0
            );

        const stock =
          product.skus.reduce(
            (total, sku) =>
              total +
              Math.max(
                0,
                sku.stock
              ),
            0
          );

        const price =
          prices.length > 0
            ? Math.min(...prices)
            : Number(product.price);

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price,
          stock,
          images: product.images,
          hasVariants:
            product.skus.length > 1,
          purchaseCount:
            item.purchaseCount,
        };
      })
      .filter(
        (
          product
        ): product is NonNullable<
          typeof product
        > => product !== null
      );
  }

  /**
   * ============================================================
   * RELATED PRODUCTS
   * ============================================================
   *
   * Product public lain dari kategori yang sama.
   */
  static async findRelatedProducts(
    productId: string,
    categoryId: string,
    limit = 8
  ) {
    const safeLimit = Math.min(
      20,
      Math.max(1, Math.floor(limit))
    );

    const products =
      await prisma.product.findMany({
        where: {
          id: {
            not: productId,
          },

          categoryId,

          deletedAt: null,
          isPublished: true,
        },

        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },

            take: 1,
          },

          skus: {
            where: {
              isActive: true,
            },

            select: {
              id: true,
              price: true,
              stock: true,
            },

            orderBy: {
              createdAt: "asc",
            },
          },
        },

        orderBy: [
          {
            featured: "desc",
          },
          {
            createdAt: "desc",
          },
        ],

        take: safeLimit,
      });

    return products.map(
      (product) => {
        const prices =
          product.skus
            .map((sku) =>
              Number(sku.price)
            )
            .filter(
              (price) =>
                Number.isFinite(price) &&
                price >= 0
            );

        const price =
          prices.length > 0
            ? Math.min(...prices)
            : Number(product.price);

        const stock =
          product.skus.reduce(
            (total, sku) =>
              total +
              Math.max(
                0,
                sku.stock
              ),
            0
          );

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price,
          stock,
          images: product.images,
          hasVariants:
            product.skus.length > 1,
        };
      }
    );
  }
}

export default ProductRecommendationRepository;
