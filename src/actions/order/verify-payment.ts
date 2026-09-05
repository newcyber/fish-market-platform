"use server";

import {
  PaymentStatus,
} from "@prisma/client";

import { requireAdmin } from "@/lib/auth/admin";
import OrderService from "@/services/order/order.service";

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
    await requireAdmin();

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
    const order =
      await OrderService.markAsPaid(
        normalizedOrderId
      );

    return {
      success: true,

      message:
        "Pembayaran berhasil diverifikasi.",

      data: {
        id: order.id,

        paymentStatus:
          PaymentStatus.VERIFIED,

        paidAt:
          order.paidAt,
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
  orderId: string
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
    await requireAdmin();

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
    const order =
      await OrderService.updatePaymentStatus(
        normalizedOrderId,
        PaymentStatus.REJECTED
      );

    return {
      success: true,

      message:
        "Pembayaran order ditolak.",

      data: {
        id: order.id,

        paymentStatus:
          PaymentStatus.REJECTED,
      },
    };
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
