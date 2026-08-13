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

export class PaymentVerificationService {
  /**
   * ==========================================================
   * GET ALL PAYMENT PROOFS
   * ==========================================================
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
      if (!id || !id.trim()) {
        return {
          success: false,
          message:
            "ID pembayaran tidak valid.",
        };
      }

      const paymentProof =
        await PaymentVerificationRepository.findById(
          id
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
   * VERIFY PAYMENT
   *
   * Hanya payment proof dengan status PENDING
   * yang dapat diverifikasi.
   * ==========================================================
   */

  static async verify(
    id: string,
    verifiedById: string
  ): Promise<PaymentVerificationResult> {
    try {
      if (!id || !id.trim()) {
        return {
          success: false,
          message:
            "ID pembayaran tidak valid.",
        };
      }

      if (
        !verifiedById ||
        !verifiedById.trim()
      ) {
        return {
          success: false,
          message:
            "Admin verifier tidak valid.",
        };
      }

      const paymentProof =
        await PaymentVerificationRepository.findById(
          id
        );

      if (!paymentProof) {
        return {
          success: false,
          message:
            "Bukti pembayaran tidak ditemukan.",
        };
      }

      if (
        paymentProof.status !==
        "PENDING"
      ) {
        return {
          success: false,
          message:
            "Pembayaran ini sudah diproses sebelumnya.",
        };
      }

      const updatedPayment =
        await PaymentVerificationRepository.verify(
          id,
          verifiedById
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
   *
   * Alasan penolakan wajib diisi.
   * Customer nantinya dapat mengirim ulang
   * bukti pembayaran.
   * ==========================================================
   */

  static async reject(
    id: string,
    rejectionReason: string,
    verifiedById: string
  ): Promise<PaymentVerificationResult> {
    try {
      if (!id || !id.trim()) {
        return {
          success: false,
          message:
            "ID pembayaran tidak valid.",
        };
      }

      if (
        !verifiedById ||
        !verifiedById.trim()
      ) {
        return {
          success: false,
          message:
            "Admin verifier tidak valid.",
        };
      }

      if (
        !rejectionReason ||
        !rejectionReason.trim()
      ) {
        return {
          success: false,
          message:
            "Alasan penolakan wajib diisi.",
        };
      }

      const paymentProof =
        await PaymentVerificationRepository.findById(
          id
        );

      if (!paymentProof) {
        return {
          success: false,
          message:
            "Bukti pembayaran tidak ditemukan.",
        };
      }

      if (
        paymentProof.status !==
        "PENDING"
      ) {
        return {
          success: false,
          message:
            "Pembayaran ini sudah diproses sebelumnya.",
        };
      }

      const updatedPayment =
        await PaymentVerificationRepository.reject(
          id,
          rejectionReason.trim(),
          verifiedById
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