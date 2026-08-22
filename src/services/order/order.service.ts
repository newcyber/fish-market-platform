import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import OrderRepository, {
  type OrderFilters,
} from "@/repositories/OrderRepository";

import {
  StorageService,
} from "@/services/storage/storage.service";

import notificationService from "@/services/notification/notification.service";

import ProductPricingService from "@/services/pricing/product-pricing.service";

import { VoucherService } from "@/services/voucher/voucher.service";

import { VoucherRepository } from "@/repositories/voucher/voucher.repository";

import VoucherLifecycleService from "@/services/voucher/voucher-lifecycle.service";

import FlashSaleCheckoutService, {
  FlashSaleCheckoutRequirement,
} from "@/services/flash-sale/flash-sale-checkout.service";

import type {
  ShippingProviderCode,
} from "@/services/shipping/shipping.types";

import shippingService from "@/services/shipping/shipping.service";

import settingsService from "@/services/settings/settings.service";

export interface OrderDashboardSummary {
  totalOrders: number;
  pendingPayments: number;
  pendingOrders: number;
  completedOrders: number;
  deletedOrders: number;
}

export interface CreateOrderItemInput {
  productId: string;

  quantity: number;

  productVariant?: string | null;

  productWeight?: string | null;

  customerNote?: string | null;
}

export interface CreateOrderInput {
  userId: string;

  addressId: string;

  paymentMethod: PaymentMethod;

  shippingCost?: number;

  /**
    * Kode voucher opsional.
    *
    * Harga dan validitas voucher tetap dihitung ulang
    * di server melalui VoucherService.
  */
  voucherCode?: string | null;

  notes?: string;

  items: CreateOrderItemInput[];
}

export interface UpdateOrderInput {
  userId: string;

  addressId: string;

  shippingCost?: number;

  notes?: string;

  items: CreateOrderItemInput[];
}

export default class OrderService {
  /**
    * Daftar order aktif.
  */
  static async getOrders(
    filters: OrderFilters = {}
  ) {
    return OrderRepository.findMany(
      filters
    );
  }

  /**
    * Daftar order yang sudah dihapus.
  */
  static async getDeletedOrders() {
    return OrderRepository.findDeleted();
  }

  /**
    * Detail order berdasarkan ID.
  */
  static async getOrderById(
    id: string
  ) {
    const order =
    await OrderRepository.findById(id);

    if (!order) {
      throw new Error(
        "Order tidak ditemukan."
      );
    }

    return order;
  }

  /**
    * Detail order berdasarkan nomor order.
  */
  static async getOrderByNumber(
    orderNumber: string
  ) {
    const order =
    await OrderRepository.findByOrderNumber(
      orderNumber
    );

    if (!order) {
      throw new Error(
        "Order tidak ditemukan."
      );
    }

    return order;
  }

  /**
    * Order milik customer tertentu.
  */
  static async getOrdersByUserId(
    userId: string
  ) {
    return OrderRepository.findByUserId(
      userId
    );
  }

  /**
    * Order terbaru.
  */
  static async getLatestOrders(
    limit = 5
  ) {
    return OrderRepository.findLatest(
      limit
    );
  }

  /**
    * Total order berdasarkan status.
  */
  static async getOrdersByStatus(
    status: OrderStatus
  ) {
    return OrderRepository.getTotalByStatus(
      status
    );
  }

  /**
    * Dashboard summary.
  */
  static async getDashboardSummary(): Promise<OrderDashboardSummary> {
    const [
      totalOrders,
      pendingPayments,
      pendingOrders,
      completedOrders,
      deletedOrders,
    ] = await Promise.all([
        OrderRepository.getTotalOrders(),

        OrderRepository.getPendingPayments(),

        OrderRepository.getTotalByStatus(
          OrderStatus.PENDING
        ),

        OrderRepository.getTotalByStatus(
          OrderStatus.COMPLETED
        ),

        OrderRepository.getDeletedTotal(),
      ]);

    return {
      totalOrders,
      pendingPayments,
      pendingOrders,
      completedOrders,
      deletedOrders,
    };
  }

  /**
    * Validasi apakah order masih tersedia.
  */
  static async ensureOrderExists(
    id: string
  ) {
    const order =
    await OrderRepository.findById(id);

    if (!order) {
      throw new Error(
        "Order tidak ditemukan."
      );
    }

    return order;
  }

  /**
    * Validasi status pembayaran.
  */
  static validatePaymentStatus(
    paymentStatus: PaymentStatus
  ) {
    if (!paymentStatus) {
      throw new Error(
        "Status pembayaran tidak valid."
      );
    }

    return paymentStatus;
  }

  /**
    * Membuat nomor order unik.
    *
    * Format:
    *
    * ORD-YYYYMMDD-HHMMSS-XXXX
  */
  private static generateOrderNumber() {
    const now = new Date();

    const year =
    now.getFullYear();

    const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day =
    String(
      now.getDate()
    ).padStart(2, "0");

    const hours =
    String(
      now.getHours()
    ).padStart(2, "0");

    const minutes =
    String(
      now.getMinutes()
    ).padStart(2, "0");

    const seconds =
    String(
      now.getSeconds()
    ).padStart(2, "0");

    const random =
    Math.floor(
      1000 +
      Math.random() *
      9000
    );

    return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  }

  /**
    * Membuat order baru.
    *
    * Seluruh proses dijalankan dalam satu
    * database transaction:
    *
    * 1. Validasi customer
    * 2. Validasi address
    * 3. Validasi product
    * 4. Validasi stock
    * 5. Hitung subtotal
    * 6. Buat Order
    * 7. Buat OrderItem
    * 8. Kurangi stock
    *
    * Jika salah satu proses gagal,
    * seluruh transaksi akan di-rollback.
  */
  static async createOrder(
    input: CreateOrderInput
  ) {
    if (!input.userId) {
      throw new Error(
        "Customer wajib dipilih."
      );
    }

    if (!input.addressId) {
      throw new Error(
        "Alamat pengiriman wajib dipilih."
      );
    }

    if (!input.items?.length) {
      throw new Error(
        "Minimal satu produk harus dipilih."
      );
    }

    if (
      input.paymentMethod !==
      PaymentMethod.BANK_TRANSFER &&
      input.paymentMethod !==
      PaymentMethod.QRIS
    ) {
      throw new Error(
        "Metode pembayaran tidak valid."
      );
    }

    const shippingCost =
    input.shippingCost ?? 0;

    if (
      !Number.isFinite(
        shippingCost
      ) ||
      shippingCost < 0
    ) {
      throw new Error(
        "Biaya pengiriman tidak valid."
      );
    }

    if (
      input.notes &&
      input.notes.length > 2000
    ) {
      throw new Error(
        "Catatan order terlalu panjang."
      );
    }

    const voucherCode =
    input.voucherCode
    ?.trim()
    .toUpperCase() || null;

    /**
      * ============================================================
      * NORMALIZE ORDER ITEMS
      * ============================================================
      *
      * OrderItem identity:
      *
      * productId
      * + productVariant
      * + productWeight
      * + customerNote
      *
      * Stok nantinya tetap dihitung berdasarkan productId.
    */

    const itemMap =
    new Map<
    string,
    {
      productId: string;
      productVariant: string | null;
      productWeight: string | null;
      customerNote: string | null;
      quantity: number;
    }
    >();

    for (const item of input.items) {
      const productId =
      String(
        item.productId
      ).trim();

      if (!productId) {
        throw new Error(
          "Produk tidak valid."
        );
      }

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity <= 0
      ) {
        throw new Error(
          "Quantity produk harus berupa angka bulat lebih dari 0."
        );
      }

      const productVariant =
      item.productVariant?.trim() ||
      null;

      const productWeight =
      item.productWeight?.trim() ||
      null;

      const customerNote =
      item.customerNote?.trim() ||
      null;

      const itemKey =
      [
        productId,
        productVariant ?? "",
        productWeight ?? "",
        customerNote ?? "",
      ].join("::");

      const existing =
      itemMap.get(itemKey);

      if (existing) {
        existing.quantity +=
        item.quantity;
      } else {
        itemMap.set(
          itemKey,
          {
            productId,
            productVariant,
            productWeight,
            customerNote,
            quantity:
            item.quantity,
          }
        );
      }
    }

    const normalizedItems =
    Array.from(
      itemMap.values()
    );

    /**
      * ============================================================
      * TRANSACTION
      * ============================================================
    */

