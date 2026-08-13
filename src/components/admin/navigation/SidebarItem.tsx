"use client";

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
};

export function SidebarItem({
  item,
}: SidebarItemProps) {
  const pathname = usePathname();

  const isActive =
    pathname === item.href ||
    (item.href !== "/admin" &&
      pathname.startsWith(item.href));

  const Icon =
    ICON_MAP[item.icon];

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

      {item.badge && (
        <Badge
          variant={
            item.badge.variant ??
            "secondary"
          }
          className="rounded-full px-2"
        >
          {item.badge.value}
        </Badge>
      )}
    </Link>
  );
}

export default SidebarItem;