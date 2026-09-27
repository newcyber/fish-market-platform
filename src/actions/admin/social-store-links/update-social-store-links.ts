"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/admin";
import socialStoreLinksService from "@/services/social-store-links/social-store-links.service";

/**
 * ============================================================
 * UPDATE SOCIAL & STORE LINKS ACTION
 * ============================================================
 */

export interface UpdateSocialStoreLinksActionInput {
  googlePlayUrl?: string;
  shopeeUrl?: string;
  tokopediaUrl?: string;
  tiktokUrl?: string;
  instagramUrl?: string;
}

export interface UpdateSocialStoreLinksActionResult {
  success: boolean;
  message: string;
}

export async function updateSocialStoreLinksAction(
  input: UpdateSocialStoreLinksActionInput,
): Promise<UpdateSocialStoreLinksActionResult> {
  try {
    /**
     * ========================================================
     * AUTHORIZATION
     * ========================================================
     */

    await requireSuperAdmin();

    /**
     * ========================================================
     * UPDATE
     * ========================================================
     */

    await socialStoreLinksService.updateLinks({
      googlePlayUrl:
        input.googlePlayUrl,

      shopeeUrl:
        input.shopeeUrl,

      tokopediaUrl:
        input.tokopediaUrl,

      tiktokUrl:
        input.tiktokUrl,

      instagramUrl:
        input.instagramUrl,
    });

    /**
     * ========================================================
     * REVALIDATE
     * ========================================================
     */

    revalidatePath(
      "/admin/social-store-links",
    );

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/customer");

    return {
      success: true,
      message:
        "Social & Store Links berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "[updateSocialStoreLinksAction]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui Social & Store Links.",
    };
  }
}