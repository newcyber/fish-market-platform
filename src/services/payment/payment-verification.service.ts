import { PaymentStatus } from "@prisma/client";

import {
  PaymentVerificationRepository,
} from "@/repositories/payment/payment-verification.repository";

/**
 * ============================================================
 *
 * PAYMENT VERIFICATION SERVICE
 *
 * Business logic untuk proses verifikasi
 * bukti pembayaran customer oleh admin.
 *
 * ============================================================
 */

export interface PaymentVerificationResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * ============================================================
 * ADMIN PAYMENT LIST OPTIONS
 * ============================================================
 */

export interface AdminPaymentListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: PaymentStatus;
}

/**
 * ============================================================
 * ADMIN PAYMENT LIST TYPES
 * ============================================================
 */

export interface AdminPaymentListItem {
  id: string;
  status: PaymentStatus;
  image: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  createdAt: Date;
  verifiedAt: Date | null;
  rejectionReason: string | null;

  order: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;

    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };

    paymentChannel: {
      id: string;
      name: string;
      type: string;
      bankName: string | null;
      accountNumber: string | null;
      accountHolder: string | null;
    } | null;
  };
}

export interface AdminPaymentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminPaymentStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

export interface AdminPaymentListData {
  payments: AdminPaymentListItem[];
  pagination: AdminPaymentPagination;
}

export class PaymentVerificationService {
  /**
   * ==========================================================
   * GET ALL PAYMENT PROOFS
   * ==========================================================
   *
   * Method lama.
   *
   * Tetap dipertahankan untuk compatibility dengan halaman
   * atau komponen lain yang masih menggunakan getAll().
   */

  static async getAll(): Promise<
    PaymentVerificationResult
  > {
    try {
      const paymentProofs =
        await PaymentVerificationRepository.findAll();

      return {
        success: true,
        data: paymentProofs,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_VERIFICATION_GET_ALL_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal mengambil data pembayaran.",
      };
    }
  }

  /**
   * ==========================================================
   * GET PAYMENT PROOF BY ID
   * ==========================================================
   */

  static async getById(
    id: string
  ): Promise<PaymentVerificationResult> {
    try {
      const normalizedId =
        String(id ?? "").trim();

      if (!normalizedId) {
        return {
          success: false,
          message:
            "ID pembayaran tidak valid.",
        };
      }

      const paymentProof =
        await PaymentVerificationRepository.findById(
          normalizedId
        );

      if (!paymentProof) {
        return {
          success: false,
          message:
            "Bukti pembayaran tidak ditemukan.",
        };
      }

      return {
        success: true,
        data: paymentProof,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_VERIFICATION_GET_BY_ID_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal mengambil detail pembayaran.",
      };
    }
  }

  /**
   * ==========================================================
   * GET ADMIN PAYMENT LIST
   * ==========================================================
   *
   * Digunakan oleh:
   *
   *   /admin/payments
   *
   * Mendukung:
   *
   *   - Search order number
   *   - Search customer name
   *   - Search customer email
   *   - Filter status
   *   - Pagination
   *
   * Data Decimal dari Prisma dinormalisasi menjadi number
   * sebelum dikirim ke UI.
   */

