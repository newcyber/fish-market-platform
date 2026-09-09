"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/admin";
import settingsService from "@/services/settings/settings.service";

export interface UpdateSeoSettingsActionInput {
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  seoCanonicalUrl?: string | null;
  seoOgTitle?: string | null;
  seoOgDescription?: string | null;
  seoOgImage?: string | null;
  seoTwitterCard?: string;
  seoRobotsIndex?: boolean;
  seoRobotsFollow?: boolean;
  seoGoogleVerification?: string | null;
  seoAiEnabled?: boolean;
}

export interface UpdateSeoSettingsActionResult {
  success: boolean;
  message: string;
}

export async function updateSeoSettingsAction(
  input: UpdateSeoSettingsActionInput,
): Promise<UpdateSeoSettingsActionResult> {
  try {
    await requireSuperAdmin();

await settingsService.updateSeoSettings({
  seoTitle: input.seoTitle,
  seoDescription: input.seoDescription,
  seoKeywords: input.seoKeywords,
  seoCanonicalUrl: input.seoCanonicalUrl,
  seoOgTitle: input.seoOgTitle,
  seoOgDescription: input.seoOgDescription,
  seoOgImage: input.seoOgImage,
  seoTwitterCard:
    input.seoTwitterCard ?? "summary_large_image",
  seoRobotsIndex:
    input.seoRobotsIndex ?? true,
  seoRobotsFollow:
    input.seoRobotsFollow ?? true,
  seoGoogleVerification:
    input.seoGoogleVerification,
  seoAiEnabled:
    input.seoAiEnabled ?? true,
});

    revalidatePath("/admin/smart-seo");
    revalidatePath("/");

    return {
      success: true,
      message: "Pengaturan SEO berhasil disimpan.",
    };
  } catch (error) {
    console.error(
      "[updateSeoSettingsAction]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan pengaturan SEO.",
    };
  }
}
