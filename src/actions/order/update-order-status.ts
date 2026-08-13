"use server";

import {
  OrderStatus,
} from "@prisma/client";

import OrderService from "@/services/order/order.service";

export async function updateOrderStatusAction(
  id: string,
  status: OrderStatus
) {
  try {
    const order =
      await OrderService.updateStatus(
        id,
        status
      );

    return {
      success: true,
      message:
        "Status order berhasil diperbarui.",
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status order.",
    };
  }
}