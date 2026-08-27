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

import FlashSaleRepository from "@/repositories/flash-sale/flash-sale.repository";

export interface OrderDashboardSummary {
  totalOrders: number;
  pendingPayments: number;
  pendingOrders: number;
  completedOrders: number;
  deletedOrders: number;
}

export interface CreateOrderItemInput {
  /**
   * Product parent.
   *
   * Tetap dikirim agar server memastikan SKU
   * memang milik product tersebut.
   */
  productId: string;

  /**
   * Canonical sellable SKU.
   *
   * Harga dan stok transaksi ditentukan oleh SKU ini.
   */
  skuId: string;

  /**
   * Quantity final yang dibeli.
   */
  quantity: number;

  /**
   * Catatan customer untuk item.
   */
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
    /**
   * ============================================================
   * CREATE ORDER
   * ============================================================
   *
   * Canonical transaction flow:
   *
   * Product
   *   ↓
   * ProductSku
   *   ↓
   * ProductPricingService
   *   ↓
   * OrderItem.skuId
   *   ↓
   * ProductSku.stock
   *   ↓
   * StockLedger.skuId
   *
   * Legacy:
   *
   * - productVariant
   * - productWeight
   *
   * tidak lagi digunakan sebagai source of truth.
   *
   * Semua proses penting berada di dalam satu Prisma transaction:
   *
   * 1. Validate customer
   * 2. Validate address
   * 3. Validate product + SKU
   * 4. Aggregate SKU stock requirement
   * 5. Resolve canonical pricing
   * 6. Collect Flash Sale requirements
   * 7. Calculate voucher
   * 8. Create Order + OrderItems
   * 9. Consume Flash Sale
   * 10. Consume voucher
   * 11. Decrement ProductSku.stock
   * 12. Create StockLedger
   *
   * Jika salah satu proses gagal,
   * seluruh transaction di-rollback.
   */
  static async createOrder(
    input: CreateOrderInput
  ) {
    /**
     * ==========================================================
     * BASIC VALIDATION
     * ==========================================================
     */

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
     * ==========================================================
     * NORMALIZE ORDER ITEMS
     * ==========================================================
     *
     * Canonical identity:
     *
     *   productId + skuId
     *
     * Customer note bukan bagian dari identity SKU.
     *
     * Jika SKU yang sama muncul lebih dari sekali,
     * quantity digabungkan.
     */

    const itemMap =
      new Map<
        string,
        {
          productId: string;
          skuId: string;
          quantity: number;
          customerNote: string | null;
        }
      >();

    for (
      const item of input.items
    ) {
      const productId =
        String(
          item.productId
        ).trim();

      if (!productId) {
        throw new Error(
          "Produk tidak valid."
        );
      }

      const skuId =
        String(
          item.skuId
        ).trim();

      if (!skuId) {
        throw new Error(
          "SKU produk wajib dipilih."
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

      const customerNote =
        item.customerNote
          ?.trim() || null;

      const itemKey =
        `${productId}::${skuId}`;

      const existing =
        itemMap.get(
          itemKey
        );

      if (existing) {
        existing.quantity +=
          item.quantity;

        /**
         * Jika request kedua membawa note,
         * gunakan note tersebut sebagai note terbaru.
         */
        if (
          customerNote !== null
        ) {
          existing.customerNote =
            customerNote;
        }
      } else {
        itemMap.set(
          itemKey,
          {
            productId,
            skuId,
            quantity:
              item.quantity,
            customerNote,
          }
        );
      }
    }

    const normalizedItems =
      Array.from(
        itemMap.values()
      );

    /**
     * ==========================================================
     * TRANSACTION
     * ==========================================================
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
              id:
                input.userId,

              deletedAt:
                null,
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
              id:
                input.addressId,

              userId:
                input.userId,

              deletedAt:
                null,
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
                in:
                  productIds,
              },

              deletedAt:
                null,
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
            `Produk ${
              missingProduct?.productId ??
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
         * 4. GET CANONICAL SKUS
         * ========================================================
         *
         * SKU harus:
         *
         * - ada
         * - aktif
         * - benar-benar milik product
         *
         * Tidak ada lagi pencarian:
         *
         * - productVariant
         * - productWeight
         */

        const skuIds =
          [
            ...new Set(
              normalizedItems.map(
                (item) =>
                  item.skuId
              )
            ),
          ];

        const skus =
          await tx.productSku.findMany({
            where: {
              id: {
                in:
                  skuIds,
              },

              isActive:
                true,
            },

            include: {
              skuOptions: {
                include: {
                  variantOption: {
                    include: {
                      group: true,
                    },
                  },
                },
              },
            },
          });

        if (
          skus.length !==
          skuIds.length
        ) {
          const foundSkuIds =
            new Set(
              skus.map(
                (sku) =>
                  sku.id
              )
            );

          const missingSku =
            normalizedItems.find(
              (item) =>
                !foundSkuIds.has(
                  item.skuId
                )
            );

          throw new Error(
            `SKU ${
              missingSku?.skuId ??
              ""
            } tidak ditemukan atau sudah tidak aktif.`
          );
        }

        const skuMap =
          new Map(
            skus.map(
              (sku) => [
                sku.id,
                sku,
              ]
            )
          );

        /**
         * ========================================================
         * 5. VALIDATE PRODUCT ↔ SKU RELATION
         * ========================================================
         *
         * Jangan percaya productId dari client.
         *
         * SKU harus benar-benar milik product
         * yang dikirim dalam request.
         */

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

          const sku =
            skuMap.get(
              item.skuId
            );

          if (!sku) {
            throw new Error(
              "SKU tidak ditemukan."
            );
          }

          if (
            sku.productId !==
            product.id
          ) {
            throw new Error(
              `SKU "${sku.sku}" tidak sesuai dengan produk "${product.name}".`
            );
          }

          if (
            !sku.isActive
          ) {
            throw new Error(
              `SKU "${sku.sku}" sedang tidak aktif.`
            );
          }
        }

        /**
         * ========================================================
         * 6. AGGREGATE STOCK REQUIREMENT PER SKU
         * ========================================================
         *
         * Sangat penting:
         *
         * STOCK SEKARANG DIHITUNG BERDASARKAN SKU.
         *
         * BUKAN:
         *
         * productId
         *
         * Contoh:
         *
         * Kakap 1KG UTUH  -> SKU-A -> qty 2
         * Kakap 1KG FILET -> SKU-B -> qty 3
         *
         * Maka:
         *
         * SKU-A stock -= 2
         * SKU-B stock -= 3
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
            item.skuId,
            (
              stockRequirement.get(
                item.skuId
              ) ?? 0
            ) +
              item.quantity
          );
        }

        /**
         * ========================================================
         * 7. VALIDATE STOCK + RESOLVE PRICING
         * ========================================================
         */

        let subtotal =
          new Prisma.Decimal(
            0
          );

        const orderItems:
          Prisma.OrderItemCreateWithoutOrderInput[] =
          [];

        const flashSaleRequirements:
          FlashSaleCheckoutRequirement[] =
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

          const sku =
            skuMap.get(
              item.skuId
            );

          if (!sku) {
            throw new Error(
              "SKU tidak ditemukan."
            );
          }

          const requiredQuantity =
            stockRequirement.get(
              sku.id
            ) ?? 0;

          /**
           * Initial stock validation.
           *
           * Final atomic guard tetap dilakukan
           * ketika UPDATE ProductSku dijalankan.
           */

          if (
            sku.stock <
            requiredQuantity
          ) {
            throw new Error(
              `Stok SKU "${sku.sku}" tidak mencukupi. Stok tersedia: ${sku.stock}.`
            );
          }

          /**
           * ======================================================
           * RESOLVE CANONICAL PRICING
           * ======================================================
           *
           * SKU adalah sumber harga.
           *
           * Product discount / Flash Sale
           * tetap dihitung oleh pricing engine.
           */

          const pricing =
            await ProductPricingService.resolve(
              tx,
              {
                productId:
                  product.id,

                skuId:
                  sku.id,

                fallbackPrice:
                  product.price,
              }
            );

          /**
           * ======================================================
           * COLLECT FLASH SALE REQUIREMENT
           * ======================================================
           *
           * Flash Sale tidak langsung mengubah soldQuantity
           * di sini.
           *
           * Consumption dilakukan setelah Order berhasil dibuat,
           * tetapi masih di transaction yang sama.
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

          /**
           * ======================================================
           * CALCULATE ITEM SUBTOTAL
           * ======================================================
           */

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

          /**
           * ======================================================
           * BUILD ORDER ITEM
           * ======================================================
           *
           * sku relation adalah canonical.
           *
           * productVariant/productWeight
           * sengaja tidak digunakan lagi.
           *
           * Field legacy di database tetap aman
           * untuk order lama.
           */

          orderItems.push({
            product: {
              connect: {
                id:
                  product.id,
              },
            },

            sku: {
              connect: {
                id:
                  sku.id,
              },
            },

            productName:
              product.name,

            /**
             * Legacy snapshot.
             *
             * Tidak lagi menjadi source of truth.
             *
             * Untuk order baru kita kosongkan.
             * SKU relation menjadi referensi canonical.
             */
            productVariant:
              null,

            productWeight:
              null,

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
         * 8. VOUCHER CALCULATION
         * ========================================================
         */

        let voucherResult:
          | Awaited<
              ReturnType<
                typeof VoucherService.validateAndCalculate
              >
            >
          | null =
          null;

        if (
          voucherCode
        ) {
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
         * 9. VOUCHER DISCOUNT
         * ========================================================
         */

        const voucherDiscount =
          voucherResult?.discountAmount ??
          new Prisma.Decimal(
            0
          );

        const discountedSubtotal =
          voucherResult?.finalSubtotal ??
          subtotal;

        /**
         * ========================================================
         * 10. SHIPPING + FINAL TOTAL
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
         * 11. CREATE ORDER
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
               * Subtotal sebelum voucher.
               */
              subtotal,

              /**
               * Voucher snapshot.
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
               * Ongkir.
               */
              shippingCost:
                shipping,

              /**
               * Total:
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
              user:
                true,

              address:
                true,

              items: {
                include: {
                  product:
                    true,

                  sku:
                    true,
                },
              },

              paymentProof:
                true,
            },
          });

        /**
         * ========================================================
         * 12. CONSUME FLASH SALE
         * ========================================================
         *
         * Wajib dilakukan setelah Order berhasil dibuat.
         *
         * Tetapi masih berada dalam transaction yang sama.
         *
         * FlashSaleCheckoutService bertanggung jawab terhadap:
         *
         * - campaign validation
         * - quota validation
         * - per-user limit
         * - advisory lock
         * - atomic soldQuantity increment
         * - FlashSalePurchase
         */

        if (
          flashSaleRequirements.length >
          0
        ) {
          await FlashSaleCheckoutService.consume(
            {
              userId:
                input.userId,

              orderId:
                order.id,

              requirements:
                flashSaleRequirements,
            },
            tx
          );
        }

        /**
         * ========================================================
         * 13. CONSUME VOUCHER + CREATE USAGE
         * ========================================================
         */

        if (
          voucherResult
        ) {
          const {
            voucher,
          } =
            voucherResult;

          /**
           * ------------------------------------------------------
           * LOCK USER + VOUCHER
           * ------------------------------------------------------
           */

          if (
            voucher.perUserLimit !==
            null
          ) {
            await VoucherRepository.acquireUserVoucherLock(
              voucher.id,
              input.userId,
              tx
            );

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
           * ------------------------------------------------------
           * GUARDED GLOBAL USAGE COUNT
           * ------------------------------------------------------
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

                ...(voucher.usageLimit !==
                null
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
            usageResult.count !==
            1
          ) {
            throw new Error(
              "Voucher sudah mencapai batas penggunaan. Silakan gunakan voucher lain."
            );
          }

          /**
           * ------------------------------------------------------
           * CREATE VOUCHER USAGE
           * ------------------------------------------------------
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
         * 14. ATOMIC SKU STOCK DECREMENT
         * ========================================================
         *
         * Jangan update Product.stock lagi.
         *
         * Canonical stock:
         *
         *   ProductSku.stock
         *
         * Guard:
         *
         *   stock >= quantity
         *
         * sehingga dua checkout bersamaan tidak dapat
         * mengurangi stock menjadi negatif.
         */

        for (
          const [
            skuId,
            quantity,
          ] of stockRequirement
        ) {
          const sku =
            skuMap.get(
              skuId
            );

          if (!sku) {
            throw new Error(
              "SKU tidak ditemukan."
            );
          }

          const stockBefore =
            sku.stock;

          const result =
            await tx.productSku.updateMany({
              where: {
                id:
                  sku.id,

                productId:
                  sku.productId,

                isActive:
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
            result.count !==
            1
          ) {
            throw new Error(
              `Stok SKU "${sku.sku}" berubah sebelum transaksi selesai. Silakan coba lagi.`
            );
          }

          const stockAfter =
            stockBefore -
            quantity;

          /**
           * ======================================================
           * STOCK LEDGER
           * ======================================================
           *
           * skuId wajib disimpan agar histori stok
           * dapat dilacak sampai level SKU.
           */

          await tx.stockLedger.create({
            data: {
              productId:
                sku.productId,

              skuId:
                sku.id,

              orderId:
                order.id,

              type:
                "SALE",

              quantity:
                -quantity,

              stockBefore,

              stockAfter,

              note:
                `Penjualan ${order.orderNumber} - SKU ${sku.sku}`,
            },
          });
        }

        /**
         * ========================================================
         * 15. RETURN ORDER
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
   * Canonical identity:
   *
   *   productId + skuId
   *
   * Customer note bukan identity SKU.
   */
  const itemMap =
    new Map<
      string,
      {
        productId: string;
        skuId: string;
        quantity: number;
        customerNote: string | null;
      }
    >();

  for (const item of input.items) {
    const productId =
      String(
        item.productId
      ).trim();

    if (!productId) {
      throw new Error(
        "Produk order tidak valid."
      );
    }

    const skuId =
      String(
        item.skuId
      ).trim();

    if (!skuId) {
      throw new Error(
        "SKU produk wajib dipilih."
      );
    }

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

    const customerNote =
      item.customerNote?.trim() ||
      null;

    const itemKey =
      `${productId}::${skuId}`;

    const existing =
      itemMap.get(itemKey);

    if (existing) {
      existing.quantity +=
        quantity;

      if (
        customerNote !== null
      ) {
        existing.customerNote =
          customerNote;
      }
    } else {
      itemMap.set(
        itemKey,
        {
          productId,
          skuId,
          quantity,
          customerNote,
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
       * ==========================================================
       * 1. GET CURRENT ORDER
       * ==========================================================
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
       * ==========================================================
       * 2. VALIDATE ORDER STATUS
       * ==========================================================
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
       * ==========================================================
       * 3. VALIDATE CUSTOMER
       * ==========================================================
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
       * ==========================================================
       * 4. VALIDATE ADDRESS
       * ==========================================================
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
       * ==========================================================
       * 5. VALIDATE LEGACY ORDER
       * ==========================================================
       *
       * Order lama yang belum memiliki skuId tidak boleh
       * diedit menggunakan engine SKU baru.
       *
       * Jangan menebak mapping variant/weight → SKU.
       */

      const legacyItem =
        order.items.find(
          (item) =>
            !item.skuId
        );

      if (legacyItem) {
        throw new Error(
          "Order lama ini belum memiliki SKU canonical dan tidak dapat diedit. Silakan buat order baru."
        );
      }

      /**
       * ==========================================================
       * 6. GET PRODUCTS
       * ==========================================================
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
          `Produk ${
            missing?.productId ??
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
       * ==========================================================
       * 7. GET CANONICAL SKUS
       * ==========================================================
       */

      const newSkuIds =
        [
          ...new Set(
            finalItems.map(
              (item) =>
                item.skuId
            )
          ),
        ];

      const oldSkuIds =
        [
          ...new Set(
            order.items
              .map(
                (item) =>
                  item.skuId
              )
              .filter(
                (
                  skuId
                ): skuId is string =>
                  Boolean(skuId)
              )
          ),
        ];

      const skuIds =
        [
          ...new Set([
            ...newSkuIds,
            ...oldSkuIds,
          ]),
        ];

      const skus =
        await tx.productSku.findMany({
          where: {
            id: {
              in:
                skuIds,
            },
          },

          include: {
            skuOptions: {
              include: {
                variantOption: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        });

      if (
        skus.length !==
        skuIds.length
      ) {
        const foundSkuIds =
          new Set(
            skus.map(
              (sku) =>
                sku.id
            )
          );

        const missing =
          skuIds.find(
            (skuId) =>
              !foundSkuIds.has(
                skuId
              )
          );

        throw new Error(
          `SKU ${
            missing ?? ""
          } tidak ditemukan.`
        );
      }

      const skuMap =
        new Map(
          skus.map(
            (sku) => [
              sku.id,
              sku,
            ]
          )
        );

      /**
       * ==========================================================
       * 8. VALIDATE PRODUCT ↔ SKU
       * ==========================================================
       */

      for (
        const item of finalItems
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

        const sku =
          skuMap.get(
            item.skuId
          );

        if (!sku) {
          throw new Error(
            "SKU tidak ditemukan."
          );
        }

        if (
          sku.productId !==
          product.id
        ) {
          throw new Error(
            `SKU "${sku.sku}" tidak sesuai dengan produk "${product.name}".`
          );
        }

        if (!sku.isActive) {
          throw new Error(
            `SKU "${sku.sku}" sedang tidak aktif.`
          );
        }
      }

      /**
       * ==========================================================
       * 9. BUILD OLD STOCK MAP
       * ==========================================================
       *
       * Stok sekarang sudah berada pada kondisi:
       *
       *   current SKU stock
       *
       * yaitu setelah order lama mengambil stock.
       *
       * Untuk mengetahui stok efektif:
       *
       *   currentStock + oldOrderQuantity
       *
       * tetapi seluruh perhitungan dilakukan per SKU.
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
        if (!item.skuId) {
          continue;
        }

        oldStockMap.set(
          item.skuId,
          (
            oldStockMap.get(
              item.skuId
            ) ?? 0
          ) +
            item.quantity
        );
      }

      /**
       * ==========================================================
       * 10. BUILD NEW STOCK MAP
       * ==========================================================
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
          item.skuId,
          (
            newStockMap.get(
              item.skuId
            ) ?? 0
          ) +
            item.quantity
        );
      }

      /**
       * ==========================================================
       * 11. VALIDATE NEW STOCK
       * ==========================================================
       *
       * Hanya SKU yang masih digunakan order baru perlu
       * divalidasi.
       */

      for (
        const [
          skuId,
          newQuantity,
        ] of newStockMap
      ) {
        const sku =
          skuMap.get(
            skuId
          );

        if (!sku) {
          throw new Error(
            "SKU tidak ditemukan."
          );
        }

        const oldQuantity =
          oldStockMap.get(
            skuId
          ) ?? 0;

        const availableStock =
          sku.stock +
          oldQuantity;

        if (
          availableStock <
          newQuantity
        ) {
          throw new Error(
            `Stok SKU "${sku.sku}" tidak mencukupi. Stok tersedia: ${availableStock}.`
          );
        }
      }

      /**
       * ==========================================================
       * 12. BUILD NEW ORDER ITEMS
       * ==========================================================
       */

      let subtotal =
        new Prisma.Decimal(
          0
        );

      const newOrderItems = [];

      const flashSaleRequirements:
        FlashSaleCheckoutRequirement[] =
        [];

      for (
        const item of
          finalItems
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

        const sku =
          skuMap.get(
            item.skuId
          );

        if (!sku) {
          throw new Error(
            "SKU tidak ditemukan."
          );
        }

        /**
         * ========================================================
         * RESOLVE CANONICAL PRICING
         * ========================================================
         */

        const pricing =
          await ProductPricingService.resolve(
            tx,
            {
              productId:
                product.id,

              skuId:
                sku.id,

              fallbackPrice:
                product.price,
            }
          );

        /**
         * Flash Sale
         *
         * Kita collect requirement terlebih dahulu.
         * Consumption dilakukan setelah OrderItem baru
         * selesai dibangun.
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

        subtotal =
          subtotal.plus(
            itemSubtotal
          );

        newOrderItems.push({
          productId:
            product.id,

          skuId:
            sku.id,

          productName:
            product.name,

          /**
           * Legacy fields.
           *
           * Order baru hasil update menggunakan SKU
           * sebagai canonical reference.
           */
          productVariant:
            null,

          productWeight:
            null,

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
       * ==========================================================
       * 13. VOUCHER SNAPSHOT
       * ==========================================================
       *
       * Jangan validasi ulang voucher.
       *
       * Voucher adalah snapshot transaksi.
       */

      const voucherDiscount =
        new Prisma.Decimal(
          order.voucherDiscount ??
            0
        );

      const subtotalAfterVoucher =
        Prisma.Decimal.max(
          subtotal.minus(
            voucherDiscount
          ),
          new Prisma.Decimal(
            0
          )
        );

      /**
       * ==========================================================
       * 14. SHIPPING + TOTAL
       * ==========================================================
       */

      const shipping =
        new Prisma.Decimal(
          shippingCost
        );

      const total =
        subtotalAfterVoucher.plus(
          shipping
        );

      /**
       * ==========================================================
       * 15. UPDATE STOCK PER SKU
       * ==========================================================
       *
       * delta:
       *
       *   newQuantity - oldQuantity
       *
       * delta > 0
       *   stock berkurang
       *
       * delta < 0
       *   stock bertambah
       */

      const affectedSkuIds =
        new Set([
          ...oldStockMap.keys(),
          ...newStockMap.keys(),
        ]);

      for (
        const skuId of
          affectedSkuIds
      ) {
        const oldQuantity =
          oldStockMap.get(
            skuId
          ) ?? 0;

        const newQuantity =
          newStockMap.get(
            skuId
          ) ?? 0;

        const delta =
          newQuantity -
          oldQuantity;

        if (
          delta === 0
        ) {
          continue;
        }

        const sku =
          skuMap.get(
            skuId
          );

        if (!sku) {
          throw new Error(
            `SKU ${skuId} tidak ditemukan.`
          );
        }

        /**
         * --------------------------------------------------------
         * DELTA POSITIVE
         * --------------------------------------------------------
         */

        if (
          delta > 0
        ) {
          const currentSku =
            await tx.productSku.findUnique({
              where: {
                id:
                  sku.id,
              },

              select: {
                id: true,
                sku: true,
                productId: true,
                stock: true,
                isActive: true,
              },
            });

          if (!currentSku) {
            throw new Error(
              "SKU tidak ditemukan saat update order."
            );
          }

          const stockBefore =
            currentSku.stock;

          const result =
            await tx.productSku.updateMany({
              where: {
                id:
                  currentSku.id,

                productId:
                  currentSku.productId,

                isActive:
                  true,

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
            result.count !==
            1
          ) {
            throw new Error(
              `Stok SKU "${currentSku.sku}" tidak mencukupi atau berubah sebelum transaksi selesai.`
            );
          }

          const stockAfter =
            stockBefore -
            delta;

          await tx.stockLedger.create({
            data: {
              productId:
                currentSku.productId,

              skuId:
                currentSku.id,

              orderId:
                order.id,

              type:
                "SALE",

              quantity:
                -delta,

              stockBefore,

              stockAfter,

              note:
                `Penyesuaian order ${order.orderNumber}: SKU ${currentSku.sku} bertambah ${delta}`,
            },
          });

          continue;
        }

        /**
         * --------------------------------------------------------
         * DELTA NEGATIVE
         * --------------------------------------------------------
         */

        const restoreQuantity =
          Math.abs(
            delta
          );

        const currentSku =
          await tx.productSku.findUnique({
            where: {
              id:
                sku.id,
            },

            select: {
              id: true,
              sku: true,
              productId: true,
              stock: true,
            },
          });

        if (!currentSku) {
          throw new Error(
            "SKU tidak ditemukan saat restore stock."
          );
        }

        const stockBefore =
          currentSku.stock;

        const updatedSku =
          await tx.productSku.update({
            where: {
              id:
                currentSku.id,
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
          updatedSku.stock;

        await tx.stockLedger.create({
          data: {
            productId:
              currentSku.productId,

            skuId:
              currentSku.id,

            orderId:
              order.id,

            type:
              "RETURN",

            quantity:
              restoreQuantity,

            stockBefore,

            stockAfter,

            note:
              `Penyesuaian order ${order.orderNumber}: SKU ${currentSku.sku} berkurang ${restoreQuantity}`,
          },
        });
      }

      /**
       * ==========================================================
       * 16. REPLACE ORDER ITEMS
       * ==========================================================
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

              skuId:
                item.skuId,

              productName:
                item.productName,

              productVariant:
                null,

              productWeight:
                null,

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
       * ==========================================================
       * 17. FLASH SALE
       * ==========================================================
       *
       * Order lama mungkin sudah memiliki FlashSalePurchase.
       *
       * Release lama terlebih dahulu, lalu consume berdasarkan
       * item baru.
       *
       * Semua tetap berada dalam transaction yang sama.
       */

      await FlashSaleRepository.releasePurchasesByOrderId(
        tx,
        order.id
      );

      if (
        flashSaleRequirements.length >
        0
      ) {
        await FlashSaleCheckoutService.consume(
          {
            userId:
              input.userId,

            orderId:
              order.id,

            requirements:
              flashSaleRequirements,
          },
          tx
        );
      }

      /**
       * ==========================================================
       * 18. UPDATE ORDER
       * ==========================================================
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

              sku: true,
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
 *
 * Gunakan status order saat ini sebagai expectedStatus.
 *
 * Ini mencegah race condition ketika status berubah setelah
 * order dibaca tetapi sebelum proses update dijalankan.
 */
const updatedOrder =
  await OrderRepository.updateStatus(
    id,
    status,
    order.status
  );

/**
 * ========================================================
 * CONCURRENT STATUS CHANGE
 * ========================================================
 *
 * Jika conditional update gagal, kemungkinan status order
 * sudah berubah oleh request atau proses lain.
 */
if (!updatedOrder) {
  return {
    success: false,
    message:
      "Status pesanan telah berubah oleh proses lain. Silakan refresh data dan coba lagi.",
  };
}

/**
 * ========================================================
 * SUCCESS RESPONSE
 * ========================================================
 */
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

  /**
   * ============================================================
   * TRANSACTION
   * ============================================================
   *
   * Semua proses cancellation harus atomic:
   *
   * 1. Lock order
   * 2. Validasi lifecycle terbaru
   * 3. Restore ProductSku.stock
   * 4. Create StockLedger CANCEL
   * 5. Release Voucher
   * 6. Release Flash Sale
   * 7. Set Order = CANCELLED
   *
   * Jika salah satu gagal:
   *
   * seluruh transaction rollback.
   */

  return prisma.$transaction(
    async (tx) => {
      /**
       * ========================================================
       * 1. LOCK ORDER ROW
       * ========================================================
       *
       * Penting untuk mencegah dua request cancellation
       * memproses order yang sama secara bersamaan.
       *
       * Tanpa row lock:
       *
       * Request A -> baca PENDING
       * Request B -> baca PENDING
       * Request A -> restore stock
       * Request B -> restore stock lagi
       *
       * Hasil:
       *
       * stock + quantity * 2
       *
       * FOR UPDATE membuat cancellation berjalan serial.
       */

      const lockedOrder =
        await tx.$queryRaw<
          Array<{
            id: string;
          }>
        >`
          SELECT "id"
          FROM "Order"
          WHERE "id" = ${id}
          FOR UPDATE
        `;

      if (
        lockedOrder.length === 0
      ) {
        throw new Error(
          "Order tidak ditemukan."
        );
      }

      /**
       * ========================================================
       * 2. GET CURRENT ORDER
       * ========================================================
       */

      const currentOrder =
        await tx.order.findUnique({
          where: {
            id,
          },

          include: {
            items: {
              select: {
                id: true,
                orderId: true,
                productId: true,
                skuId: true,
                productName: true,
                quantity: true,
                price: true,
                subtotal: true,
              },
            },
          },
        });

      if (!currentOrder) {
        throw new Error(
          "Order tidak ditemukan."
        );
      }

      /**
       * ========================================================
       * 3. VALIDATE ORDER LIFECYCLE
       * ========================================================
       */

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

      if (
  currentOrder.paymentStatus ===
  PaymentStatus.VERIFIED
) {
  throw new Error(
    "Order dengan pembayaran VERIFIED tidak dapat dibatalkan."
  );
}

      /**
       * ========================================================
       * 4. VALIDATE CANONICAL SKU
       * ========================================================
       *
       * Stock canonical saat ini adalah:
       *
       *     ProductSku.stock
       *
       * Karena itu cancellation tidak boleh menebak
       * mapping legacy:
       *
       *     productVariant / productWeight
       *
       * menjadi SKU.
       *
       * Jika order lama belum mempunyai skuId,
       * batalkan dengan aman daripada mengembalikan
       * stock ke SKU yang salah.
       */

      const legacyItem =
        currentOrder.items.find(
          (item) =>
            !item.skuId
        );

      if (legacyItem) {
        throw new Error(
          `Order ${currentOrder.orderNumber} memiliki OrderItem lama tanpa skuId dan tidak dapat dibatalkan menggunakan stock engine SKU baru.`
        );
      }

      /**
       * ========================================================
       * 5. AGGREGATE QUANTITY PER SKU
       * ========================================================
       *
       * Stock identity:
       *
       *     skuId
       *
       * BUKAN:
       *
       *     productId
       *
       * Ini penting karena satu Product dapat memiliki
       * beberapa SKU berat / variant.
       */

      const skuQuantities =
        new Map<
          string,
          number
        >();

      for (
        const item of
        currentOrder.items
      ) {
        if (
          !item.skuId
        ) {
          continue;
        }

        if (
          !Number.isInteger(
            item.quantity
          ) ||
          item.quantity <= 0
        ) {
          throw new Error(
            `Quantity OrderItem "${item.id}" tidak valid saat pembatalan order.`
          );
        }

        skuQuantities.set(
          item.skuId,
          (
            skuQuantities.get(
              item.skuId
            ) ?? 0
          ) +
            item.quantity
        );
      }

      /**
       * ========================================================
       * 6. GET CURRENT SKU STOCK
       * ========================================================
       */

      const skuIds =
        Array.from(
          skuQuantities.keys()
        );

      const skus =
        await tx.productSku.findMany({
          where: {
            id: {
              in:
                skuIds,
            },
          },

          select: {
            id: true,
            productId: true,
            sku: true,
            stock: true,
            isActive: true,
          },
        });

      if (
        skus.length !==
        skuIds.length
      ) {
        const foundSkuIds =
          new Set(
            skus.map(
              (sku) =>
                sku.id
            )
          );

        const missingSkuId =
          skuIds.find(
            (skuId) =>
              !foundSkuIds.has(
                skuId
              )
          );

        throw new Error(
          `SKU "${missingSkuId ?? ""}" tidak ditemukan saat pembatalan order.`
        );
      }

      const skuMap =
        new Map(
          skus.map(
            (sku) => [
              sku.id,
              sku,
            ]
          )
        );

      /**
       * ========================================================
       * 7. RESTORE SKU STOCK + CREATE LEDGER
       * ========================================================
       *
       * Canonical stock:
       *
       *     ProductSku.stock
       *
       * Setiap SKU dibuatkan satu StockLedger CANCEL.
       */

      for (
        const [
          skuId,
          quantity,
        ] of skuQuantities
      ) {
        const sku =
          skuMap.get(
            skuId
          );

        if (!sku) {
          throw new Error(
            `SKU "${skuId}" tidak ditemukan saat restore stock.`
          );
        }

        const stockBefore =
          sku.stock;

        /**
         * Atomic increment.
         */
        const updatedSku =
          await tx.productSku.updateMany({
            where: {
              id:
                sku.id,
            },

            data: {
              stock: {
                increment:
                  quantity,
              },
            },
          });

        if (
          updatedSku.count !==
          1
        ) {
          throw new Error(
            `Gagal mengembalikan stock SKU "${sku.sku}".`
          );
        }

        const stockAfter =
          stockBefore +
          quantity;

        /**
         * ======================================================
         * STOCK LEDGER
         * ======================================================
         */

        await tx.stockLedger.create({
          data: {
            productId:
              sku.productId,

            skuId:
              sku.id,

            orderId:
              currentOrder.id,

            type:
              "CANCEL",

            quantity,

            stockBefore,

            stockAfter,

            note:
              `Pembatalan order ${currentOrder.orderNumber} - SKU ${sku.sku}`,
          },
        });
      }

      /**
       * ========================================================
       * 8. RELEASE VOUCHER
       * ========================================================
       *
       * VoucherLifecycleService menentukan apakah voucher
       * memang boleh dikembalikan berdasarkan paymentStatus.
       *
       * Tetap menggunakan transaction client yang sama.
       */

      await VoucherLifecycleService.releaseForCancelledOrder(
        currentOrder.id,
        currentOrder.paymentStatus,
        tx
      );

      /**
       * ========================================================
       * 9. RELEASE FLASH SALE
       * ========================================================
       *
       * Jika order menggunakan Flash Sale:
       *
       * - soldQuantity dikembalikan
       * - FlashSalePurchase dihapus
       * - quota customer kembali tersedia
       *
       * Semua tetap berada dalam transaction yang sama.
       */

      await FlashSaleRepository.releasePurchasesByOrderId(
        tx,
        currentOrder.id
      );

      /**
       * ========================================================
       * 10. SET ORDER = CANCELLED
       * ========================================================
       *
       * Order sudah di-lock dengan FOR UPDATE,
       * sehingga tidak ada cancellation paralel
       * yang dapat memproses order ini bersamaan.
       */

      return await tx.order.update({
  where: {
    id:
      currentOrder.id,
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

        sku: true,
      },
    },

    paymentProof: true,
  },
});
    }
  );
}

/**
 * ============================================================
 * UPDATE PAYMENT STATUS
 * ============================================================
 *
 * Memperbarui status pembayaran order dengan conditional update
 * untuk mencegah race condition.
 */
static async updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus
) {
  /**
   * ============================================================
   * VALIDATE ORDER ID
   * ============================================================
   */
  if (!id) {
    throw new Error(
      "Order ID wajib diisi."
    );
  }

  /**
   * ============================================================
   * TRANSACTION
   * ============================================================
   *
   * Payment update harus berjalan dalam transaction
   * agar dapat menggunakan row-level lock yang sama
   * dengan cancelOrder().
   *
   * Dengan demikian:
   *
   * VERIFY PAYMENT
   *       ↕
   *   FOR UPDATE
   *       ↕
   * CANCEL ORDER
   *
   * tidak dapat memproses order yang sama secara
   * bersamaan.
   */
  return prisma.$transaction(
    async (tx) => {
      /**
       * ==========================================================
       * 1. LOCK ORDER ROW
       * ==========================================================
       *
       * Lock row Order sebelum membaca paymentStatus
       * dan status order.
       *
       * Ini penting untuk mencegah race condition:
       *
       * Request A:
       *   VERIFY PAYMENT
       *
       * Request B:
       *   CANCEL ORDER
       *
       * Keduanya harus menggunakan state Order terbaru
       * secara serial.
       */
      const lockedOrder =
        await tx.$queryRaw<
          Array<{
            id: string;
          }>
        >`
          SELECT "id"
          FROM "Order"
          WHERE "id" = ${id}
          FOR UPDATE
        `;

      /**
       * ==========================================================
       * 2. ORDER NOT FOUND
       * ==========================================================
       */
      if (
        lockedOrder.length === 0
      ) {
        throw new Error(
          "Order tidak ditemukan."
        );
      }

      /**
       * ==========================================================
       * 3. GET CURRENT ORDER
       * ==========================================================
       *
       * Karena row Order sudah di-lock dengan FOR UPDATE,
       * data yang dibaca di sini merupakan state terbaru
       * yang aman untuk diproses.
       */
      const order =
        await tx.order.findUnique({
          where: {
            id,
          },
          include: {
            user: true,

            address: true,

            items: {
              include: {
                product: true,
                sku: true,
              },
            },

            paymentProof: true,
          },
        });

      if (!order) {
        throw new Error(
          "Order tidak ditemukan."
        );
      }

      /**
       * ==========================================================
       * 4. PREVENT UPDATE DELETED ORDER
       * ==========================================================
       */
      if (order.deletedAt) {
        throw new Error(
          "Order yang sudah dihapus tidak dapat diubah."
        );
      }

      /**
       * ==========================================================
       * 5. PREVENT UPDATE CANCELLED ORDER
       * ==========================================================
       *
       * Cancellation juga menggunakan FOR UPDATE.
       *
       * Jika cancelOrder() berhasil lebih dahulu,
       * maka ketika proses payment mendapatkan lock,
       * order.status akan terbaca sebagai CANCELLED
       * dan proses pembayaran akan ditolak.
       */
      if (
        order.status ===
        OrderStatus.CANCELLED
      ) {
        throw new Error(
          "Pembayaran order yang sudah dibatalkan tidak dapat diubah."
        );
      }

      /**
       * ==========================================================
       * 6. PAYMENT STATUS TRANSITION
       * ==========================================================
       *
       * Lifecycle pembayaran:
       *
       * PENDING
       *   ├── VERIFIED
       *   └── REJECTED
       *
       * REJECTED
       *   └── VERIFIED
       *
       * VERIFIED
       *   └── FINAL / LOCKED
       */
      const allowedTransitions:
        Record<
          PaymentStatus,
          PaymentStatus[]
        > = {
          [PaymentStatus.PENDING]: [
            PaymentStatus.VERIFIED,
            PaymentStatus.REJECTED,
          ],

          [PaymentStatus.REJECTED]: [
            PaymentStatus.VERIFIED,
          ],

          [PaymentStatus.VERIFIED]: [],
        };

      /**
       * ==========================================================
       * 7. IDEMPOTENT UPDATE
       * ==========================================================
       *
       * Jika status tujuan sama dengan status saat ini,
       * tidak perlu melakukan update.
       *
       * Contoh:
       *
       * PENDING → PENDING
       * VERIFIED → VERIFIED
       *
       * cukup mengembalikan order saat ini.
       */
      if (
        order.paymentStatus ===
        paymentStatus
      ) {
        return order;
      }

      /**
       * ==========================================================
       * 8. VALIDATE PAYMENT TRANSITION
       * ==========================================================
       */
      const allowedNextStatuses =
        allowedTransitions[
          order.paymentStatus
        ];

      if (
        !allowedNextStatuses.includes(
          paymentStatus
        )
      ) {
        throw new Error(
          `Perubahan status pembayaran dari ${order.paymentStatus} ke ${paymentStatus} tidak diizinkan.`
        );
      }

      /**
 * ==========================================================
 * 9. UPDATE PAYMENT STATUS
 * ==========================================================
 *
 * Payment status dan paidAt harus diperbarui dalam
 * transaction yang sama.
 *
 * Jika paymentStatus menjadi VERIFIED:
 * - paymentStatus = VERIFIED
 * - paidAt = waktu verifikasi
 *
 * Jika paymentStatus menjadi REJECTED:
 * - paymentStatus = REJECTED
 * - paidAt tidak diubah
 *
 * Karena Order sudah di-lock dengan FOR UPDATE,
 * update ini aman terhadap race condition dengan
 * cancelOrder().
 */
return await tx.order.update({
  where: {
    id: order.id,
  },

  data: {
    paymentStatus,

    ...(paymentStatus ===
      PaymentStatus.VERIFIED
      ? {
          paidAt: new Date(),
        }
      : {}),
  },

  include: {
    user: true,

    address: true,

    items: {
      include: {
        product: true,
        sku: true,
      },
    },

    paymentProof: true,
  },
});
    }
  );
}

/**
 * ============================================================
 * MARK ORDER AS PAID
 * ============================================================
 *
 * Menandai pembayaran order sebagai VERIFIED.
 *
 * Seluruh validasi lifecycle pembayaran dipusatkan melalui
 * updatePaymentStatus().
 *
 * Dengan demikian:
 *
 * markAsPaid()
 *      ↓
 * updatePaymentStatus()
 *      ↓
 * payment transition validation
 *      ↓
 * conditional database update
 *
 * Tidak ada duplicate validation / duplicate read.
 */
static async markAsPaid(
  id: string
) {
  return this.updatePaymentStatus(
    id,
    PaymentStatus.VERIFIED
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
 * ============================================================
 * RESTORE ORDER
 * ============================================================
 *
 * Restore hanya mengembalikan order dari Trash.
 *
 * Operasi ini TIDAK boleh:
 *
 * - mengubah stock
 * - membuat StockLedger baru
 * - menghitung ulang pricing
 * - menghitung ulang voucher
 * - mengubah payment status
 * - mengubah order status
 *
 * Data transaksi harus tetap menggunakan snapshot asli.
 */
static async restoreOrder(
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
   * REQUIRE TRASH STATE
   * ============================================================
   *
   * Restore hanya valid untuk order yang memang sedang
   * berada di Trash.
   */
  if (!order.deletedAt) {
    throw new Error(
      "Order tidak berada di Trash."
    );
  }

  /**
   * ============================================================
   * REQUIRE FINAL STATUS
   * ============================================================
   *
   * Sebagai defensive validation, restore hanya berlaku
   * untuk order dengan lifecycle final.
   */
  const isFinalStatus =
    order.status === OrderStatus.COMPLETED ||
    order.status === OrderStatus.CANCELLED;

  if (!isFinalStatus) {
    throw new Error(
      "Hanya order COMPLETED atau CANCELLED yang dapat dipulihkan."
    );
  }

  /**
   * ============================================================
   * RESTORE ORDER
   * ============================================================
   *
   * Repository hanya menghapus deletedAt dan tidak boleh
   * mengubah data transaksi lainnya.
   */
  return OrderRepository.restore(
    id
  );
}

/**
 * ============================================================
 * FORCE DELETE ORDER
 * ============================================================
 *
 * Penghapusan permanen hanya diperbolehkan untuk order yang:
 *
 * 1. Sudah berada di Trash
 * 2. Memiliki status final:
 *    - COMPLETED
 *    - CANCELLED
 *
 * Order aktif tidak boleh langsung dihapus permanen untuk
 * menjaga integritas operasional, stok, pembayaran, voucher,
 * dan histori transaksi.
 *
 * Relasi database:
 *
 * - OrderItem          → Cascade
 * - PaymentProof       → Cascade
 * - VoucherUsage       → Cascade
 * - FlashSalePurchase  → Cascade
 * - StockLedger        → SetNull
 *
 * StockLedger sengaja dipertahankan sebagai histori audit stok.
 */
static async forceDeleteOrder(
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
   * REQUIRE TRASH STATE
   * ============================================================
   *
   * Force delete hanya boleh dilakukan setelah order
   * dipindahkan ke Trash melalui soft delete.
   */
  if (!order.deletedAt) {
    throw new Error(
      "Order harus dipindahkan ke Trash terlebih dahulu sebelum dihapus permanen."
    );
  }

  /**
   * ============================================================
   * REQUIRE FINAL STATUS
   * ============================================================
   *
   * Sebagai lapisan keamanan tambahan, pastikan hanya order
   * dengan lifecycle final yang dapat dihapus permanen.
   */
  const isFinalStatus =
    order.status === OrderStatus.COMPLETED ||
    order.status === OrderStatus.CANCELLED;

  if (!isFinalStatus) {
    throw new Error(
      "Hanya order COMPLETED atau CANCELLED yang dapat dihapus permanen."
    );
  }

  /**
   * ============================================================
   * FORCE DELETE
   * ============================================================
   *
   * Prisma relation policy akan menangani relasi:
   *
   * - Cascade:
   *   OrderItem
   *   PaymentProof
   *   VoucherUsage
   *   FlashSalePurchase
   *
   * - SetNull:
   *   StockLedger.orderId
   */
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

    sku: {
      include: {
        skuOptions: {
          include: {
            variantOption: true,
          },
        },
      },
    },
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
          * VALIDATE PRODUCT EXISTENCE + CANONICAL SKU
          * ====================================================
          *
          * Checkout customer menggunakan skuId yang tersimpan
          * di CartItem sebagai source of truth.
          *
          * Product.stock TIDAK lagi digunakan untuk stock checkout.
          * Stock canonical berada pada ProductSku.stock.
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

          if (!item.skuId || !item.sku) {
            throw new Error(
              `SKU untuk produk "${product.name}" tidak ditemukan. Silakan hapus produk tersebut dari keranjang dan tambahkan kembali.`
            );
          }

          if (item.sku.productId !== product.id) {
            throw new Error(
              `SKU "${item.sku.sku}" tidak sesuai dengan produk "${product.name}".`
            );
          }

          if (!item.sku.isActive) {
            throw new Error(
              `SKU "${item.sku.sku}" sedang tidak aktif.`
            );
          }

          if (
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0
          ) {
            throw new Error(
              `Quantity produk "${product.name}" tidak valid.`
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
            * Resolve harga menggunakan canonical SKU.
            *
            * productVariant / productWeight bukan lagi source
            * of truth untuk harga checkout.
          */

         const { sku } = item;

if (!sku) {
  throw new Error(
    `SKU untuk produk "${product.name}" tidak ditemukan.`
  );
}

if (sku.stock < item.quantity) {
  throw new Error(
    `Stok SKU "${sku.sku}" tidak mencukupi. Stok tersedia: ${sku.stock}.`
  );
}

          const pricing =
          await ProductPricingService.resolve(
            tx,
            {
              productId:
                product.id,

              skuId:
                sku.id,

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

            skuId:
              sku.id,

            productName:
              product.name,

            /**
              * Legacy snapshot fields tetap dipertahankan
              * untuk kompatibilitas data lama, tetapi tidak
              * digunakan sebagai source of truth transaksi.
            */
            productVariant:
              item.productVariant,

            productWeight:
              item.productWeight,

            weightSku:
              item.weightSku,

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

                      skuId:
                      item.skuId,

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
          * AGGREGATE STOCK REQUIREMENTS PER SKU
          * ====================================================
          *
          * Stock canonical berada pada ProductSku.stock.
          * Product yang sama boleh memiliki beberapa SKU dengan
          * stock terpisah, sehingga aggregation WAJIB berdasarkan
          * skuId, bukan productId.
        */

        const stockRequirements =
        new Map<
          string,
          number
        >();

        for (
          const item of normalizedItems
        ) {
          if (!item.skuId) {
            throw new Error(
              `SKU untuk produk "${item.productName}" tidak valid.`
            );
          }

          stockRequirements.set(
            item.skuId,
            (
              stockRequirements.get(
                item.skuId
              ) ?? 0
            ) +
            item.quantity
          );
        }

        /**
          * ====================================================
          * ATOMIC SKU STOCK DECREMENT
          * + CREATE STOCK LEDGER
          * ====================================================
          *
          * Product.stock TIDAK lagi diubah oleh checkout.
          * Guard stock >= quantity dilakukan di query UPDATE
          * agar aman terhadap checkout bersamaan.
        */

        for (
          const [
            skuId,
            quantity,
          ] of stockRequirements
        ) {
          if (
            quantity <= 0
          ) {
            continue;
          }

          const currentSku =
          await tx.productSku.findUnique({
              where: {
                id:
                skuId,
              },

              select: {
                id: true,
                sku: true,
                productId: true,
                stock: true,
                isActive: true,
              },
            });

          if (!currentSku) {
            throw new Error(
              "SKU tidak ditemukan saat checkout."
            );
          }

          if (!currentSku.isActive) {
            throw new Error(
              `SKU "${currentSku.sku}" sedang tidak aktif.`
            );
          }

          const stockBefore =
          currentSku.stock;

          const stockResult =
          await tx.productSku.updateMany({
              where: {
                id:
                currentSku.id,

                productId:
                currentSku.productId,

                isActive:
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
              `Stok SKU "${currentSku.sku}" tidak mencukupi atau berubah sebelum checkout selesai.`
            );
          }

          const stockAfter =
          stockBefore -
          quantity;

          await tx.stockLedger.create({
              data: {
                productId:
                currentSku.productId,

                skuId:
                currentSku.id,

                orderId:
                createdOrder.id,

                type:
                "SALE",

                quantity:
                -quantity,

                stockBefore,

                stockAfter,

                note:
                `Penjualan ${createdOrder.orderNumber} - SKU ${currentSku.sku}`,
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
