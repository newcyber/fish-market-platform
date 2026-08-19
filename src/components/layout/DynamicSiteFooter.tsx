import Image from "next/image";
import Link from "next/link";

import {
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  ShoppingCart,
  User,
} from "lucide-react";

import settingsService from "@/services/settings/settings.service";

/**
 * ============================================================
 * DYNAMIC SITE FOOTER
 *
 * Footer global yang mengambil data dari Admin Settings.
 *
 * Digunakan oleh:
 * - Homepage /
 * - Public Products /products
 * - Customer Area /customer
 *
 * ============================================================
 */

export default async function DynamicSiteFooter() {
  /**
   * ==========================================================
   * LOAD SETTINGS
   * ==========================================================
   */

  const settings =
    await settingsService.getSettings();

  /**
   * ==========================================================
   * STORE DATA
   * ==========================================================
   */

  const storeName =
    settings.storeName?.trim() ||
    "Pisjo Market";

  const storeDescription =
    settings.storeDescription?.trim() ||
    "Fresh Seafood";

  const footerDescription =
    settings.footerDescription?.trim() ||
    "Platform belanja dengan pengalaman belanja yang sederhana, nyaman, dan terpercaya.";

  /**
   * ==========================================================
   * STORE LOGO
   *
   * Logo berasal dari Admin Settings.
   * Jika belum tersedia, gunakan fallback inisial toko.
   * ==========================================================
   */

  const siteLogo =
    settings.siteLogo?.trim() ||
    null;

  /**
   * ==========================================================
   * STORE CONTACT
   * ==========================================================
   */

  const storeEmail =
    settings.email?.trim() ||
    "";

  const storeWhatsapp =
    settings.whatsapp?.trim() ||
    "";

  /**
   * ==========================================================
   * WHATSAPP URL
   * ==========================================================
   */

  const whatsappNumber =
    storeWhatsapp
      .replace(/\D/g, "")
      .replace(/^0/, "62");

  const whatsappUrl =
    whatsappNumber
      ? `https://wa.me/${whatsappNumber}`
      : null;

  /**
   * ==========================================================
   * STORE ADDRESS
   * ==========================================================
   */

  const storeAddress = [
    settings.address,
    settings.city,
    settings.province,
    settings.postalCode,
  ]
    .filter(
      (value): value is string =>
        Boolean(value?.trim())
    )
    .join(", ");

  /**
   * ==========================================================
   * OPERATING HOURS
   * ==========================================================
   */

  const openingTime =
    settings.openingTime?.trim() ||
    "";

  const closingTime =
    settings.closingTime?.trim() ||
    "";

  const hasOperatingHours =
    Boolean(openingTime) &&
    Boolean(closingTime);

  const operatingHours =
    hasOperatingHours
      ? `${openingTime} - ${closingTime}`
      : "Jam operasional belum tersedia";

  /**
   * ==========================================================
   * STORE INITIAL
   *
   * Fallback jika siteLogo belum tersedia.
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
    <footer className="mt-12 border-t border-slate-200 bg-white sm:mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">

        {/* ================================================== */}
        {/* TOP FOOTER */}
        {/* ================================================== */}

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10">

          {/* ================================================= */}
          {/* BRAND */}
          {/* ================================================= */}

          <div className="lg:col-span-4">

            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">

                {siteLogo ? (
                  <Image
                    src={siteLogo}
                    alt={`${storeName} Logo`}
                    fill
                    sizes="44px"
                    className="object-contain p-1"
                  />
                ) : (
                  <span>
                    {storeInitial}
                  </span>
                )}

              </div>

              <div className="min-w-0">
                <div className="truncate text-base font-bold">
                  {storeName}
                </div>

                <div className="mt-0.5 truncate text-xs text-slate-400">
                  {storeDescription}
                </div>
              </div>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              {footerDescription}
            </p>
          </div>

          {/* ================================================= */}
          {/* STORE INFORMATION */}
          {/* ================================================= */}

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-2">

            {/* EMAIL */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition sm:p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                  <Mail className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Email
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Hubungi kami melalui email
                  </p>
                </div>

              </div>

              <div className="mt-4">

                {storeEmail ? (
                  <a
                    href={`mailto:${storeEmail}`}
                    className="block break-all text-sm font-medium leading-6 text-slate-600 transition hover:text-slate-950"
                  >
                    {storeEmail}
                  </a>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">
                    Email belum tersedia.
                  </p>
                )}

              </div>

            </div>

            {/* WHATSAPP */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition sm:p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                  <MessageCircle className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">
                    WhatsApp
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Chat langsung dengan toko
                  </p>
                </div>

              </div>

              <div className="mt-4">

                {storeWhatsapp && whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all text-sm font-medium leading-6 text-slate-600 transition hover:text-slate-950"
                  >
                    {storeWhatsapp}
                  </a>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">
                    WhatsApp belum tersedia.
                  </p>
                )}

              </div>

            </div>

            {/* LOCATION */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition sm:p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Lokasi Toko
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Alamat toko kami
                  </p>
                </div>

              </div>

              <p className="mt-4 wrap-break-word text-sm leading-6 text-slate-500">
                {storeAddress ||
                  "Alamat toko belum tersedia."}
              </p>

            </div>

            {/* OPERATING HOURS */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition sm:p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                  <Clock3 className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Jam Operasional
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Waktu pelayanan toko
                  </p>
                </div>

              </div>

              <div className="mt-4">

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Setiap Hari
                </p>

                <p
                  className={[
                    "mt-1 text-sm font-semibold leading-6",
                    hasOperatingHours
                      ? "text-slate-700"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {operatingHours}
                </p>

              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* BELANJA */}
          {/* ================================================= */}

          <div>

            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Belanja
            </h3>

            <ul className="space-y-3">

              <li>
                <Link
                  href="/products"
                  className="group flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Package className="h-4 w-4 shrink-0" />

                  <span>Produk</span>
                </Link>
              </li>

              <li>
                <Link
                  href="/customer/cart"
                  className="group flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ShoppingCart className="h-4 w-4 shrink-0" />

                  <span>Keranjang</span>
                </Link>
              </li>

              <li>
                <Link
                  href="/customer/orders"
                  className="group flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <PackageCheck className="h-4 w-4 shrink-0" />

                  <span>Pesanan</span>
                </Link>
              </li>

            </ul>

          </div>

          {/* ================================================= */}
          {/* AKUN */}
          {/* ================================================= */}

          <div className="lg:col-span-2">

            <h3 className="text-sm font-semibold text-slate-900">
              Akun
            </h3>

            <div className="mt-4 space-y-3">

              <Link
                href="/customer/profile"
                className="flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
              >
                <User className="h-4 w-4 shrink-0" />

                <span>Profil</span>
              </Link>

              <Link
                href="/customer/addresses"
                className="flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
              >
                <MapPin className="h-4 w-4 shrink-0" />

                <span>Alamat</span>
              </Link>

              <Link
                href="/customer/orders"
                className="flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
              >
                <Package className="h-4 w-4 shrink-0" />

                <span>Pesanan Saya</span>
              </Link>

            </div>

          </div>

        </div>

        {/* =================================================== */}
        {/* COPYRIGHT */}
        {/* =================================================== */}

        <div className="mt-10 border-t border-slate-200 pt-6 sm:mt-12">

          <p className="text-center text-xs leading-6 text-slate-400">
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>

        </div>

      </div>
    </footer>
  );
}