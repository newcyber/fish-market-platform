"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/admin";
import landingPageService from "@/repositories/landing-page/landing-page.service";

export interface UpdateLandingPageImagesActionInput {
  hero: string | null;
  app: string | null;
  ogImage: string | null;
}

export interface UpdateLandingPageImagesActionResult {
  success: boolean;
  message: string;
}

export async function updateLandingPageImagesAction(
  input: UpdateLandingPageImagesActionInput,
): Promise<UpdateLandingPageImagesActionResult> {
  try {
    await requireSuperAdmin();

    await landingPageService.updateLandingPageImages(input);

    revalidatePath("/");
    revalidatePath("/admin/landing-page");

    return {
      success: true,
      message: "Gambar Landing Page berhasil diperbarui.",
    };
  } catch (error) {
    console.error("[UPDATE_LANDING_PAGE_IMAGES_ERROR]", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui gambar Landing Page.",
    };
  }
}