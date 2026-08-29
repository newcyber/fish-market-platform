import Link from "next/link";

import {
  MapPin,
  Package,
  User,
  ShieldCheck,
} from "lucide-react";

/**
 * ============================================================
 * Pisjo MARKET
 * SITE FOOTER
 *
 * Shared footer untuk:
 * - Homepage
 * - Public Products
 * - Customer Area
 *
 * ============================================================
 */

export default function SiteFooter() {
  const currentYear =
    new Date().getFullYear();

  return (
    <footer className="mt-16 border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        <div className="grid gap-10 md:grid-cols-4">

          {/* ================================================== */}
          {/* BRAND */}
          {/* ================================================== */}

          <div className="md:col-span-2">

            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                FM
              </div>

              <div>
                <div className="font-bold">
                  Pisjo Market
                </div>

                <div className="text-xs text-slate-400">
                  Fresh Seafood
                </div>
              </div>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              Platform belanja seafood segar dengan
              pengalaman belanja yang sederhana,
              nyaman, dan terpercaya.
            </p>

          </div>

          {/* ================================================== */}
          {/* BELANJA */}
          {/* ================================================== */}

          <div>

            <h3 className="text-sm font-semibold">
              Belanja
            </h3>

            <div className="mt-4 space-y-3">

              <Link
                href="/products"
                className="block text-sm text-slate-500 transition hover:text-slate-900"
              >
                Produk
              </Link>

              <Link
                href="/customer/cart"
                className="block text-sm text-slate-500 transition hover:text-slate-900"
              >
                Keranjang
              </Link>

              <Link
                href="/customer/orders"
                className="block text-sm text-slate-500 transition hover:text-slate-900"
              >
                Pesanan Saya
              </Link>

            </div>

          </div>

          {/* ================================================== */}
          {/* AKUN */}
          {/* ================================================== */}

          <div>

            <h3 className="text-sm font-semibold">
              Akun
            </h3>

            <div className="mt-4 space-y-3">

              <Link
                href="/customer/account"
                className="flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
              >
                <User className="h-4 w-4" />

                Profil
              </Link>

              <Link
                href="/customer/addresses"
                className="flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
              >
                <MapPin className="h-4 w-4" />

                Alamat
              </Link>

              <Link
                href="/help"
                className="flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
              >
                <ShieldCheck className="h-4 w-4" />

                Bantuan
              </Link>

            </div>

          </div>

        </div>

        {/* ================================================== */}
        {/* COPYRIGHT */}
        {/* ================================================== */}

        <div className="mt-10 border-t pt-6">

          <p className="text-center text-xs text-slate-400">
            © {currentYear} Pisjo Market.
            All rights reserved.
          </p>

        </div>

      </div>
    </footer>
  );
}