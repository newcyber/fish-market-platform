"use server";

import {
  PaymentStatus,
} from "@prisma/client";

import OrderService from "@/services/order/order.service";

export async function verifyOrderPaymentAction(
  orderId: string
) {
  try {
    if (!orderId) {
      return {
        success: false,
        message:
          "Order ID wajib diisi.",
      };
    }

    const order =
      await OrderService.markAsPaid(
        orderId
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
    if (!orderId) {
      return {
        success: false,
        message:
          "Order ID wajib diisi.",
      };
    }

    const order =
      await OrderService.updatePaymentStatus(
        orderId,
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
    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Gagal menolak pembayaran.",
    };
  }
}