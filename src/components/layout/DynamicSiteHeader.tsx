import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  Fish,
  Heart,
  Menu,
} from "lucide-react";

import { auth } from "@/auth";

import HomeUserMenu from "@/components/home/home-user-menu";
import SiteCartButton from "@/components/layout/SiteCartButton";
import SiteSearch from "@/components/layout/SiteSearch";
import { CustomerAccountMenu } from "@/components/customer/CustomerAccountMenu";

import settingsService from "@/services/settings/settings.service";

/**
 * ============================================================
 * DYNAMIC SITE HEADER
 * ============================================================
 *
 * Header global untuk seluruh storefront.
 *
 * Mode:
 *
 * PUBLIC
 * - Homepage /
 * - Products /products
 * - Product Detail /products/[slug]
 *
 * CUSTOMER
 * - Customer Dashboard /customer
 * - Customer Products /customer/products
 * - Customer Rewards /customer/rewards
 * - Customer Orders /customer/orders
 * - Customer Wishlist /customer/wishlist
 * - Customer Account /customer/account
 *
 * ============================================================
 * PUBLIC MODE
 * ============================================================
 *
 * Desktop:
 * - Beranda
 * - Produk
 * - Belanja
 * - Search
 * - Cart
 * - Login / Register / User Menu
 *
 * Mobile:
 * - Search
 * - Cart
 * - Login / Account
 *
 * ============================================================
 * CUSTOMER MODE
 * ============================================================
 *
 * Desktop:
 * - Beranda
 * - Produk
 * - Reward
 * - Pesanan
 * - Search
 * - Wishlist
 * - Cart
 * - Customer Account
 *
 * Mobile:
 * - Search
 * - Wishlist
 * - Cart
 * - Account
 *
 * ============================================================
 *
 * Catatan:
 * - Cart count tetap ditangani oleh SiteCartButton.
 * - CustomerAccountMenu menangani dropdown customer.
 * - Branding toko berasal dari Admin Settings.
 *
 * ============================================================
 */

interface DynamicSiteHeaderProps {
  activePage?: "home" | "products";

  /**
   * Public:
   * mode tidak perlu dikirim.
   *
   * Customer:
   * gunakan mode="customer".
   */
  mode?: "public" | "customer";

  /**
   * Data customer hanya digunakan ketika
   * mode === "customer".
   */
  customerName?: string;
  customerInitial?: string;
  wishlistCount?: number;
}

