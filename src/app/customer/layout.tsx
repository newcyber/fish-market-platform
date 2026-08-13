import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Clock3,
  Heart,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  PackageCheck,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";

import { auth } from "@/auth";

import CustomerService from "@/services/customer/customer.service";
import WishlistService from "@/services/wishlist/wishlist.service";
import CartService from "@/services/cart/cart.service";

import settingsService from "@/services/settings/settings.service";

import { CustomerAccountMenu } from "@/components/customer/CustomerAccountMenu";

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
    "Fish Market";

  const storeDescription =
  settings.storeDescription?.trim() ||
  "Fresh Seafood";

  const footerDescription =
  settings.footerDescription?.trim() ||
  "Platform belanja dengan pengalaman belanja yang sederhana, nyaman, dan terpercaya.";

/* ============================================================
 * STORE CONTACT
 * ============================================================ */

const storeEmail =
  settings.email?.trim() ||
  "";

const storeWhatsapp =
  settings.whatsapp?.trim() ||
  "";

/**
 * Normalisasi nomor WhatsApp untuk URL wa.me.
 *
 * Contoh:
 *
 * 081234567890
 * → 6281234567890
 *
 * +628123456789
 * → 628123456789
 */
const whatsappNumber =
  storeWhatsapp
    .replace(/\D/g, "")
    .replace(/^0/, "62");

const whatsappUrl =
  whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : null;

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

  const openingTime =
    settings.openingTime?.trim() ||
    "";

  const closingTime =
    settings.closingTime?.trim() ||
    "";

  const hasOperatingHours =
    Boolean(openingTime) &&
    Boolean(closingTime);

  const operatingHours = hasOperatingHours
    ? `${openingTime} - ${closingTime}`
    : "Jam operasional belum tersedia";

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

            {/* LOGO */}

            <Link
              href="/customer"
              className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <span className="text-sm font-bold">
                  {storeInitial}
                </span>
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

            {/* DESKTOP NAVIGATION */}

            <nav className="hidden items-center gap-1 lg:flex">

              <Link
                href="/customer"
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

            {/* SEARCH */}

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

            {/* ACTIONS */}

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

      {/* ====================================================== */}
      {/* FOOTER */}
      {/* ====================================================== */}

      <footer className="mt-12 border-t border-slate-200 bg-white sm:mt-16">

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">

          {/* TOP FOOTER */}

          <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10">

            {/* ================================================= */}
            {/* BRAND */}
            {/* ================================================= */}

            <div className="lg:col-span-4">

              <Link
                href="/customer"
                className="inline-flex items-center gap-3"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">
                  {storeInitial}
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

  {/* ================================================= */}
  {/* EMAIL */}
  {/* ================================================= */}

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


  {/* ================================================= */}
  {/* WHATSAPP */}
  {/* ================================================= */}

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


  {/* ================================================= */}
  {/* LOKASI TOKO */}
  {/* ================================================= */}

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

    <p className="mt-4 break-words text-sm leading-6 text-slate-500">

      {storeAddress ||
        "Alamat toko belum tersedia."}

    </p>

  </div>


  {/* ================================================= */}
  {/* JAM OPERASIONAL */}
  {/* ================================================= */}

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
                    href="/customer/products"
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

    </div>
  );
}