    return prisma.$transaction(
      async (tx) => {
        /**
          * ========================================================
          * 1. VALIDATE CUSTOMER
          * ========================================================
        */

        const user =
        await tx.user.findFirst({
            where: {
              id: input.userId,
              deletedAt: null,
            },
          });

        if (!user) {
          throw new Error(
            "Customer tidak ditemukan."
          );
        }

        if (!user.isActive) {
          throw new Error(
            "Customer tidak aktif."
          );
        }

        /**
          * ========================================================
          * 2. VALIDATE ADDRESS
          * ========================================================
        */

        const address =
        await tx.address.findFirst({
            where: {
              id: input.addressId,
              userId: input.userId,
              deletedAt: null,
            },
          });

        if (!address) {
          throw new Error(
            "Alamat pengiriman tidak ditemukan atau bukan milik customer."
          );
        }

        /**
          * ========================================================
          * 3. GET PRODUCTS
          * ========================================================
        */

        const productIds =
        [
          ...new Set(
            normalizedItems.map(
              (item) =>
              item.productId
            )
          ),
        ];

        const products =
        await tx.product.findMany({
            where: {
              id: {
                in: productIds,
              },

              deletedAt: null,
            },
          });

        if (
          products.length !==
          productIds.length
        ) {
          const foundIds =
          new Set(
            products.map(
              (product) =>
              product.id
            )
          );

          const missingProduct =
          normalizedItems.find(
            (item) =>
            !foundIds.has(
              item.productId
            )
          );

          throw new Error(
            `Produk ${missingProduct?.productId ??
            ""
          } tidak ditemukan.`
        );
      }

      const productMap =
      new Map(
        products.map(
          (product) => [
            product.id,
            product,
          ]
        )
      );

      /**
        * ========================================================
        * 4. VALIDATE OPTIONS
        * ========================================================
      */

      for (
        const item of normalizedItems
      ) {
        if (item.productVariant) {
          const variant =
          await tx.productVariantOption.findFirst({
              where: {
                productId:
                item.productId,

                label:
                item.productVariant,

                isActive: true,
              },

              select: {
                id: true,
              },
            });

          if (!variant) {
            throw new Error(
              "Varian produk yang dipilih tidak valid atau sudah tidak tersedia."
            );
          }
        }

        if (item.productWeight) {
          const weight =
          await tx.productWeightOption.findFirst({
              where: {
                productId:
                item.productId,

                label:
                item.productWeight,

                isActive: true,
              },

              select: {
                id: true,
              },
            });

          if (!weight) {
            throw new Error(
              "Pilihan berat produk tidak valid atau sudah tidak tersedia."
            );
          }
        }
      }

      /**
        * ========================================================
        * 5. AGGREGATE STOCK REQUIREMENT
        * ========================================================
        *
        * Variant dan weight membedakan OrderItem,
        * tetapi stok Product tetap satu.
      */

      const stockRequirement =
      new Map<
      string,
      number
      >();

      for (
        const item of normalizedItems
      ) {
        stockRequirement.set(
          item.productId,
          (
            stockRequirement.get(
              item.productId
            ) ?? 0
          ) +
          item.quantity
        );
      }

      /**
        * ========================================================
        * 6. VALIDATE STOCK + CALCULATE ORDER ITEMS
        * ========================================================
        *
        * Harga wajib dihitung melalui ProductPricingService
        * agar konsisten dengan CartService.
      */

      let subtotal =
      new Prisma.Decimal(0);

      const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] =
      [];

      for (
        const item of normalizedItems
      ) {
        const product =
        productMap.get(
          item.productId
        );

        if (!product) {
          throw new Error(
            "Produk tidak ditemukan."
          );
        }

        /**
          * ======================================================
          * VALIDATE STOCK
          * ======================================================
        */

        const requiredQuantity =
        stockRequirement.get(
          item.productId
        ) ?? 0;

        if (
          product.stock <
          requiredQuantity
        ) {
          throw new Error(
            `Stock ${product.name} tidak mencukupi. Stock tersedia: ${product.stock}.`
          );
        }

        /**
          * ======================================================
          * RESOLVE PRODUCT PRICE
          * ======================================================
          *
          * Formula:
          *
          * Weight Price / Product Price
          * +
          * Variant Adjustment
          * =
          * Final Price
        */

        const pricing =
        await ProductPricingService.resolve(
          tx,
          {
            productId:
            product.id,

            productVariant:
            item.productVariant,

            productWeight:
            item.productWeight,

            fallbackPrice:
            product.price,
          }
        );

        const itemSubtotal =
        pricing.finalPrice.mul(
          item.quantity
        );

        subtotal =
        subtotal.plus(
          itemSubtotal
        );

        /**
          * ======================================================
          * BUILD ORDER ITEM SNAPSHOT
          * ======================================================
        */

        orderItems.push({
            product: {
              connect: {
                id:
                product.id,
              },
            },

            productName:
            product.name,

            productVariant:
            item.productVariant,

            productWeight:
            item.productWeight,

            customerNote:
            item.customerNote,

            price:
            pricing.finalPrice,

            quantity:
            item.quantity,

            subtotal:
            itemSubtotal,
          });
      }

      /**
        * ========================================================
        * 7. VOUCHER CALCULATION
        * ========================================================
        *
        * Voucher dihitung setelah seluruh item selesai
        * sehingga subtotal sudah merupakan nilai final.
      */

      let voucherResult:
      | Awaited<
      ReturnType<
      typeof VoucherService.validateAndCalculate
      >
      >
      | null = null;

      if (voucherCode) {
        voucherResult =
        await VoucherService.validateAndCalculate(
          {
            code:
            voucherCode,

            userId:
            input.userId,

            subtotal,
          },
          tx
        );
      }

      /**
        * ========================================================
        * VOUCHER DISCOUNT
        * ========================================================
      */

      const voucherDiscount =
      voucherResult?.discountAmount ??
      new Prisma.Decimal(0);

      const discountedSubtotal =
      voucherResult?.finalSubtotal ??
      subtotal;

      /**
        * ========================================================
        * SHIPPING + FINAL TOTAL
        * ========================================================
      */

      const shipping =
      new Prisma.Decimal(
        shippingCost
      );

      const total =
      discountedSubtotal.plus(
        shipping
      );

      /**
        * ========================================================
        * 8. CREATE ORDER
        * ========================================================
      */

      const orderNumber =
      this.generateOrderNumber();

      const order =
      await tx.order.create({
          data: {
            orderNumber,

            userId:
            input.userId,

            addressId:
            input.addressId,

            status:
            OrderStatus.PENDING,

            paymentStatus:
            PaymentStatus.PENDING,

            paymentMethod:
            input.paymentMethod,

            /**
              * Nilai subtotal asli sebelum diskon voucher.
            */
            subtotal,

            /**
              * Snapshot voucher pada order.
              *
              * Jika tidak menggunakan voucher,
              * semua field akan bernilai null / 0.
            */
            voucherId:
            voucherResult?.voucher.id ??
            null,

            voucherCode:
            voucherResult?.voucher.code ??
            null,

            voucherName:
            voucherResult?.voucher.name ??
            null,

            voucherDiscount,

            /**
              * Ongkir tetap terpisah dari diskon voucher.
            */
            shippingCost:
            shipping,

            /**
              * Total akhir:
              *
              * subtotal
              * - voucherDiscount
              * + shipping
            */
            total,

            notes:
            input.notes?.trim() ||
            null,

            items: {
              create:
              orderItems,
            },
          },

          include: {
            user: true,

            address: true,

            items: {
              include: {
                product: true,
              },
            },

            paymentProof: true,
          },
        });


        
      /**
        * ========================================================
        * 9. CONSUME VOUCHER + CREATE VOUCHER USAGE
        * ========================================================
        *
        * Voucher hanya dianggap digunakan setelah
        * order berhasil dibuat.
        *
        * Proses ini tetap berada di dalam transaction.
      */

      if (voucherResult) {
        const { voucher } =
        voucherResult;

        /**
          * ======================================================
          * FINAL PER-USER LIMIT CHECK
          * ======================================================
          *
          * Validasi awal sudah dilakukan oleh VoucherService.
          *
          * Pengecekan ulang dilakukan sedekat mungkin dengan
          * proses consume voucher agar perubahan penggunaan voucher
          * selama proses checkout dapat terdeteksi kembali.
        */

        /**
          * ======================================================
          * ATOMIC PER-USER LIMIT
          * ======================================================
          *
          * Lock berdasarkan kombinasi voucher + user.
          *
          * Request checkout lain dari user yang sama dengan voucher
          * yang sama harus menunggu transaction ini selesai.
          *
          * Setelah lock diperoleh, usage count dibaca kembali sehingga
          * perUserLimit tidak dapat ditembus oleh request paralel.
        */

        if (
          voucher.perUserLimit !== null
        ) {
          /**
            * ------------------------------------------------------
            * ACQUIRE TRANSACTION LOCK
            * ------------------------------------------------------
          */

          await VoucherRepository.acquireUserVoucherLock(
            voucher.id,
            input.userId,
            tx
          );

          /**
            * ------------------------------------------------------
            * RE-CHECK USER USAGE
            * ------------------------------------------------------
          */

          const userUsageCount =
          await VoucherRepository.countUserUsage(
            voucher.id,
            input.userId,
            tx
          );

          if (
            userUsageCount >=
            voucher.perUserLimit
          ) {
            throw new Error(
              "Anda sudah mencapai batas penggunaan voucher ini."
            );
          }
        }

        /**
          * ======================================================
          * GUARDED GLOBAL USAGE COUNT
          * ======================================================
          *
          * Mencegah usageCount melebihi usageLimit ketika beberapa
          * customer menggunakan voucher secara bersamaan.
        */

        const usageResult =
        await tx.voucher.updateMany({
            where: {
              id:
              voucher.id,

              deletedAt:
              null,

              isActive:
              true,

              ...(voucher.usageLimit !== null
                ? {
                  usageCount: {
                    lt:
                    voucher.usageLimit,
                  },
                }
                : {}),
            },

            data: {
              usageCount: {
                increment:
                1,
              },
            },
          });

        if (
          usageResult.count !== 1
        ) {
          throw new Error(
            "Voucher sudah mencapai batas penggunaan. Silakan gunakan voucher lain."
          );
        }

        /**
          * ======================================================
          * CREATE VOUCHER USAGE RECORD
          * ======================================================
        */

        await VoucherRepository.createUsage(
          {
            voucherId:
            voucher.id,

            userId:
            input.userId,

            orderId:
            order.id,

            discountAmount:
            voucherResult.discountAmount,
          },
          tx
        );
      }

      /**
        * ========================================================
        * 10. ATOMIC STOCK DECREMENT + STOCK LEDGER
        * ========================================================
      */

      for (
        const [
          productId,
          quantity,
        ] of stockRequirement
      ) {
        const product =
        productMap.get(
          productId
        );

        if (!product) {
          throw new Error(
            "Produk tidak ditemukan."
          );
        }

        const stockBefore =
        product.stock;

        const result =
        await tx.product.updateMany({
            where: {
              id: productId,

              deletedAt: null,

              stock: {
                gte: quantity,
              },
            },

            data: {
              stock: {
                decrement:
                quantity,
              },
            },
          });

        if (
          result.count !== 1
        ) {
          throw new Error(
            `Stock ${product.name} berubah sebelum transaksi selesai. Silakan coba lagi.`
          );
        }

        const stockAfter =
        stockBefore -
        quantity;

        await tx.stockLedger.create({
            data: {
              productId,

              orderId:
              order.id,

              type:
              "SALE",

              quantity:
              -quantity,

              stockBefore,

              stockAfter,

              note:
              `Penjualan ${order.orderNumber}`,
            },
          });
      }

      /**
        * ========================================================
        * 9. RETURN ORDER
        * ========================================================
      */

      return order;
    }
  );
}

