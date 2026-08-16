"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

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

  internalShippingMaxDistance?: number;

  internalShippingFreeThreshold?: number | null;

  /**
   * ==========================================================
   * OPERATIONAL
   * ==========================================================
   */

  openingTime?: string;

  closingTime?: string;
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
     * AUTHENTICATION
     * --------------------------------------------------------
     */

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,

        message:
          "Anda harus login terlebih dahulu.",
      };
    }

    /**
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     */

    const role = session.user.role;

    const isAdmin =
      role === "ADMIN" ||
      role === "SUPER_ADMIN";

    if (!isAdmin) {
      return {
        success: false,

        message:
          "Anda tidak memiliki izin untuk mengubah pengaturan toko.",
      };
    }

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

      internalShippingMaxDistance:
        input.internalShippingMaxDistance,

      internalShippingFreeThreshold:
        input.internalShippingFreeThreshold,

      /**
       * ------------------------------------------------------
       * OPERATIONAL
       * ------------------------------------------------------
       */

      openingTime:
        input.openingTime,

      closingTime:
        input.closingTime,
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

    revalidatePath(
      "/customer"
    );

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
      "[UPDATE_SETTINGS_ACTION]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memperbarui pengaturan.",
    };
  }
}