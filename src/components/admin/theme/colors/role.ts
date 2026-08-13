export const ROLE_BADGE = {
  SUPER_ADMIN: {
    label: "Super Admin",
    variant: "destructive",
  },

  ADMIN: {
    label: "Admin",
    variant: "default",
  },

  CUSTOMER: {
    label: "Customer",
    variant: "secondary",
  },
} as const;

export type RoleBadge =
  keyof typeof ROLE_BADGE;