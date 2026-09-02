"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import OrderService from "@/services/order/order.service";

export async function cancelOrderAction(
  orderId: string
) {
  try {
    await requireAdmin();

    console.log(
      "[CANCEL_ORDER_ACTION] START",
      orderId
    );

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

    console.log(
      "[CANCEL_ORDER_ACTION] SUCCESS",
      {
        orderId,
        status: order.status,
      }
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
    console.error(
      "[CANCEL_ORDER_ACTION] ERROR",
      {
        orderId,
        error,
      }
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Gagal membatalkan order.",
    };
  }
}
