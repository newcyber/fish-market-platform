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
  /**
   * ==========================================================
   * DASHBOARD
   * ==========================================================
   */
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/admin",
    icon: "dashboard",
    roles: ADMIN_ROLES,
    order: 1,
  },

  /**
   * ==========================================================
   * PRODUCTS
   * ==========================================================
   */
  {
    id: "products",
    title: "Products",
    href: "/admin/products",
    icon: "products",
    roles: ADMIN_ROLES,
    order: 2,
  },

  /**
   * ==========================================================
   * CATEGORIES
   * ==========================================================
   */
  {
    id: "categories",
    title: "Categories",
    href: "/admin/categories",
    icon: "categories",
    roles: ADMIN_ROLES,
    order: 3,
  },

  /**
   * ==========================================================
   * TRANSACTIONS
   * ==========================================================
   *
   * Satu grup untuk seluruh proses transaksi:
   *
   * Transactions
   * ├── Orders
   * └── Payments
   *
   * Parent dapat dilihat oleh:
   *
   * - SUPER_ADMIN
   * - ADMIN
   *
   * Orders:
   * - SUPER_ADMIN
   * - ADMIN
   *
   * Payments:
   * - SUPER_ADMIN
   *
   * ==========================================================
   */
  {
  id: "transactions",
  title: "Transactions",
  href: "/admin/orders",
  icon: "orders",
  roles: ADMIN_ROLES,
  order: 4,

  children: [
    {
      id: "orders",
      title: "Orders",
      href: "/admin/orders",
      icon: "orders",
      roles: ADMIN_ROLES,
      order: 1,
    },

    {
      id: "payments",
      title: "Payments",
      href: "/admin/payments",
      icon: "payments",
      roles: SUPER_ADMIN_ONLY,
      order: 2,
    },
  ],
},

  /**
   * ==========================================================
   * CUSTOMERS
   * ==========================================================
   */
  {
    id: "customers",
    title: "Customers",
    href: "/admin/customers",
    icon: "customers",
    roles: ADMIN_ROLES,
    order: 5,
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
    order: 6,

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
    href: "/admin/reward-catalog",
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

      {
        id: "reward-catalog",
        title: "Reward Catalog",
        href: "/admin/reward-catalog",
        icon: "reward-catalog",
        roles: SUPER_ADMIN_ONLY,
        order: 2,
      },

      {
        id: "reward-category",
        title: "Reward Category",
        href: "/admin/reward-categories",
        icon: "reward-category",
        roles: SUPER_ADMIN_ONLY,
        order: 3,
      },

      {
      id: "reward-claims",
      title: "Reward Claims",
      href: "/admin/reward-claims",
      icon: "reward-catalog",
      roles: SUPER_ADMIN_ONLY,
      order: 4,
      },
    ],
  },

  /**
   * ==========================================================
   * REPORTS
   * ==========================================================
   */
  {
    id: "reports",
    title: "Reports",
    href: "/admin/reports",
    icon: "reports",
    roles: SUPER_ADMIN_ONLY,
    order: 8,
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
    order: 9,

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
