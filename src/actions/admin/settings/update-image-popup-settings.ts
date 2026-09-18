"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/admin";

import settingsService from "@/services/settings/settings.service";

import type {
  UpdateImagePopupSettingsPayload,
} from "@/repositories/settings/settings.repository";

/**
 * ============================================================
 * UPDATE IMAGE POPUP SETTINGS ACTION
 * ============================================================
 *
 * Action khusus untuk konfigurasi Image Popup.
 *
 * Hanya SUPER_ADMIN yang dapat mengubah konfigurasi.
 * ============================================================
 */

export type UpdateImagePopupSettingsActionInput =
  UpdateImagePopupSettingsPayload;

export interface UpdateImagePopupSettingsActionResult {
  success: boolean;
  message: string;
}

export async function updateImagePopupSettingsAction(
  input: UpdateImagePopupSettingsActionInput
): Promise<UpdateImagePopupSettingsActionResult> {
  try {
    /**
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     */

    await requireSuperAdmin();

    /**
     * --------------------------------------------------------
     * UPDATE IMAGE POPUP
     * --------------------------------------------------------
     */

    await settingsService.updateImagePopupSettings(
      input
    );

    /**
     * --------------------------------------------------------
     * REVALIDATE CUSTOMER HOMEPAGE
     * --------------------------------------------------------
     *
     * Promo Popup digunakan pada homepage.
     */

    revalidatePath("/");

    revalidatePath("/customer");

    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return {
      success: true,
      message:
        "Pengaturan Image Popup berhasil disimpan.",
    };
  } catch (error) {
    console.error(
      "[UPDATE_IMAGE_POPUP_SETTINGS_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan pengaturan Image Popup.",
    };
  }
}