"use server";

import { requireAdmin } from "@/lib/auth/admin";

import OrderService, {
  type UpdateOrderInput,
} from "@/services/order/order.service";

export async function updateOrderAction(
  id: string,
  input: UpdateOrderInput
) {
  try {
    await requireAdmin();

    const order =
      await OrderService.updateOrder(
        id,
        input
      );

    if (!order) {
      return {
        success: false,
        message:
          "Order tidak ditemukan atau gagal diperbarui.",
      };
    }

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
