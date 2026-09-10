"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import changelogService from "@/services/changelog/changelog.service";

export interface DeleteChangelogReleaseActionResult {
  success: boolean;
  message: string;
}

export async function deleteChangelogReleaseAction(
  id: string,
): Promise<DeleteChangelogReleaseActionResult> {
  try {
    await requireAdmin();

    await changelogService.deleteRelease(id);

    revalidatePath("/admin/settings");
    revalidatePath("/changelog");

    return {
      success: true,
      message: "Release changelog berhasil dihapus.",
    };
  } catch (error) {
    console.error(
      "[deleteChangelogReleaseAction]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menghapus release changelog.",
    };
  }
}
