"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import {
  PaymentVerificationService,
} from "@/services/payment/payment-verification.service";

/**
 * ============================================================
 *
 * PAYMENT VERIFICATION ACTIONS
 *
 * Server Actions untuk proses verifikasi pembayaran
 * oleh Admin.
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
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Anda harus login terlebih dahulu.",
      };
    }

    const result =
      await PaymentVerificationService.verify(
        paymentProofId,
        session.user.id
      );

    if (result.success) {
      revalidatePath(
        "/admin/payments"
      );

      revalidatePath(
        `/admin/payments/${paymentProofId}`
      );

      revalidatePath(
        "/admin/orders"
      );
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
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Anda harus login terlebih dahulu.",
      };
    }

    const result =
      await PaymentVerificationService.reject(
        paymentProofId,
        rejectionReason,
        session.user.id
      );

    if (result.success) {
      revalidatePath(
        "/admin/payments"
      );

      revalidatePath(
        `/admin/payments/${paymentProofId}`
      );

      revalidatePath(
        "/admin/orders"
      );
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