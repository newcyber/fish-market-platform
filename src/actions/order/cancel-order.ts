"use server";

import { revalidatePath } from "next/cache";

import OrderService from "@/services/order/order.service";

export async function cancelOrderAction(
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
      await OrderService.cancelOrder(
        orderId
      );

    revalidatePath(
      "/admin/orders"
    );

    revalidatePath(
      `/admin/orders/${order.id}`
    );

    return {
      success: true,

      message:
        "Order berhasil dibatalkan.",

      data: {
        id: order.id,

        status:
          order.status,
      },
    };
  } catch (error) {
    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Gagal membatalkan order.",
    };
  }
}