/**
  * Update order.
  *
  * Method ini digunakan untuk perubahan
  * data order yang tidak berkaitan dengan
  * status atau pembayaran.
*/
/**
  * Update order secara transactional.
  *
  * Perubahan item akan otomatis
  * menyesuaikan stock produk.
  *
  * Hanya order PENDING yang dapat diedit.
*/
static async updateOrder(
  id: string,
  input: UpdateOrderInput
) {
  if (!id) {
    throw new Error(
      "Order ID wajib diisi."
    );
  }

  if (!input.userId) {
    throw new Error(
      "Customer wajib dipilih."
    );
  }

  if (!input.addressId) {
    throw new Error(
      "Alamat pengiriman wajib dipilih."
    );
  }

  if (
    !Array.isArray(input.items) ||
    input.items.length === 0
  ) {
    throw new Error(
      "Minimal satu produk harus ada."
    );
  }

  /**
    * ============================================================
    * NORMALIZE ORDER ITEMS
    * ============================================================
    *
    * Identity OrderItem:
    *
    * productId
    * + productVariant
    * + productWeight
    * + customerNote
    *
    * Item yang benar-benar identik akan digabung.
    *
    * Stok tetap dihitung berdasarkan productId.
  */

  const itemMap =
  new Map<
  string,
  {
    productId: string;
    productVariant: string | null;
    productWeight: string | null;
    customerNote: string | null;
    quantity: number;
  }
  >();

  for (const item of input.items) {
    const productId =
    String(
      item.productId
    ).trim();

    const quantity =
  Number(item.quantity);

if (
  !Number.isInteger(quantity) ||
  quantity <= 0
) {
  throw new Error(
    "Quantity produk harus berupa angka bulat lebih dari 0."
  );
}

    if (!productId) {
      throw new Error(
        "Produk order tidak valid."
      );
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        "Quantity produk harus berupa angka bulat lebih dari 0."
      );
    }

    const productVariant =
    item.productVariant?.trim() ||
    null;

    const productWeight =
    item.productWeight?.trim() ||
    null;

    const customerNote =
    item.customerNote?.trim() ||
    null;

    const itemKey =
    [
      productId,
      productVariant ?? "",
      productWeight ?? "",
      customerNote ?? "",
    ].join("::");

    const existing =
    itemMap.get(itemKey);

    if (existing) {
      existing.quantity +=
      quantity;
    } else {
      itemMap.set(
        itemKey,
        {
          productId,
          productVariant,
          productWeight,
          customerNote,
          quantity,
        }
      );
    }
  }

  const finalItems =
  Array.from(
    itemMap.values()
  );

  if (
    finalItems.length === 0
  ) {
    throw new Error(
      "Produk order tidak valid."
    );
  }

  const shippingCost =
  Number(
    input.shippingCost ?? 0
  );

  if (
    !Number.isFinite(
      shippingCost
    ) ||
    shippingCost < 0
  ) {
    throw new Error(
      "Biaya pengiriman tidak valid."
    );
  }

  return prisma.$transaction(
    async (tx) => {
      /**
        * ========================================================
        * 1. GET CURRENT ORDER
        * ========================================================
      */

      const order =
      await tx.order.findUnique({
          where: {
            id,
          },

          include: {
            items: true,
          },
        });

      if (!order) {
        throw new Error(
          "Order tidak ditemukan."
        );
      }

      if (order.deletedAt) {
        throw new Error(
          "Order yang sudah dihapus tidak dapat diubah."
        );
      }

      /**
        * ========================================================
        * 2. VALIDATE ORDER STATUS
        * ========================================================
      */

      if (
        order.status !==
        OrderStatus.PENDING
      ) {
        throw new Error(
          "Order hanya dapat diedit saat berstatus PENDING."
        );
      }

      if (
        order.paymentStatus ===
        PaymentStatus.VERIFIED
      ) {
        throw new Error(
          "Order yang pembayarannya sudah terverifikasi tidak dapat diedit."
        );
      }

      /**
        * ========================================================
        * 3. VALIDATE CUSTOMER
        * ========================================================
      */

      const customer =
      await tx.user.findFirst({
          where: {
            id:
            input.userId,

            deletedAt: null,

            isActive: true,
          },
        });

      if (!customer) {
        throw new Error(
          "Customer tidak ditemukan atau tidak aktif."
        );
      }

      /**
        * ========================================================
        * 4. VALIDATE ADDRESS
        * ========================================================
      */

      const address =
      await tx.address.findFirst({
          where: {
            id:
            input.addressId,

            userId:
            input.userId,

            deletedAt: null,
          },
        });

      if (!address) {
        throw new Error(
          "Alamat pengiriman tidak ditemukan atau bukan milik customer."
        );
      }

      /**
        * ========================================================
        * 5. GET PRODUCTS
        * ========================================================
      */

      const productIds =
      [
        ...new Set(
          finalItems.map(
            (item) =>
            item.productId
          )
        ),
      ];

      const products =
      await tx.product.findMany({
          where: {
            id: {
              in:
              productIds,
            },

            deletedAt: null,
          },
        });

      if (
        products.length !==
        productIds.length
      ) {
        const foundIds =
        new Set(
          products.map(
            (product) =>
            product.id
          )
        );

        const missing =
        finalItems.find(
          (item) =>
          !foundIds.has(
            item.productId
          )
        );

        throw new Error(
          `Produk ${missing?.productId ??
          ""
        } tidak ditemukan.`
      );
    }

    const productMap =
    new Map(
      products.map(
        (product) => [
          product.id,
          product,
        ]
      )
    );

    /**
      * ========================================================
      * 6. VALIDATE PRODUCT OPTIONS
      * ========================================================
    */

    for (
      const item of finalItems
    ) {
      if (
        item.productVariant
      ) {
        const variant =
        await tx.productVariantOption.findFirst({
            where: {
              productId:
              item.productId,

              label:
              item.productVariant,

              isActive: true,
            },

            select: {
              id: true,
            },
          });

        if (!variant) {
          throw new Error(
            "Varian produk yang dipilih tidak valid atau sudah tidak tersedia."
          );
        }
      }

      if (
        item.productWeight
      ) {
        const weight =
        await tx.productWeightOption.findFirst({
            where: {
              productId:
              item.productId,

              label:
              item.productWeight,

              isActive: true,
            },

            select: {
              id: true,
            },
          });

        if (!weight) {
          throw new Error(
            "Pilihan berat produk tidak valid atau sudah tidak tersedia."
          );
        }
      }
    }

    /**
      * ========================================================
      * 7. BUILD OLD STOCK MAP
      * ========================================================
      *
      * OrderItem lama dapat memiliki
      * variant/weight berbeda,
      * tetapi stok tetap satu per Product.
    */

    const oldStockMap =
    new Map<
    string,
    number
    >();

    for (
      const item of
      order.items
    ) {
      oldStockMap.set(
        item.productId,
        (
          oldStockMap.get(
            item.productId
          ) ?? 0
        ) +
        item.quantity
      );
    }

    /**
      * ========================================================
      * 8. BUILD NEW STOCK MAP
      * ========================================================
    */

    const newStockMap =
    new Map<
    string,
    number
    >();

    for (
      const item of
      finalItems
    ) {
      newStockMap.set(
        item.productId,
        (
          newStockMap.get(
            item.productId
          ) ?? 0
        ) +
        item.quantity
      );
    }

    /**
      * ========================================================
      * 9. VALIDATE STOCK REQUIREMENT
      * ========================================================
      *
      * Product.stock saat ini sudah dalam
      * kondisi stok lama order telah
      * dikurangi.
      *
      * Maka stok efektif untuk validasi:
      *
      * currentStock + oldOrderQuantity
    */

    for (
      const [
        productId,
        newQuantity,
      ] of newStockMap
    ) {
      const product =
      productMap.get(
        productId
      );

      if (!product) {
        throw new Error(
          "Produk tidak ditemukan."
        );
      }

      const oldQuantity =
      oldStockMap.get(
        productId
      ) ?? 0;

      const availableStock =
      product.stock +
      oldQuantity;

      if (
        availableStock <
        newQuantity
      ) {
        throw new Error(
          `Stock ${product.name} tidak mencukupi. Stock tersedia: ${availableStock}.`
        );
      }
    }

    /**
      * ========================================================
      * 10. BUILD NEW ORDER ITEMS
      * ========================================================
    */

    let subtotal =
    new Prisma.Decimal(0);

    const newOrderItems = [];

    for (const item of finalItems) {
      const product =
      productMap.get(
        item.productId
      );

      if (!product) {
        throw new Error(
          "Produk tidak ditemukan."
        );
      }

      /**
        * ======================================================
        * RESOLVE PRODUCT PRICING
        * ======================================================
        *
        * Gunakan pricing engine yang sama dengan createOrder()
        * agar harga variant dan weight selalu konsisten.
      */

      const pricing =
      await ProductPricingService.resolve(
        tx,
        {
          productId:
          product.id,

          productVariant:
          item.productVariant,

          productWeight:
          item.productWeight,

          fallbackPrice:
          product.price,
        }
      );

      const price =
      pricing.finalPrice;

      const quantity =
      new Prisma.Decimal(
        item.quantity
      );

      const itemSubtotal =
      price.mul(
        quantity
      );

      subtotal =
      subtotal.plus(
        itemSubtotal
      );

      newOrderItems.push({
          productId:
          product.id,

          productName:
          product.name,

          productVariant:
          item.productVariant,

          productWeight:
          item.productWeight,

          customerNote:
          item.customerNote,

          price,

          quantity:
          item.quantity,

          subtotal:
          itemSubtotal,
        });
    }

    /**
      * ========================================================
      * SHIPPING + FINAL TOTAL
      * ========================================================
    */

    const shipping =
    new Prisma.Decimal(
      shippingCost
    );

    /**
      * ====================================================
      * FINAL ORDER TOTAL
      * ====================================================
      *
      * Total akhir:
      *
      * subtotal
      * - voucher discount
      * + shipping
    */

    /**
 * ============================================================
 * VOUCHER DISCOUNT SNAPSHOT
 * ============================================================
 *
 * Voucher pada order merupakan snapshot transaksi.
 *
 * Jangan melakukan validasi ulang voucher di sini karena:
 *
 * - voucher mungkin sudah expired
 * - usage limit mungkin sudah penuh
 * - voucher sudah tercatat pada VoucherUsage
 * - order menyimpan snapshot voucherDiscount
 *
 * Ketika item order diubah, kita tetap menggunakan nominal
 * voucher discount yang tersimpan pada order.
 */
const voucherDiscount =
  new Prisma.Decimal(
    order.voucherDiscount ?? 0
  );

/**
 * ============================================================
 * CALCULATE FINAL SUBTOTAL
 * ============================================================
 *
 * subtotal
 * - voucherDiscount
 *
 * Nilai tidak boleh negatif.
 */
const subtotalAfterVoucher =
  Prisma.Decimal.max(
    subtotal.minus(
      voucherDiscount
    ),
    new Prisma.Decimal(0)
  );

/**
 * ============================================================
 * CALCULATE GRAND TOTAL
 * ============================================================
 *
 * subtotal setelah voucher
 * + shipping
 */
const total =
  subtotalAfterVoucher.plus(
    shipping
  );

    /**
      * ========================================================
      * 11. UPDATE STOCK + CREATE STOCK LEDGER
      * ========================================================
      *
      * delta > 0
      * → Order membutuhkan stok tambahan
      * → Product.stock berkurang
      * → SALE
      *
      * delta < 0
      * → Sebagian stok order dilepas
      * → Product.stock bertambah
      * → RETURN
    */

    const affectedProductIds =
    new Set([
        ...oldStockMap.keys(),
        ...newStockMap.keys(),
      ]);

    for (
      const productId of
      affectedProductIds
    ) {
      const oldQuantity =
      oldStockMap.get(
        productId
      ) ?? 0;

      const newQuantity =
      newStockMap.get(
        productId
      ) ?? 0;

      const delta =
      newQuantity -
      oldQuantity;

      if (
        delta === 0
      ) {
        continue;
      }

      /**
        * ======================================================
        * FIND PRODUCT
        * ======================================================
        *
        * Product dapat berasal dari:
        *
        * 1. Item baru yang masih ada pada order
        *    → tersedia di productMap.
        *
        * 2. Item lama yang sudah dihapus dari order
        *    → perlu diambil kembali dari database.
      */

      const product =
      productMap.get(
        productId
      ) ??
      await tx.product.findFirst({
          where: {
            id:
            productId,

            deletedAt:
            null,
          },
        });

      if (!product) {
        throw new Error(
          `Produk ${productId} tidak ditemukan.`
        );
      }

      /**
        * ======================================================
        * DELTA POSITIF
        * ======================================================
        *
        * Contoh:
        *
        * lama = 2
        * baru = 5
        * delta = +3
        *
        * Kurangi stok 3.
      */

      if (
        delta > 0
      ) {
        /**
          * Snapshot stok sebelum perubahan.
        */

        const currentProduct =
        await tx.product.findUnique({
            where: {
              id:
              productId,
            },

            select: {
              id: true,
              name: true,
              stock: true,
            },
          });

        if (!currentProduct) {
          throw new Error(
            "Produk tidak ditemukan saat update order."
          );
        }

        const stockBefore =
        currentProduct.stock;

        const result =
        await tx.product.updateMany({
            where: {
              id:
              productId,

              deletedAt: null,

              stock: {
                gte:
                delta,
              },
            },

            data: {
              stock: {
                decrement:
                delta,
              },
            },
          });

        if (
          result.count !== 1
        ) {
          throw new Error(
            `Stock ${currentProduct.name} tidak mencukupi atau berubah sebelum transaksi selesai.`
          );
        }

        const stockAfter =
        stockBefore -
        delta;

        await tx.stockLedger.create({
            data: {
              productId,

              orderId:
              order.id,

              type:
              "SALE",

              quantity:
              -delta,

              stockBefore,

              stockAfter,

              note:
              `Penyesuaian order ${order.orderNumber}: quantity bertambah ${delta}`,
            },
          });

        continue;
      }

      /**
        * ======================================================
        * DELTA NEGATIF
        * ======================================================
        *
        * Contoh:
        *
        * lama = 5
        * baru = 2
        * delta = -3
        *
        * Kembalikan stok 3.
      */

      const restoreQuantity =
      Math.abs(
        delta
      );

      const currentProduct =
      await tx.product.findUnique({
          where: {
            id:
            productId,
          },

          select: {
            id: true,
            name: true,
            stock: true,
          },
        });

      if (!currentProduct) {
        throw new Error(
          "Produk tidak ditemukan saat update order."
        );
      }

      const stockBefore =
      currentProduct.stock;

      const updatedProduct =
      await tx.product.update({
          where: {
            id:
            productId,
          },

          data: {
            stock: {
              increment:
              restoreQuantity,
            },
          },

          select: {
            stock: true,
          },
        });

      const stockAfter =
      updatedProduct.stock;

      await tx.stockLedger.create({
          data: {
            productId,

            orderId:
            order.id,

            type:
            "RETURN",

            quantity:
            restoreQuantity,

            stockBefore,

            stockAfter,

            note:
            `Penyesuaian order ${order.orderNumber}: quantity berkurang ${restoreQuantity}`,
          },
        });
    }

    /**
      * ========================================================
      * 12. REPLACE ORDER ITEMS
      * ========================================================
    */

    await tx.orderItem.deleteMany({
        where: {
          orderId:
          id,
        },
      });

    await tx.orderItem.createMany({
        data:
        newOrderItems.map(
          (item) => ({
              orderId:
              id,

              productId:
              item.productId,

              productName:
              item.productName,

              productVariant:
              item.productVariant,

              productWeight:
              item.productWeight,

              customerNote:
              item.customerNote,

              price:
              item.price,

              quantity:
              item.quantity,

              subtotal:
              item.subtotal,
            })
        ),
      });

    /**
      * ========================================================
      * 13. UPDATE ORDER
      * ========================================================
    */

    return await tx.order.update({
        where: {
          id,
        },

        data: {
          userId:
          input.userId,

          addressId:
          input.addressId,

          subtotal,

          shippingCost:
          shipping,

          total,

          notes:
          input.notes?.trim() ||
          null,
        },

        include: {
          user: true,

          address: true,

          items: {
            include: {
              product: true,
            },
          },

          paymentProof: true,
        },
      });
  }
);
}

