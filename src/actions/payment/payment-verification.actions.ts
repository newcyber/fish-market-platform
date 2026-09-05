"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import {
  PaymentVerificationService,
} from "@/services/payment/payment-verification.service";

/**
 * ============================================================
 *
 * PAYMENT VERIFICATION ACTIONS
 *
 * Server Actions untuk proses verifikasi pembayaran
 * oleh Admin / Super Admin.
 *
 * IMPORTANT:
 * Authorization wajib dilakukan di Server Action.
 * Jangan hanya mengandalkan halaman /admin/payments
 * karena Server Action dapat dipanggil secara langsung.
 *
 * ============================================================
 */

/**
 * ============================================================
 * VERIFY PAYMENT
 * ============================================================
 */
export async function verifyPaymentAction(
  paymentProofId: string
) {
  try {
    /**
     * ==========================================================
     * 1. AUTHORIZE ADMIN
     * ==========================================================
     *
     * requireAdmin() memastikan hanya role Admin / Super Admin
     * yang dapat menjalankan proses verifikasi pembayaran.
     */
    const session = await requireAdmin();

    /**
     * ==========================================================
     * 2. VALIDATE PAYMENT PROOF ID
     * ==========================================================
     */
    const normalizedPaymentProofId = String(
      paymentProofId ?? ""
    ).trim();

    if (!normalizedPaymentProofId) {
      return {
        success: false,
        message: "ID pembayaran wajib diisi.",
      };
    }

    /**
     * ==========================================================
     * 3. VERIFY PAYMENT
     * ==========================================================
     *
     * Business lifecycle tetap berada di
     * PaymentVerificationService.
     *
     * Jangan melakukan update database langsung dari action.
     */
    const result =
      await PaymentVerificationService.verify(
        normalizedPaymentProofId,
        session.user.id
      );

    /**
     * ==========================================================
     * 4. REVALIDATE RELATED ADMIN PAGES
     * ==========================================================
     */
    if (result.success) {
      revalidatePath("/admin/payments");
      revalidatePath(
        `/admin/payments/${normalizedPaymentProofId}`
      );
      revalidatePath("/admin/orders");
    }

    return result;
  } catch (error) {
    console.error(
      "[VERIFY_PAYMENT_ACTION_ERROR]",
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
 * ============================================================
 * REJECT PAYMENT
 * ============================================================
 */
export async function rejectPaymentAction(
  paymentProofId: string,
  rejectionReason: string
) {
  try {
    /**
     * ==========================================================
     * 1. AUTHORIZE ADMIN
     * ==========================================================
     */
    const session = await requireAdmin();

    /**
     * ==========================================================
     * 2. VALIDATE PAYMENT PROOF ID
     * ==========================================================
     */
    const normalizedPaymentProofId = String(
      paymentProofId ?? ""
    ).trim();

    if (!normalizedPaymentProofId) {
      return {
        success: false,
        message: "ID pembayaran wajib diisi.",
      };
    }

    /**
     * ==========================================================
     * 3. VALIDATE REJECTION REASON
     * ==========================================================
     */
    const normalizedRejectionReason = String(
      rejectionReason ?? ""
    ).trim();

    if (!normalizedRejectionReason) {
      return {
        success: false,
        message: "Alasan penolakan wajib diisi.",
      };
    }

    /**
     * ==========================================================
     * 4. REJECT PAYMENT
     * ==========================================================
     *
     * Business lifecycle tetap berada di
     * PaymentVerificationService.
     */
    const result =
      await PaymentVerificationService.reject(
        normalizedPaymentProofId,
        normalizedRejectionReason,
        session.user.id
      );

    /**
     * ==========================================================
     * 5. REVALIDATE RELATED ADMIN PAGES
     * ==========================================================
     */
    if (result.success) {
      revalidatePath("/admin/payments");
      revalidatePath(
        `/admin/payments/${normalizedPaymentProofId}`
      );
      revalidatePath("/admin/orders");
    }

    return result;
  } catch (error) {
    console.error(
      "[REJECT_PAYMENT_ACTION_ERROR]",
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
