import { auth } from "@/auth";

import {
  isAdmin,
  isSuperAdmin,
} from "@/lib/auth/permissions";

/**
 * ============================================================
 * REQUIRE ADMIN
 * ============================================================
 *
 * Memastikan request berasal dari user aktif
 * dengan role ADMIN atau SUPER_ADMIN.
 *
 * Digunakan oleh Admin API Routes.
 */

export async function requireAdmin() {
  const session = await auth();

  if (
    !session?.user ||
    !session.user.id ||
    !session.user.isActive
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  if (
    !isAdmin(session.user.role)
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return session;
}

/**
 * ============================================================
 * REQUIRE SUPER ADMIN
 * ============================================================
 *
 * Memastikan request berasal dari user aktif
 * dengan role SUPER_ADMIN.
 *
 * Digunakan untuk konfigurasi sistem yang sensitif,
 * seperti:
 *
 * - Store Settings
 * - Payment Channels
 * - konfigurasi bisnis penting lainnya
 *
 * ADMIN biasa tidak diperbolehkan.
 */

export async function requireSuperAdmin() {
  const session = await auth();

  if (
    !session?.user ||
    !session.user.id ||
    !session.user.isActive
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  if (
    !isSuperAdmin(session.user.role)
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return session;
}