/**
  * Update status order dengan lifecycle
  * transition yang terkontrol.
  *
  * Lifecycle:
  *
  * PENDING
  *   -> PROCESSING
  *   -> CANCELLED
  *
  * PROCESSING
  *   -> SHIPPING
  *   -> CANCELLED
  *
  * SHIPPING
  *   -> COMPLETED
  *   -> CANCELLED
  *
  * COMPLETED / CANCELLED
  *   -> terminal state
*/
static async updateStatus(
  id: string,
  status: OrderStatus
) {
  try {
    /**
      * ========================================================
      * GET CURRENT ORDER
      * ========================================================
    */

    const order =
    await OrderRepository.findById(id);

    if (!order) {
      return {
        success: false,
        message: "Pesanan tidak ditemukan.",
      };
    }

    /**
      * ========================================================
      * PROTECT FINAL STATES
      * ========================================================
    */

    if (
      order.status === "COMPLETED" ||
      order.status === "CANCELLED"
    ) {
      return {
        success: false,
        message:
        "Status pesanan yang sudah selesai atau dibatalkan tidak dapat diubah.",
      };
    }

    /**
      * ========================================================
      * PREVENT SAME STATUS
      * ========================================================
    */

    if (order.status === status) {
      return {
        success: false,
        message:
        "Pesanan sudah memiliki status tersebut.",
      };
    }

    /**
      * ========================================================
      * VALIDATE PAYMENT
      * ========================================================
    */

    const isPaymentVerified =
    order.paymentStatus === "VERIFIED";

    /**
      * ========================================================
      * STATUS TRANSITION RULES
      * ========================================================
    */

    /**
      * --------------------------------------------------------
      * PENDING
      * --------------------------------------------------------
    */

    if (order.status === "PENDING") {
      if (status === "PROCESSING" && !isPaymentVerified) {
        return {
          success: false,
          message:
          "Pesanan tidak dapat diproses sebelum pembayaran diverifikasi.",
        };
      }

      if (
        status !== "PROCESSING" &&
        status !== "CANCELLED"
      ) {
        return {
          success: false,
          message:
          "Pesanan dengan status PENDING hanya dapat diproses atau dibatalkan.",
        };
      }
    }

    /**
      * --------------------------------------------------------
      * WAITING PAYMENT
      * --------------------------------------------------------
    */

    if (
      order.status === "WAITING_PAYMENT" &&
      status !== "WAITING_VERIFICATION" &&
      status !== "CANCELLED"
    ) {
      return {
        success: false,
        message:
        "Pesanan yang menunggu pembayaran hanya dapat dilanjutkan ke verifikasi atau dibatalkan.",
      };
    }

    /**
      * --------------------------------------------------------
      * WAITING VERIFICATION
      * --------------------------------------------------------
    */

    if (
      order.status === "WAITING_VERIFICATION"
    ) {
      if (status === "PROCESSING" && !isPaymentVerified) {
        return {
          success: false,
          message:
          "Pesanan tidak dapat diproses sebelum pembayaran diverifikasi.",
        };
      }

      if (
        status !== "PROCESSING" &&
        status !== "CANCELLED"
      ) {
        return {
          success: false,
          message:
          "Pesanan yang sedang menunggu verifikasi hanya dapat diproses atau dibatalkan.",
        };
      }
    }

    /**
      * --------------------------------------------------------
      * PROCESSING
      * --------------------------------------------------------
    */

    if (
      order.status === "PROCESSING" &&
      status !== "SHIPPING" &&
      status !== "CANCELLED"
    ) {
      return {
        success: false,
        message:
        "Pesanan yang sedang diproses hanya dapat ditandai sebagai dikirim atau dibatalkan.",
      };
    }

    /**
      * --------------------------------------------------------
      * SHIPPING
      * --------------------------------------------------------
    */

    if (order.status === "SHIPPING") {
      if (status === "COMPLETED" && !isPaymentVerified) {
        return {
          success: false,
          message:
          "Pesanan tidak dapat diselesaikan sebelum pembayaran diverifikasi.",
        };
      }

      if (
        status !== "COMPLETED" &&
        status !== "CANCELLED"
      ) {
        return {
          success: false,
          message:
          "Pesanan yang sudah dikirim hanya dapat diselesaikan atau dibatalkan.",
        };
      }
    }

    /**
      * ========================================================
      * CANCELLED
      * ========================================================
      *
      * PENTING:
      *
      * Jangan langsung:
      *
      * OrderRepository.updateStatus(id, status)
      *
      * Karena pembatalan harus:
      *
      * 1. Mengembalikan stock
      * 2. Membuat StockLedger CANCEL
      * 3. Mengubah status menjadi CANCELLED
      *
      * Semua dilakukan melalui cancelOrder().
    */

    if (status === "CANCELLED") {
      const cancelledOrder =
      await this.cancelOrder(id);

      return {
        success: true,
        message:
        "Pesanan berhasil dibatalkan dan stok telah dikembalikan.",
        data:
        cancelledOrder,
      };
    }

    /**
      * ========================================================
      * NORMAL STATUS UPDATE
      * ========================================================
    */

    const updatedOrder =
    await OrderRepository.updateStatus(
      id,
      status
    );

    if (!updatedOrder) {
      return {
        success: false,
        message:
        "Gagal memperbarui status pesanan.",
      };
    }

    return {
      success: true,
      message:
      "Status pesanan berhasil diperbarui.",
      data: updatedOrder,
    };
  } catch (error) {
    console.error(
      "[ORDER_SERVICE_UPDATE_STATUS_ERROR]",
      error
    );

    return {
      success: false,
      message:
      "Terjadi kesalahan saat memperbarui status pesanan.",
    };
  }
}

