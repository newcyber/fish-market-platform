"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  User,
} from "lucide-react";

import { signOut } from "next-auth/react";

interface HomeUserMenuProps {
  name: string;
  role?: string | null;
}

export function HomeUserMenu({
  name,
  role,
}: HomeUserMenuProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const isAdmin =
    role === "ADMIN" ||
    role === "SUPER_ADMIN";

  const initial =
    name.charAt(0).toUpperCase();

  /**
   * ==========================================================
   * LOGOUT
   * ==========================================================
   */

  async function handleLogout() {
    try {
      setIsLoggingOut(true);

      await signOut({
        callbackUrl: "/",
      });
    } catch (error) {
      console.error(
        "[HOME_USER_MENU_LOGOUT_ERROR]",
        error
      );

      setIsLoggingOut(false);
    }
  }

  return (
    <div className="relative">
      {/* ====================================================== */}
      {/* PROFILE TRIGGER */}
      {/* ====================================================== */}

      <button
        type="button"
        onClick={() => {
          setIsOpen(
            (current) => !current
          );
        }}
        className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-cyan-200 hover:bg-cyan-50"
        aria-label="Buka menu profil"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {/* AVATAR */}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white transition group-hover:bg-cyan-600">
          {initial}
        </div>

        {/* USER NAME */}

        <div className="hidden min-w-0 text-left sm:block">
          <p className="text-[11px] leading-4 text-slate-400">
            Halo,
          </p>

          <p className="max-w-35 truncate text-sm font-semibold text-slate-900">
            {name}
          </p>
        </div>

        <ChevronDown
          className={[
            "hidden h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 sm:block",

            isOpen
              ? "rotate-180"
              : "",
          ].join(" ")}
        />
      </button>

      {/* ====================================================== */}
      {/* DROPDOWN */}
      {/* ====================================================== */}

      {isOpen ? (
        <div
          className="absolute right-0 top-full z-50 mt-3 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
          role="menu"
        >
          {/* USER INFO */}

          <div className="border-b border-slate-100 px-3 py-3">
            <p className="text-xs text-slate-400">
              Login sebagai
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
              {name}
            </p>
          </div>

          <div className="py-2">
            {isAdmin ? (
              <>
                {/* DASHBOARD ADMIN */}

                <Link
                  href="/admin"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  role="menuitem"
                >
                  <LayoutDashboard className="h-4 w-4" />

                  Dashboard Admin
                </Link>
              </>
            ) : (
              <>
                {/* AKUN SAYA */}

                <Link
                  href="customer/account"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  role="menuitem"
                >
                  <User className="h-4 w-4" />

                  Akun Saya
                </Link>

                {/* PESANAN SAYA */}

                <Link
                  href="/customer/orders"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  role="menuitem"
                >
                  <Package className="h-4 w-4" />

                  Pesanan Saya
                </Link>
              </>
            )}
          </div>

          {/* DIVIDER */}

          <div className="border-t border-slate-100 pt-2">
            {/* LOGOUT */}

            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />

              {isLoggingOut
                ? "Keluar..."
                : "Keluar"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default HomeUserMenu;
