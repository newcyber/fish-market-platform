"use server";

import OrderService from "@/services/order/order.service";

export async function forceDeleteOrderAction(
  id: string
) {
  try {
    const order =
      await OrderService.forceDeleteOrder(id);

    return {
      success: true,
      message:
        "Order berhasil dihapus permanen.",
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menghapus order secara permanen.",
    };
  }
}