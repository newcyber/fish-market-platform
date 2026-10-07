"use server";

import {
  PaymentStatus,
} from "@prisma/client";

import { requireAdmin } from "@/lib/auth/admin";
import {
  PaymentVerificationService,
} from "@/services/payment/payment-verification.service";

export async function verifyOrderPaymentAction(
  orderId: string
) {
  try {
    /**
     * ========================================================
     * AUTHORIZATION
     * ========================================================
     *
     * Hanya ADMIN / SUPER_ADMIN yang boleh memverifikasi
     * pembayaran.
     */
    const session = await requireAdmin();

    /**
     * ========================================================
     * VALIDATE ORDER ID
     * ========================================================
     */

    const normalizedOrderId = String(orderId ?? "").trim();

    if (!normalizedOrderId) {
      return {
        success: false,
        message: "Order ID wajib diisi.",
      };
    }

    /**
     * ========================================================
     * VERIFY PAYMENT
     * ========================================================
     *
     * markAsPaid() tetap menjadi satu-satunya pintu
     * perubahan payment menjadi VERIFIED.
     */
    const result =
      await PaymentVerificationService.verifyByOrderId(
        normalizedOrderId,
        session.user.id,
      );

    if (!result.success) {
      return result;
    }

    const payment = result.data as {
      orderId: string;
      status: PaymentStatus;
      verifiedAt: Date | null;
    };

    return {
      success: true,
      message: "Pembayaran berhasil diverifikasi.",
      data: {
        id: payment.orderId,
        paymentStatus: payment.status,
        paidAt: payment.verifiedAt,
      },
    };
  } catch (error) {
    console.error(
      "[VERIFY_ORDER_PAYMENT_ACTION_ERROR]",
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

export async function rejectOrderPaymentAction(
  orderId: string,
  rejectionReason: string,
) {
  try {
    /**
     * ========================================================
     * AUTHORIZATION
     * ========================================================
     *
     * Hanya ADMIN / SUPER_ADMIN yang boleh menolak
     * pembayaran.
     */
    const session = await requireAdmin();

    /**
     * ========================================================
     * VALIDATE ORDER ID
     * ========================================================
     */

    const normalizedOrderId = String(orderId ?? "").trim();

    if (!normalizedOrderId) {
      return {
        success: false,
        message: "Order ID wajib diisi.",
      };
    }

    /**
     * ========================================================
     * REJECT PAYMENT
     * ========================================================
     *
     * Tetap menggunakan lifecycle payment yang sudah
     * diaudit di OrderService.
     */
    const result =
      await PaymentVerificationService.rejectByOrderId(
        normalizedOrderId,
        rejectionReason,
        session.user.id,
      );

    return result;
  } catch (error) {
    console.error(
      "[REJECT_ORDER_PAYMENT_ACTION_ERROR]",
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
