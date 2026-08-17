import {
  PaymentStatus,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

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

        if (
          paymentProof.status !==
          PaymentStatus.PENDING
        ) {
          throw new Error(
            "Pembayaran ini sudah diproses sebelumnya."
          );
        }

        const now =
          new Date();

        /**
         * ====================================================
         * UPDATE PAYMENT PROOF
         * ====================================================
         */

        const updatedProof =
          await tx.paymentProof.update({
            where: {
              id,
            },

            data: {
              status:
                PaymentStatus.VERIFIED,

              verifiedAt:
                now,

              verifiedById,
            },
          });

        /**
         * ====================================================
         * UPDATE ORDER
         * ====================================================
         */

        await tx.order.update({
          where: {
            id:
              paymentProof.orderId,
          },

          data: {
            paymentStatus:
              PaymentStatus.VERIFIED,

            status:
              "PROCESSING",

            paidAt:
              now,
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

        if (
          paymentProof.status !==
          PaymentStatus.PENDING
        ) {
          throw new Error(
            "Pembayaran ini sudah diproses sebelumnya."
          );
        }

        const now =
          new Date();

        /**
         * ====================================================
         * UPDATE PAYMENT PROOF
         * ====================================================
         */

        const updatedProof =
          await tx.paymentProof.update({
            where: {
              id,
            },

            data: {
              status:
                PaymentStatus.REJECTED,

              rejectionReason,

              verifiedAt:
                now,

              verifiedById,
            },
          });

        /**
         * ====================================================
         * UPDATE ORDER
         * ====================================================
         */

        await tx.order.update({
          where: {
            id:
              paymentProof.orderId,
          },

          data: {
            paymentStatus:
              PaymentStatus.REJECTED,

            status:
              "WAITING_PAYMENT",
          },
        });

        return updatedProof;
      }
    );
  }
}