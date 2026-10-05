"use server";

import {
  PaymentStatus,
} from "@prisma/client";

import OrderService from "@/services/order/order.service";
import { requireAdmin } from "@/lib/auth/admin";

export async function updatePaymentStatusAction(
  id: string,
  paymentStatus: PaymentStatus
) {
  try {
    // Payment status changes are privileged financial operations.
    // Never rely on the admin UI; Server Actions can be invoked directly.
    await requireAdmin();

    const order =
      await OrderService.updatePaymentStatus(
        id,
        paymentStatus
      );

    return {
      success: true,
      message:
        "Status pembayaran berhasil diperbarui.",
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status pembayaran.",
    };
  }
}