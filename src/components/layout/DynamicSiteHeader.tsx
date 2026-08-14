import Link from "next/link";

import {
  ArrowRight,
  Fish,
  Menu,
} from "lucide-react";

import { auth } from "@/auth";

import HomeUserMenu from "@/components/home/home-user-menu";

import settingsService from "@/services/settings/settings.service";

/**
 * ============================================================
 * DYNAMIC SITE HEADER
 *
 * Header global untuk halaman public.
 *
 * Digunakan oleh:
 * - Homepage /
 * - Products /products
 *
 * Data toko diambil dari Admin Settings.
 *
 * ============================================================
 */

interface DynamicSiteHeaderProps {
  activePage?: "home" | "products";
}

export default async function DynamicSiteHeader({
  activePage,
}: DynamicSiteHeaderProps) {
  /**
   * ==========================================================
   * LOAD AUTH + SETTINGS
   * ==========================================================
   */

  const [
    session,
    settings,
  ] = await Promise.all([
    auth(),
    settingsService.getSettings(),
  ]);

  /**
   * ==========================================================
   * USER
   * ==========================================================
   */

  const user =
    session?.user;

  const userName =
    user?.name?.trim() ||
    "Pengguna";

  const userRole =
    user?.role;

  /**
   * ==========================================================
   * STORE SETTINGS
   * ==========================================================
   */

  const storeName =
    settings.storeName?.trim() ||
    "Fish Market";

  const storeDescription =
    settings.storeDescription?.trim() ||
    "Fresh Seafood";

  /**
   * ==========================================================
   * STORE INITIAL
   * ==========================================================
   */

  const storeInitial =
    storeName
      .split(/\s+/)
      .filter(Boolean)
      .map((word) =>
        word.charAt(0)
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "FM";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* LOGO */}
        {/* ================================================== */}

        <Link
          href="/"
          className="flex shrink-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10">
            {storeInitial ? (
              <span className="text-sm font-bold">
                {storeInitial}
              </span>
            ) : (
              <Fish className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight text-slate-950">
              {storeName}
            </p>

            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-600">
              {storeDescription}
            </p>
          </div>
        </Link>

        {/* ================================================== */}
        {/* DESKTOP NAVIGATION */}
        {/* ================================================== */}

        <nav className="hidden items-center gap-7 md:flex">

          {/* BERANDA */}

          <Link
            href="/"
            className={[
              "text-sm font-medium transition",
              activePage === "home"
                ? "text-slate-950"
                : "text-slate-600 hover:text-cyan-600",
            ].join(" ")}
          >
            Beranda
          </Link>

          {/* PRODUK */}

          <Link
            href="/products"
            className={[
              "text-sm font-medium transition",
              activePage === "products"
                ? "text-slate-950"
                : "text-slate-600 hover:text-cyan-600",
            ].join(" ")}
          >
            Produk
          </Link>

          {/* BELANJA */}

          <Link
            href="/customer"
            className="text-sm font-medium text-slate-600 transition hover:text-cyan-600"
          >
            Belanja
          </Link>

        </nav>

        {/* ================================================== */}
        {/* DESKTOP ACTION */}
        {/* ================================================== */}

        <div className="hidden items-center gap-3 md:flex">

          {user ? (
            <HomeUserMenu
              name={userName}
              role={userRole}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Masuk
              </Link>

              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Daftar

                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </>
          )}

        </div>

        {/* ================================================== */}
        {/* MOBILE ACTION */}
        {/* ================================================== */}

        <Link
          href={
            user
              ? "/customer"
              : "/login"
          }
          aria-label={
            user
              ? "Buka akun"
              : "Masuk"
          }
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-50 md:hidden"
        >
          {user ? (
            <span className="text-sm font-bold text-slate-900">
              {userName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <Menu className="h-5 w-5 text-slate-700" />
          )}
        </Link>

      </div>
    </header>
  );
}