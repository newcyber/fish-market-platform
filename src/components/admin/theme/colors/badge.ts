import {
  ROLE_BADGE,
} from "./role";

import {
  STATUS_BADGE,
} from "./status";

export function getRoleBadge(
  role: keyof typeof ROLE_BADGE
) {
  return ROLE_BADGE[role];
}

export function getStatusBadge(
  active: boolean
) {
  return STATUS_BADGE[
    String(active) as
      keyof typeof STATUS_BADGE
  ];
}