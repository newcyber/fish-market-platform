"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  auth,
} from "@/auth";

import OrderService from "@/services/order/order.service";

/**
 * ============================================================
 * CONFIRM QRIS PAYMENT ACTION
 * ============================================================
 *
 * Customer menekan tombol:
 *
 * "Saya Sudah Bayar"
 *
 * Action ini hanya mengirim konfirmasi pembayaran.
 *
 * Pembayaran TIDAK langsung dianggap VERIFIED.
 *
 * Status:
 *
 * WAITING PAYMENT
 *        ↓
 * CUSTOMER CONFIRMATION
 *        ↓
 * PENDING
 *        ↓
 * ADMIN VERIFICATION
 *        ↓
 * VERIFIED / REJECTED
 *
 * ============================================================
 */

export async function confirmQrisPaymentAction(
  orderId: string
) {
  try {
    /**
     * ========================================================
     * AUTHENTICATION
     * ========================================================
     */

    const session =
      await auth();

    if (!session?.user?.id) {
      return {
        success: false,

        message:
          "Sesi Anda telah berakhir. Silakan login kembali.",
      };
    }

    /**
     * ========================================================
     * VALIDATE ORDER ID
     * ========================================================
     */

    if (
      !orderId ||
      !orderId.trim()
    ) {
      return {
        success: false,

        message:
          "ID pesanan tidak valid.",
      };
    }

    /**
     * ========================================================
     * CONFIRM PAYMENT
     * ========================================================
     */

    const result =
      await OrderService.confirmQrisPayment(
        session.user.id,
        orderId
      );

    /**
     * ========================================================
     * REVALIDATE
     * ========================================================
     */

    if (result.success) {
      revalidatePath(
        `/customer/orders/${orderId}`
      );

      revalidatePath(
        `/customer/orders/${orderId}/payment`
      );

      revalidatePath(
        "/customer/orders"
      );

      revalidatePath(
        "/admin/payments"
      );

      revalidatePath(
        "/admin/orders"
      );
    }

    return result;
  } catch (error) {
    console.error(
      "[CONFIRM_QRIS_PAYMENT_ACTION_ERROR]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengirim konfirmasi pembayaran.",
    };
  }
}