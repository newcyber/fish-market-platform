"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/admin";

import landingPageService from "@/repositories/landing-page/landing-page.service";

export interface UpdateAndroidAppActionInput {
  enabled: boolean;
  appName: string;
  version: string;
  description: string | null;
}

export async function updateAndroidAppAction(
  input: UpdateAndroidAppActionInput,
) {
  await requireSuperAdmin();

  const appName = input.appName.trim();
  const version = input.version.trim();
  const description =
    input.description?.trim() || null;

  if (!appName) {
    return {
      success: false,
      message: "Nama aplikasi wajib diisi.",
    };
  }

  if (!version) {
    return {
      success: false,
      message: "Versi aplikasi wajib diisi.",
    };
  }

  await landingPageService.updateAndroidApp({
    enabled: input.enabled,
    appName,
    version,
    description,
  });

  revalidatePath("/");
  revalidatePath("/admin/landing-page");

  return {
    success: true,
    message: "Pengaturan Android berhasil disimpan.",
  };
}