import type { NavigationItem } from "@/types/navigation";

import { Role } from "@prisma/client";

/**
 * ============================================================
 * ADMIN NAVIGATION
 * ============================================================
 *
 * Main menu order:
 * 1. Dashboard
 * 2. Transaction
 * 3. Customer
 * 4. Produk
 * 5. Promotion
 * 6. Loyalty
 * 7. Report
 * 8. Setting
 *
 * Kategori berada di dalam Produk.
 * Smart SEO berada di dalam Setting agar tidak menjadi top-level menu.
 * ============================================================
 */

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

const SUPER_ADMIN_ONLY = [Role.SUPER_ADMIN];

export const ADMIN_NAVIGATION: NavigationItem[] = [
  /**
   * ==========================================================
   * 1. DASHBOARD
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
   * 2. TRANSACTION
   * ==========================================================
   *
   * Transaction
   * ├── Orders
   * └── Payments
   */
  {
    id: "transactions",
    title: "Transaction",
    href: "/admin/orders",
    icon: "orders",
    roles: ADMIN_ROLES,
    order: 2,

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

      {
        id: "couriers",
        title: "Kurir Internal",
        href: "/admin/couriers",
        icon: "couriers",
        roles: ADMIN_ROLES,
        order: 3,
      },
    ],
  },

  /**
   * ==========================================================
   * 3. CUSTOMER
   * ==========================================================
   */
  {
    id: "customers",
    title: "Customer",
    href: "/admin/customers",
    icon: "customers",
    roles: ADMIN_ROLES,
    order: 3,
  },

  /**
   * ==========================================================
   * 4. PRODUK
   * ==========================================================
   *
   * Produk
   * ├── Products
   * ├── Categories
   * └── Product Reviews
   */
  {
    id: "products",
    title: "Produk",
    href: "/admin/products",
    icon: "products",
    roles: ADMIN_ROLES,
    order: 4,

    children: [
      {
        id: "product-list",
        title: "Products",
        href: "/admin/products",
        icon: "products",
        roles: ADMIN_ROLES,
        order: 1,
      },

      {
        id: "categories",
        title: "Categories",
        href: "/admin/categories",
        icon: "categories",
        roles: ADMIN_ROLES,
        order: 2,
      },

      {
        id: "product-reviews",
        title: "Product Reviews",
        href: "/admin/product-reviews",
        icon: "products",
        roles: ADMIN_ROLES,
        order: 3,
      },
    ],
  },

  /**
   * ==========================================================
   * 5. PROMOTION
   * ==========================================================
   */
  {
    id: "promotions",
    title: "Promotion",
    href: "/admin/promotions",
    icon: "promotions",
    roles: SUPER_ADMIN_ONLY,
    order: 5,

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

      {
        id: "image-banners",
        title: "Image Banner",
        href: "/admin/promotions/image-banners",
        icon: "image-banner",
        order: 4,
        roles: SUPER_ADMIN_ONLY,
      },

      {
        id: "image-popup",
        title: "Image Popup",
        href: "/admin/promotions/image-popup",
        icon: "image-popup",
        order: 5,
        roles: SUPER_ADMIN_ONLY,
      },
    ],
  },

  /**
   * ==========================================================
   * 6. LOYALTY
   * ==========================================================
   */
  {
    id: "loyalty",
    title: "Loyalty",
    href: "/admin/reward-catalog",
    icon: "loyalty",
    roles: SUPER_ADMIN_ONLY,
    order: 6,

    children: [
      {
        id: "reward-points",
        title: "Reward Point Calculator",
        href: "/admin/reward-points",
        icon: "reward-points",
        roles: SUPER_ADMIN_ONLY,
        order: 1,
      },

      {
        id: "reward-vouchers",
        title: "Reward Voucher",
        href: "/admin/reward-vouchers",
        icon: "reward-voucher",
        roles: SUPER_ADMIN_ONLY,
        order: 2,
      },

      {
        id: "reward-catalog",
        title: "Reward Catalog",
        href: "/admin/reward-catalog",
        icon: "reward-catalog",
        roles: SUPER_ADMIN_ONLY,
        order: 3,
      },

      {
        id: "reward-category",
        title: "Reward Category",
        href: "/admin/reward-categories",
        icon: "reward-category",
        roles: SUPER_ADMIN_ONLY,
        order: 4,
      },

      {
        id: "reward-claims",
        title: "Reward Claims",
        href: "/admin/reward-claims",
        icon: "reward-catalog",
        roles: SUPER_ADMIN_ONLY,
        order: 5,
      },

      {
        id: "member-tiers",
        title: "Member Tier",
        href: "/admin/member-tiers",
        icon: "loyalty",
        roles: SUPER_ADMIN_ONLY,
        order: 6,
      },
    ],
  },

  /**
   * ==========================================================
   * 7. REPORT
   * ==========================================================
   */
  {
    id: "reports",
    title: "Report",
    href: "/admin/reports",
    icon: "reports",
    roles: SUPER_ADMIN_ONLY,
    order: 7,
  },

  /**
   * ==========================================================
   * 8. SETTING
   * ==========================================================
   */
  {
    id: "settings",
    title: "Setting",
    href: "/admin/settings",
    icon: "settings",
    roles: SUPER_ADMIN_ONLY,
    order: 8,

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

      {
        id: "smart-seo",
        title: "Smart SEO Setting",
        href: "/admin/smart-seo",
        icon: "smart-seo",
        roles: SUPER_ADMIN_ONLY,
        order: 3,
      },

      {
        id: "landing-page",
        title: "Landing Page",
        href: "/admin/landing-page",
        icon: "landing-page",
        roles: SUPER_ADMIN_ONLY,
        order: 4,
      },

      {
        id: "landing-page-images",
        title: "Image Landing Page",
        href: "/admin/landing-page/images",
        icon: "landing-page",
        roles: SUPER_ADMIN_ONLY,
        order: 5,
      },

      {
        id: "android-app",
        title: "Android App",
        href: "/admin/landing-page/android",
        icon: "landing-page",
        roles: SUPER_ADMIN_ONLY,
        order: 6,
      },

      {
        id: "ios-app",
        title: "iOS App",
        href: "/admin/landing-page/ios",
        icon: "landing-page",
        roles: SUPER_ADMIN_ONLY,
        order: 7,
      },

      {
        id: "wapi-setting",
        title: "WAPI Setting",
        href: "/admin/settings/wapi",
        icon: "whatsapp",
        roles: SUPER_ADMIN_ONLY,
        order: 8,
      },

      {
        id: "wapi-notification-center",
        title: "WAPI Notification Center",
        href: "/admin/notifications/wapi-deliveries",
        icon: "whatsapp",
        roles: SUPER_ADMIN_ONLY,
        order: 9,
      },

      {
        id: "wapi-customer-command-center",
        title: "WAPI Customer Center",
        href: "/admin/notifications/wapi-customer-deliveries",
        icon: "whatsapp",
        roles: SUPER_ADMIN_ONLY,
        order: 10,
      },

      {
        id: "social-store-links",
        title: "Social & Store Links",
        href: "/admin/social-store-links",
        icon: "settings",
        roles: SUPER_ADMIN_ONLY,
        order: 11,
      },

      {
        id: "database-backups",
        title: "Database Backup",
        href: "/admin/database-backups",
        icon: "settings",
        roles: SUPER_ADMIN_ONLY,
        order: 12,
      },
    ],
  },
];

export default ADMIN_NAVIGATION;
