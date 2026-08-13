"use server";

import {
  revalidatePath,
} from "next/cache";

import { auth } from "@/auth";

import OrderService from "@/services/order/order.service";

/**
 * ============================================================
 * UPLOAD PAYMENT PROOF ACTION
 *
 * Server Action untuk customer mengirim
 * atau memperbarui bukti pembayaran.
 * ============================================================
 */

export async function uploadPaymentProof(
  formData: FormData
) {
  try {
    /**
     * ========================================================
     * AUTHENTICATION
     * ========================================================
     */

    const session =
      await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Anda harus login terlebih dahulu.",
      };
    }

    /**
     * ========================================================
     * GET FORM DATA
     * ========================================================
     */

    const orderId =
      formData.get("orderId");

    const file =
      formData.get("file");

    const bankName =
      formData.get("bankName");

    const accountName =
      formData.get("accountName");

    const accountNumber =
      formData.get("accountNumber");

    /**
     * ========================================================
     * VALIDATE ORDER ID
     * ========================================================
     */

    if (
      typeof orderId !== "string" ||
      !orderId.trim()
    ) {
      return {
        success: false,
        message:
          "ID pesanan tidak valid.",
      };
    }

    /**
     * ========================================================
     * VALIDATE FILE
     * ========================================================
     */

    if (!(file instanceof File)) {
      return {
        success: false,
        message:
          "Silakan pilih bukti pembayaran.",
      };
    }

    /**
     * ========================================================
     * SUBMIT PAYMENT PROOF
     * ========================================================
     */

    const result =
      await OrderService.submitPaymentProof(
        session.user.id,
        {
          orderId,

          file,

          bankName:
            typeof bankName === "string"
              ? bankName
              : null,

          accountName:
            typeof accountName === "string"
              ? accountName
              : null,

          accountNumber:
            typeof accountNumber === "string"
              ? accountNumber
              : null,
        }
      );

    /**
     * ========================================================
     * REVALIDATE
     * ========================================================
     */

    if (result.success) {
      revalidatePath(
        `/customer/orders/${orderId}`
      );

      revalidatePath(
        `/customer/orders/${orderId}/payment`
      );

      revalidatePath(
        "/customer/orders"
      );
    }

    return result;
  } catch (error) {
    console.error(
      "[UPLOAD_PAYMENT_PROOF_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat mengirim bukti pembayaran.",
    };
  }
}