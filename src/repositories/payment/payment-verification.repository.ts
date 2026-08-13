import { PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 *
 * PAYMENT VERIFICATION REPOSITORY
 *
 * Database access layer untuk proses verifikasi
 * bukti pembayaran customer.
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
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
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
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },

            address: true,

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
   * PENDING → VERIFIED
   *
   * Order:
   * paymentStatus → VERIFIED
   * status → PROCESSING
   * paidAt → now
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

        const now = new Date();

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
   * PENDING → REJECTED
   *
   * Order:
   * paymentStatus → REJECTED
   *
   * Order status kembali ke WAITING_PAYMENT
   * agar customer dapat melakukan pembayaran ulang.
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

        const now = new Date();

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

        await tx.order.update({
  where: {
    id:
      paymentProof.orderId,
  },

  data: {
    paymentStatus:
      PaymentStatus.REJECTED,

    status:
      "PENDING",
  },
});

        return updatedProof;
      }
    );
  }
}