"use server";

import OrderService, {
  type UpdateOrderInput,
} from "@/services/order/order.service";

export async function updateOrderAction(
  id: string,
  input: UpdateOrderInput
) {
  try {
    const order =
      await OrderService.updateOrder(
        id,
        input
      );

    return {
      success: true,

      message:
        "Order berhasil diperbarui.",

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
          : "Gagal memperbarui order.",
    };
  }
}