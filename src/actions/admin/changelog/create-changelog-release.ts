"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import changelogService from "@/services/changelog/changelog.service";

export interface CreateChangelogReleaseActionInput {
  version: string;
  date: string;
  title: string;
  description?: string | null;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface CreateChangelogReleaseActionResult {
  success: boolean;
  message: string;
  release?: Awaited<
    ReturnType<typeof changelogService.createRelease>
  >;
}

export async function createChangelogReleaseAction(
  input: CreateChangelogReleaseActionInput,
): Promise<CreateChangelogReleaseActionResult> {
  try {
    await requireAdmin();

    const date = new Date(input.date);

    if (Number.isNaN(date.getTime())) {
      throw new Error("Tanggal changelog tidak valid.");
    }

    const release = await changelogService.createRelease({
      version: input.version,
      date,
      title: input.title,
      description: input.description,
      isPublished: input.isPublished,
      sortOrder: input.sortOrder,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/changelog");

    return {
      success: true,
      message: "Release changelog berhasil dibuat.",
      release,
    };
  } catch (error) {
    console.error(
      "[createChangelogReleaseAction]",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal membuat release changelog.",
    };
  }
}
