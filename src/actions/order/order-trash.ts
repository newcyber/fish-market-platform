"use server";

import { revalidatePath } from "next/cache";

import OrderService from "@/services/order/order.service";

export async function deleteOrderAction(
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
      await OrderService.deleteOrder(
        orderId
      );

    revalidatePath(
      "/admin/orders"
    );

    revalidatePath(
      "/admin/orders/trash"
    );

    revalidatePath(
      `/admin/orders/${order.id}`
    );

    return {
      success: true,

      message:
        "Order berhasil dipindahkan ke Trash.",

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
          : "Gagal memindahkan order ke Trash.",
    };
  }
}

export async function restoreOrderAction(
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
      await OrderService.restoreOrder(
        orderId
      );

    revalidatePath(
      "/admin/orders"
    );

    revalidatePath(
      "/admin/orders/trash"
    );

    revalidatePath(
      `/admin/orders/${order.id}`
    );

    return {
      success: true,

      message:
        "Order berhasil dipulihkan.",

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
          : "Gagal memulihkan order.",
    };
  }
}

export async function forceDeleteOrderAction(
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
      await OrderService.forceDeleteOrder(
        orderId
      );

    revalidatePath(
      "/admin/orders"
    );

    revalidatePath(
      "/admin/orders/trash"
    );

    return {
      success: true,

      message:
        "Order berhasil dihapus permanen.",

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
          : "Gagal menghapus order secara permanen.",
    };
  }
}