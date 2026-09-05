import {
  OrderStatus,
  PaymentStatus,
  Role,
  StockLedgerType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * DASHBOARD REPOSITORY
 * ============================================================
 */

export class DashboardRepository {
  /**
   * ==========================================================
   * TOTAL PRODUCTS
   * ==========================================================
   */

  static async countProducts() {
    return prisma.product.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
   * ==========================================================
   * TOTAL CUSTOMERS
   * ==========================================================
   */

  static async countCustomers() {
    return prisma.user.count({
      where: {
        role: Role.CUSTOMER,
        deletedAt: null,
      },
    });
  }

  /**
   * ==========================================================
   * TOTAL ORDERS
   * ==========================================================
   */

  static async countOrders() {
    return prisma.order.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
   * ==========================================================
   * PENDING PAYMENT VERIFICATION
   * ==========================================================
   *
   * Hanya menghitung customer yang:
   *
   * - Sudah upload bukti pembayaran
   * - Bukti pembayaran masih berstatus PENDING
   * - Bukti pembayaran belum dihapus
   *
   * Sumber utama:
   *
   * PaymentProof.status = PENDING
   *
   * ==========================================================
   */

  static async countPendingPayments() {
    return prisma.paymentProof.count({
      where: {
        deletedAt: null,
        status: PaymentStatus.PENDING,
      },
    });
  }

/**
 * ==========================================================
 * TOTAL SALES
 * ==========================================================
 *
 * Penjualan yang sudah terealisasi:
 *
 * - Order tidak dihapus
 * - Payment sudah VERIFIED
 * - Menggunakan Order.total sebagai snapshot transaksi
 *
 * Definisi ini harus konsisten dengan:
 * - SALES LAST 7 DAYS
 * - SALES BY CATEGORY
 */
static async sumTotalSales() {
  const result = await prisma.order.aggregate({
    where: {
      deletedAt: null,
      paymentStatus: PaymentStatus.VERIFIED,
    },
    _sum: {
      total: true,
    },
  });

  return Number(result._sum.total ?? 0);
}

  /**
   * ==========================================================
   * TOTAL CUSTOMER POINTS
   * ==========================================================
   *
   * rewardPointsBalance adalah cached balance customer.
   */

  static async sumCustomerRewardPoints() {
    const result = await prisma.user.aggregate({
      where: {
        role: Role.CUSTOMER,
        deletedAt: null,
      },
      _sum: {
        rewardPointsBalance: true,
      },
    });

    return result._sum.rewardPointsBalance ?? 0;
  }

  /**
   * ==========================================================
   * TODAY ORDERS
   * ==========================================================
   *
   * Menggunakan rentang hari berdasarkan waktu server aplikasi.
   */

  static async countTodayOrders() {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(
      startOfTomorrow.getDate() + 1
    );

    return prisma.order.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
    });
  }

/**
 * ==========================================================
 * TODAY SALES
 * ==========================================================
 *
 * Penjualan yang terealisasi hari ini:
 *
 * - Order tidak dihapus
 * - Payment sudah VERIFIED
 * - paidAt berada pada hari ini
 *
 * Hari menggunakan waktu lokal server aplikasi.
 */
static async sumTodaySales() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const result = await prisma.order.aggregate({
    where: {
      deletedAt: null,
      paymentStatus: PaymentStatus.VERIFIED,
      paidAt: {
        gte: startOfToday,
        lt: startOfTomorrow,
      },
    },
    _sum: {
      total: true,
    },
  });

  return Number(result._sum.total ?? 0);
}

  /**
   * ==========================================================
   * SALES LAST 7 DAYS
   * ==========================================================
   *
   * Penjualan dihitung berdasarkan:
   *
   * - Order tidak dihapus
   * - Payment sudah VERIFIED
   * - paidAt berada dalam 7 hari terakhir
   *
   * Tanggal chart menggunakan tanggal lokal server aplikasi.
   */

  static async findSalesLast7Days() {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startDate = new Date(startOfToday);
    startDate.setDate(
      startDate.getDate() - 6
    );

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(
      startOfTomorrow.getDate() + 1
    );

    const orders = await prisma.order.findMany({
      where: {
        deletedAt: null,
        paymentStatus: PaymentStatus.VERIFIED,
        paidAt: {
          gte: startDate,
          lt: startOfTomorrow,
        },
      },
      select: {
        total: true,
        paidAt: true,
      },
      orderBy: {
        paidAt: "asc",
      },
    });

    const salesByDate = new Map<string, number>();

    for (let index = 0; index < 7; index += 1) {
      const date = new Date(startDate);

      date.setDate(
        startDate.getDate() + index
      );

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      salesByDate.set(key, 0);
    }

    for (const order of orders) {
      if (!order.paidAt) {
        continue;
      }

      const paidAt = new Date(order.paidAt);

      const key = [
        paidAt.getFullYear(),
        String(paidAt.getMonth() + 1).padStart(2, "0"),
        String(paidAt.getDate()).padStart(2, "0"),
      ].join("-");

      if (salesByDate.has(key)) {
        salesByDate.set(
          key,
          (salesByDate.get(key) ?? 0) +
            Number(order.total)
        );
      }
    }

    return Array.from(
      salesByDate.entries()
    ).map(([date, sales]) => {
      const [
        year,
        month,
        day,
      ] = date.split("-").map(Number);

      const parsedDate = new Date(
        year,
        month - 1,
        day
      );

      return {
        date,
        label: new Intl.DateTimeFormat(
          "id-ID",
          {
            day: "2-digit",
            month: "short",
          }
        ).format(parsedDate),
        sales,
      };
    });
  }

  /**
   * ==========================================================
   * ORDER STATUS SUMMARY
   * ==========================================================
   *
   * Menampilkan jumlah order berdasarkan status saat ini.
   *
   * Semua status OrderStatus selalu dikembalikan,
   * termasuk status dengan jumlah 0.
   *
   * Order yang sudah di-soft-delete tidak dihitung.
   */

  static async countOrdersByStatus() {
    const groupedOrders =
      await prisma.order.groupBy({
        by: ["status"],
        where: {
          deletedAt: null,
        },
        _count: {
          _all: true,
        },
      });

    const counts: Record<
      OrderStatus,
      number
    > = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.WAITING_PAYMENT]: 0,
      [OrderStatus.WAITING_VERIFICATION]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.SHIPPING]: 0,
      [OrderStatus.COMPLETED]: 0,
      [OrderStatus.CANCELLED]: 0,
    };

    for (const item of groupedOrders) {
      counts[item.status] =
        item._count._all;
    }

    return counts;
  }

    /**
   * ==========================================================
   * SALES BY CATEGORY
   * ==========================================================
   *
   * Menghitung total penjualan berdasarkan kategori produk.
   *
   * Sumber nilai transaksi:
   * OrderItem.subtotal
   *
   * Hanya transaksi yang:
   * - belum di-soft-delete
   * - paymentStatus = VERIFIED
   *
   * Category diambil melalui relasi:
   *
   * OrderItem
   *   -> Product
   *      -> Category
   *
   * Tidak menggunakan Product.price karena harga tersebut
   * adalah harga katalog saat ini, bukan snapshot transaksi.
   */
  static async findSalesByCategory() {
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          deletedAt: null,
          paymentStatus: PaymentStatus.VERIFIED,
        },
      },
      select: {
        subtotal: true,
        product: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const salesByCategory = new Map<
      string,
      {
        id: string;
        name: string;
        sales: number;
      }
    >();

    for (const item of items) {
      const category = item.product.category;

      if (!category) {
        continue;
      }

      const existing = salesByCategory.get(category.id);

      if (existing) {
        existing.sales += Number(item.subtotal);
      } else {
        salesByCategory.set(category.id, {
          id: category.id,
          name: category.name,
          sales: Number(item.subtotal),
        });
      }
    }

    return Array.from(salesByCategory.values())
      .sort((a, b) => b.sales - a.sales)
      .map((item) => ({
        id: item.id,
        name: item.name,
        sales: item.sales,
      }));
  }

    /**
   * ==========================================================
   * LOW STOCK SKUS
   * ==========================================================
   *
   * Menampilkan SKU aktif dengan stok rendah.
   *
   * Sumber stok:
   * ProductSku.stock
   *
   * Hanya SKU yang:
   * - aktif
   * - produknya belum di-soft-delete
   * - stock <= threshold
   *
   * Diurutkan dari stok paling sedikit.
   */
  static async findLowStockSkus(
    limit = 5,
    threshold = 10
  ) {
    const skus = await prisma.productSku.findMany({
      take: limit,
      where: {
        isActive: true,
        stock: {
          lte: threshold,
        },
        product: {
          deletedAt: null,
        },
      },
      orderBy: [
        {
          stock: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
      select: {
        id: true,
        sku: true,
        productId: true,
        stock: true,
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    return skus.map((item) => ({
      id: item.id,
      sku: item.sku,
      productId: item.productId,
      productName: item.product.name,
      stock: item.stock,
    }));
  }

    /**
   * ==========================================================
   * RECENT PAYMENT ACTIVITIES
   * ==========================================================
   *
   * Hanya pembayaran yang sudah diverifikasi.
   *
   * verifiedAt adalah timestamp event yang digunakan.
   */
  static async findRecentPaymentActivities(limit = 5) {
    const payments = await prisma.paymentProof.findMany({
      take: limit,
      where: {
        deletedAt: null,
        status: PaymentStatus.VERIFIED,
        verifiedAt: {
          not: null,
        },
      },
      orderBy: {
        verifiedAt: "desc",
      },
      select: {
        id: true,
        verifiedAt: true,
        order: {
          select: {
            orderNumber: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return payments
      .filter(
        (
          payment
        ): payment is typeof payment & {
          verifiedAt: Date;
        } => payment.verifiedAt !== null
      )
      .map((payment) => ({
        id: payment.id,
        orderNumber: payment.order.orderNumber,
        customerName: payment.order.user.name,
        createdAt: payment.verifiedAt,
      }));
  }

    /**
   * ==========================================================
   * RECENT REWARD ACTIVITIES
   * ==========================================================
   *
   * Claim reward terbaru dari customer.
   */
  static async findRecentRewardActivities(limit = 5) {
    const claims = await prisma.rewardClaim.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        rewardName: true,
        pointsSpent: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return claims.map((claim) => ({
      id: claim.id,
      customerName: claim.user.name,
      rewardName: claim.rewardName,
      pointsSpent: claim.pointsSpent,
      status: claim.status,
      createdAt: claim.createdAt,
    }));
  }

    /**
   * ==========================================================
   * RECENT ORDER ACTIVITIES
   * ==========================================================
   *
   * Order terbaru berdasarkan createdAt.
   */
  static async findRecentOrderActivities(limit = 5) {
    const orders = await prisma.order.findMany({
      take: limit,
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt,
    }));
  }

    /**
   * ==========================================================
   * RECENT STOCK ACTIVITIES
   * ==========================================================
   *
   * Mengambil perubahan stok terbaru dari StockLedger.
   *
   * Sumber stok canonical:
   * ProductSku.stock
   *
   * Histori:
   * - SALE
   * - RESTOCK
   * - ADJUSTMENT
   * - RETURN
   * - CANCEL
   *
   * Tidak menggunakan field `note` sebagai sumber utama
   * karena label aktivitas ditentukan berdasarkan type.
   */
  static async findRecentStockActivities(
    limit = 5
  ) {
    const ledgers = await prisma.stockLedger.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        quantity: true,
        stockBefore: true,
        stockAfter: true,
        createdAt: true,
        sku: {
          select: {
            sku: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    return ledgers.map((ledger) => ({
      id: ledger.id,
      type: ledger.type as StockLedgerType,
      quantity: ledger.quantity,
      stockBefore: ledger.stockBefore,
      stockAfter: ledger.stockAfter,
      productName: ledger.product.name,
      sku: ledger.sku?.sku ?? null,
      orderNumber: ledger.order?.orderNumber ?? null,
      createdAt: ledger.createdAt,
    }));
  }

    /**
   * ==========================================================
   * RECENT ACTIVITIES
   * ==========================================================
   *
   * Menggabungkan aktivitas terbaru dari:
   * - Order
   * - PaymentProof
   * - RewardClaim
   * - StockLedger
   *
   * Masing-masing sumber tetap menggunakan timestamp event
   * yang sesuai dengan domain-nya.
   */
  static async findRecentActivities(limit = 8) {
    const sourceLimit = Math.max(limit, 5);

    const [
      orders,
      payments,
      rewards,
      stockActivities,
    ] = await Promise.all([
      this.findRecentOrderActivities(sourceLimit),
      this.findRecentPaymentActivities(sourceLimit),
      this.findRecentRewardActivities(sourceLimit),
      this.findRecentStockActivities(sourceLimit),
    ]);

    const activities = [
      ...orders.map((order) => ({
        id: `order-${order.id}`,
        type: "ORDER" as const,
        title: "Order baru",
        description: `${order.customerName} membuat order ${order.orderNumber}.`,
        createdAt: order.createdAt,
      })),

      ...payments.map((payment) => ({
        id: `payment-${payment.id}`,
        type: "PAYMENT" as const,
        title: "Pembayaran diverifikasi",
        description: `Pembayaran ${payment.orderNumber} milik ${payment.customerName} telah diverifikasi.`,
        createdAt: payment.createdAt,
      })),

      ...rewards.map((reward) => ({
        id: `reward-${reward.id}`,
        type: "REWARD" as const,
        title: "Reward diklaim",
        description: `${reward.customerName} mengklaim ${reward.rewardName}.`,
        createdAt: reward.createdAt,
      })),

      ...stockActivities.map((stock) => ({
        id: `stock-${stock.id}`,
        type: "STOCK" as const,
        title: getStockActivityTitle(stock.type),
        description: buildStockActivityDescription(stock),
        createdAt: stock.createdAt,
      })),
    ];

    return activities
      .sort(
        (a, b) =>
          b.createdAt.getTime() -
          a.createdAt.getTime()
      )
      .slice(0, limit);
  }

  /**
   * ==========================================================
   * RECENT ORDERS
   * ==========================================================
   */

  static async findRecentOrders(
    limit = 5
  ) {
    return prisma.order.findMany({
      take: limit,
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        paymentProof: true,
      },
    });
  }

  /**
   * ==========================================================
   * RECENT CUSTOMERS
   * ==========================================================
   */

  static async findRecentCustomers(
    limit = 5
  ) {
    return prisma.user.findMany({
      take: limit,
      where: {
        role: Role.CUSTOMER,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

function getStockActivityTitle(
  type: StockLedgerType
) {
  switch (type) {
    case StockLedgerType.SALE:
      return "Stok terjual";

    case StockLedgerType.RESTOCK:
      return "Stok ditambah";

    case StockLedgerType.ADJUSTMENT:
      return "Stok disesuaikan";

    case StockLedgerType.RETURN:
      return "Stok dikembalikan";

    case StockLedgerType.CANCEL:
      return "Stok dikembalikan karena pembatalan";

    default:
      return "Aktivitas stok";
  }
}

function buildStockActivityDescription(stock: {
  productName: string;
  sku: string | null;
  stockBefore: number;
  stockAfter: number;
  orderNumber: string | null;
}) {
  const productLabel = stock.sku
    ? `${stock.productName} (${stock.sku})`
    : stock.productName;

  const orderLabel = stock.orderNumber
    ? ` Order ${stock.orderNumber}.`
    : "";

  return `${productLabel}: stok ${stock.stockBefore} → ${stock.stockAfter}.${orderLabel}`;
}

export default DashboardRepository;
