"use server";

import OrderService from "@/services/order/order.service";

export async function restoreOrderAction(
  id: string
) {
  try {
    const order =
      await OrderService.restoreOrder(id);

    return {
      success: true,
      message:
        "Order berhasil dipulihkan.",
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memulihkan order.",
    };
  }
}