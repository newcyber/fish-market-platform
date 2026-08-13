"use server";

import OrderService, {
  type CreateOrderInput,
} from "@/services/order/order.service";

export async function createOrderAction(
  input: CreateOrderInput
) {
  try {
    const order =
      await OrderService.createOrder(
        input
      );

    return {
      success: true,
      message:
        "Order berhasil dibuat.",
      data: {
        id: order.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal membuat order.",
    };
  }
}