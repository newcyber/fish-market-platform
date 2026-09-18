"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/admin";
import StorageService from "@/services/storage/storage.service";
import landingPageService from "@/repositories/landing-page/landing-page.service";
import type { LandingPageConfig } from "@/repositories/landing-page/landing-page.types";

export interface UpdateLandingPageActionInput {
  enabled: boolean;
  config: LandingPageConfig;
  tutorialImage?: File | null;
}

export interface UpdateLandingPageActionResult {
  success: boolean;
  message: string;
}

export async function updateLandingPageAction(
  input: UpdateLandingPageActionInput,
): Promise<UpdateLandingPageActionResult> {
  try {
    await requireSuperAdmin();

    let config = input.config;

    let uploadedTutorialImage:
      string | null = null;

    const currentTutorialImage =
      input.config.tutorialSection?.image ??
      null;

    if (input.tutorialImage) {
      uploadedTutorialImage =
        await StorageService.saveLandingImage(
          input.tutorialImage,
        );

      config = {
        ...input.config,
        tutorialSection: {
          ...(input.config.tutorialSection ?? {}),
          image: uploadedTutorialImage,
        },
      };
    }

    try {
      await landingPageService.updateLandingPage({
        enabled: input.enabled,
        config,
      });
    } catch (error) {
      if (uploadedTutorialImage) {
        try {
          await StorageService.deleteLandingImage(
            uploadedTutorialImage,
          );
        } catch (cleanupError) {
          console.error(
            "Gagal membersihkan gambar tutorial baru:",
            cleanupError,
          );
        }
      }

      throw error;
    }

    if (
      uploadedTutorialImage &&
      currentTutorialImage &&
      currentTutorialImage !==
        uploadedTutorialImage
    ) {
      try {
        await StorageService.deleteLandingImage(
          currentTutorialImage,
        );
      } catch (cleanupError) {
        console.error(
          "Gagal menghapus gambar tutorial lama:",
          cleanupError,
        );
      }
    }

    revalidatePath("/");
    revalidatePath("/admin/landing-page");

    return {
      success: true,
      message: "Landing Page berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "[UPDATE_LANDING_PAGE_ERROR]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui Landing Page.",
    };
  }
}