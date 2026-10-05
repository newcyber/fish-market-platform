"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Fish, LayoutDashboard, Menu, Navigation, X } from "lucide-react";

import { LogoutButton } from "@/components/admin/user/LogoutButton";
import { CourierNotificationBell } from "@/components/courier/CourierNotificationBell";
import { APP_CONFIG } from "@/config/app";

interface CourierAppShellProps {
  children: React.ReactNode;
  storeName: string;
  siteLogo: string | null;
  siteDescription: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "K"
  );
}

export function CourierAppShell({
  children,
  storeName,
  siteLogo,
  siteDescription,
  user,
}: CourierAppShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const initials = getInitials(user.name);

  const isDashboard = pathname === "/courier";
  const isNavigation = pathname === "/courier/navigation" || pathname.startsWith("/courier/navigation/");

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      {open ? (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 shrink-0 items-center border-b px-4 sm:h-20 sm:px-5">
          <Link
            href="/courier"
            onClick={() => setOpen(false)}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--pisjo-primary)] text-white">
              {siteLogo ? (
                <Image
                  src={siteLogo}
                  alt={`${storeName} logo`}
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <Fish className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {storeName || "Pisjo Market"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {siteDescription?.trim() || APP_CONFIG.branding.adminTitle}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:py-4">
          <div className="space-y-1">
            <Link
              href="/courier"
              onClick={() => setOpen(false)}
              className={[
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                isDashboard
                  ? "bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard Kurir
            </Link>

            <Link
              href="/courier/navigation"
              onClick={() => setOpen(false)}
              className={[
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                isNavigation
                  ? "bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")}
            >
              <Navigation className="h-5 w-5" />
              Navigasi Pengantaran
            </Link>
          </div>
        </nav>

        <div className="mt-auto border-t bg-white p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              COURIER
            </span>
            <span className="text-xs font-medium text-emerald-600">Online</span>
          </div>

          <div className="mt-4">
            <LogoutButton className="w-full justify-start" />
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-white/95 px-3 py-2.5 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Operasional Kurir
              </p>
              <p className="truncate text-sm font-semibold text-slate-900">
                Dashboard Pengantaran
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <CourierNotificationBell />

            <Link
              href="/"
              className="hidden shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:flex"
            >
              PISJO MARKET
            </Link>
          </div>
        </header>

        <main className="min-w-0 p-3 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default CourierAppShell;
