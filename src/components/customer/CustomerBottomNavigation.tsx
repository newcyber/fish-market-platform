"use client";

import Link from "next/link";
import {
  Home,
  LayoutGrid,
  Package,
  Star,
  UserRound,
} from "lucide-react";

interface CustomerBottomNavigationProps {
  activePage?: "home" | "categories" | "orders" | "rewards" | "account";
}

const items = [
  {
    key: "home" as const,
    label: "Beranda",
    href: "/customer",
    icon: Home,
  },
  {
    key: "categories" as const,
    label: "Kategori",
    href: "/customer/products",
    icon: LayoutGrid,
  },
  {
    key: "orders" as const,
    label: "Pesanan",
    href: "/customer/orders",
    icon: Package,
  },
  {
    key: "rewards" as const,
    label: "Reward",
    href: "/customer/rewards",
    icon: Star,
  },
  {
    key: "account" as const,
    label: "Akun",
    href: "/customer/account",
    icon: UserRound,
  },
];

export default function CustomerBottomNavigation({
  activePage,
}: CustomerBottomNavigationProps) {
  return (
    <nav
      aria-label="Navigasi customer"
      className="
        fixed
        inset-x-0
        bottom-0
        z-50
        border-t
        border-slate-200
        bg-white/95
        pb-[env(safe-area-inset-bottom)]
        shadow-[0_-8px_30px_rgba(15,23,42,0.08)]
        backdrop-blur-xl
        md:hidden
      "
    >
      <div
        className="
          mx-auto
          grid
          h-16
          max-w-lg
          grid-cols-5
          items-stretch
        "
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-w-0 flex-col items-center justify-center gap-1",
                "text-[10px] font-semibold transition",
                active
                  ? "text-[var(--pisjo-primary)]"
                  : "text-slate-400 hover:text-slate-700",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-5 w-5",
                  active ? "stroke-[2.5]" : "stroke-2",
                ].join(" ")}
              />

              <span className="truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