export default async function DynamicSiteHeader({
  activePage,
  mode = "public",
  customerName,
  customerInitial,
  wishlistCount = 0,
}: DynamicSiteHeaderProps) {
  /**
   * ==========================================================
   * LOAD AUTH + SETTINGS
   * ==========================================================
   */

  const [session, settings] = await Promise.all([
    auth(),
    settingsService.getSettings(),
  ]);

  /**
   * ==========================================================
   * USER
   * ==========================================================
   */

  const user = session?.user;

  const userName =
    user?.name?.trim() ||
    "Pengguna";

  const userRole = user?.role;

  /**
   * ==========================================================
   * STORE SETTINGS
   * ==========================================================
   */

  const storeName =
    settings.storeName?.trim() ||
    "Pisjo Market";

  const storeDescription =
    settings.storeDescription?.trim() ||
    "Fresh Seafood";

  /**
   * ==========================================================
   * STORE LOGO
   * ==========================================================
   */

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
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "FM";

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-slate-200/80
        bg-white/90
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          min-h-16
          max-w-7xl
          flex-wrap
          items-center
          justify-between
          gap-3
          px-4
          py-2
          sm:px-6
          lg:px-8
        "
      >
        {/* ================================================== */}
        {/* LOGO                                               */}
        {/* ================================================== */}

        <Link
          href="/"
          className="
            flex
            min-w-0
            shrink-0
            items-center
            gap-3
          "
        >
          <div
            className="
              relative
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              bg-slate-950
              text-white
              shadow-lg
              shadow-slate-900/10
            "
          >
            {siteLogo ? (
              <Image
                src={siteLogo}
                alt={`${storeName} Logo`}
                fill
                sizes="44px"
                className="object-contain p-1"
                priority
              />
            ) : storeInitial ? (
              <span className="text-sm font-bold">
                {storeInitial}
              </span>
            ) : (
              <Fish className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <p
              className="
                truncate
                text-base
                font-bold
                tracking-tight
                text-slate-950
              "
            >
              {storeName}
            </p>

            <p
              className="
                truncate
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-[var(--pisjo-primary)]
              "
            >
              {storeDescription}
            </p>
          </div>
        </Link>

        {/* ================================================== */}
        {/* DESKTOP NAVIGATION                                 */}
        {/* ================================================== */}

        <nav
          className="
            hidden
            items-center
            gap-7
            md:flex
          "
        >
          {/* BERANDA */}

          <Link
            href="/"
            className={[
              "text-sm font-medium transition",
              activePage === "home"
                ? "text-slate-950"
                : "text-slate-600 hover:text-[var(--pisjo-primary)]",
            ].join(" ")}
          >
            Beranda
          </Link>

          {/* PRODUK */}

          <Link
            href={
              mode === "customer"
                ? "/customer/products"
                : "/products"
            }
            className={[
              "text-sm font-medium transition",
              activePage === "products"
                ? "text-slate-950"
                : "text-slate-600 hover:text-[var(--pisjo-primary)]",
            ].join(" ")}
          >
            Produk
          </Link>

          {/* CUSTOMER NAVIGATION */}

          {mode === "customer" ? (
            <>
              <Link
                href="/customer/rewards"
                className="
                  text-sm
                  font-medium
                  text-slate-600
                  transition
                  hover:text-[var(--pisjo-primary)]
                "
              >
                Reward
              </Link>

              <Link
                href="/customer/orders"
                className="
                  text-sm
                  font-medium
                  text-slate-600
                  transition
                  hover:text-[var(--pisjo-primary)]
                "
              >
                Pesanan
              </Link>
            </>
          ) : (
            /* PUBLIC NAVIGATION */

            <Link
              href="/customer"
              className="
                text-sm
                font-medium
                text-slate-600
                transition
                hover:text-[var(--pisjo-primary)]
              "
            >
              Belanja
            </Link>
          )}
        </nav>

        {/* ================================================== */}
        {/* DESKTOP ACTIONS                                    */}
        {/* ================================================== */}

        <div
          className="
            hidden
            min-w-0
            flex-1
            items-center
            justify-end
            gap-3
            md:flex
          "
        >
          {/* SEARCH */}

          <div
            className="
              min-w-0
              md:max-w-sm
              lg:max-w-lg
            "
          >
            <SiteSearch />
          </div>

          {/* CART */}

 {/* CART */}

<SiteCartButton
  mode={mode}
/>

          {/* ================================================== */}
          {/* CUSTOMER ACTIONS                                  */}
          {/* ================================================== */}

          {mode === "customer" ? (
            <>
              {/* WISHLIST */}

              <Link
                href="/customer/wishlist"
                aria-label={
                  wishlistCount > 0
                    ? `Wishlist, ${wishlistCount} produk`
                    : "Wishlist"
                }
                className="
                  relative
                  inline-flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-600
                  transition
                  hover:bg-slate-50
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

              {/* CUSTOMER ACCOUNT */}

              {customerName && customerInitial ? (
                <CustomerAccountMenu
                  customerName={customerName}
                  customerInitial={customerInitial}
                />
              ) : null}
            </>
          ) : (
            /* ================================================== */
            /* PUBLIC AUTH                                       */
            /* ================================================== */

            <>
              {user ? (
                <HomeUserMenu
                  name={userName}
                  role={userRole}
                />
              ) : (
                <>
                  {/* LOGIN */}

                  <Link
                    href="/login"
                    className="
                      inline-flex
                      h-10
                      items-center
                      justify-center
                      rounded-xl
                      px-4
                      text-sm
                      font-medium
                      text-slate-700
                      transition
                      hover:bg-slate-100
                      hover:text-slate-950
                    "
                  >
                    Masuk
                  </Link>

                  {/* REGISTER */}

                  <Link
                    href="/register"
                    className="
                      inline-flex
                      h-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-950
                      px-5
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-slate-800
                    "
                  >
                    Daftar

                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* ================================================== */}
        {/* MOBILE ACTIONS                                     */}
        {/* ================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            gap-2
            md:hidden
          "
        >
{/* CART */}

<SiteCartButton
  mode={mode}
/>

          {/* CUSTOMER MOBILE ACTIONS */}

          {mode === "customer" ? (
            <>
              {/* WISHLIST */}

              <Link
                href="/customer/wishlist"
                aria-label="Wishlist"
                className="
                  relative
                  inline-flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-600
                  transition
                  hover:bg-slate-50
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

              {/* ACCOUNT */}

<CustomerAccountMenu
  customerName={customerName || "Customer"}
  customerInitial={
    (
      customerInitial ||
      customerName?.charAt(0) ||
      "C"
    )
      .charAt(0)
      .toUpperCase()
  }
/>
            </>
          ) : (
            /* PUBLIC MOBILE ACCOUNT */

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
              className="
                inline-flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-slate-200
                bg-white
                transition
                hover:bg-slate-50
              "
            >
              {user ? (
                <span
                  className="
                    text-sm
                    font-bold
                    text-slate-900
                  "
                >
                  {userName
                    .charAt(0)
                    .toUpperCase()}
                </span>
              ) : (
                <Menu
                  className="
                    h-5
                    w-5
                    text-slate-700
                  "
                />
              )}
            </Link>
          )}
        </div>

        {/* ================================================== */}
        {/* MOBILE SEARCH                                      */}
        {/* ================================================== */}

        <div
          className="
            order-last
            w-full
            md:hidden
          "
        >
          <SiteSearch mobile />
        </div>
      </div>
    </header>
  );
}
