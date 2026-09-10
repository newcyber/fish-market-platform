"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import changelogService, {
  type UpdateChangelogEntryInput,
} from "@/services/changelog/changelog.service";

export interface UpdateChangelogEntryActionInput
  extends UpdateChangelogEntryInput {
  id: string;
}

export interface UpdateChangelogEntryActionResult {
  success: boolean;
  message: string;
  entry?: Awaited<
    ReturnType<typeof changelogService.updateEntry>
  >;
}

export async function updateChangelogEntryAction(
  input: UpdateChangelogEntryActionInput,
): Promise<UpdateChangelogEntryActionResult> {
  try {
    await requireAdmin();

    const {
      id,
      type,
      title,
      description,
      highlights,
      sortOrder,
    } = input;

    const entry =
      await changelogService.updateEntry(id, {
        type,
        title,
        description,
        highlights,
        sortOrder,
      });

    revalidatePath("/admin/settings");
    revalidatePath("/changelog");

    return {
      success: true,
      message: "Entry changelog berhasil diperbarui.",
      entry,
    };
  } catch (error) {
    console.error(
      "[updateChangelogEntryAction]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui entry changelog.",
    };
  }
}
