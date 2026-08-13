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
  storeName: string;

  storeDescription?: string;

  /**
   * Deskripsi khusus untuk Footer Customer
   */
  footerDescription?: string;

  email?: string;
  whatsapp?: string;

  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;

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
        message: "Anda harus login terlebih dahulu.",
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
      storeName: input.storeName,

      storeDescription:
        input.storeDescription,

      /**
       * FOOTER DESCRIPTION
       *
       * Sebelumnya bagian ini belum diteruskan,
       * sehingga data footerDescription hilang
       * sebelum sampai ke Settings Service.
       */
      footerDescription:
        input.footerDescription,

      email:
        input.email,

      whatsapp:
        input.whatsapp,

      address:
        input.address,

      city:
        input.city,

      province:
        input.province,

      postalCode:
        input.postalCode,

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
    revalidatePath("/admin/settings");

    /**
     * --------------------------------------------------------
     * REVALIDATE CUSTOMER PAGES
     * --------------------------------------------------------
     *
     * Footer digunakan pada halaman customer,
     * sehingga halaman customer juga perlu
     * diperbarui setelah Settings disimpan.
     */
    revalidatePath("/customer");

    /**
     * Halaman customer lainnya yang menggunakan
     * Customer Layout/Footer.
     */
    revalidatePath("/customer/products");

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