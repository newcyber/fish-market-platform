"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/admin";

import settingsService from "@/services/settings/settings.service";

/**
 * ============================================================
 * UPDATE STORE SETTINGS ACTION
 * ============================================================
 *
 * Flow:
 *
 * Admin Form
 *      ↓
 * Server Action
 *      ↓
 * requireSuperAdmin()
 *      ↓
 * Authentication & Authorization
 *      ↓
 * Settings Service
 *      ↓
 * Settings Repository
 *      ↓
 * Database
 *
 * ============================================================
 */

/**
 * ============================================================
 * INPUT
 * ============================================================
 */

export interface UpdateSettingsActionInput {
  /**
   * ==========================================================
   * STORE INFORMATION
   * ==========================================================
   */

  storeName: string;

  storeDescription?: string;

  /**
   * Deskripsi khusus untuk Footer Customer.
   */
  footerDescription?: string;

  /**
   * URL atau path logo situs.
   */
  siteLogo?: string | null;

  heroSlide1Image?: string | null;

  heroSlide2Image?: string | null;

  heroSlide3Image?: string | null;

  email?: string;

  whatsapp?: string;

  /**
   * ==========================================================
   * STORE ADDRESS
   * ==========================================================
   */

  address?: string;

  city?: string;

  province?: string;

  postalCode?: string;

  /**
   * ==========================================================
   * STORE LOCATION / SHIPPING ORIGIN
   * ==========================================================
   */

  latitude?: number | null;

  longitude?: number | null;

  /**
   * ==========================================================
   * INTERNAL SHIPPING CONFIGURATION
   * ==========================================================
   */

internalShippingEnabled?: boolean;

internalShippingName?: string | null;

internalShippingBaseFee?: number;

internalShippingPerKmFee?: number;

internalShippingMinFee?: number;

internalShippingMaxDistance?: number;

internalShippingFreeThreshold?: number | null;

internalShippingFreeMaxDiscount?: number;

  /**
   * ==========================================================
   * OPERASIONAL
   * ==========================================================
   */

  openingTime?: string;

  closingTime?: string;

  /**
   * ==========================================================
   * ORDER SETTINGS
   * ==========================================================
   */

  paymentTimeoutHours?: number;
}

/**
 * ============================================================
 * RESULT
 * ============================================================
 */

export interface UpdateSettingsActionResult {
  success: boolean;

  message: string;
}

/**
 * ============================================================
 * UPDATE SETTINGS
 * ============================================================
 */

export async function updateSettingsAction(
  input: UpdateSettingsActionInput
): Promise<UpdateSettingsActionResult> {
  try {
    /**
     * --------------------------------------------------------
     * AUTHENTICATION & AUTHORIZATION
     * --------------------------------------------------------
     *
     * Hanya SUPER_ADMIN yang boleh mengubah
     * Store Settings.
     *
     * requireSuperAdmin() juga memastikan user:
     *
     * - sudah login
     * - memiliki user ID
     * - account masih aktif
     * - memiliki role SUPER_ADMIN
     */

    await requireSuperAdmin();

    /**
     * --------------------------------------------------------
     * UPDATE SETTINGS
     * --------------------------------------------------------
     *
     * Semua data dari Admin Settings diteruskan ke
     * Settings Service.
     */

    await settingsService.updateSettings({
      /**
       * ------------------------------------------------------
       * STORE INFORMATION
       * ------------------------------------------------------
       */

      storeName:
        input.storeName,

      storeDescription:
        input.storeDescription,

      footerDescription:
        input.footerDescription,

      siteLogo:
        input.siteLogo,

      /**
       * ======================================================
       * HERO SLIDER IMAGES
       * ======================================================
       */

      heroSlide1Image:
        input.heroSlide1Image,

      heroSlide2Image:
        input.heroSlide2Image,

      heroSlide3Image:
        input.heroSlide3Image,

      email:
        input.email,

      whatsapp:
        input.whatsapp,

      /**
       * ------------------------------------------------------
       * STORE ADDRESS
       * ------------------------------------------------------
       */

      address:
        input.address,

      city:
        input.city,

      province:
        input.province,

      postalCode:
        input.postalCode,

      /**
       * ------------------------------------------------------
       * STORE LOCATION / SHIPPING ORIGIN
       * ------------------------------------------------------
       */

      latitude:
        input.latitude,

      longitude:
        input.longitude,

      /**
       * ------------------------------------------------------
       * INTERNAL SHIPPING CONFIGURATION
       * ------------------------------------------------------
       */

      internalShippingEnabled:
        input.internalShippingEnabled,

      internalShippingName:
        input.internalShippingName,

      internalShippingBaseFee:
        input.internalShippingBaseFee,

      internalShippingPerKmFee:
        input.internalShippingPerKmFee,

      internalShippingMinFee:
        input.internalShippingMinFee,

      internalShippingMaxDistance:
        input.internalShippingMaxDistance,

      internalShippingFreeThreshold:
        input.internalShippingFreeThreshold,

      internalShippingFreeMaxDiscount:
        input.internalShippingFreeMaxDiscount,

      /**
       * ------------------------------------------------------
       * OPERATIONAL
       * ------------------------------------------------------
       */

      openingTime:
        input.openingTime,

      closingTime:
        input.closingTime,

      /**
       * ------------------------------------------------------
       * ORDER SETTINGS
       * ------------------------------------------------------
       */

      paymentTimeoutHours:
        input.paymentTimeoutHours,
    });

    /**
     * --------------------------------------------------------
     * REVALIDATE ADMIN SETTINGS
     * --------------------------------------------------------
     */

    revalidatePath(
      "/admin/settings"
    );

    /**
     * --------------------------------------------------------
     * REVALIDATE CUSTOMER PAGES
     * --------------------------------------------------------
     *
     * Customer layout menggunakan data StoreSettings.
     */

    revalidatePath("/");
    revalidatePath("/customer");

    revalidatePath(
      "/customer/products"
    );

    /**
     * Checkout akan menggunakan konfigurasi shipping.
     */

    revalidatePath(
      "/customer/checkout"
    );

    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return {
      success: true,

      message:
        "Pengaturan toko berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "[UPDATE_SETTINGS_ACTION_ERROR]",
      error
    );

    /**
     * --------------------------------------------------------
     * AUTHORIZATION ERROR
     * --------------------------------------------------------
     *
     * Jangan membocorkan detail internal authorization
     * kepada client.
     */

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,

        message:
          "Anda harus login terlebih dahulu.",
      };
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return {
        success: false,

        message:
          "Anda tidak memiliki izin untuk mengubah pengaturan toko.",
      };
    }

    /**
     * --------------------------------------------------------
     * GENERAL ERROR
     * --------------------------------------------------------
     */

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui pengaturan toko.",
    };
  }
}
