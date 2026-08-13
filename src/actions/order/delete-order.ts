"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/types/action-result";

import OrderService from "@/services/order/order.service";

export async function deleteOrderAction(
  id: string
): Promise<ActionResult> {
  if (!id) {
    return {
      success: false,
      message: "Order ID tidak valid.",
    };
  }

  try {
    await OrderService.deleteOrder(id);

    revalidatePath("/admin/orders");
    revalidatePath("/admin/orders/trash");
    revalidatePath(`/admin/orders/${id}`);

    return {
      success: true,
      message:
        "Order berhasil dipindahkan ke Trash.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memindahkan order ke Trash.",
    };
  }
}

export default deleteOrderAction;