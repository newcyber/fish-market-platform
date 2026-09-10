"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import changelogService from "@/services/changelog/changelog.service";

export interface DeleteChangelogEntryActionResult {
  success: boolean;
  message: string;
}

export async function deleteChangelogEntryAction(
  id: string,
): Promise<DeleteChangelogEntryActionResult> {
  try {
    await requireAdmin();

    await changelogService.deleteEntry(id);

    revalidatePath("/admin/settings");
    revalidatePath("/changelog");

    return {
      success: true,
      message: "Entry changelog berhasil dihapus.",
    };
  } catch (error) {
    console.error(
      "[deleteChangelogEntryAction]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menghapus entry changelog.",
    };
  }
}
