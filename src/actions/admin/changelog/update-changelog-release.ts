"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import changelogService from "@/services/changelog/changelog.service";

export interface UpdateChangelogReleaseActionInput {
  id: string;
  version?: string;
  date?: string;
  title?: string;
  description?: string | null;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface UpdateChangelogReleaseActionResult {
  success: boolean;
  message: string;
  release?: Awaited<
    ReturnType<typeof changelogService.updateRelease>
  >;
}

export async function updateChangelogReleaseAction(
  input: UpdateChangelogReleaseActionInput,
): Promise<UpdateChangelogReleaseActionResult> {
  try {
    await requireAdmin();

    const payload: Parameters<
      typeof changelogService.updateRelease
    >[1] = {
      version: input.version,
      title: input.title,
      description: input.description,
      isPublished: input.isPublished,
      sortOrder: input.sortOrder,
    };

    if (input.date !== undefined) {
      const date = new Date(input.date);

      if (Number.isNaN(date.getTime())) {
        throw new Error("Tanggal changelog tidak valid.");
      }

      payload.date = date;
    }

    const release =
      await changelogService.updateRelease(
        input.id,
        payload,
      );

    revalidatePath("/admin/settings");
    revalidatePath("/changelog");

    return {
      success: true,
      message: "Release changelog berhasil diperbarui.",
      release,
    };
  } catch (error) {
    console.error(
      "[updateChangelogReleaseAction]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui release changelog.",
    };
  }
}
