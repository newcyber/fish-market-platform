import { Role } from "@prisma/client";

/**
 * Seluruh Role yang tersedia di aplikasi.
 */
export const ROLES = {
  SUPER_ADMIN: Role.SUPER_ADMIN,
  ADMIN: Role.ADMIN,
  CUSTOMER: Role.CUSTOMER,
} as const;

/**
 * Role yang boleh mengakses Dashboard Admin.
 */
export const ADMIN_ROLES: readonly Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
];

/**
 * Seluruh role yang tersedia.
 */
export const ALL_ROLES: readonly Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.CUSTOMER,
];