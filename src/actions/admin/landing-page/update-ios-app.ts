"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/admin";
import landingPageService from "@/repositories/landing-page/landing-page.service";

/**
 * ============================================================
 * UPDATE IOS APP
 * ============================================================
 *
 * Server Action untuk memperbarui konfigurasi aplikasi iOS
 * pada Landing Page.
 *
 * Authorization:
 * - Hanya Super Admin yang diperbolehkan.
 *
 * iOS tidak menggunakan upload IPA.
 * Database hanya menyimpan metadata aplikasi dan URL
 * App Store.
 *
 * ============================================================
 */

export async function updateIosAppAction(input: {
  enabled: boolean;
  appName: string;
  version: string;
  description?: string;
  appStoreUrl?: string;
}) {
  /**
   * ==========================================================
   * AUTHORIZATION
   * ==========================================================
   *
   * Gunakan guard yang sama dengan pengaturan Landing Page
   * lainnya.
   */

  await requireSuperAdmin();

  /**
   * ==========================================================
   * NORMALIZE INPUT
   * ==========================================================
   */

  const appName =
    input.appName.trim();

  const version =
    input.version.trim();

  const description =
    input.description?.trim() || null;

  const appStoreUrl =
    input.appStoreUrl?.trim() || null;

  /**
   * ==========================================================
   * BASIC VALIDATION
   * ==========================================================
   */

  if (!appName) {
    throw new Error(
      "Nama aplikasi iOS wajib diisi.",
    );
  }

  if (!version) {
    throw new Error(
      "Versi aplikasi iOS wajib diisi.",
    );
  }

  /**
   * ==========================================================
   * UPDATE
   * ==========================================================
   *
   * Validasi URL App Store dan business rules lainnya
   * ditangani oleh LandingPageService.
   */

  await landingPageService.updateIosApp({
    enabled: input.enabled,
    appName,
    version,
    description,
    appStoreUrl,
  });

  /**
   * ==========================================================
   * CACHE INVALIDATION
   * ==========================================================
   */

  revalidatePath("/");
  revalidatePath("/admin/landing-page");

  /**
   * ==========================================================
   * RESPONSE
   * ==========================================================
   */

  return {
    success: true,
  };
}