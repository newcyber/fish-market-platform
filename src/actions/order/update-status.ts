"use server";

import {
  OrderStatus,
} from "@prisma/client";

import OrderService from "@/services/order/order.service";

/**
 * ============================================================
 * UPDATE ORDER STATUS ACTION
 * ============================================================
 */

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus
) {
  try {
    /**
     * ========================================================
     * VALIDATE ORDER ID
     * ========================================================
     */

    if (!orderId) {
      return {
        success: false,
        message:
          "Order ID wajib diisi.",
      };
    }

    /**
     * ========================================================
     * VALIDATE STATUS
     * ========================================================
     */

    if (!status) {
      return {
        success: false,
        message:
          "Status order wajib diisi.",
      };
    }

    /**
     * ========================================================
     * UPDATE ORDER STATUS
     * ========================================================
     */

    const result =
      await OrderService.updateStatus(
        orderId,
        status
      );

    /**
     * ========================================================
     * HANDLE FAILED RESULT
     * ========================================================
     */

    if (
      !result.success ||
      !result.data
    ) {
      return {
        success: false,
        message:
          result.message ??
          "Gagal memperbarui status order.",
      };
    }

    /**
     * ========================================================
     * SUCCESS
     * ========================================================
     */

    return {
      success: true,

      message:
        result.message ??
        "Status order berhasil diperbarui.",

      data: {
        id:
          result.data.id,

        status:
          result.data.status,
      },
    };
  } catch (error) {
    console.error(
      "[UPDATE_ORDER_STATUS_ACTION_ERROR]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status order.",
    };
  }
}