/**
  * Membatalkan order secara transactional.
  *
  * Cancel berbeda dengan Trash:
  *
  * CANCELLED
  * = lifecycle state
  *
  * deletedAt
  * = soft delete / Trash
  *
  * Ketika order dibatalkan, seluruh
  * quantity item dikembalikan ke stock.
*/
static async cancelOrder(
  id: string
) {
  if (!id) {
    throw new Error(
      "Order ID wajib diisi."
    );
  }

  const order =
  await OrderRepository.findById(
    id
  );

  if (!order) {
    throw new Error(
      "Order tidak ditemukan."
    );
  }

  if (order.deletedAt) {
    throw new Error(
      "Order yang berada di Trash tidak dapat dibatalkan."
    );
  }

  if (
    order.status ===
    OrderStatus.COMPLETED
  ) {
    throw new Error(
      "Order yang sudah selesai tidak dapat dibatalkan."
    );
  }

  if (
    order.status ===
    OrderStatus.CANCELLED
  ) {
    throw new Error(
      "Order sudah dibatalkan."
    );
  }

  /**
    * Gunakan transaction agar:
    *
    * 1. Stock dikembalikan
    * 2. StockLedger dibuat
    * 3. Status menjadi CANCELLED
    *
    * harus berhasil bersama-sama.
  */
  return prisma.$transaction(
    async (tx) => {
      /**
        * Ambil ulang order di dalam
        * transaction agar data yang
        * digunakan adalah data terbaru.
      */
      const currentOrder =
      await tx.order.findUnique({
          where: {
            id,
          },

          include: {
            items: true,
          },
        });

      if (!currentOrder) {
        throw new Error(
          "Order tidak ditemukan."
        );
      }

      if (
        currentOrder.deletedAt
      ) {
        throw new Error(
          "Order yang berada di Trash tidak dapat dibatalkan."
        );
      }

      if (
        currentOrder.status ===
        OrderStatus.COMPLETED
      ) {
        throw new Error(
          "Order yang sudah selesai tidak dapat dibatalkan."
        );
      }

      if (
        currentOrder.status ===
        OrderStatus.CANCELLED
      ) {
        throw new Error(
          "Order sudah dibatalkan."
        );
      }

      /**
        * ========================================================
        * GABUNGKAN QUANTITY BERDASARKAN PRODUCT ID
        * ========================================================
        *
        * Variant dan weight dapat berbeda,
        * tetapi stock berada pada Product.
      */

      const quantities =
      new Map<
      string,
      number
      >();

      for (
        const item of
        currentOrder.items
      ) {
        quantities.set(
          item.productId,
          (
            quantities.get(
              item.productId
            ) ?? 0
          ) +
          item.quantity
        );
      }

      /**
        * ========================================================
        * KEMBALIKAN STOCK + STOCK LEDGER
        * ========================================================
      */

      for (
        const [
          productId,
          quantity,
        ] of quantities
      ) {
        if (
          quantity <= 0
        ) {
          continue;
        }

        /**
          * Ambil stock sebelum perubahan
          * untuk snapshot StockLedger.
        */
        const product =
        await tx.product.findUnique({
            where: {
              id:
              productId,
            },

            select: {
              id: true,
              name: true,
              stock: true,
            },
          });

        if (!product) {
          throw new Error(
            `Produk ${productId} tidak ditemukan saat pembatalan order.`
          );
        }

        const stockBefore =
        product.stock;

        /**
          * Increment stock secara atomic.
        */
        const updatedProduct =
        await tx.product.update({
            where: {
              id:
              productId,
            },

            data: {
              stock: {
                increment:
                quantity,
              },
            },

            select: {
              stock: true,
            },
          });

        const stockAfter =
        updatedProduct.stock;

        /**
          * ======================================================
          * CREATE STOCK LEDGER
          * ======================================================
        */

        await tx.stockLedger.create({
            data: {
              productId,

              orderId:
              currentOrder.id,

              type:
              "CANCEL",

              quantity,

              stockBefore,

              stockAfter,

              note:
              `Pembatalan order ${currentOrder.orderNumber}`,
            },
          });
      }

      /**
 * ============================================================
 * RELEASE VOUCHER
 * ============================================================
 *
 * Voucher hanya dikembalikan jika pembayaran belum VERIFIED.
 *
 * Jika pembayaran sudah VERIFIED, voucher tetap dianggap
 * consumed meskipun order kemudian dibatalkan.
 *
 * Gunakan currentOrder yang dibaca ulang di dalam transaction
 * agar keputusan lifecycle voucher menggunakan state terbaru.
 *
 * Proses dijalankan dalam transaction yang sama dengan:
 *
 * - stock restoration
 * - StockLedger
 * - VoucherUsage
 * - usageCount
 * - Order cancellation
 * ============================================================
 */

await VoucherLifecycleService.releaseForCancelledOrder(
  currentOrder.id,
  currentOrder.paymentStatus,
  tx
);

      /**
        * ========================================================
        * UBAH STATUS MENJADI CANCELLED
        * ========================================================
        *
        * Dilakukan setelah:
        *
        * - semua stock berhasil dikembalikan
        * - semua StockLedger berhasil dibuat
        *
        * Jika salah satu gagal,
        * seluruh transaction akan rollback.
      */

      return await tx.order.update({
          where: {
            id,
          },

          data: {
            status:
            OrderStatus.CANCELLED,
          },

          include: {
            user: true,

            address: true,

            items: {
              include: {
                product: true,
              },
            },

            paymentProof: true,
          },
        });
    }
  );
}

/**
  * Update status pembayaran.
*/
static async updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus
) {
  const order =
  await OrderRepository.findById(id);

  if (!order) {
    throw new Error(
      "Order tidak ditemukan."
    );
  }

  if (order.deletedAt) {
    throw new Error(
      "Order yang sudah dihapus tidak dapat diubah."
    );
  }

  if (
    order.status ===
    OrderStatus.CANCELLED
  ) {
    throw new Error(
      "Pembayaran order yang sudah dibatalkan tidak dapat diubah."
    );
  }

  if (
    order.paymentStatus ===
    PaymentStatus.VERIFIED &&
    paymentStatus !==
    PaymentStatus.VERIFIED
  ) {
    throw new Error(
      "Pembayaran yang sudah terverifikasi tidak dapat diturunkan kembali."
    );
  }

  return OrderRepository.updatePaymentStatus(
    id,
    paymentStatus
  );
}

/**
  * Menandai pembayaran sebagai VERIFIED.
*/
static async markAsPaid(
  id: string
) {
  const order =
  await OrderRepository.findById(id);

  if (!order) {
    throw new Error(
      "Order tidak ditemukan."
    );
  }

  if (order.deletedAt) {
    throw new Error(
      "Order yang sudah dihapus tidak dapat diproses."
    );
  }

  if (
    order.status ===
    OrderStatus.CANCELLED
  ) {
    throw new Error(
      "Order yang sudah dibatalkan tidak dapat dibayar."
    );
  }

  if (
    order.paymentStatus ===
    PaymentStatus.VERIFIED
  ) {
    throw new Error(
      "Pembayaran order sudah terverifikasi."
    );
  }

  return OrderRepository.markAsPaid(
    id
  );
}

/**
  * Menandai order sebagai COMPLETED.
  *
  * Order hanya dapat diselesaikan
  * setelah berada pada status SHIPPING
  * dan pembayaran sudah VERIFIED.
*/
static async markAsCompleted(
  id: string
) {
  const order =
  await OrderRepository.findById(
    id
  );

  if (!order) {
    throw new Error(
      "Order tidak ditemukan."
    );
  }

  if (order.deletedAt) {
    throw new Error(
      "Order yang sudah dihapus tidak dapat diselesaikan."
    );
  }

  if (
    order.status ===
    OrderStatus.CANCELLED
  ) {
    throw new Error(
      "Order yang sudah dibatalkan tidak dapat diselesaikan."
    );
  }

  if (
    order.status ===
    OrderStatus.COMPLETED
  ) {
    throw new Error(
      "Order sudah berstatus selesai."
    );
  }

  if (
    order.status !==
    OrderStatus.SHIPPING
  ) {
    throw new Error(
      "Order harus berstatus SHIPPING sebelum dapat diselesaikan."
    );
  }

  if (
    order.paymentStatus !==
    PaymentStatus.VERIFIED
  ) {
    throw new Error(
      "Order belum memiliki pembayaran yang terverifikasi."
    );
  }

  return OrderRepository.markAsCompleted(
    id
  );
}

/**
  * Soft delete order.
  *
  * Order dipindahkan ke Trash dan
  * tidak dihapus secara permanen.
  *
  * Soft delete TIDAK mengubah stock.
  *
  * Stock sudah ditangani oleh lifecycle
  * order, terutama ketika order dibatalkan.
*/
/**
 * ============================================================
 * SOFT DELETE ORDER
 * ============================================================
 *
 * Order hanya boleh dipindahkan ke Trash apabila sudah berada
 * pada lifecycle final:
 *
 * - COMPLETED
 * - CANCELLED
 *
 * Order aktif tidak boleh langsung dihapus karena dapat
 * menyebabkan data operasional menghilang dari dashboard
 * meskipun proses pesanan belum selesai.
 *
 * Soft delete tidak mengubah stock.
 *
 * Stock harus ditangani melalui lifecycle order, terutama
 * ketika order dibatalkan melalui cancelOrder().
 */
static async deleteOrder(
  id: string
) {
  /**
   * ============================================================
   * VALIDATE ID
   * ============================================================
   */
  if (!id) {
    throw new Error(
      "Order ID wajib diisi."
    );
  }

  /**
   * ============================================================
   * FIND ORDER
   * ============================================================
   */
  const order =
    await OrderRepository.findById(
      id
    );

  if (!order) {
    throw new Error(
      "Order tidak ditemukan."
    );
  }

  /**
   * ============================================================
   * PREVENT DUPLICATE TRASH
   * ============================================================
   */
  if (order.deletedAt) {
    throw new Error(
      "Order sudah berada di Trash."
    );
  }

  /**
   * ============================================================
   * PROTECT ACTIVE ORDERS
   * ============================================================
   *
   * Hanya order dengan status final yang dapat dipindahkan
   * ke Trash.
   */
  const isFinalStatus =
    order.status === OrderStatus.COMPLETED ||
    order.status === OrderStatus.CANCELLED;

  if (!isFinalStatus) {
    throw new Error(
      "Order yang masih aktif tidak dapat dipindahkan ke Trash. Selesaikan atau batalkan order terlebih dahulu."
    );
  }

  /**
   * ============================================================
   * SOFT DELETE
   * ============================================================
   */
  return OrderRepository.softDelete(
    id
  );
}

