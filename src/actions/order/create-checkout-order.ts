"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import OrderService from "@/services/order/order.service";

import type {
  ShippingProviderCode,
} from "@/services/shipping/shipping.types";

/**
 * ============================================================
 * CREATE CHECKOUT ORDER ACTION
 * ============================================================
 *
 * Server Action untuk membuat pesanan dari checkout customer.
 *
 * Shipping provider dikirim dari client hanya sebagai pilihan
 * metode pengiriman.
 *
 * Biaya pengiriman TIDAK dikirim dari client.
 *
 * Ongkir akan dihitung ulang secara aman di server melalui
 * OrderService dan ShippingService.
 * ============================================================
 */

/**
 * ============================================================
 * INPUT
 * ============================================================
 */

interface CreateCheckoutOrderInput {
  /**
   * Alamat tujuan customer.
   */
  addressId: string;

  /**
   * Metode pembayaran yang dipilih.
   */
  paymentChannelId: string;

  /**
   * Provider pengiriman.
   */
  shippingProvider: ShippingProviderCode;

  /**
   * Catatan pesanan.
   */
  notes?: string | null;

  /**
   * Kode voucher customer.
   */
  voucherCode?: string | null;
}

/**
 * ============================================================
 * RESULT
 * ============================================================
 */

interface CreateCheckoutOrderResult {
  success: boolean;

  message: string;

  orderId?: string;

  orderNumber?: string;
}

/**
 * ============================================================
 * VALID SHIPPING PROVIDERS
 * ============================================================
 */

const VALID_SHIPPING_PROVIDERS: ShippingProviderCode[] = [
  "INTERNAL",
  "JNE",
  "JNT",
  "SICEPAT",
  "ANTERAJA",
  "POS",
];

/**
 * ============================================================
 * CREATE CHECKOUT ORDER ACTION
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
     * VALIDATE SHIPPING PROVIDER
     * ==========================================================
     */

    const shippingProvider =
      input.shippingProvider;

    if (!shippingProvider) {
      return {
        success: false,

        message:
          "Silakan pilih metode pengiriman terlebih dahulu.",
      };
    }

    if (
      !VALID_SHIPPING_PROVIDERS.includes(
        shippingProvider
      )
    ) {
      return {
        success: false,

        message:
          "Provider pengiriman yang dipilih tidak valid.",
      };
    }

    /**
     * ==========================================================
     * NORMALIZE VOUCHER CODE
     * ==========================================================
     *
     * Voucher boleh kosong.
     *
     * Jika customer mengisi voucher:
     * - hapus spasi awal/akhir
     * - ubah menjadi uppercase
     *
     * Jika kosong:
     * - kirim null
     */

    const voucherCode =
      input.voucherCode
        ?.trim()
        .toUpperCase() ||
      null;

    /**
     * ==========================================================
     * CREATE ORDER
     * ==========================================================
     *
     * OrderService akan:
     *
     * 1. Validasi alamat
     * 2. Validasi cart
     * 3. Hitung ulang harga produk
     * 4. Hitung subtotal
     * 5. Validasi voucher
     * 6. Hitung diskon voucher
     * 7. Hitung ulang shipping quote
     * 8. Hitung total akhir
     * 9. Simpan order
     * 10. Consume voucher
     * 11. Catat VoucherUsage
     * 12. Update stock
     * 13. Buat Stock Ledger
     */

    const result =
      await OrderService.createCheckoutOrder(
        session.user.id,

        addressId,

        paymentChannelId,

        input.notes ?? null,

        shippingProvider,

        voucherCode
      );

    /**
     * ==========================================================
     * HANDLE SERVICE FAILURE
     * ==========================================================
     */

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

    revalidatePath(
      "/customer/cart"
    );

    revalidatePath(
      "/customer/checkout"
    );

    revalidatePath(
      "/customer/orders"
    );

    revalidatePath(
      "/admin/orders"
    );

    revalidatePath(
      "/admin/payments"
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