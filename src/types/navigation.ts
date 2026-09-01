export type NavigationIcon =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "payments"
  | "reports"
  | "settings"
  | "promotions"
  | "flash-sale"
  | "voucher"
  | "loyalty"
  | "reward-voucher"
  | "reward-catalog"
  | "reward-category";

import type { Role } from "@prisma/client";

export interface NavigationBadge {
  value: number | string;

  variant?:
    | "default"
    | "secondary"
    | "destructive";
}

export interface NavigationItem {
  /**
   * Unique key
   */
  id: string;

  /**
   * Menu title
   */
  title: string;

  /**
   * URL
   */
  href: string;

  /**
   * Icon key
   */
  icon: NavigationIcon;

  /**
   * Allowed roles
   */
  roles: Role[];

  /**
   * Sidebar order
   */
  order: number;

  /**
   * Optional badge
   */
  badge?: NavigationBadge;

  /**
   * Nested menu
   */
  children?: NavigationItem[];

  /**
   * Hidden menu
   */
  hidden?: boolean;

  /**
   * Disabled menu
   */
  disabled?: boolean;
}