/**
  * Restore order dari Trash.
*/
static async restoreOrder(
  id: string
) {
  const order =
  await OrderRepository.findById(id);

  if (!order) {
    throw new Error(
      "Order tidak ditemukan."
    );
  }

  if (!order.deletedAt) {
    throw new Error(
      "Order tidak berada di Trash."
    );
  }

  return OrderRepository.restore(
    id
  );
}

/**
  * ============================================================
  * FORCE DELETE ORDER
  * ============================================================
*/

static async forceDeleteOrder(
  id: string
) {
  const order =
  await OrderRepository.findById(id);

  if (!order) {
    throw new Error(
      "Order tidak ditemukan."
    );
  }

  if (!order.deletedAt) {
    throw new Error(
      "Order harus berada di Trash sebelum dihapus permanen."
    );
  }

  return OrderRepository.forceDelete(
    id
  );
}

/**
  * ============================================================
  * SUBMIT PAYMENT PROOF
  *
  * Customer mengirim atau memperbarui
  * bukti pembayaran untuk pesanan miliknya.
  *
  * Flow:
  *
  * - Validate order ownership
  * - Validate order status
  * - Validate payment status
  * - Save new proof image
  * - Create or update PaymentProof
  * - Cleanup old proof safely
  * ============================================================
*/
static async submitPaymentProof(
  userId: string,
  input: {
    orderId: string;
    file: File;
    bankName?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
  }
) {
  let uploadedImagePath:
  | string
  | null = null;

  try {
    /**
      * ========================================================
      * VALIDATE FILE
      * ========================================================
    */

    if (!(input.file instanceof File)) {
      return {
        success: false,
        message:
        "Bukti pembayaran wajib dipilih.",
      };
    }

    if (input.file.size <= 0) {
      return {
        success: false,
        message:
        "File bukti pembayaran tidak valid.",
      };
    }

    /**
      * ========================================================
      * VALIDATE IMAGE TYPE
      *
      * Allowed:
      * - JPG
      * - JPEG
      * - PNG
      * - WEBP
      * ========================================================
    */

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedMimeTypes.includes(
        input.file.type
      )
    ) {
      return {
        success: false,
        message:
        "Format bukti pembayaran harus berupa JPG, JPEG, PNG, atau WEBP.",
      };
    }

    /**
      * ========================================================
      * MAX FILE SIZE
      *
      * 5 MB
      * ========================================================
    */

    const maxFileSize =
    5 * 1024 * 1024;

    if (
      input.file.size >
      maxFileSize
    ) {
      return {
        success: false,
        message:
        "Ukuran bukti pembayaran maksimal 5 MB.",
      };
    }

    /**
      * ========================================================
      * FIND ORDER
      *
      * Security:
      * Customer hanya boleh mengupload
      * bukti untuk order miliknya sendiri.
      * ========================================================
    */

    const order =
    await prisma.order.findFirst({
        where: {
          id:
          input.orderId,

          userId,

          deletedAt:
          null,
        },

        include: {
          paymentProof:
          true,
        },
      });

    if (!order) {
      return {
        success: false,
        message:
        "Pesanan tidak ditemukan atau Anda tidak memiliki akses.",
      };
    }

    /**
      * ========================================================
      * VALIDATE ORDER STATUS
      *
      * Payment proof hanya boleh dikirim
      * sebelum pesanan selesai atau dibatalkan.
      * ========================================================
    */

    if (
      order.status ===
      OrderStatus.COMPLETED ||
      order.status ===
      OrderStatus.CANCELLED
    ) {
      return {
        success: false,
        message:
        "Bukti pembayaran tidak dapat dikirim untuk pesanan ini.",
      };
    }

    /**
      * ========================================================
      * PAYMENT ALREADY VERIFIED
      *
      * Bukti tidak boleh diubah setelah
      * pembayaran diverifikasi.
      * ========================================================
    */

    if (
      order.paymentStatus ===
      PaymentStatus.VERIFIED
    ) {
      return {
        success: false,
        message:
        "Pembayaran pesanan ini sudah diverifikasi dan tidak dapat diubah.",
      };
    }

    /**
      * ========================================================
      * SAVE NEW IMAGE
      * ========================================================
    */

    uploadedImagePath =
    await StorageService.save(
      input.file
    );

    /**
      * ========================================================
      * CREATE OR UPDATE PAYMENT PROOF
      *
      * Prisma schema menggunakan:
      *
      * orderId
      * image
      * bankName
      * accountName
      * accountNumber
      * status
      * ========================================================
    */

    const paymentProof =
    await prisma.$transaction(
      async (tx) => {
        const proof =
        await tx.paymentProof.upsert({
            where: {
              orderId:
              order.id,
            },

            create: {
              orderId:
              order.id,

              image:
              uploadedImagePath!,

              bankName:
              input.bankName?.trim() ||
              null,

              accountName:
              input.accountName?.trim() ||
              null,

              accountNumber:
              input.accountNumber?.trim() ||
              null,

              status:
              PaymentStatus.PENDING,

              verifiedAt:
              null,

              verifiedById:
              null,

              rejectionReason:
              null,
            },

            update: {
              image:
              uploadedImagePath!,

              bankName:
              input.bankName?.trim() ||
              null,

              accountName:
              input.accountName?.trim() ||
              null,

              accountNumber:
              input.accountNumber?.trim() ||
              null,

              /**
                * Upload ulang akan
                * mengembalikan status
                * ke PENDING.
              */

              status:
              PaymentStatus.PENDING,

              verifiedAt:
              null,

              verifiedById:
              null,

              rejectionReason:
              null,
            },
          });

        /**
          * ====================================================
          * UPDATE ORDER PAYMENT STATUS
          *
          * Payment masih menunggu
          * verifikasi admin.
          *
          * Schema saat ini hanya memiliki:
          * PENDING
          * VERIFIED
          * REJECTED
          * ====================================================
        */

        await tx.order.update({
            where: {
              id:
              order.id,
            },

            data: {
              paymentStatus:
              PaymentStatus.PENDING,
            },
          });

        return proof;
      }
    );

    /**
      * ========================================================
      * CLEANUP OLD IMAGE
      *
      * Dilakukan setelah database berhasil.
      * Jika cleanup gagal, database tetap aman.
      * ========================================================
    */

    if (
      order.paymentProof?.image &&
      order.paymentProof.image !==
      uploadedImagePath
    ) {
      try {
        await StorageService.delete(
          order.paymentProof.image
        );
      } catch (storageError) {
        console.error(
          "[PAYMENT_PROOF_OLD_IMAGE_DELETE_ERROR]",
          storageError
        );
      }
    }

    /**
      * ========================================================
      * SUCCESS
      * ========================================================
    */

    return {
      success: true,
      message:
      "Bukti pembayaran berhasil dikirim dan sedang menunggu verifikasi.",
      data:
      paymentProof,
    };
  } catch (error) {
    /**
      * ========================================================
      * CLEANUP NEW FILE IF DATABASE PROCESS FAILED
      * ========================================================
    */

    if (uploadedImagePath) {
      try {
        await StorageService.delete(
          uploadedImagePath
        );
      } catch (storageError) {
        console.error(
          "[PAYMENT_PROOF_NEW_IMAGE_CLEANUP_ERROR]",
          storageError
        );
      }
    }

    console.error(
      "[SUBMIT_PAYMENT_PROOF_ERROR]",
      error
    );

    return {
      success: false,
      message:
      error instanceof Error
      ? error.message
      : "Gagal mengirim bukti pembayaran.",
    };
  }
}

/**
  * ============================================================
  * CREATE CHECKOUT ORDER
  * ============================================================
  *
  * Flow:
  *
  * 1. Validate address
  * 2. Get cart
  * 3. Validate payment channel
  * 4. Create order
  * 5. Copy CartItem snapshot to OrderItem
  * 6. Atomic stock decrement
  * 7. Create StockLedger
  * 8. Clear cart
  *
  * Semua proses penting berjalan dalam satu transaction.
  *
  * ============================================================
*/

