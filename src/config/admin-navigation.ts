import type { NavigationItem } from "@/types/navigation";

import { Role } from "@prisma/client";

/**
 * ============================================================
 * ADMIN NAVIGATION
 * ============================================================
 */

const ADMIN_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
];

const SUPER_ADMIN_ONLY = [
  Role.SUPER_ADMIN,
];

export const ADMIN_NAVIGATION: NavigationItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/admin",
    icon: "dashboard",
    roles: ADMIN_ROLES,
    order: 1,
  },

  {
    id: "products",
    title: "Products",
    href: "/admin/products",
    icon: "products",
    roles: ADMIN_ROLES,
    order: 2,
  },

  {
    id: "categories",
    title: "Categories",
    href: "/admin/categories",
    icon: "categories",
    roles: ADMIN_ROLES,
    order: 3,
  },

  {
    id: "orders",
    title: "Orders",
    href: "/admin/orders",
    icon: "orders",
    roles: ADMIN_ROLES,
    order: 4,
  },

  {
    id: "customers",
    title: "Customers",
    href: "/admin/customers",
    icon: "customers",
    roles: ADMIN_ROLES,
    order: 5,
  },

  {
    id: "payments",
    title: "Payments",
    href: "/admin/payments",
    icon: "payments",
    roles: SUPER_ADMIN_ONLY,
    order: 6,
  },

  /**
   * ==========================================================
   * PROMOTIONS
   * ==========================================================
   */
  {
    id: "promotions",
    title: "Promotions",
    href: "/admin/promotions",
    icon: "promotions",
    roles: SUPER_ADMIN_ONLY,
    order: 7,

    children: [
      {
        id: "promotion-list",
        title: "Promotions",
        href: "/admin/promotions",
        icon: "promotions",
        roles: SUPER_ADMIN_ONLY,
        order: 1,
      },

      {
        id: "flash-sales",
        title: "Flash Sale",
        href: "/admin/flash-sales",
        icon: "flash-sale",
        roles: SUPER_ADMIN_ONLY,
        order: 2,
      },

      {
        id: "voucher-settings",
        title: "Voucher",
        href: "/admin/vouchers",
        icon: "voucher",
        roles: SUPER_ADMIN_ONLY,
        order: 3,
      },
    ],
  },

  /**
   * ==========================================================
   * LOYALTY
   * ==========================================================
   */
  {
    id: "loyalty",
    title: "Loyalty",
    href: "/admin/reward-vouchers",
    icon: "loyalty",
    roles: SUPER_ADMIN_ONLY,
    order: 8,

    children: [
      {
        id: "reward-vouchers",
        title: "Reward Voucher",
        href: "/admin/reward-vouchers",
        icon: "reward-voucher",
        roles: SUPER_ADMIN_ONLY,
        order: 1,
      },
    ],
  },

  {
    id: "reports",
    title: "Reports",
    href: "/admin/reports",
    icon: "reports",
    roles: SUPER_ADMIN_ONLY,
    order: 9,
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
    roles: SUPER_ADMIN_ONLY,
    order: 10,

    children: [
      {
        id: "store-settings",
        title: "Pengaturan Toko",
        href: "/admin/settings",
        icon: "settings",
        roles: SUPER_ADMIN_ONLY,
        order: 1,
      },

      {
        id: "payment-channels",
        title: "Metode Pembayaran",
        href: "/admin/payment-channels",
        icon: "payments",
        roles: SUPER_ADMIN_ONLY,
        order: 2,
      },
    ],
  },
];

export default ADMIN_NAVIGATION;
