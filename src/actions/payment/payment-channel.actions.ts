"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/admin";

import {
  CreatePaymentChannelInput,
  PaymentChannelService,
  UpdatePaymentChannelInput,
} from "@/services/payment/payment-channel.service";

/**
 * ============================================================
 *
 * PAYMENT CHANNEL ACTIONS
 *
 * Server Actions untuk Super Admin Payment Channel Management.
 *
 * SECURITY:
 *
 * Semua mutation wajib melewati requireSuperAdmin().
 *
 * Sidebar bukan security boundary.
 *
 * ============================================================
 */

/**
 * ============================================================
 * CREATE PAYMENT CHANNEL
 * ============================================================
 */

export async function createPaymentChannelAction(
  input: CreatePaymentChannelInput
) {
  try {
    /**
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     *
     * Hanya SUPER_ADMIN yang diperbolehkan membuat
     * metode pembayaran.
     */

    await requireSuperAdmin();

    const result =
      await PaymentChannelService.create(
        input
      );

    if (result.success) {
      revalidatePath(
        "/admin/payment-channels"
      );
    }

    return result;
  } catch (error) {
    console.error(
      "[CREATE_PAYMENT_CHANNEL_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error &&
        error.message === "FORBIDDEN"
          ? "Anda tidak memiliki izin untuk mengelola metode pembayaran."
          : error instanceof Error &&
              error.message === "UNAUTHORIZED"
            ? "Anda harus login terlebih dahulu."
            : "Gagal menambahkan metode pembayaran.",
    };
  }
}

/**
 * ============================================================
 * UPDATE PAYMENT CHANNEL
 * ============================================================
 */

export async function updatePaymentChannelAction(
  id: string,
  input: UpdatePaymentChannelInput
) {
  try {
    /**
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     */

    await requireSuperAdmin();

    if (!id) {
      return {
        success: false,
        message:
          "ID metode pembayaran tidak valid.",
      };
    }

    const result =
      await PaymentChannelService.update(
        id,
        input
      );

    if (result.success) {
      revalidatePath(
        "/admin/payment-channels"
      );

      revalidatePath(
        `/admin/payment-channels/${id}/edit`
      );
    }

    return result;
  } catch (error) {
    console.error(
      "[UPDATE_PAYMENT_CHANNEL_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error &&
        error.message === "FORBIDDEN"
          ? "Anda tidak memiliki izin untuk mengelola metode pembayaran."
          : error instanceof Error &&
              error.message === "UNAUTHORIZED"
            ? "Anda harus login terlebih dahulu."
            : "Gagal memperbarui metode pembayaran.",
    };
  }
}

/**
 * ============================================================
 * UPDATE PAYMENT CHANNEL ACTIVE STATUS
 * ============================================================
 */

export async function updatePaymentChannelStatusAction(
  id: string,
  isActive: boolean
) {
  try {
    /**
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     */

    await requireSuperAdmin();

    if (!id) {
      return {
        success: false,
        message:
          "ID metode pembayaran tidak valid.",
      };
    }

    const result =
      await PaymentChannelService.updateActiveStatus(
        id,
        isActive
      );

    if (result.success) {
      revalidatePath(
        "/admin/payment-channels"
      );
    }

    return result;
  } catch (error) {
    console.error(
      "[UPDATE_PAYMENT_CHANNEL_STATUS_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error &&
        error.message === "FORBIDDEN"
          ? "Anda tidak memiliki izin untuk mengelola metode pembayaran."
          : error instanceof Error &&
              error.message === "UNAUTHORIZED"
            ? "Anda harus login terlebih dahulu."
            : "Gagal memperbarui status metode pembayaran.",
    };
  }
}

/**
 * ============================================================
 * DELETE PAYMENT CHANNEL
 * ============================================================
 */

export async function deletePaymentChannelAction(
  id: string
) {
  try {
    /**
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     */

    await requireSuperAdmin();

    if (!id) {
      return {
        success: false,
        message:
          "ID metode pembayaran tidak valid.",
      };
    }

    const result =
      await PaymentChannelService.delete(
        id
      );

    if (result.success) {
      revalidatePath(
        "/admin/payment-channels"
      );
    }

    return result;
  } catch (error) {
    console.error(
      "[DELETE_PAYMENT_CHANNEL_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error &&
        error.message === "FORBIDDEN"
          ? "Anda tidak memiliki izin untuk mengelola metode pembayaran."
          : error instanceof Error &&
              error.message === "UNAUTHORIZED"
            ? "Anda harus login terlebih dahulu."
            : "Gagal menghapus metode pembayaran.",
    };
  }
}