static async createCheckoutOrder(
  userId: string,
  addressId: string,
  paymentChannelId: string,
  notes?: string | null,
  shippingProvider: ShippingProviderCode = "INTERNAL",
  voucherCode?: string | null
) {

  const normalizedVoucherCode =
  voucherCode
  ?.trim()
  .toUpperCase() ||
  null;

  try {
    /**
      * ========================================================
      * VALIDATE BASIC INPUT
      * ========================================================
    */

    if (!userId) {
      return {
        success: false,
        message: "Customer tidak valid.",
      };
    }

    if (!addressId) {
      return {
        success: false,
        message: "Alamat pengiriman tidak valid.",
      };
    }

    if (!paymentChannelId) {
      return {
        success: false,
        message: "Metode pembayaran tidak valid.",
      };
    }

    /**
      * ========================================================
      * VALIDATE SHIPPING PROVIDER
      * ========================================================
    */

    if (!shippingProvider) {
      return {
        success: false,
        message: "Metode pengiriman tidak valid.",
      };
    }

    const normalizedShippingProvider =
    shippingProvider
    .trim()
    .toUpperCase() as ShippingProviderCode;

    /**
      * ========================================================
      * VALIDATE ADDRESS
      * ========================================================
    */

    const address =
    await prisma.address.findFirst({
        where: {
          id: addressId,
          userId,
          deletedAt: null,
        },

        select: {
          id: true,
          latitude: true,
          longitude: true,
        },
      });

    if (!address) {
      return {
        success: false,
        message:
        "Alamat pengiriman tidak ditemukan atau tidak valid.",
      };
    }

    /**
      * ========================================================
      * VALIDATE ADDRESS COORDINATES
      * ========================================================
    */

    if (
      address.latitude === null ||
      address.longitude === null
    ) {
      return {
        success: false,
        message:
        "Lokasi alamat pengiriman belum memiliki koordinat.",
      };
    }

    /**
      * ========================================================
      * VALIDATE PAYMENT CHANNEL
      * ========================================================
    */

    const paymentChannel =
    await prisma.paymentChannel.findFirst({
        where: {
          id:
          paymentChannelId,

          isActive:
          true,
        },
      });

    if (!paymentChannel) {
      return {
        success: false,

        message:
        "Metode pembayaran tidak tersedia atau sudah tidak aktif.",
      };
    }

    const paymentMethod =
    paymentChannel.type === "QRIS"
    ? PaymentMethod.QRIS
    : PaymentMethod.BANK_TRANSFER;

    if (!paymentChannel) {
      return {
        success: false,
        message:
        "Metode pembayaran tidak tersedia atau sudah tidak aktif.",
      };
    }

    /**
      * ========================================================
      * GET STORE SETTINGS
      * ========================================================
      *
      * Settings harus diambil sebelum validasi provider.
      *
      * INTERNAL provider membutuhkan konfigurasi dari
      * settings agar dapat diregistrasikan ke registry.
    */

    const settings =
    await settingsService.getSettings();

    /**
      * ========================================================
      * REGISTER INTERNAL SHIPPING PROVIDER
      * ========================================================
    */

    if (
      normalizedShippingProvider ===
      "INTERNAL"
    ) {
      shippingService.registerInternalProvider({
          enabled:
          settings.internalShippingEnabled,

          name:
          settings.internalShippingName ??
          "Kurir Internal",

          baseFee:
          Number(
            settings.internalShippingBaseFee
          ),

          perKmFee:
          Number(
            settings.internalShippingPerKmFee
          ),

          maxDistanceKm:
          Number(
            settings.internalShippingMaxDistance
          ),

          freeShippingThreshold:
          settings.internalShippingFreeThreshold !==
          null
          ? Number(
            settings.internalShippingFreeThreshold
          )
          : null,
        });
    }

    /**
      * ========================================================
      * VALIDATE PROVIDER AVAILABILITY
      * ========================================================
      *
      * Provider baru diperiksa setelah INTERNAL provider
      * diregistrasikan.
    */

    if (
      !shippingService.hasProvider(
        normalizedShippingProvider
      )
    ) {
      return {
        success: false,
        message:
        "Provider pengiriman tidak tersedia.",
      };
    }

    /**
      * ========================================================
      * GET CART
      * ========================================================
    */

    const cart =
    await prisma.cart.findUnique({
        where: {
          userId,
        },

        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

    if (
      !cart ||
      cart.items.length === 0
    ) {
      return {
        success: false,
        message:
        "Keranjang belanja Anda kosong.",
      };
    }

    /**
      * ========================================================
      * GENERATE ORDER NUMBER
      * ========================================================
    */

    const orderNumber =
    await this.generateOrderNumber();

    /**
      * ========================================================
      * CREATE TRANSACTION
      * ========================================================
    */

    const order =
    await prisma.$transaction(
      async (tx) => {
        /**
          * ====================================================
          * RE-VALIDATE CART ITEMS
          * ====================================================
        */

        const productIds =
        [
          ...new Set(
            cart.items.map(
              (item) =>
              item.productId
            )
          ),
        ];

        const products =
        await tx.product.findMany({
            where: {
              id: {
                in: productIds,
              },

              deletedAt: null,
              isPublished: true,
            },

            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
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

        /**
          * ====================================================
          * VALIDATE PRODUCT EXISTENCE
          * ====================================================
        */

        for (
          const item of cart.items
        ) {
          const product =
          productMap.get(
            item.productId
          );

          if (!product) {
            throw new Error(
              `Produk ${item.product.name} sudah tidak tersedia.`
            );
          }

          if (
            product.stock <= 0
          ) {
            throw new Error(
              `Stok ${product.name} sedang habis.`
            );
          }
        }

        /**
          * ========================================================
          * RESOLVE CHECKOUT ITEM PRICING
          * ========================================================
          *
          * Semua harga checkout harus menggunakan pricing engine
          * yang sama dengan createOrder() dan updateOrder().
        */

        const normalizedItems = [];

        const flashSaleRequirements:
        FlashSaleCheckoutRequirement[] = [];

        for (const item of cart.items) {
          const product =
          productMap.get(
            item.productId
          );

          if (!product) {
            throw new Error(
              "Produk tidak ditemukan."
            );
          }

          /**
            * Resolve harga berdasarkan:
            *
            * - Product Variant
            * - Product Weight
            * - Pricing Rule
            * - Product Discount
            * - Fallback Product Price
          */

          const pricing =
  await ProductPricingService.resolve(
    tx,
    {
      productId:
        product.id,

      productVariant:
        item.productVariant,

      productWeight:
        item.productWeight,

      fallbackPrice:
        product.price,
    }
  );


/**
 * ========================================================
 * COLLECT FLASH SALE REQUIREMENT
 * ========================================================
 */

if (
  pricing.isFlashSaleApplied &&
  pricing.flashSaleItemId
) {
  flashSaleRequirements.push({
    flashSaleItemId:
      pricing.flashSaleItemId,

    quantity:
      item.quantity,

    price:
      pricing.finalPrice,
  });
}


const price =
  pricing.finalPrice;

          const quantity =
          new Prisma.Decimal(
            item.quantity
          );

          const itemSubtotal =
          price.mul(
            quantity
          );

          normalizedItems.push({
              productId:
              product.id,

              productName:
              product.name,

              productVariant:
              item.productVariant,

              productWeight:
              item.productWeight,

              customerNote:
              item.customerNote,

              price,

              quantity:
              item.quantity,

              subtotal:
              itemSubtotal,
            });
        }

        /**
        /**
          * ========================================================
          * CALCULATE CHECKOUT SUBTOTAL
          * ========================================================
        */

        const subtotal =
        normalizedItems.reduce(
          (
            total,
            item
          ) =>
          total.plus(
            item.subtotal
          ),
          new Prisma.Decimal(0)
        );

        /**
          * ========================================================
          * VOUCHER CALCULATION
          * ========================================================
          *
          * Voucher dihitung berdasarkan subtotal produk.
          *
          * Shipping tidak termasuk dalam dasar perhitungan
          * diskon voucher.
        */

        let voucherResult:
        | Awaited<
        ReturnType<
        typeof VoucherService.validateAndCalculate
        >
        >
        | null = null;

        if (normalizedVoucherCode) {
          voucherResult =
          await VoucherService.validateAndCalculate(
            {
              code:
              normalizedVoucherCode,

              userId,

              subtotal,
            },
            tx
          );
        }

        /**
          * ========================================================
          * VOUCHER DISCOUNT
          * ========================================================
        */

        const voucherDiscount =
        voucherResult?.discountAmount ??
        new Prisma.Decimal(0);

        const discountedSubtotal =
        voucherResult?.finalSubtotal ??
        subtotal;

        /**
          * ====================================================
          * GET SHIPPING QUOTE
          * ====================================================
          *
          * Ongkir selalu dihitung ulang oleh server.
        */

        /**
          * ====================================================
          * GET SHIPPING QUOTE
          * ====================================================
          *
          * Ongkir selalu dihitung ulang oleh server.
        */

        const shippingResult =
        await shippingService.getQuote({
            provider:
            normalizedShippingProvider,

            origin: {
              latitude:
              Number(
                settings.latitude
              ),

              longitude:
              Number(
                settings.longitude
              ),
            },

            destination: {
              latitude:
              Number(
                address.latitude
              ),

              longitude:
              Number(
                address.longitude
              ),
            },

            /**
              * ShippingQuoteRequest mengharapkan number,
              * sedangkan subtotal order menggunakan Prisma.Decimal.
            */
            subtotal:
            subtotal.toNumber(),
          });

        /**
          * ====================================================
          * VALIDATE SHIPPING AVAILABILITY
          * ====================================================
        */

        if (
          !shippingResult.available
        ) {
          throw new Error(
            shippingResult.reason ??
            "Pengiriman tidak tersedia untuk alamat ini."
          );
        }

        /**
          * ====================================================
          * FINAL SHIPPING COST
          * ====================================================
          *
          * Pertahankan shippingCost karena masih digunakan
          * saat membuat Order.
        */

        const { shippingCost } = shippingResult;

        /**
          * ====================================================
          * DECIMAL SHIPPING VALUE
          * ====================================================
          *
          * Digunakan untuk seluruh perhitungan finansial.
        */

        const shipping =
        new Prisma.Decimal(
          shippingCost
        );

        /**
          * ====================================================
          * FINAL ORDER TOTAL
          * ====================================================
          *
          * Total akhir:
          *
          * subtotal
          * - voucher discount
          * + shipping
        */

        const total =
        discountedSubtotal.plus(
          shipping
        );
        /**
          * ====================================================
          * CREATE ORDER
          * ====================================================
        */

        const createdOrder =
        await tx.order.create({
            data: {
              orderNumber,

              userId,

              addressId,

              paymentMethod,

              paymentChannelId,

              subtotal,


              /**
                * ========================================================
                * VOUCHER SNAPSHOT
                * ========================================================
              */

              voucherId:
              voucherResult?.voucher.id ??
              null,

              voucherCode:
              voucherResult?.voucher.code ??
              null,

              voucherName:
              voucherResult?.voucher.name ??
              null,

              voucherDiscount,

              shippingCost: shippingCost,

              total,

              notes:
              notes?.trim() ||
              null,

              items: {
                create:
                normalizedItems.map(
                  (item) => ({
                      productId:
                      item.productId,

                      productName:
                      item.productName,

                      productVariant:
                      item.productVariant ??
                      null,

                      productWeight:
                      item.productWeight ??
                      null,

                      customerNote:
                      item.customerNote ??
                      null,

                      price:
                      item.price,

                      quantity:
                      item.quantity,

                      subtotal:
                      item.subtotal,
                    })
                ),
              },
            },

            include: {
              user: true,

              items: true,

              address: true,
            },
          });

          /**
 * ==========================================================
 * FLASH SALE ATOMIC CHECKOUT CONSUMPTION
 * ==========================================================
 *
 * HARUS dijalankan setelah Order berhasil dibuat,
 * tetapi tetap di dalam Prisma transaction yang sama.
 *
 * Service akan:
 *
 * - Validasi Flash Sale masih aktif
 * - Validasi quota terbaru
 * - Validasi per-user purchase limit
 * - Atomic increment soldQuantity
 * - Membuat FlashSalePurchase
 *
 * Jika salah satu validasi gagal, seluruh transaction
 * akan rollback termasuk Order yang baru dibuat.
 */

/**
 * ==========================================================
 * FLASH SALE ATOMIC CHECKOUT CONSUMPTION
 * ==========================================================
 *
 * HARUS dijalankan setelah Order berhasil dibuat,
 * dan tetap berada dalam Prisma transaction yang sama.
 */

if (
  flashSaleRequirements.length > 0
) {
  await FlashSaleCheckoutService.consume(
    {
      userId,

      orderId:
        createdOrder.id,

      requirements:
        flashSaleRequirements,
    },

    tx
  );
}

        /**
          * ====================================================
          * CONSUME VOUCHER
          * ====================================================
          *
          * Voucher hanya dianggap digunakan setelah
          * Order berhasil dibuat.
          *
          * Proses ini tetap berada di dalam transaction.
        */

        if (voucherResult) {
          const { voucher } =
          voucherResult;

          /**
            * ==================================================
            * FINAL PER-USER LIMIT CHECK
            * ==================================================
          */

          if (
            voucher.perUserLimit !== null
          ) {
            const userUsageCount =
            await VoucherRepository.countUserUsage(
              voucher.id,
              userId,
              tx
            );

            if (
              userUsageCount >=
              voucher.perUserLimit
            ) {
              throw new Error(
                "Anda sudah mencapai batas penggunaan voucher ini."
              );
            }
          }

          /**
            * ==================================================
            * GUARDED GLOBAL USAGE COUNT
            * ==================================================
            *
            * Mencegah usageCount melebihi usageLimit.
          */

          const usageResult =
          await tx.voucher.updateMany({
              where: {
                id:
                voucher.id,

                deletedAt:
                null,

                isActive:
                true,

                ...(voucher.usageLimit !== null
                  ? {
                    usageCount: {
                      lt:
                      voucher.usageLimit,
                    },
                  }
                  : {}),
              },

              data: {
                usageCount: {
                  increment:
                  1,
                },
              },
            });

          if (
            usageResult.count !== 1
          ) {
            throw new Error(
              "Voucher sudah mencapai batas penggunaan. Silakan gunakan voucher lain."
            );
          }

          /**
            * ==================================================
            * CREATE VOUCHER USAGE RECORD
            * ==================================================
          */

          await VoucherRepository.createUsage(
            {
              voucherId:
              voucher.id,

              userId,

              orderId:
              createdOrder.id,

              discountAmount:
              voucherResult.discountAmount,
            },
            tx
          );
        }

        /**
          * ====================================================
          * AGGREGATE STOCK REQUIREMENTS
          * ====================================================
          *
          * Product yang sama dapat muncul beberapa kali
          * karena variant, weight, atau customerNote berbeda.
          *
          * Stock tetap berada pada level Product.
        */

        const stockRequirements =
        new Map<
        string,
        number
        >();

        for (
          const item of normalizedItems
        ) {
          stockRequirements.set(
            item.productId,
            (
              stockRequirements.get(
                item.productId
              ) ?? 0
            ) +
            item.quantity
          );
        }

        /**
          * ====================================================
          * ATOMIC STOCK DECREMENT
          * + CREATE STOCK LEDGER
          * ====================================================
        */

        for (
          const [
            productId,
            quantity,
          ] of stockRequirements
        ) {
          if (
            quantity <= 0
          ) {
            continue;
          }

          const currentProduct =
          await tx.product.findUnique({
              where: {
                id:
                productId,
              },

              select: {
                id: true,
                name: true,
                stock: true,
              },
            });

          if (!currentProduct) {
            throw new Error(
              "Produk tidak ditemukan saat checkout."
            );
          }

          const stockBefore =
          currentProduct.stock;

          const stockResult =
          await tx.product.updateMany({
              where: {
                id:
                productId,

                deletedAt:
                null,

                isPublished:
                true,

                stock: {
                  gte:
                  quantity,
                },
              },

              data: {
                stock: {
                  decrement:
                  quantity,
                },
              },
            });

          if (
            stockResult.count !== 1
          ) {
            throw new Error(
              `Stok ${currentProduct.name} tidak mencukupi atau berubah sebelum checkout selesai.`
            );
          }

          const stockAfter =
          stockBefore -
          quantity;

          /**
            * ==================================================
            * CREATE STOCK LEDGER
            * ==================================================
          */

          await tx.stockLedger.create({
              data: {
                productId,

                orderId:
                createdOrder.id,

                type:
                "SALE",

                quantity:
                -quantity,

                stockBefore,

                stockAfter,

                note:
                `Penjualan ${createdOrder.orderNumber}`,
              },
            });
        }

        /**
          * ====================================================
          * CLEAR CART
          * ====================================================
        */

        await tx.cartItem.deleteMany({
            where: {
              cartId:
              cart.id,
            },
          });

        return createdOrder;
      }
    );

    /**
      * ========================================================
      * CREATE ORDER NOTIFICATION
      * ========================================================
    */

    try {
      await notificationService.createOrderNotification({
          orderId:
          order.id,

          orderNumber:
          order.orderNumber,

          customerName:
          order.user?.name ??
          null,

          totalAmount:
          Number(
            order.total
          ),
        });
    } catch (
      notificationError
    ) {
      /**
        * Notification tidak boleh membuat checkout
        * yang sudah berhasil menjadi gagal.
      */

      console.error(
        "[CREATE_ORDER_NOTIFICATION_ERROR]",
        notificationError
      );
    }

    /**
      * ========================================================
      * SUCCESS
      * ========================================================
    */

    return {
      success: true,

      message:
      "Pesanan berhasil dibuat.",

      data:
      order,
    };
  } catch (error) {
    console.error(
      "[CREATE_CHECKOUT_ORDER_ERROR]",
      error
    );

    return {
      success: false,

      message:
      error instanceof Error
      ? error.message
      : "Gagal membuat pesanan. Silakan coba lagi.",
    };
  }
}

/**
  * ============================================================
  * CONFIRM QRIS PAYMENT
  * ============================================================
  *
  * Customer menekan tombol "Saya Sudah Bayar".
  *
  * Sistem TIDAK langsung menganggap pembayaran berhasil.
  *
  * Alur:
  *
  * Customer
  *      ↓
  * Klik "Saya Sudah Bayar"
  *      ↓
  * Validasi order
  *      ↓
  * Validasi ownership
  *      ↓
  * Validasi metode QRIS
  *      ↓
  * Buat / update PaymentProof
  *      ↓
  * Status PENDING
  *      ↓
  * Admin melakukan verifikasi
  *
  * ============================================================
*/

static async confirmQrisPayment(
  userId: string,
  orderId: string
) {
  try {
    /**
      * ========================================================
      * VALIDATE INPUT
      * ========================================================
    */

    if (
      !userId ||
      !userId.trim()
    ) {
      return {
        success: false,
        message:
        "User tidak valid.",
      };
    }

    if (
      !orderId ||
      !orderId.trim()
    ) {
      return {
        success: false,
        message:
        "ID pesanan tidak valid.",
      };
    }

    /**
      * ========================================================
      * GET ORDER
      * ========================================================
    */

    const order =
    await prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
          deletedAt: null,
        },

        include: {
          paymentChannel: true,

          paymentProof: true,
        },
      });

    if (!order) {
      return {
        success: false,
        message:
        "Pesanan tidak ditemukan atau Anda tidak memiliki akses ke pesanan ini.",
      };
    }

    /**
      * ========================================================
      * VALIDATE PAYMENT CHANNEL
      * ========================================================
    */

    if (
      order.paymentChannel?.type !==
      "QRIS"
    ) {
      return {
        success: false,
        message:
        "Pesanan ini tidak menggunakan metode pembayaran QRIS.",
      };
    }

    /**
      * ========================================================
      * GET STORE SETTINGS
      * ========================================================
      *
      * Settings menjadi source of truth untuk:
      *
      * - Lokasi toko
      * - Konfigurasi kurir internal
      * - Base fee
      * - Fee per kilometer
      * - Maximum delivery distance
      * - Free shipping threshold
    */

    const settings =
    await settingsService.getSettings();

    /**
      * ========================================================
      * VALIDATE STORE COORDINATES
      * ========================================================
    */

    if (
      settings.latitude === null ||
      settings.longitude === null
    ) {
      return {
        success: false,
        message:
        "Lokasi toko belum dikonfigurasi dengan benar.",
      };
    }

    /**
      * ========================================================
      * REGISTER INTERNAL SHIPPING PROVIDER
      * ========================================================
      *
      * Provider internal dibuat berdasarkan konfigurasi
      * settings terbaru.
    */

    shippingService.registerInternalProvider({
        enabled:
        settings.internalShippingEnabled,

        name:
        settings.internalShippingName,

        baseFee:
        Number(
          settings.internalShippingBaseFee
        ),

        perKmFee:
        Number(
          settings.internalShippingPerKmFee
        ),

        maxDistanceKm:
        Number(
          settings.internalShippingMaxDistance
        ),

        freeShippingThreshold:
        settings.internalShippingFreeThreshold ===
        null
        ? null
        : Number(
          settings.internalShippingFreeThreshold
        ),
      });


    /**
      * ========================================================
      * VALIDATE ORDER STATUS
      * ========================================================
    */

    if (
      order.status ===
      "COMPLETED"
    ) {
      return {
        success: false,
        message:
        "Pesanan ini sudah selesai.",
      };
    }

    if (
      order.status ===
      "CANCELLED"
    ) {
      return {
        success: false,
        message:
        "Pesanan ini telah dibatalkan.",
      };
    }

    /**
      * ========================================================
      * ALREADY VERIFIED
      * ========================================================
    */

    if (
      order.paymentStatus ===
      PaymentStatus.VERIFIED
    ) {
      return {
        success: false,
        message:
        "Pembayaran pesanan ini sudah diverifikasi.",
      };
    }

    /**
      * ========================================================
      * CREATE / UPDATE PAYMENT CONFIRMATION
      * ========================================================
      *
      * Untuk QRIS:
      *
      * image = null
      *
      * Karena customer cukup melakukan konfirmasi
      * bahwa pembayaran telah dilakukan.
      *
      * Admin tetap wajib memverifikasi pembayaran.
      * ========================================================
    */

    await prisma.$transaction(
      async (tx) => {
        await tx.paymentProof.upsert({
            where: {
              orderId: order.id,
            },

            create: {
              orderId: order.id,

              image: null,

              bankName:
              "QRIS",

              accountName:
              null,

              accountNumber:
              null,

              status:
              PaymentStatus.PENDING,

              verifiedAt:
              null,

              verifiedById:
              null,

              rejectionReason:
              null,
            },

            update: {
              image: null,

              bankName:
              "QRIS",

              accountName:
              null,

              accountNumber:
              null,

              status:
              PaymentStatus.PENDING,

              verifiedAt:
              null,

              verifiedById:
              null,

              rejectionReason:
              null,
            },
          });

        /**
          * ======================================================
          * UPDATE ORDER PAYMENT STATUS
          * ======================================================
        */

        await tx.order.update({
            where: {
              id: order.id,
            },

            data: {
              paymentStatus:
              PaymentStatus.PENDING,
            },
          });
      }
    );

    /**
      * ========================================================
      * SUCCESS
      * ========================================================
    */

    return {
      success: true,

      message:
      "Konfirmasi pembayaran berhasil dikirim. Pembayaran Anda sedang menunggu verifikasi admin.",
    };
  } catch (error) {
    console.error(
      "[CONFIRM_QRIS_PAYMENT_ERROR]",
      error
    );

    return {
      success: false,

      message:
      error instanceof Error
      ? error.message
      : "Gagal mengirim konfirmasi pembayaran QRIS.",
    };
  }
}

}