  static async getAdminPayments(
    options: AdminPaymentListOptions = {}
  ): Promise<
    PaymentVerificationResult<AdminPaymentListData>
  > {
    try {
      const page =
        options.page ?? 1;

      const limit =
        options.limit ?? 20;

      if (
        !Number.isInteger(page) ||
        page < 1
      ) {
        return {
          success: false,
          message:
            "Page harus berupa bilangan bulat positif.",
        };
      }

      if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return {
          success: false,
          message:
            "Limit harus berada di antara 1 dan 100.",
        };
      }

      const search =
        String(
          options.search ?? ""
        ).trim() || undefined;

      const status =
        options.status;

      const skip =
        (page - 1) * limit;

      const [
        payments,
        total,
      ] = await Promise.all([
        PaymentVerificationRepository.findAdminPayments({
          search,
          status,
          skip,
          take: limit,
        }),

        PaymentVerificationRepository.countAdminPayments({
          search,
          status,
        }),
      ]);

      const totalPages =
        total > 0
          ? Math.ceil(total / limit)
          : 1;

      const normalizedPayments: AdminPaymentListItem[] =
        payments.map((payment) => ({
          id: payment.id,
          status: payment.status,
          image: payment.image,
          bankName: payment.bankName,
          accountName: payment.accountName,
          accountNumber:
            payment.accountNumber,
          createdAt:
            payment.createdAt,
          verifiedAt:
            payment.verifiedAt,
          rejectionReason:
            payment.rejectionReason,

          order: {
            id:
              payment.order.id,

            orderNumber:
              payment.order.orderNumber,

            total:
              Number(
                payment.order.total
              ),

            status:
              String(
                payment.order.status
              ),

            user: {
              id:
                payment.order.user.id,

              name:
                payment.order.user.name,

              email:
                payment.order.user.email,

              phone:
                payment.order.user.phone,
            },

            paymentChannel:
              payment.order.paymentChannel
                ? {
                    id:
                      payment.order
                        .paymentChannel
                        .id,

                    name:
                      payment.order
                        .paymentChannel
                        .name,

                    type:
                      String(
                        payment.order
                          .paymentChannel
                          .type
                      ),

                    bankName:
                      payment.order
                        .paymentChannel
                        .bankName,

                    accountNumber:
                      payment.order
                        .paymentChannel
                        .accountNumber,

                    accountHolder:
                      payment.order
                        .paymentChannel
                        .accountHolder,
                  }
                : null,
          },
        }));

      return {
        success: true,

        data: {
          payments:
            normalizedPayments,

          pagination: {
            page,
            limit,
            total,
            totalPages,

            hasNextPage:
              page < totalPages,

            hasPreviousPage:
              page > 1,
          },
        },
      };
    } catch (error) {
      console.error(
        "[PAYMENT_VERIFICATION_GET_ADMIN_PAYMENTS_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal mengambil daftar pembayaran admin.",
      };
    }
  }

  /**
   * ==========================================================
   * GET ADMIN PAYMENT STATS
   * ==========================================================
   *
   * KPI halaman:
   *
   *   - Total Bukti
   *   - Menunggu Verifikasi
   *   - Terverifikasi
   *   - Ditolak
   */

  static async getAdminPaymentStats(): Promise<
    PaymentVerificationResult<AdminPaymentStats>
  > {
    try {
      const stats =
        await PaymentVerificationRepository.getAdminPaymentStats();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_VERIFICATION_GET_ADMIN_STATS_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal mengambil statistik pembayaran.",
      };
    }
  }

  /**
   * ==========================================================
   * VERIFY PAYMENT
   * ==========================================================
   *
   * Hanya payment proof PENDING yang dapat diverifikasi.
   *
   * Seluruh perubahan:
   *
   *   PaymentProof
   *   Order.paymentStatus
   *   Order.status
   *   Order.paidAt
   *
   * dilakukan oleh repository dalam satu transaction.
   *
   * Repository juga melakukan row-level locking terhadap Order
   * agar proses verify bersamaan dengan proses order lifecycle
   * tidak menghasilkan state yang tidak konsisten.
   */

  static async verify(
    id: string,
    verifiedById: string
  ): Promise<PaymentVerificationResult> {
    try {
      const normalizedId =
        String(id ?? "").trim();

      const normalizedVerifierId =
        String(verifiedById ?? "").trim();

      if (!normalizedId) {
        return {
          success: false,
          message:
            "ID pembayaran tidak valid.",
        };
      }

      if (!normalizedVerifierId) {
        return {
          success: false,
          message:
            "Admin verifier tidak valid.",
        };
      }

      /**
       * ========================================================
       * SINGLE TRANSACTION BOUNDARY
       * ========================================================
       *
       * Jangan melakukan findById() terlebih dahulu di service.
       *
       * Validasi state dilakukan di dalam transaction agar
       * hasil validasi dan update berada pada state database
       * yang sama.
       */

      const updatedPayment =
        await PaymentVerificationRepository.verify(
          normalizedId,
          normalizedVerifierId
        );

      return {
        success: true,
        message:
          "Pembayaran berhasil diverifikasi. Pesanan sekarang dapat diproses.",
        data: updatedPayment,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_VERIFICATION_VERIFY_ERROR]",
        error
      );

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal memverifikasi pembayaran.",
      };
    }
  }

  /**
   * ==========================================================
   * REJECT PAYMENT
   * ==========================================================
   *
   * Alasan penolakan wajib diisi.
   *
   * Customer nantinya dapat mengirim ulang
   * bukti pembayaran.
   */

  static async reject(
    id: string,
    rejectionReason: string,
    verifiedById: string
  ): Promise<PaymentVerificationResult> {
    try {
      const normalizedId =
        String(id ?? "").trim();

      const normalizedReason =
        String(
          rejectionReason ?? ""
        ).trim();

      const normalizedVerifierId =
        String(
          verifiedById ?? ""
        ).trim();

      if (!normalizedId) {
        return {
          success: false,
          message:
            "ID pembayaran tidak valid.",
        };
      }

      if (!normalizedVerifierId) {
        return {
          success: false,
          message:
            "Admin verifier tidak valid.",
        };
      }

      if (!normalizedReason) {
        return {
          success: false,
          message:
            "Alasan penolakan wajib diisi.",
        };
      }

      /**
       * ========================================================
       * SINGLE TRANSACTION BOUNDARY
       * ========================================================
       *
       * Repository menangani:
       *
       *   PaymentProof
       *   Order
       *
       * dalam satu transaction.
       */

      const updatedPayment =
        await PaymentVerificationRepository.reject(
          normalizedId,
          normalizedReason,
          normalizedVerifierId
        );

      return {
        success: true,
        message:
          "Pembayaran ditolak. Customer dapat mengirim ulang bukti pembayaran.",
        data: updatedPayment,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_VERIFICATION_REJECT_ERROR]",
        error
      );

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal menolak pembayaran.",
      };
    }
  }
}
