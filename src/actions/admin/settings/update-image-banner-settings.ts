"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/admin";

import settingsService from "@/services/settings/settings.service";
import type { UpdateImageBannerSettingsPayload } from "@/repositories/settings/settings.repository";

/**
 * ============================================================
 * UPDATE IMAGE BANNER SETTINGS ACTION
 * ============================================================
 *
 * Action khusus untuk konfigurasi Image Banner.
 *
 * Hanya SUPER_ADMIN yang dapat mengubah konfigurasi.
 *
 * Field yang diproses:
 * - Hero Slider
 * - Mobile Login Slider
 * - Flash Sale Banner
 * - Promo Pilihan
 *
 * Action ini sengaja dipisahkan dari updateSettingsAction()
 * agar perubahan Image Banner tidak memengaruhi Store Settings
 * lainnya.
 */

/**
 * ============================================================
 * INPUT
 * ============================================================
 */

export type UpdateImageBannerSettingsActionInput =
  UpdateImageBannerSettingsPayload;

/**
 * ============================================================
 * RESULT
 * ============================================================
 */

export interface UpdateImageBannerSettingsActionResult {
  success: boolean;
  message: string;
}

/**
 * ============================================================
 * UPDATE IMAGE BANNER SETTINGS
 * ============================================================
 */

export async function updateImageBannerSettingsAction(
  input: UpdateImageBannerSettingsActionInput
): Promise<UpdateImageBannerSettingsActionResult> {
  try {
    /**
     * --------------------------------------------------------
     * AUTHENTICATION & AUTHORIZATION
     * --------------------------------------------------------
     */

    await requireSuperAdmin();

    /**
     * --------------------------------------------------------
     * UPDATE IMAGE BANNER
     * --------------------------------------------------------
     */

    await settingsService.updateImageBannerSettings(input);

    /**
     * --------------------------------------------------------
     * REVALIDATE CUSTOMER PAGES
     * --------------------------------------------------------
     *
     * Image Banner digunakan pada homepage dan halaman login.
     * Kita revalidate halaman terkait agar perubahan segera aktif.
     */

    revalidatePath("/");
    revalidatePath("/login");

    return {
      success: true,
      message: "Pengaturan Image Banner berhasil disimpan.",
    };
  } catch (error) {
    console.error(
      "[UPDATE_IMAGE_BANNER_SETTINGS_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan pengaturan Image Banner.",
    };
  }
}