import type { Role } from "@prisma/client";

/**
 * Seluruh role yang tersedia di sistem.
 */
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
  COURIER: "COURIER",
} as const;

export function isAuthenticated(
  role: Role | null | undefined,
): role is Role {
  return role !== null && role !== undefined;
}

export function isSuperAdmin(
  role: Role | null | undefined,
): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export function isAdmin(
  role: Role | null | undefined,
): boolean {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

export function isCustomer(
  role: Role | null | undefined,
): boolean {
  return role === ROLES.CUSTOMER;
}

export function isCourier(
  role: Role | null | undefined,
): boolean {
  return role === ROLES.COURIER;
}

export function hasRole(
  role: Role | null | undefined,
  allowedRoles: readonly Role[],
): boolean {
  if (!role) return false;
  return allowedRoles.includes(role);
}
