"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  ChevronDown,
  Megaphone,
  Zap,
  TicketPercent,
  HeartHandshake,
  Gift,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type {
  NavigationIcon,
  NavigationItem,
} from "@/types/navigation";

import { Badge } from "@/components/ui/badge";

interface SidebarItemProps {
  item: NavigationItem;
}

/**
 * ============================================================
 * ICON MAP
 * ============================================================
 */

const ICON_MAP: Record<
  NavigationIcon,
  React.ComponentType<{
    className?: string;
  }>
> = {
  dashboard: LayoutDashboard,

  products: Package,

  categories: FolderTree,

  orders: ShoppingCart,

  customers: Users,

  payments: CreditCard,

  reports: BarChart3,

  settings: Settings,

  promotions: Megaphone,

  "flash-sale": Zap,

  voucher: TicketPercent,

  loyalty: HeartHandshake,

  "reward-voucher": Gift,
};

/**
 * ============================================================
 * SIDEBAR ITEM
 * ============================================================
 */

export function SidebarItem({
  item,
}: SidebarItemProps) {
  const pathname = usePathname();

  /**
   * ==========================================================
   * CHILDREN
   * ==========================================================
   */

  const children =
    item.children
      ?.filter(
        (child) => !child.hidden
      )
      .sort(
        (a, b) =>
          a.order - b.order
      ) ?? [];

  const hasChildren =
    children.length > 0;

  /**
   * ==========================================================
   * ACTIVE STATE
   * ==========================================================
   */

  const isDirectActive =
    pathname === item.href;

  const isChildActive =
    children.some(
      (child) =>
        pathname === child.href ||
        (child.href !== "/admin" &&
          pathname.startsWith(
            `${child.href}/`
          ))
    );

  const isActive =
    isDirectActive ||
    isChildActive;

  /**
   * ==========================================================
   * EXPAND STATE
   * ==========================================================
   *
   * State ini digunakan ketika user membuka atau menutup
   * submenu secara manual.
   *
   * Initial value mengikuti apakah salah satu child sedang aktif.
   */

  const [isOpen, setIsOpen] =
    useState(isChildActive);

  /**
   * ==========================================================
   * SUBMENU OPEN STATE
   * ==========================================================
   *
   * Jika sedang berada pada halaman child,
   * submenu akan selalu terbuka.
   *
   * Contoh:
   *
   * /admin/settings
   * /admin/payment-channels
   *
   * Tidak menggunakan useEffect agar tidak terjadi warning:
   *
   * Calling setState synchronously within an effect
   */

  const isSubmenuOpen =
    isOpen || isChildActive;

  /**
   * ==========================================================
   * ICON
   * ==========================================================
   */

  const Icon =
    ICON_MAP[item.icon];

  /**
   * ==========================================================
   * MENU WITH CHILDREN
   * ==========================================================
   */

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => {
            setIsOpen(
              (current) => !current
            );
          }}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",

            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          aria-expanded={
            isSubmenuOpen
          }
          aria-controls={`${item.id}-submenu`}
        >
          <Icon className="h-5 w-5 shrink-0" />

          <span className="flex-1 truncate text-left">
            {item.title}
          </span>

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",

              isSubmenuOpen &&
                "rotate-180"
            )}
          />
        </button>

        {isSubmenuOpen ? (
          <ul
            id={`${item.id}-submenu`}
            className="ml-5 space-y-1 border-l pl-3"
          >
            {children.map(
              (child) => {
                const ChildIcon =
                  ICON_MAP[
                    child.icon
                  ];

                const isChildItemActive =
                  pathname ===
                    child.href ||
                  (child.href !==
                    "/admin" &&
                    pathname.startsWith(
                      `${child.href}/`
                    ));

                return (
                  <li
                    key={child.id}
                  >
                    <Link
                      href={
                        child.disabled
                          ? "#"
                          : child.href
                      }
                      aria-disabled={
                        child.disabled
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",

                        isChildItemActive
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",

                        child.disabled &&
                          "pointer-events-none opacity-50"
                      )}
                    >
                      <ChildIcon className="h-4 w-4 shrink-0" />

                      <span className="flex-1 truncate">
                        {child.title}
                      </span>

                      {child.badge ? (
                        <Badge
                          variant={
                            child.badge
                              .variant ??
                            "secondary"
                          }
                          className="rounded-full px-2"
                        >
                          {
                            child.badge
                              .value
                          }
                        </Badge>
                      ) : null}
                    </Link>
                  </li>
                );
              }
            )}
          </ul>
        ) : null}
      </div>
    );
  }

  /**
   * ==========================================================
   * NORMAL MENU
   * ==========================================================
   */

  return (
    <Link
      href={
        item.disabled
          ? "#"
          : item.href
      }
      aria-disabled={
        item.disabled
      }
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",

        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",

        item.disabled &&
          "pointer-events-none opacity-50"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />

      <span className="flex-1 truncate">
        {item.title}
      </span>

      {item.badge ? (
        <Badge
          variant={
            item.badge.variant ??
            "secondary"
          }
          className="rounded-full px-2"
        >
          {item.badge.value}
        </Badge>
      ) : null}
    </Link>
  );
}

export default SidebarItem;
