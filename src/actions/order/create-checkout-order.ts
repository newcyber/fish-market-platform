"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import OrderService from "@/services/order/order.service";

/**
 * ============================================================
 * CREATE CHECKOUT ORDER ACTION
 *
 * Server Action untuk membuat pesanan dari checkout customer.
 * ============================================================
 */

interface CreateCheckoutOrderInput {
  addressId: string;

  paymentChannelId: string;

  notes?: string | null;
}

interface CreateCheckoutOrderResult {
  success: boolean;

  message: string;

  orderId?: string;

  orderNumber?: string;
}

/**
 * ============================================================
 * CREATE CHECKOUT ORDER
 * ============================================================
 */

export async function createCheckoutOrderAction(
  input: CreateCheckoutOrderInput
): Promise<CreateCheckoutOrderResult> {
  try {
    /**
     * ==========================================================
     * AUTHENTICATION
     * ==========================================================
     */

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Sesi Anda telah berakhir. Silakan login kembali.",
      };
    }

    /**
     * ==========================================================
     * VALIDATE ADDRESS
     * ==========================================================
     */

    const addressId =
      input.addressId?.trim();

    if (!addressId) {
      return {
        success: false,
        message:
          "Silakan pilih alamat pengiriman terlebih dahulu.",
      };
    }

    /**
     * ==========================================================
     * VALIDATE PAYMENT CHANNEL
     * ==========================================================
     */

    const paymentChannelId =
      input.paymentChannelId?.trim();

    if (!paymentChannelId) {
      return {
        success: false,
        message:
          "Silakan pilih metode pembayaran terlebih dahulu.",
      };
    }

    /**
     * ==========================================================
     * CREATE ORDER
     * ==========================================================
     */

    const result =
      await OrderService.createCheckoutOrder(
        session.user.id,
        addressId,
        paymentChannelId,
        input.notes ?? null
      );

    if (!result.success) {
      return {
        success: false,
        message:
          result.message ??
          "Gagal membuat pesanan.",
      };
    }

    /**
     * ==========================================================
     * EXTRACT ORDER DATA
     * ==========================================================
     */

    const order =
      result.data;

    /**
     * ==========================================================
     * REVALIDATE CACHE
     * ==========================================================
     */

    revalidatePath("/customer/cart");

    revalidatePath("/customer/checkout");

    revalidatePath("/customer/orders");

    revalidatePath("/admin/orders");

    revalidatePath("/admin/payments");

    /**
     * ==========================================================
     * SUCCESS
     * ==========================================================
     */

    return {
      success: true,

      message:
        result.message ??
        "Pesanan berhasil dibuat.",

      orderId:
        order?.id,

      orderNumber:
        order?.orderNumber,
    };
  } catch (error) {
    console.error(
      "[CREATE_CHECKOUT_ORDER_ACTION_ERROR]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.",
    };
  }
}