import Image from "next/image";

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Heart,
  Menu,
  Search,
  ShoppingCart,
} from "lucide-react";

import { auth } from "@/auth";

import CustomerService from "@/services/customer/customer.service";
import WishlistService from "@/services/wishlist/wishlist.service";
import CartService from "@/services/cart/cart.service";

import settingsService from "@/services/settings/settings.service";

import { CustomerAccountMenu } from "@/components/customer/CustomerAccountMenu";

import DynamicSiteFooter from "@/components/layout/DynamicSiteFooter";

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default async function CustomerLayout({
  children,
}: CustomerLayoutProps) {
  /* ============================================================
   * AUTHENTICATION
   * ============================================================ */

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  /* ============================================================
   * ACCOUNT STATUS
   * ============================================================ */

  if (!session.user.isActive) {
    redirect("/login");
  }

  /* ============================================================
   * CUSTOMER ROLE
   * ============================================================ */

  if (session.user.role !== "CUSTOMER") {
    redirect("/admin");
  }

  /* ============================================================
   * LOAD DATA
   * ============================================================ */

  const [
    customer,
    wishlist,
    cart,
    settings,
  ] = await Promise.all([
    CustomerService.getCustomerById(
      session.user.id
    ),

    WishlistService.getWishlist(
      session.user.id
    ),

    CartService.getCart(
      session.user.id
    ),

    settingsService.getSettings(),
  ]);

  /* ============================================================
   * VALIDATE CUSTOMER
   * ============================================================ */

  if (!customer) {
    redirect("/login");
  }

  /* ============================================================
   * STORE DATA
   * ============================================================ */

  const storeName =
    settings.storeName?.trim() ||
    "Pisjo Market";

  const storeDescription =
    settings.storeDescription?.trim() ||
    "Fresh Seafood";

  /**
   * ============================================================
   * STORE LOGO
   * ============================================================
   *
   * Logo berasal dari Admin Settings.
   *
   * Jika logo belum tersedia, sistem akan
   * menggunakan fallback storeInitial.
   */

  const siteLogo =
    settings.siteLogo?.trim() ||
    null;

  /* ============================================================
   * STORE INITIAL
   * ============================================================ */

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

  /* ============================================================
   * HEADER COUNTS
   * ============================================================ */

  const wishlistCount =
    wishlist?.items.length ?? 0;

  const cartCount =
    cart?.items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    ) ?? 0;

  /* ============================================================
   * CUSTOMER DISPLAY DATA
   * ============================================================ */

  const customerName =
    customer.name?.trim() ||
    "Customer";

  const customerInitial =
    customerName
      .charAt(0)
      .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="flex h-16 items-center justify-between gap-3">

            {/* ================================================= */}
            {/* LOGO */}
            {/* ================================================= */}

            <Link
              href="/"
              className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-white shadow-sm">

                {siteLogo ? (
                  <Image
                    src={siteLogo}
                    alt={`${storeName} Logo`}
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                ) : (
                  <span className="text-sm font-bold">
                    {storeInitial}
                  </span>
                )}

              </div>

              <div className="hidden min-w-0 sm:block">

                <div className="truncate text-base font-bold leading-none">
                  {storeName}
                </div>

                <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {storeDescription}
                </div>

              </div>

            </Link>

            {/* ================================================= */}
            {/* DESKTOP NAVIGATION */}
            {/* ================================================= */}

            <nav className="hidden items-center gap-1 lg:flex">

              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Beranda
              </Link>

              <Link
                href="/customer/products"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Produk
              </Link>

              <Link
                href="/customer/orders"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Pesanan
              </Link>

            </nav>

            {/* ================================================= */}
            {/* SEARCH */}
            {/* ================================================= */}

            <div className="hidden min-w-0 flex-1 md:block md:max-w-sm lg:max-w-lg">

              <Link
                href="/customer/products"
                className="flex h-10 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-400 transition hover:border-slate-300 hover:bg-white"
              >
                <Search className="h-4 w-4 shrink-0" />

                <span className="truncate">
                  Cari produk segar...
                </span>

              </Link>

            </div>

            {/* ================================================= */}
            {/* ACTIONS */}
            {/* ================================================= */}

            <div className="flex shrink-0 items-center gap-1">

              {/* Mobile Menu */}

              <button
                type="button"
                aria-label="Menu"
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Wishlist */}

              <Link
                href="/customer/wishlist"
                aria-label={
                  wishlistCount > 0
                    ? `Wishlist, ${wishlistCount} produk`
                    : "Wishlist"
                }
                className="
                  relative
                  hidden
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  text-slate-600
                  transition
                  hover:bg-slate-100
                  sm:flex
                "
              >
                <Heart className="h-5 w-5" />

                {wishlistCount > 0 && (

                  <span
                    className="
                      absolute
                      -right-1
                      -top-1
                      flex
                      h-5
                      min-w-5
                      items-center
                      justify-center
                      rounded-full
                      bg-red-500
                      px-1
                      text-[10px]
                      font-bold
                      leading-none
                      text-white
                      ring-2
                      ring-white
                    "
                  >
                    {wishlistCount > 99
                      ? "99+"
                      : wishlistCount}
                  </span>

                )}

              </Link>

              {/* Cart */}

              <Link
                href="/customer/cart"
                aria-label={
                  cartCount > 0
                    ? `Keranjang, ${cartCount} barang`
                    : "Keranjang"
                }
                className="
                  relative
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  text-slate-600
                  transition
                  hover:bg-slate-100
                "
              >
                <ShoppingCart className="h-5 w-5" />

                {cartCount > 0 && (

                  <span
                    className="
                      absolute
                      -right-1
                      -top-1
                      flex
                      h-5
                      min-w-5
                      items-center
                      justify-center
                      rounded-full
                      bg-slate-900
                      px-1
                      text-[10px]
                      font-bold
                      leading-none
                      text-white
                      ring-2
                      ring-white
                    "
                  >
                    {cartCount > 99
                      ? "99+"
                      : cartCount}
                  </span>

                )}

              </Link>

              {/* Account */}

              <CustomerAccountMenu
                customerName={customerName}
                customerInitial={customerInitial}
              />

            </div>

          </div>

        </div>

      </header>

      {/* ====================================================== */}
      {/* MOBILE SEARCH */}
      {/* ====================================================== */}

      <div className="border-b border-slate-200 bg-white md:hidden">

        <div className="mx-auto max-w-7xl px-4 py-3">

          <Link
            href="/customer/products"
            className="flex h-10 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-400 transition hover:bg-white"
          >
            <Search className="h-4 w-4 shrink-0" />

            <span className="truncate">
              Cari produk segar...
            </span>

          </Link>

        </div>

      </div>

      {/* ====================================================== */}
      {/* MAIN CONTENT */}
      {/* ====================================================== */}

      <main className="flex-1">
        {children}
      </main>

      <DynamicSiteFooter />

    </div>
  );
}