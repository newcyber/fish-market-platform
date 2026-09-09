import {
  PaymentStatus,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

interface AdminPaymentFilters {
  search?: string;
  status?: PaymentStatus;
}

/**
 * ============================================================
 *
 * PAYMENT VERIFICATION REPOSITORY
 *
 * Database access layer untuk proses verifikasi
 * bukti pembayaran customer.
 *
 * IMPORTANT:
 *
 * PaymentProof menyimpan data snapshot pembayaran,
 * sedangkan Order tetap menjadi sumber relasi terhadap
 * PaymentChannel yang dipilih saat checkout.
 *
 * Flow:
 *
 * PaymentProof
 *        ↓
 * Order
 *        ↓
 * PaymentChannel
 *
 * Dengan relasi ini Admin dapat mengetahui apakah
 * pembayaran menggunakan:
 *
 * - BANK_TRANSFER
 * - QRIS
 *
 * termasuk untuk data lama ketika bankName pada
 * PaymentProof bernilai null.
 *
 * ============================================================
 */

export class PaymentVerificationRepository {
  /**
   * ==========================================================
   * FIND ALL PAYMENT PROOFS
   * ==========================================================
   */

  static async findAll() {
    return prisma.paymentProof.findMany({
      where: {
        deletedAt: null,
      },

      include: {
        order: {
          include: {
            /**
             * ==================================================
             * CUSTOMER
             * ==================================================
             */

            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },

            /**
             * ==================================================
             * PAYMENT CHANNEL
             * ==================================================
             *
             * Penting untuk membedakan:
             *
             * BANK_TRANSFER
             * QRIS
             *
             * Jangan hanya bergantung kepada:
             *
             * paymentProof.bankName
             *
             * karena data lama dapat memiliki:
             *
             * bankName = null
             */

            paymentChannel: {
              select: {
                id: true,
                name: true,
                type: true,
                bankName: true,
                accountNumber: true,
                accountHolder: true,
              },
            },
          },
        },
      },

      orderBy: [
        {
          status: "asc",
        },

        {
          createdAt: "desc",
        },
      ],
    });
  }

  static async findAdminPayments(options?: {
  search?: string;
  status?: PaymentStatus;
  skip?: number;
  take?: number;
}) {
  const search = options?.search?.trim() || undefined;
  const skip = Math.max(options?.skip ?? 0, 0);
  const take = Math.min(
    Math.max(options?.take ?? 20, 1),
    100
  );

  return prisma.paymentProof.findMany({
    where: {
      deletedAt: null,

      ...(options?.status
        ? {
            status: options.status,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                order: {
                  orderNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                order: {
                  user: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                order: {
                  user: {
                    email: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },

    skip,
    take,

    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },

          paymentChannel: {
            select: {
              id: true,
              name: true,
              type: true,
              bankName: true,
              accountNumber: true,
              accountHolder: true,
            },
          },
        },
      },
    },

    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

static async countAdminPayments(
  filters?: AdminPaymentFilters
) {
  const search = filters?.search?.trim() || undefined;

  return prisma.paymentProof.count({
    where: {
      deletedAt: null,

      ...(filters?.status
        ? {
            status: filters.status,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                order: {
                  orderNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                order: {
                  user: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                order: {
                  user: {
                    email: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
  });
}

static async getAdminPaymentStats() {
  const [
    total,
    pending,
    verified,
    rejected,
  ] = await Promise.all([
    prisma.paymentProof.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.paymentProof.count({
      where: {
        deletedAt: null,
        status: PaymentStatus.PENDING,
      },
    }),

    prisma.paymentProof.count({
      where: {
        deletedAt: null,
        status: PaymentStatus.VERIFIED,
      },
    }),

    prisma.paymentProof.count({
      where: {
        deletedAt: null,
        status: PaymentStatus.REJECTED,
      },
    }),
  ]);

  return {
    total,
    pending,
    verified,
    rejected,
  };
}

  /**
   * ==========================================================
   * FIND BY ID
   * ==========================================================
   */

  static async findById(
    id: string
  ) {
    return prisma.paymentProof.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      include: {
        order: {
          include: {
            /**
             * ==================================================
             * CUSTOMER
             * ==================================================
             */

            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },

            /**
             * ==================================================
             * PAYMENT CHANNEL
             * ==================================================
             */

            paymentChannel: {
              select: {
                id: true,
                name: true,
                type: true,
                bankName: true,
                accountNumber: true,
                accountHolder: true,
                instructions: true,
                description: true,
              },
            },

            /**
             * ==================================================
             * ADDRESS
             * ==================================================
             */

            address: true,

            /**
             * ==================================================
             * ORDER ITEMS
             * ==================================================
             */

            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * ==========================================================
   * VERIFY PAYMENT
   *
   * PaymentProof:
   *
   * PENDING
   *   ↓
   * VERIFIED
   *
   * Order:
   *
   * paymentStatus
   *   ↓
   * VERIFIED
   *
   * status
   *   ↓
   * PROCESSING
   *
   * paidAt
   *   ↓
   * now
   *
   * ==========================================================
   */

static async verify(
  id: string,
  verifiedById: string
) {
  return prisma.$transaction(
    async (tx) => {
      /**
       * ========================================================
       * 1. LOCK PAYMENT'S ORDER
       * ========================================================
       *
       * Order menjadi synchronization point antara:
       *
       *   payment verification
       *   order cancellation
       *   order lifecycle
       *
       * sehingga dua proses tidak dapat memproses Order yang
       * sama secara bersamaan.
       */
      const paymentProofOwner =
        await tx.paymentProof.findFirst({
          where: {
            id,
            deletedAt: null,
          },
          select: {
            orderId: true,
          },
        });

      if (!paymentProofOwner) {
        throw new Error(
          "Bukti pembayaran tidak ditemukan."
        );
      }

      const lockedOrder =
        await tx.$queryRaw<
          Array<{ id: string }>
        >`
          SELECT "id"
          FROM "Order"
          WHERE "id" = ${paymentProofOwner.orderId}
          FOR UPDATE
        `;

      if (lockedOrder.length === 0) {
        throw new Error(
          "Order tidak ditemukan."
        );
      }

      /**
       * ========================================================
       * 2. READ CURRENT PAYMENT PROOF
       * ========================================================
       *
       * Dibaca setelah Order terkunci.
       */
      const paymentProof =
        await tx.paymentProof.findFirst({
          where: {
            id,
            deletedAt: null,
          },
        });

      if (!paymentProof) {
        throw new Error(
          "Bukti pembayaran tidak ditemukan."
        );
      }

      /**
       * ========================================================
       * 3. READ CURRENT ORDER
       * ========================================================
       */
      const order =
        await tx.order.findUnique({
          where: {
            id: paymentProof.orderId,
          },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            deletedAt: true,
          },
        });

      if (!order) {
        throw new Error(
          "Order tidak ditemukan."
        );
      }

      /**
       * ========================================================
       * 4. ORDER GUARDS
       * ========================================================
       */
      if (order.deletedAt) {
        throw new Error(
          "Order yang sudah dihapus tidak dapat diubah."
        );
      }

      if (
        order.status === "CANCELLED"
      ) {
        throw new Error(
          "Pembayaran order yang sudah dibatalkan tidak dapat diubah."
        );
      }

      if (
        order.status === "COMPLETED"
      ) {
        throw new Error(
          "Pembayaran order yang sudah selesai tidak dapat diubah."
        );
      }

      /**
       * ========================================================
       * 5. PAYMENT PROOF GUARD
       * ========================================================
       */
      if (
        paymentProof.status !==
        PaymentStatus.PENDING
      ) {
        throw new Error(
          "Pembayaran ini sudah diproses sebelumnya."
        );
      }

      /**
       * ========================================================
       * 6. ORDER PAYMENT GUARD
       * ========================================================
       *
       * PaymentProof PENDING harus tetap konsisten dengan
       * Order yang belum VERIFIED.
       */
      if (
        order.paymentStatus ===
        PaymentStatus.VERIFIED
      ) {
        throw new Error(
          "Order ini sudah memiliki pembayaran VERIFIED."
        );
      }

      /**
       * ========================================================
       * 7. DETERMINE NEXT ORDER STATUS
       * ========================================================
       *
       * Sama dengan lifecycle OrderService:
       *
       * PENDING
       * WAITING_PAYMENT
       * WAITING_VERIFICATION
       *       ↓
       *   VERIFIED
       *       ↓
       * PROCESSING
       *
       * Jangan menurunkan order yang sudah lebih maju.
       */
      let nextOrderStatus =
        order.status;

      if (
        order.status === "PENDING" ||
        order.status === "WAITING_PAYMENT" ||
        order.status === "WAITING_VERIFICATION"
      ) {
        nextOrderStatus =
          "PROCESSING";
      }

      const now = new Date();

      /**
       * ========================================================
       * 8. UPDATE PAYMENT PROOF
       * ========================================================
       */
      const updatedProof =
        await tx.paymentProof.update({
          where: {
            id,
          },
          data: {
            status:
              PaymentStatus.VERIFIED,

            verifiedAt: now,

            verifiedById,

            /**
             * Jika sebelumnya pernah REJECTED, data rejection
             * tidak boleh ikut terbawa ke verification baru.
             */
            rejectionReason: null,
          },
        });

      /**
       * ========================================================
       * 9. UPDATE ORDER
       * ========================================================
       */
      await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentStatus:
            PaymentStatus.VERIFIED,

          status:
            nextOrderStatus,

          paidAt: now,
        },
      });

      return updatedProof;
    }
  );
}

  /**
   * ==========================================================
   * REJECT PAYMENT
   *
   * PaymentProof:
   *
   * PENDING
   *   ↓
   * REJECTED
   *
   * Order:
   *
   * paymentStatus
   *   ↓
   * REJECTED
   *
   * status
   *   ↓
   * WAITING_PAYMENT
   *
   * Customer dapat melakukan pembayaran ulang.
   *
   * ==========================================================
   */

static async reject(
  id: string,
  rejectionReason: string,
  verifiedById: string
) {
  return prisma.$transaction(
    async (tx) => {
      /**
       * ========================================================
       * 1. VALIDATE PAYMENT PROOF + GET ORDER ID
       * ========================================================
       */
      const paymentProofOwner =
        await tx.paymentProof.findFirst({
          where: {
            id,
            deletedAt: null,
          },
          select: {
            orderId: true,
          },
        });

      if (!paymentProofOwner) {
        throw new Error(
          "Bukti pembayaran tidak ditemukan."
        );
      }

      /**
       * ========================================================
       * 2. LOCK ORDER
       * ========================================================
       */
      const lockedOrder =
        await tx.$queryRaw<
          Array<{ id: string }>
        >`
          SELECT "id"
          FROM "Order"
          WHERE "id" = ${paymentProofOwner.orderId}
          FOR UPDATE
        `;

      if (lockedOrder.length === 0) {
        throw new Error(
          "Order tidak ditemukan."
        );
      }

      /**
       * ========================================================
       * 3. READ CURRENT PAYMENT PROOF
       * ========================================================
       */
      const paymentProof =
        await tx.paymentProof.findFirst({
          where: {
            id,
            deletedAt: null,
          },
        });

      if (!paymentProof) {
        throw new Error(
          "Bukti pembayaran tidak ditemukan."
        );
      }

      /**
       * ========================================================
       * 4. READ CURRENT ORDER
       * ========================================================
       */
      const order =
        await tx.order.findUnique({
          where: {
            id: paymentProof.orderId,
          },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            deletedAt: true,
          },
        });

      if (!order) {
        throw new Error(
          "Order tidak ditemukan."
        );
      }

      /**
       * ========================================================
       * 5. ORDER GUARDS
       * ========================================================
       */
      if (order.deletedAt) {
        throw new Error(
          "Order yang sudah dihapus tidak dapat diubah."
        );
      }

      if (
        order.status === "CANCELLED"
      ) {
        throw new Error(
          "Pembayaran order yang sudah dibatalkan tidak dapat diubah."
        );
      }

      if (
        order.status === "COMPLETED"
      ) {
        throw new Error(
          "Pembayaran order yang sudah selesai tidak dapat diubah."
        );
      }

      /**
       * ========================================================
       * 6. PAYMENT PROOF GUARD
       * ========================================================
       */
      if (
        paymentProof.status !==
        PaymentStatus.PENDING
      ) {
        throw new Error(
          "Pembayaran ini sudah diproses sebelumnya."
        );
      }

      /**
       * ========================================================
       * 7. ORDER PAYMENT GUARD
       * ========================================================
       */
      if (
        order.paymentStatus ===
        PaymentStatus.VERIFIED
      ) {
        throw new Error(
          "Order ini sudah memiliki pembayaran VERIFIED."
        );
      }

      const now = new Date();

      /**
       * ========================================================
       * 8. UPDATE PAYMENT PROOF
       * ========================================================
       */
      const updatedProof =
        await tx.paymentProof.update({
          where: {
            id,
          },
          data: {
            status:
              PaymentStatus.REJECTED,

            rejectionReason:
              rejectionReason.trim(),

            verifiedAt: null,
            verifiedById,

          },
        });

      /**
       * ========================================================
       * 9. UPDATE ORDER
       * ========================================================
       *
       * Penolakan payment mengembalikan order ke
       * WAITING_PAYMENT sehingga customer dapat melakukan
       * pembayaran / upload bukti kembali.
       *
       * Hanya order yang masih berada dalam fase pembayaran
       * yang boleh diturunkan ke WAITING_PAYMENT.
       */
      let nextOrderStatus =
        order.status;

      if (
        order.status === "PENDING" ||
        order.status === "WAITING_VERIFICATION"
      ) {
        nextOrderStatus =
          "WAITING_PAYMENT";
      }

      await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentStatus:
            PaymentStatus.REJECTED,

          status:
            nextOrderStatus,
        },
      });

      return updatedProof;
    }
  );
}
}
