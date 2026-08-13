import type { Role } from "@prisma/client";

/**
 * Seluruh role yang tersedia di sistem.
 */
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
} as const;

/**
 * Mengecek apakah user sudah login.
 */
export function isAuthenticated(
  role: Role | null | undefined
): role is Role {
  return role !== null && role !== undefined;
}

/**
 * Mengecek apakah user adalah Super Admin.
 */
export function isSuperAdmin(
  role: Role | null | undefined
): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/**
 * Mengecek apakah user adalah Admin.
 *
 * Super Admin juga dianggap memiliki hak Admin.
 */
export function isAdmin(
  role: Role | null | undefined
): boolean {
  return (
    role === ROLES.ADMIN ||
    role === ROLES.SUPER_ADMIN
  );
}

/**
 * Mengecek apakah user adalah Customer.
 */
export function isCustomer(
  role: Role | null | undefined
): boolean {
  return role === ROLES.CUSTOMER;
}

/**
 * Mengecek apakah role user termasuk
 * dalam daftar role yang diizinkan.
 */
export function hasRole(
  role: Role | null | undefined,
  allowedRoles: readonly Role[]
): boolean {
  if (!role) {
    return false;
  }

  return allowedRoles.includes(role);
}