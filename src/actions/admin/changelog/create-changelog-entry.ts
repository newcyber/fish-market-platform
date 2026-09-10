"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import changelogService, {
  type CreateChangelogEntryInput,
} from "@/services/changelog/changelog.service";

export interface CreateChangelogEntryActionInput
  extends CreateChangelogEntryInput {}

export interface CreateChangelogEntryActionResult {
  success: boolean;
  message: string;
  entry?: Awaited<
    ReturnType<typeof changelogService.createEntry>
  >;
}

export async function createChangelogEntryAction(
  input: CreateChangelogEntryActionInput,
): Promise<CreateChangelogEntryActionResult> {
  try {
    await requireAdmin();

    const entry =
      await changelogService.createEntry({
        releaseId: input.releaseId,
        type: input.type,
        title: input.title,
        description: input.description,
        highlights: input.highlights,
        sortOrder: input.sortOrder,
      });

    revalidatePath("/admin/settings");
    revalidatePath("/changelog");

    return {
      success: true,
      message: "Entry changelog berhasil dibuat.",
      entry,
    };
  } catch (error) {
    console.error(
      "[createChangelogEntryAction]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal membuat entry changelog.",
    };
  }
}
