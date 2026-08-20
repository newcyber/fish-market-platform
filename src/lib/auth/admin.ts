import { auth } from "@/auth";

import { isAdmin } from "@/lib/auth/permissions";

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