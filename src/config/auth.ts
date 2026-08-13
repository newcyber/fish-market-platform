import { Role } from "@prisma/client";

export const AUTH_CONFIG = {
  SESSION_MAX_AGE: 60 * 60 * 24 * 7, // 7 hari

  SESSION_UPDATE_AGE: 60 * 60 * 24, // 1 hari

  PASSWORD_MIN_LENGTH: 8,

  PASSWORD_MAX_LENGTH: 100,

  LOGIN_REDIRECT: "/",

  UNAUTHORIZED_REDIRECT: "/login",

  DEFAULT_ROLE: Role.CUSTOMER,
} as const;