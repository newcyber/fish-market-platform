import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  CircleHelp,
  Fish,
  ShieldCheck,
  Truck,
} from "lucide-react";

import settingsService from "@/services/settings/settings.service";

import {
  AuthBrandingProvider,
} from "@/components/auth/AuthBrandingProvider";

/**
 * ============================================================
 * METADATA
 * ============================================================
 */

export const metadata: Metadata = {
  title: {
    default: "Authentication",
    template: "%s | Pusat Ikan Segar",
  },

  description:
    "Masuk atau daftar untuk melanjutkan ke Pusat Ikan Segar.",
};

/**
 * ============================================================
 * AUTH LAYOUT PROPS
 * ============================================================
 */

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * ============================================================
 * AUTH LAYOUT
 * ============================================================
 *
 * Layout halaman:
 *
 * - Login
 * - Register
 * - Verify Email
 * - Forgot Password
 * - Reset Password
 *
 * Konsep layout terinspirasi dari marketplace modern:
 *
 * Header Putih
 *        ↓
 * Brand Hero Background
 *        ↓
 * Branding Area + Authentication Card
 *
 * Branding tetap mengambil data dari Admin Settings.
 *
 * ============================================================
 */

export default async function AuthLayout({
  children,
}: AuthLayoutProps) {
  /**
   * ==========================================================
   * LOAD SETTINGS
   * ==========================================================
   */

  const settings =
    await settingsService.getSettings();

  /**
   * ==========================================================
   * STORE INFORMATION
   * ==========================================================
   */

  const storeName =
    settings.storeName?.trim() ||
    "Pusat Ikan Segar";

  const storeDescription =
    settings.storeDescription?.trim() ||
    "Seafood Segar Berkualitas";

  const siteLogo =
    settings.siteLogo?.trim() ||
    null;

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
    "PI";

  return (
    <main className="min-h-screen bg-slate-100">

      {/* ====================================================== */}
      {/* TOP HEADER */}
      {/* ====================================================== */}

      <header className="relative z-20 border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* ================================================== */}
          {/* BRAND */}
          {/* ================================================== */}

          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            {/* Logo */}

            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sky-700 text-white shadow-sm">

              {siteLogo ? (
                <Image
                  src={siteLogo}
                  alt={`${storeName} Logo`}
                  fill
                  sizes="44px"
                  className="object-contain bg-white p-1"
                  priority
                />
              ) : (
                <span className="text-sm font-bold">
                  {storeInitial}
                </span>
              )}

            </div>

            {/* Store Name */}

            <div className="min-w-0">

              <div className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {storeName}
              </div>

            </div>

          </Link>

          {/* ================================================== */}
          {/* HELP */}
          {/* ================================================== */}

          <Link
            href="/"
            className="hidden items-center gap-2 text-sm font-medium text-sky-700 transition hover:text-sky-900 sm:flex"
          >
            <CircleHelp className="h-4 w-4" />

            <span>
              Butuh bantuan?
            </span>

          </Link>

        </div>

      </header>

      {/* ====================================================== */}
      {/* AUTH HERO */}
      {/* ====================================================== */}

      <section className="relative overflow-hidden bg-linear-to-br from-sky-800 via-cyan-700 to-blue-900">

        {/* ==================================================== */}
        {/* DECORATION */}
        {/* ==================================================== */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="absolute right-0 top-0 h-128 w-lg rounded-full bg-blue-300/10 blur-3xl" />

          <div className="absolute bottom-0 left-1/2 h-64 w-3xl -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl" />

        </div>

        {/* ==================================================== */}
        {/* CONTENT */}
        {/* ==================================================== */}

        <div className="relative mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8 lg:py-16">

          <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">

            {/* ================================================= */}
            {/* LEFT BRANDING */}
            {/* ================================================= */}

            <div className="hidden justify-center lg:flex">

              <div className="max-w-xl text-center text-white">

                {/* Logo */}

                <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur">

                  {siteLogo ? (
                    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">

                      <Image
                        src={siteLogo}
                        alt={`${storeName} Logo`}
                        fill
                        sizes="112px"
                        className="object-contain p-2"
                        priority
                      />

                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white text-5xl font-bold text-sky-800">
                      {storeInitial}
                    </div>
                  )}

                </div>

                {/* Brand Name */}

                <h1 className="mt-8 text-5xl font-semibold tracking-tight xl:text-6xl">
                  {storeName}
                </h1>

                {/* Description */}

                <p className="mt-5 text-xl font-medium text-cyan-50 xl:text-2xl">
                  {storeDescription}
                </p>

                {/* Divider */}

                <div className="mx-auto my-10 h-px w-24 bg-white/30" />

                {/* Main Copy */}

                <h2 className="text-2xl font-semibold leading-relaxed xl:text-3xl">
                  Belanja Seafood Segar
                  <br />
                  Lebih Mudah dan Terpercaya
                </h2>

                <p className="mx-auto mt-6 max-w-lg text-base leading-8 text-cyan-50/80">
                  Nikmati pengalaman berbelanja ikan dan
                  seafood segar dengan produk berkualitas,
                  proses pemesanan yang praktis, dan layanan
                  yang lebih mudah.
                </p>

                {/* Features */}

                <div className="mt-10 grid grid-cols-3 gap-4">

                  <FeatureItem
                    icon={
                      <Fish className="h-5 w-5" />
                    }
                    label="Produk Segar"
                  />

                  <FeatureItem
                    icon={
                      <ShieldCheck className="h-5 w-5" />
                    }
                    label="Terpercaya"
                  />

                  <FeatureItem
                    icon={
                      <Truck className="h-5 w-5" />
                    }
                    label="Pengiriman"
                  />

                </div>

              </div>

            </div>

            {/* ================================================= */}
            {/* AUTH CARD */}
            {/* ================================================= */}

            <div className="flex justify-center lg:justify-end">

              <AuthBrandingProvider
  branding={{
    storeName,
    storeDescription,
    siteLogo,
    storeInitial,
  }}
>
  <div className="w-full max-w-md">
    {children}
  </div>
</AuthBrandingProvider>

            </div>

          </div>

        </div>

      </section>

      {/* ====================================================== */}
      {/* MOBILE BRANDING */}
      {/* ====================================================== */}

      <section className="border-t border-slate-200 bg-white px-4 py-6 lg:hidden">

        <div className="mx-auto flex max-w-md items-center gap-3">

          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sky-700 text-white">

            {siteLogo ? (
              <Image
                src={siteLogo}
                alt={`${storeName} Logo`}
                fill
                sizes="40px"
                className="object-contain bg-white p-1"
              />
            ) : (
              <span className="text-xs font-bold">
                {storeInitial}
              </span>
            )}

          </div>

          <div className="min-w-0">

            <p className="truncate text-sm font-semibold text-slate-900">
              {storeName}
            </p>

            <p className="truncate text-xs text-slate-500">
              {storeDescription}
            </p>

          </div>

        </div>

      </section>

      {/* ====================================================== */}
      {/* FOOTER */}
      {/* ====================================================== */}

      <footer className="border-t border-slate-200 bg-slate-50">

        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-center px-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">

          <p>
            © {new Date().getFullYear()}{" "}
            {storeName}. Semua hak dilindungi.
          </p>

        </div>

      </footer>

    </main>
  );
}

/**
 * ============================================================
 * FEATURE ITEM
 * ============================================================
 */

function FeatureItem({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-4 backdrop-blur">

      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
        {icon}
      </div>

      <span className="text-xs font-medium text-cyan-50">
        {label}
      </span>

    </div>
  );
}