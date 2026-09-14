"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/admin";
import landingPageService from "@/repositories/landing-page/landing-page.service";
import type { LandingPageConfig } from "@/repositories/landing-page/landing-page.types";

export interface UpdateLandingPageActionInput {
  enabled: boolean;
  config: LandingPageConfig;
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

    await landingPageService.updateLandingPage({
      enabled: input.enabled,
      config: input.config,
    });

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