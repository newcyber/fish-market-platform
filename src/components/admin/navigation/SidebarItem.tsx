"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

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
  Sparkles,
  ChevronDown,
  Megaphone,
  Zap,
  TicketPercent,
  HeartHandshake,
  Gift,
  Award,
  Tags,
  Calculator,
  Image,
  PanelsTopLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type {
  NavigationIcon,
  NavigationItem,
} from "@/types/navigation";

import { Badge } from "@/components/ui/badge";

import {
  getOrderNotificationCountAction,
  getPaymentNotificationCountAction,
} from "@/actions/notification/notification.actions";

interface SidebarItemProps {
  item: NavigationItem;

  onNavigate?: () => void;
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

  "smart-seo": Sparkles,

  promotions: Megaphone,

  "flash-sale": Zap,

  voucher: TicketPercent,

  "image-banner": Image,

  "image-popup": PanelsTopLeft,

  loyalty: HeartHandshake,

  "reward-voucher": Gift,

  "reward-catalog": Award,

  "reward-category": Tags,

  "reward-points": Calculator,

  "landing-page": PanelsTopLeft,
};

/**
 * ============================================================
 * SIDEBAR ITEM
 * ============================================================
 */

export function SidebarItem({
  item,
  onNavigate,
}: SidebarItemProps) {
  const pathname = usePathname();

  const [
    orderNotificationCount,
    setOrderNotificationCount,
  ] = useState(0);

  const [
    paymentNotificationCount,
    setPaymentNotificationCount,
  ] = useState(0);

  /**
   * ==========================================================
   * LOAD ORDER NOTIFICATION COUNT
   * ==========================================================
   */

  const loadOrderNotificationCount =
    useCallback(
      async () => {
        const hasOrderChild =
          item.children?.some(
            (child) =>
              !child.hidden &&
              child.id === "orders"
          ) ?? false;

        if (!hasOrderChild) {
          return;
        }

        try {
          const result =
            await getOrderNotificationCountAction();

          if (result.success) {
            setOrderNotificationCount(
              result.count
            );
          }
        } catch (error) {
          console.error(
            "[SIDEBAR_ORDER_NOTIFICATION_COUNT_ERROR]",
            error
          );
        }
      },
      [item.children]
    );

  /**
   * ==========================================================
   * LOAD PAYMENT NOTIFICATION COUNT
   * ==========================================================
   */

  const loadPaymentNotificationCount =
    useCallback(
      async () => {
        const hasPaymentChild =
          item.children?.some(
            (child) =>
              !child.hidden &&
              child.id === "payments"
          ) ?? false;

        if (!hasPaymentChild) {
          return;
        }

        try {
          const result =
            await getPaymentNotificationCountAction();

          if (result.success) {
            setPaymentNotificationCount(
              result.count
            );
          }
        } catch (error) {
          console.error(
            "[SIDEBAR_PAYMENT_NOTIFICATION_COUNT_ERROR]",
            error
          );
        }
      },
      [item.children]
    );

  /**
   * ==========================================================
   * ORDER NOTIFICATION POLLING
   * ==========================================================
   */

  useEffect(() => {
    const hasOrderChild =
      item.children?.some(
        (child) =>
          !child.hidden &&
          child.id === "orders"
      ) ?? false;

    if (!hasOrderChild) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        void loadOrderNotificationCount();
      }, 0);

    const intervalId =
      window.setInterval(() => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadOrderNotificationCount();
        }
      }, 5000);

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadOrderNotificationCount();
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearTimeout(
        timeoutId
      );

      window.clearInterval(
        intervalId
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    item.children,
    loadOrderNotificationCount,
  ]);

  /**
   * ==========================================================
   * PAYMENT NOTIFICATION POLLING
   * ==========================================================
   */

  useEffect(() => {
    const hasPaymentChild =
      item.children?.some(
        (child) =>
          !child.hidden &&
          child.id === "payments"
      ) ?? false;

    if (!hasPaymentChild) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        void loadPaymentNotificationCount();
      }, 0);

    const intervalId =
      window.setInterval(() => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadPaymentNotificationCount();
        }
      }, 5000);

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadPaymentNotificationCount();
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearTimeout(
        timeoutId
      );

      window.clearInterval(
        intervalId
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    item.children,
    loadPaymentNotificationCount,
  ]);

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
   */

  const [
    isOpen,
    setIsOpen,
  ] = useState(
    isChildActive
  );

  const isSubmenuOpen =
    isOpen ||
    isChildActive;

  /**
   * ==========================================================
   * ICON
   * ==========================================================
   */

  const Icon =
    ICON_MAP[item.icon];

  /**
   * ==========================================================
   * NAVIGATION HANDLER
   * ==========================================================
   */

  function handleNavigate() {
    onNavigate?.();
  }

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
              (current) =>
                !current
            );
          }}
          className={cn(
            "group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            "touch-manipulation",
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

          <span className="min-w-0 flex-1 truncate text-left">
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
            className="ml-4 space-y-1 border-l pl-3 sm:ml-5"
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
                    key={
                      child.id
                    }
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
                      onClick={() => {
                        if (
                          !child.disabled
                        ) {
                          handleNavigate();
                        }
                      }}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors touch-manipulation",
                        isChildItemActive
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        child.disabled &&
                          "pointer-events-none opacity-50"
                      )}
                    >
                      <ChildIcon className="h-4 w-4 shrink-0" />

                      <span className="min-w-0 flex-1 truncate">
                        {child.title}
                      </span>

                      {child.id ===
                        "orders" &&
                      orderNotificationCount >
                        0 ? (
                        <Badge
                          variant="destructive"
                          className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 p-0 text-[10px] font-bold leading-none text-white"
                        >
                          {orderNotificationCount >
                          99
                            ? "99+"
                            : orderNotificationCount}
                        </Badge>
                      ) : child.id ===
                          "payments" &&
                        paymentNotificationCount >
                          0 ? (
                        <Badge
                          variant="destructive"
                          className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 p-0 text-[10px] font-bold leading-none text-white"
                        >
                          {paymentNotificationCount >
                          99
                            ? "99+"
                            : paymentNotificationCount}
                        </Badge>
                      ) : child.badge ? (
                        <Badge
                          variant={
                            child.badge
                              .variant ??
                            "secondary"
                          }
                          className="shrink-0 rounded-full px-2"
                        >
                          {
                            child
                              .badge
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
      onClick={() => {
        if (!item.disabled) {
          handleNavigate();
        }
      }}
      className={cn(
        "group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "touch-manipulation",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        item.disabled &&
          "pointer-events-none opacity-50"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />

      <span className="min-w-0 flex-1 truncate">
        {item.title}
      </span>

      {item.badge ? (
        <Badge
          variant={
            item.badge
              .variant ??
            "secondary"
          }
          className="shrink-0 rounded-full px-2"
        >
          {
            item.badge.value
          }
        </Badge>
      ) : null}
    </Link>
  );
}

export default SidebarItem;