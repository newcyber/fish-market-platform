import type { NavigationItem } from "@/types/navigation";

import { Role } from "@prisma/client";

/**
 * ============================================================
 * ADMIN NAVIGATION
 * ============================================================
 */

export const ADMIN_NAVIGATION: NavigationItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/admin",
    icon: "dashboard",
    roles: [
      Role.SUPER_ADMIN,
      Role.ADMIN,
    ],
    order: 1,
  },

  {
    id: "products",
    title: "Products",
    href: "/admin/products",
    icon: "products",
    roles: [
      Role.SUPER_ADMIN,
      Role.ADMIN,
    ],
    order: 2,
  },

  {
    id: "categories",
    title: "Categories",
    href: "/admin/categories",
    icon: "categories",
    roles: [
      Role.SUPER_ADMIN,
      Role.ADMIN,
    ],
    order: 3,
  },

  {
    id: "orders",
    title: "Orders",
    href: "/admin/orders",
    icon: "orders",
    roles: [
      Role.SUPER_ADMIN,
      Role.ADMIN,
    ],
    order: 4,
  },

  {
    id: "customers",
    title: "Customers",
    href: "/admin/customers",
    icon: "customers",
    roles: [
      Role.SUPER_ADMIN,
      Role.ADMIN,
    ],
    order: 5,
  },

  {
    id: "payments",
    title: "Payments",
    href: "/admin/payments",
    icon: "payments",
    roles: [
      Role.SUPER_ADMIN,
    ],
    order: 6,
  },

  {
    id: "reports",
    title: "Reports",
    href: "/admin/reports",
    icon: "reports",
    roles: [
      Role.SUPER_ADMIN,
    ],
    order: 7,
  },

  /**
   * ==========================================================
   * SETTINGS
   * ==========================================================
   */
  {
    id: "settings",
    title: "Settings",
    href: "/admin/settings",
    icon: "settings",
    roles: [
      Role.SUPER_ADMIN,
    ],
    order: 8,

    children: [
      {
        id: "store-settings",
        title: "Pengaturan Toko",
        href: "/admin/settings",
        icon: "settings",
        roles: [
          Role.SUPER_ADMIN,
        ],
        order: 1,
      },

      {
        id: "payment-channels",
        title: "Metode Pembayaran",
        href: "/admin/payment-channels",
        icon: "payments",
        roles: [
          Role.SUPER_ADMIN,
        ],
        order: 2,
      },
    ],
  },
];

export default ADMIN_NAVIGATION;