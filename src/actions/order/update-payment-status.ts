"use server";

import {
  PaymentStatus,
} from "@prisma/client";

import OrderService from "@/services/order/order.service";

export async function updatePaymentStatusAction(
  id: string,
  paymentStatus: PaymentStatus
) {
  try {
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