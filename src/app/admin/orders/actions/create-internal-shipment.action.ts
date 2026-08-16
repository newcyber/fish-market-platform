"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import internalShipmentService from "@/services/shipping/internal-shipment.service";

/**
 * ============================================================
 * CREATE INTERNAL SHIPMENT ACTION
 * ============================================================
 *
 * Server Action untuk:
 *
 * - Memastikan user sudah login
 * - Membuat resi Kurir Internal Fish Market
 * - Mengubah order menjadi SHIPPING
 * - Refresh halaman yang berhubungan dengan order
 *
 * ============================================================
 */

/**
 * ============================================================
 * RESULT
 * ============================================================
 */

export interface CreateInternalShipmentActionResult {
  success: boolean;

  message: string;

  data?: {
    orderId: string;

    orderNumber: string;

    trackingNumber: string;

    shippingProvider: string;

    shippingService: string;

    shippedAt: Date;
  };
}

/**
 * ============================================================
 * CREATE INTERNAL SHIPMENT
 * ============================================================
 */

export async function createInternalShipmentAction(
  orderId: string
): Promise<CreateInternalShipmentActionResult> {
  try {
    /**
     * ==========================================================
     * AUTHENTICATION
     * ==========================================================
     */

    const session =
      await auth();

    if (!session?.user?.id) {
      return {
        success: false,

        message:
          "Sesi Anda telah berakhir. Silakan login kembali.",
      };
    }

    /**
     * ==========================================================
     * VALIDATE ORDER ID
     * ==========================================================
     */

    const normalizedOrderId =
      orderId?.trim();

    if (!normalizedOrderId) {
      return {
        success: false,

        message:
          "Order ID tidak valid.",
      };
    }

    /**
     * ==========================================================
     * CREATE INTERNAL SHIPMENT
     * ==========================================================
     */

    const result =
      await internalShipmentService.createShipment(
        normalizedOrderId
      );

    /**
     * ==========================================================
     * HANDLE FAILURE
     * ==========================================================
     */

    if (!result.success || !result.data) {
      return {
        success: false,

        message:
          result.message ??
          "Gagal membuat resi Kurir Internal.",
      };
    }

    /**
     * ==========================================================
     * REVALIDATE CACHE
     * ==========================================================
     */

    revalidatePath(
      "/admin/orders"
    );

    revalidatePath(
      `/admin/orders/${normalizedOrderId}`
    );

    revalidatePath(
      "/customer/orders"
    );

    revalidatePath(
      `/customer/orders/${normalizedOrderId}`
    );

    /**
     * ==========================================================
     * SUCCESS
     * ==========================================================
     */

    return {
      success: true,

      message:
        result.message ??
        "Resi Kurir Internal berhasil dibuat.",

      data:
        result.data,
    };
  } catch (error) {
    console.error(
      "[CREATE_INTERNAL_SHIPMENT_ACTION_ERROR]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat resi Kurir Internal.",
    };
  }
}