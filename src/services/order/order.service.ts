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
}

export interface CreateOrderInput {
  userId: string;
  addressId: string;

  paymentMethod: PaymentMethod;

  shippingCost?: number;

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
      PaymentMethod.BANK_TRANSFER
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

    /**
     * Normalisasi item.
     *
     * Jika product yang sama dikirim
     * beberapa kali, quantity akan digabung.
     */
    const itemMap =
      new Map<
        string,
        number
      >();

    for (const item of input.items) {
      if (!item.productId) {
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

      const current =
        itemMap.get(
          item.productId
        ) ?? 0;

      itemMap.set(
        item.productId,
        current +
          item.quantity
      );
    }

    const normalizedItems =
      Array.from(
        itemMap.entries()
      ).map(
        ([
          productId,
          quantity,
        ]) => ({
          productId,
          quantity,
        })
      );

    return prisma.$transaction(
      async (tx) => {
        /**
         * 1. Validasi customer.
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
         * 2. Validasi address.
         *
         * Address harus benar-benar
         * milik customer tersebut.
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
         * 3. Ambil seluruh product.
         */
        const productIds =
          normalizedItems.map(
            (item) =>
              item.productId
          );

        const products =
          await tx.product.findMany({
            where: {
              id: {
                in: productIds,
              },

              deletedAt: null,
            },
          });

        /**
         * Pastikan semua product
         * ditemukan.
         */
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
         * 4. Validasi stock dan
         * hitung subtotal.
         */
        let subtotal =
          new Prisma.Decimal(0);

        const orderItems =
          normalizedItems.map(
            (item) => {
              const product =
                productMap.get(
                  item.productId
                );

              if (!product) {
                throw new Error(
                  "Produk tidak ditemukan."
                );
              }

              if (
                product.stock <
                item.quantity
              ) {
                throw new Error(
                  `Stock ${product.name} tidak mencukupi. Stock tersedia: ${product.stock}.`
                );
              }

              const price =
                new Prisma.Decimal(
                  product.price
                );

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

              return {
                productId:
                  product.id,

                productName:
                  product.name,

                price,

                quantity:
                  item.quantity,

                subtotal:
                  itemSubtotal,
              };
            }
          );

        const shipping =
          new Prisma.Decimal(
            shippingCost
          );

        const total =
          subtotal.plus(
            shipping
          );

        /**
         * 5. Generate nomor order.
         *
         * Karena orderNumber memiliki
         * UNIQUE constraint, kita tetap
         * bergantung pada database untuk
         * memastikan uniqueness.
         */
        const orderNumber =
          this.generateOrderNumber();

        /**
         * 6. Buat Order + OrderItem
         * dalam transaction yang sama.
         */
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

              subtotal,

              shippingCost:
                shipping,

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
         * 7. Kurangi stock.
         *
         * Menggunakan updateMany
         * dengan kondisi stock >= quantity
         * agar race condition tidak
         * menyebabkan stock negatif.
         */
        for (const item of normalizedItems) {
          const result =
            await tx.product.updateMany({
              where: {
                id: item.productId,

                deletedAt: null,

                stock: {
                  gte: item.quantity,
                },
              },

              data: {
                stock: {
                  decrement:
                    item.quantity,
                },
              },
            });

          if (
            result.count !== 1
          ) {
            throw new Error(
              "Stock produk berubah sebelum transaksi selesai. Silakan coba lagi."
            );
          }
        }

        /**
         * 8. Return Order lengkap.
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

  const normalizedItems =
    input.items
      .map((item) => ({
        productId:
          String(item.productId).trim(),

        quantity: Math.floor(
          Number(item.quantity)
        ),
      }))
      .filter(
        (item) =>
          item.productId &&
          Number.isFinite(
            item.quantity
          ) &&
          item.quantity > 0
      );

  if (
    normalizedItems.length === 0
  ) {
    throw new Error(
      "Produk order tidak valid."
    );
  }

  /**
   * Gabungkan product yang sama.
   */
  const itemMap =
    new Map<
      string,
      number
    >();

  for (const item of normalizedItems) {
    itemMap.set(
      item.productId,
      (itemMap.get(
        item.productId
      ) ?? 0) + item.quantity
    );
  }

  const finalItems =
    Array.from(
      itemMap.entries()
    ).map(
      ([
        productId,
        quantity,
      ]) => ({
        productId,
        quantity,
      })
    );

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
       * 1. Ambil order lama
       * beserta item.
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
       * Edit hanya diperbolehkan
       * selama order masih PENDING.
       *
       * Setelah masuk proses berikutnya,
       * perubahan item dapat merusak
       * integritas fulfillment.
       */
      if (
        order.status !==
        OrderStatus.PENDING
      ) {
        throw new Error(
          "Order hanya dapat diedit saat berstatus PENDING."
        );
      }

      /**
       * Payment yang sudah VERIFIED
       * tidak boleh mengubah nilai order.
       */
      if (
        order.paymentStatus ===
        PaymentStatus.VERIFIED
      ) {
        throw new Error(
          "Order yang pembayarannya sudah terverifikasi tidak dapat diedit."
        );
      }

      /**
       * 2. Validasi customer.
       */
      const customer =
        await tx.user.findFirst({
          where: {
            id: input.userId,
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
       * 3. Validasi address.
       *
       * Address harus milik
       * customer baru.
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
       * 4. Ambil seluruh product.
       */
      const productIds =
        finalItems.map(
          (item) =>
            item.productId
        );

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
       * 5. Hitung subtotal baru.
       */
      let subtotal =
        new Prisma.Decimal(0);

      const newOrderItems =
        finalItems.map(
          (item) => {
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
             * Stock yang tersedia
             * harus mencakup stock
             * yang akan dilepas dari
             * order lama.
             */
            const oldQuantity =
              order.items
                .filter(
                  (oldItem) =>
                    oldItem.productId ===
                    product.id
                )
                .reduce(
                  (
                    total,
                    oldItem
                  ) =>
                    total +
                    oldItem.quantity,
                  0
                );

            const availableStock =
              product.stock +
              oldQuantity;

            if (
              availableStock <
              item.quantity
            ) {
              throw new Error(
                `Stock ${product.name} tidak mencukupi. Stock tersedia: ${availableStock}.`
              );
            }

            const price =
              new Prisma.Decimal(
                product.price
              );

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

            return {
              productId:
                product.id,

              productName:
                product.name,

              price,

              quantity:
                item.quantity,

              subtotal:
                itemSubtotal,
            };
          }
        );

      const shipping =
        new Prisma.Decimal(
          shippingCost
        );

      const total =
        subtotal.plus(
          shipping
        );

      /**
       * 6. Hitung perubahan stock.
       *
       * old quantity → new quantity
       *
       * delta > 0:
       * stock berkurang
       *
       * delta < 0:
       * stock dikembalikan
       */
      const oldStockMap =
        new Map<
          string,
          number
        >();

      for (
        const item of order.items
      ) {
        oldStockMap.set(
          item.productId,
          (oldStockMap.get(
            item.productId
          ) ?? 0) +
            item.quantity
        );
      }

      const newStockMap =
        new Map<
          string,
          number
        >();

      for (
        const item of finalItems
      ) {
        newStockMap.set(
          item.productId,
          item.quantity
        );
      }

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

        if (delta === 0) {
          continue;
        }

        if (delta > 0) {
          const result =
            await tx.product.updateMany(
              {
                where: {
                  id: productId,

                  deletedAt: null,

                  stock: {
                    gte: delta,
                  },
                },

                data: {
                  stock: {
                    decrement:
                      delta,
                  },
                },
              }
            );

          if (
            result.count !== 1
          ) {
            const product =
              productMap.get(
                productId
              );

            throw new Error(
              `Stock ${product?.name ?? productId} tidak mencukupi atau berubah sebelum transaksi selesai.`
            );
          }
        } else {
          await tx.product.update({
            where: {
              id: productId,
            },

            data: {
              stock: {
                increment:
                  Math.abs(
                    delta
                  ),
              },
            },
          });
        }
      }

      /**
       * 7. Ganti OrderItem.
       *
       * Karena order hanya boleh diedit
       * dalam status PENDING, cara ini
       * lebih sederhana dan konsisten
       * daripada melakukan diff record satu
       * per satu.
       */
      await tx.orderItem.deleteMany({
        where: {
          orderId: id,
        },
      });

      await tx.orderItem.createMany({
        data: newOrderItems.map(
          (item) => ({
            orderId: id,

            productId:
              item.productId,

            productName:
              item.productName,

            price: item.price,

            quantity:
              item.quantity,

            subtotal:
              item.subtotal,
          })
        ),
      });

      /**
       * 8. Update order utama.
       */
      const updatedOrder =
        await tx.order.update({
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

      return updatedOrder;
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
     *
     * PENDING hanya dapat menuju:
     *
     * - PROCESSING
     * - CANCELLED
     *
     * PROCESSING membutuhkan pembayaran terverifikasi.
     * --------------------------------------------------------
     */

    if (order.status === "PENDING") {
      if (status === "PROCESSING") {
        if (!isPaymentVerified) {
          return {
            success: false,
            message:
              "Pesanan tidak dapat diproses sebelum pembayaran diverifikasi.",
          };
        }
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
     *
     * Status ini dapat:
     *
     * - Menunggu pembayaran
     * - Dibatalkan
     *
     * Perubahan ke PROCESSING sebaiknya dilakukan setelah
     * pembayaran diverifikasi.
     * --------------------------------------------------------
     */

    if (
      order.status === "WAITING_PAYMENT"
    ) {
      if (
        status !== "WAITING_VERIFICATION" &&
        status !== "CANCELLED"
      ) {
        return {
          success: false,
          message:
            "Pesanan yang menunggu pembayaran hanya dapat dilanjutkan ke verifikasi atau dibatalkan.",
        };
      }
    }

    /**
     * --------------------------------------------------------
     * WAITING VERIFICATION
     *
     * Setelah pembayaran diverifikasi:
     *
     * WAITING_VERIFICATION
     *        ↓
     * PROCESSING
     * --------------------------------------------------------
     */

    if (
      order.status === "WAITING_VERIFICATION"
    ) {
      if (status === "PROCESSING") {
        if (!isPaymentVerified) {
          return {
            success: false,
            message:
              "Pesanan tidak dapat diproses sebelum pembayaran diverifikasi.",
          };
        }
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
     *
     * Pesanan sedang disiapkan.
     *
     * Dapat menuju:
     *
     * PROCESSING
     *      ↓
     * SHIPPING
     *
     * atau
     *
     * PROCESSING
     *      ↓
     * CANCELLED
     * --------------------------------------------------------
     */

    if (order.status === "PROCESSING") {
      if (
        status !== "SHIPPING" &&
        status !== "CANCELLED"
      ) {
        return {
          success: false,
          message:
            "Pesanan yang sedang diproses hanya dapat ditandai sebagai dikirim atau dibatalkan.",
        };
      }
    }

    /**
     * --------------------------------------------------------
     * SHIPPING
     *
     * Pesanan sudah dikirim.
     *
     * Dapat menuju:
     *
     * SHIPPING
     *      ↓
     * COMPLETED
     * --------------------------------------------------------
     */

    if (order.status === "SHIPPING") {
      if (status === "COMPLETED") {
        if (!isPaymentVerified) {
          return {
            success: false,
            message:
              "Pesanan tidak dapat diselesaikan sebelum pembayaran diverifikasi.",
          };
        }
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
     * UPDATE STATUS
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
   * 2. Status menjadi CANCELLED
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
       * Gabungkan quantity berdasarkan
       * productId.
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
          (quantities.get(
            item.productId
          ) ?? 0) +
            item.quantity
        );
      }

      /**
       * Kembalikan stock.
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

        await tx.product.update({
          where: {
            id: productId,
          },

          data: {
            stock: {
              increment:
                quantity,
            },
          },
        });
      }

      /**
       * Ubah status menjadi
       * CANCELLED.
       */
      const cancelledOrder =
        await tx.order.update({
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

      return cancelledOrder;
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
static async deleteOrder(
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
      "Order sudah berada di Trash."
    );
  }

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
   *
   * Customer checkout transaction.
   *
   * Flow:
   * - Validate address
   * - Get cart
   * - Validate stock
   * - Create order
   * - Reduce stock
   * - Create stock ledger
   * - Clear cart
   * ============================================================
   */

  static async createCheckoutOrder(
  userId: string,
  addressId: string,
  paymentChannelId: string,
  notes?: string | null
) {
    try {
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
 * VALIDATE PAYMENT CHANNEL
 * ========================================================
 */

const paymentChannel =
  await prisma.paymentChannel.findFirst({
    where: {
      id: paymentChannelId,
      isActive: true,
    },
  });

if (!paymentChannel) {
  return {
    success: false,
    message:
      "Metode pembayaran tidak tersedia atau sudah tidak aktif.",
  };
}

      /**
       * ========================================================
       * VALIDATE PRODUCTS
       * ========================================================
       */

      for (const item of cart.items) {
        if (
          !item.product.isPublished ||
          item.product.deletedAt
        ) {
          return {
            success: false,
            message:
              `Produk ${item.product.name} sudah tidak tersedia.`,
          };
        }

        if (
          item.quantity >
          item.product.stock
        ) {
          return {
            success: false,
            message:
              `Stok ${item.product.name} tidak mencukupi. Tersedia ${item.product.stock} ${item.product.unit}.`,
          };
        }
      }

      /**
       * ========================================================
       * CALCULATE SUBTOTAL
       * ========================================================
       */

      const subtotal =
        cart.items.reduce(
          (total, item) => {
            return (
              total +
              Number(item.product.price) *
                item.quantity
            );
          },
          0
        );

      /**
       * ========================================================
       * SHIPPING COST
       * ========================================================
       */

      const shippingCost = 0;

      const total =
        subtotal +
        shippingCost;

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
             * CREATE ORDER
             */

            const createdOrder =
  await tx.order.create({
    data: {
      orderNumber,
      userId,
      addressId,

      paymentMethod:
        "BANK_TRANSFER",

      paymentChannelId,

      subtotal,
      shippingCost,
      total,

      notes:
        notes ?? null,

                  items: {
                    create:
                      cart.items.map(
                        (item) => ({
                          productId:
                            item.productId,

                          productName:
                            item.product.name,

                          price:
                            item.product.price,

                          quantity:
                            item.quantity,

                          subtotal:
                            Number(
                              item.product.price
                            ) *
                            item.quantity,
                        })
                      ),
                  },
                },

                include: {
                  items: true,
                  address: true,
                },
              });

            /**
             * UPDATE STOCK
             * + CREATE STOCK LEDGER
             */

            for (
              const item of cart.items
            ) {
              const stockBefore =
                item.product.stock;

              const stockAfter =
                stockBefore -
                item.quantity;

              await tx.product.update({
                where: {
                  id:
                    item.productId,
                },

                data: {
                  stock:
                    stockAfter,
                },
              });

              await tx.stockLedger.create({
                data: {
                  productId:
                    item.productId,

                  orderId:
                    createdOrder.id,

                  type:
                    "SALE",

                  quantity:
                    -item.quantity,

                  stockBefore,

                  stockAfter,

                  note:
                    `Penjualan ${createdOrder.orderNumber}`,
                },
              });
            }

            /**
             * CLEAR CART
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
 * CREATE ADMIN NOTIFICATION
 * ========================================================
 *
 * Notifikasi dibuat SETELAH transaction berhasil.
 *
 * Jika notifikasi gagal, order tetap berhasil
 * dan checkout customer tidak terganggu.
 */
try {
  /**
   * Ambil data customer karena createdOrder
   * saat ini hanya include items dan address.
   */
  const customer =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        name: true,
      },
    });

  await notificationService.createOrderNotification({
    orderId: order.id,

    orderNumber:
      order.orderNumber,

    customerName:
      customer?.name ?? "Customer",

    totalAmount:
      Number(order.total),
  });
} catch (notificationError) {
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

  data: order,
};
    } catch (error) {
      console.error(
        "[CREATE_CHECKOUT_ORDER_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal membuat pesanan. Silakan coba lagi.",
      };
    }
  }


}