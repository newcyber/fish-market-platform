import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Fish,
  LockKeyhole,
  ShieldCheck,
  Truck,
  UserRoundPlus,
} from "lucide-react";

import SettingsService from "@/services/settings/settings.service";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface LoginRequiredPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}

/**
 * ============================================================
 * PAGE NAME
 * ============================================================
 *
 * Mengubah URL internal menjadi nama halaman yang
 * lebih mudah dipahami customer.
 *
 * Contoh:
 *
 * /customer/products
 *      → Daftar Produk
 *
 * /customer/products/udang-vaname
 *      → Detail Produk
 *
 * /customer/orders
 *      → Pesanan Saya
 */

function getPageName(
  path: string
): string {
  if (path === "/customer") {
    return "Dashboard Customer";
  }

  if (path === "/customer/products") {
    return "Daftar Produk";
  }

  if (
    /^\/customer\/products\/[^/]+$/.test(
      path
    )
  ) {
    return "Detail Produk";
  }

  if (path === "/customer/cart") {
    return "Keranjang Belanja";
  }

  if (path === "/customer/checkout") {
    return "Checkout";
  }

  if (path === "/customer/orders") {
    return "Pesanan Saya";
  }

  if (
    /^\/customer\/orders\/[^/]+$/.test(
      path
    )
  ) {
    return "Detail Pesanan";
  }

  if (path === "/customer/profile") {
    return "Profil Saya";
  }

  if (path === "/customer/wishlist") {
    return "Wishlist";
  }

  if (path === "/customer/addresses") {
    return "Alamat Saya";
  }

  if (
    /^\/customer\/addresses\/[^/]+\/edit$/.test(
      path
    )
  ) {
    return "Edit Alamat";
  }

  return "Halaman Customer";
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default async function LoginRequiredPage({
  searchParams,
}: LoginRequiredPageProps) {
  /**
   * ==========================================================
   * QUERY PARAMETER
   * ==========================================================
   */

  const params =
    await searchParams;

  const callbackUrl =
    params.callbackUrl ||
    "/customer";

  /**
   * ==========================================================
   * SECURITY
   * ==========================================================
   *
   * Hanya izinkan internal URL.
   *
   * Contoh valid:
   *
   * /customer
   * /customer/products
   * /customer/cart
   *
   * Jangan izinkan:
   *
   * https://example.com
   * //example.com
   */

  const safeCallbackUrl =
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/customer";

  /**
   * ==========================================================
   * FRIENDLY PAGE NAME
   * ==========================================================
   */

  const pageName =
    getPageName(
      safeCallbackUrl
    );

  /**
   * ==========================================================
   * LOGIN URL
   * ==========================================================
   */

  const loginUrl =
    `/login?callbackUrl=${encodeURIComponent(
      safeCallbackUrl
    )}`;

  /**
   * ==========================================================
   * REGISTER URL
   * ==========================================================
   */

  const registerUrl =
    `/register?callbackUrl=${encodeURIComponent(
      safeCallbackUrl
    )}`;

  /**
   * ==========================================================
   * GET STORE SETTINGS
   * ==========================================================
   *
   * Logo diambil langsung dari:
   *
   * StoreSettings.siteLogo
   *
   * melalui:
   *
   * SettingsService
   *      ↓
   * SettingsRepository
   *      ↓
   * Prisma
   */

  const settings =
  await SettingsService.getSettings();

const logoUrl =
  settings?.siteLogo || null;

const storeName =
  settings?.storeName?.trim() ||
  "Pisjo Market";

const storeDescription =
  settings?.storeDescription?.trim() ||
  "Fresh Seafood";

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-gradient-to-b
        from-cyan-50
        via-slate-50
        to-white
      "
    >
      {/* ==================================================== */}
      {/* DECORATIVE BACKGROUND */}
      {/* ==================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
      >
        <div
          className="
            absolute
            -left-32
            -top-32
            h-72
            w-72
            rounded-full
            bg-cyan-200/30
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -right-32
            top-20
            h-80
            w-80
            rounded-full
            bg-blue-200/30
            blur-3xl
          "
        />

        <div
          className="
            absolute
            bottom-0
            left-1/2
            h-72
            w-72
            -translate-x-1/2
            rounded-full
            bg-sky-100/40
            blur-3xl
          "
        />

        <Fish
          className="
            absolute
            left-[7%]
            top-[24%]
            h-8
            w-8
            rotate-[-12deg]
            text-cyan-200/70
          "
        />

        <Fish
          className="
            absolute
            right-[8%]
            top-[38%]
            h-10
            w-10
            rotate-[15deg]
            text-blue-200/70
          "
        />

        <Fish
          className="
            absolute
            bottom-[18%]
            left-[12%]
            h-7
            w-7
            rotate-[10deg]
            text-cyan-200/60
          "
        />

        <Fish
          className="
            absolute
            bottom-[12%]
            right-[14%]
            h-8
            w-8
            rotate-[-15deg]
            text-sky-200/60
          "
        />
      </div>

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      {/* ==================================================== */}
{/* HEADER */}
{/* ==================================================== */}

<header
  className="
    relative
    z-20
    border-b
    border-slate-200
    bg-white
  "
>
  <div
    className="
      mx-auto
      flex
      h-[72px]
      max-w-7xl
      items-center
      px-4
      sm:px-6
      lg:px-8
    "
  >
    <Link
      href="/"
      className="
        group
        flex
        min-w-0
        items-center
        gap-3
      "
    >
      {/* ================================================= */}
      {/* LOGO */}
      {/* ================================================= */}

      {logoUrl ? (
        <div
          className="
            relative
            h-11
            w-11
            shrink-0
            overflow-hidden
            rounded-full
            bg-white
            shadow-sm
            ring-1
            ring-slate-200
            transition
            duration-200
            group-hover:scale-105
          "
        >
          <Image
            src={logoUrl}
            alt={storeName}
            fill
            priority
            sizes="44px"
            className="
              object-contain
            "
          />
        </div>
      ) : (
        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-slate-950
            text-white
            shadow-sm
            transition
            duration-200
            group-hover:scale-105
          "
        >
          <Fish
            className="
              h-5
              w-5
            "
          />
        </div>
      )}

      {/* ================================================= */}
      {/* SITE BRAND */}
      {/* ================================================= */}

      <div
        className="
          min-w-0
        "
      >
        {/* SITE NAME */}

        <div
          className="
            truncate
            text-[15px]
            font-bold
            leading-tight
            tracking-tight
            text-slate-900
            sm:text-base
          "
        >
          {storeName}
        </div>

        {/* SITE DESCRIPTION */}

        {storeDescription && (
          <div
            className="
              mt-0.5
              max-w-[220px]
              truncate
              text-[9px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-cyan-600
              sm:max-w-[320px]
              sm:text-[10px]
            "
          >
            {storeDescription}
          </div>
        )}
      </div>
    </Link>
  </div>
</header>

      {/* ==================================================== */}
      {/* CONTENT */}
      {/* ==================================================== */}

      <section
        className="
          relative
          z-10
          px-4
          pb-12
          pt-4
          sm:px-6
          sm:pb-16
          lg:px-8
          lg:pt-10
        "
      >
        <div className="mx-auto max-w-5xl">
          {/* ================================================= */}
          {/* MAIN CARD */}
          {/* ================================================= */}

          <div
            className="
              overflow-hidden
              rounded-3xl
              border
              border-slate-200/80
              bg-white/95
              shadow-xl
              shadow-slate-900/5
              backdrop-blur
            "
          >
            <div
              className="
                grid
                lg:grid-cols-[1fr_360px]
              "
            >
              {/* ============================================= */}
              {/* LEFT */}
              {/* ============================================= */}

              <div
                className="
                  p-6
                  sm:p-8
                  lg:p-12
                "
              >
                {/* Login Icon */}

                <div
                  className="
                    flex
                    justify-center
                    lg:justify-start
                  "
                >
                  <div
                    className="
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center
                      rounded-2xl
                      bg-gradient-to-br
                      from-cyan-50
                      to-blue-50
                      text-cyan-700
                      ring-8
                      ring-cyan-50/70
                    "
                  >
                    <LockKeyhole
                      className="h-7 w-7"
                    />
                  </div>
                </div>

                {/* Heading */}

                <div
                  className="
                    mt-7
                    text-center
                    lg:text-left
                  "
                >
                  <div
                    className="
                      mb-3
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      bg-cyan-50
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-cyan-700
                    "
                  >
                    <ShieldCheck
                      className="
                        h-3.5
                        w-3.5
                      "
                    />

                    Akses Akun Pelanggan
                  </div>

                  <h1
                    className="
                      text-3xl
                      font-extrabold
                      tracking-tight
                      text-slate-900
                      sm:text-4xl
                    "
                  >
                    Login Diperlukan
                  </h1>

                  <p
                    className="
                      mx-auto
                      mt-3
                      max-w-xl
                      text-sm
                      leading-6
                      text-slate-600
                      sm:text-base
                      lg:mx-0
                    "
                  >
                    Silakan masuk ke akun Anda
                    terlebih dahulu untuk
                    melanjutkan ke halaman yang
                    ingin Anda akses.
                  </p>
                </div>

                {/* ================================================= */}
                {/* CALLBACK INFORMATION */}
                {/* ================================================= */}

                <div
                  className="
                    mt-7
                    rounded-2xl
                    border
                    border-cyan-100
                    bg-gradient-to-r
                    from-cyan-50
                    to-blue-50
                    p-4
                    sm:p-5
                  "
                >
                  <div
                    className="
                      flex
                      gap-3
                    "
                  >
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-white
                        text-cyan-700
                        shadow-sm
                      "
                    >
                      <ArrowRight
                        className="h-5 w-5"
                      />
                    </div>

                    <div
                      className="
                        min-w-0
                      "
                    >
                      <p
                        className="
                          text-xs
                          font-medium
                          text-slate-500
                        "
                      >
                        Setelah login Anda
                        akan kembali ke:
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          font-bold
                          text-slate-900
                          sm:text-base
                        "
                      >
                        {pageName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ================================================= */}
                {/* ACTIONS */}
                {/* ================================================= */}

                <div className="mt-6 space-y-3">
                  <Link
                    href={loginUrl}
                    className="
                      group
                      flex
                      min-h-14
                      w-full
                      items-center
                      justify-center
                      gap-3
                      rounded-2xl
                      bg-cyan-600
                      px-5
                      py-3
                      text-sm
                      font-bold
                      text-white
                      shadow-lg
                      shadow-cyan-600/20
                      transition-all
                      duration-200
                      hover:bg-cyan-700
                      hover:shadow-xl
                      hover:shadow-cyan-600/25
                      active:scale-[0.99]
                      sm:text-base
                    "
                  >
                    <LockKeyhole
                      className="h-5 w-5"
                    />

                    <span>
                      Masuk ke Akun
                    </span>

                    <ArrowRight
                      className="
                        h-5
                        w-5
                        transition-transform
                        duration-200
                        group-hover:translate-x-1
                      "
                    />
                  </Link>

                  <Link
                    href={registerUrl}
                    className="
                      flex
                      min-h-14
                      w-full
                      items-center
                      justify-center
                      gap-3
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      text-slate-800
                      transition-all
                      duration-200
                      hover:border-cyan-300
                      hover:bg-cyan-50
                      hover:text-cyan-700
                      active:scale-[0.99]
                      sm:text-base
                    "
                  >
                    <UserRoundPlus
                      className="h-5 w-5"
                    />

                    <span>
                      Belum Punya Akun? Daftar
                    </span>
                  </Link>
                </div>

                {/* ================================================= */}
                {/* MOBILE BENEFITS */}
                {/* ================================================= */}

                <div
                  className="
                    mt-8
                    grid
                    grid-cols-3
                    gap-3
                    border-t
                    border-slate-100
                    pt-7
                    lg:hidden
                  "
                >
                  <Benefit
                    icon={
                      <ShieldCheck className="h-5 w-5" />
                    }
                    title="Aman"
                  />

                  <Benefit
                    icon={
                      <Fish className="h-5 w-5" />
                    }
                    title="Fresh"
                  />

                  <Benefit
                    icon={
                      <Truck className="h-5 w-5" />
                    }
                    title="Cepat"
                  />
                </div>

                {/* ================================================= */}
                {/* BACK */}
                {/* ================================================= */}

                <div
                  className="
                    mt-8
                    text-center
                    lg:text-left
                  "
                >
                  <Link
                    href="/"
                    className="
                      inline-flex
                      items-center
                      gap-2
                      text-sm
                      font-semibold
                      text-slate-600
                      transition
                      hover:text-cyan-700
                    "
                  >
                    <ArrowLeft
                      className="h-4 w-4"
                    />

                    Kembali ke Beranda
                  </Link>
                </div>
              </div>

              {/* ============================================= */}
              {/* RIGHT BENEFITS */}
              {/* ============================================= */}

              <aside
                className="
                  relative
                  hidden
                  overflow-hidden
                  bg-gradient-to-b
                  from-cyan-600
                  via-cyan-700
                  to-blue-800
                  p-8
                  text-white
                  lg:block
                "
              >
                <div
                  className="
                    absolute
                    -right-16
                    -top-16
                    h-48
                    w-48
                    rounded-full
                    bg-white/10
                  "
                />

                <div
                  className="
                    absolute
                    -bottom-20
                    -left-16
                    h-56
                    w-56
                    rounded-full
                    bg-white/10
                  "
                />

                <div
                  className="
                    relative
                    flex
                    h-full
                    flex-col
                  "
                >
                  <div>
                    <div
                      className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-2xl
                        bg-white/15
                      "
                    >
                      <Fish
                        className="h-6 w-6"
                      />
                    </div>

                    <h2
                      className="
                        mt-6
                        text-xl
                        font-bold
                      "
                    >
                      Segarnya sampai ke rumah
                    </h2>

                    <p
                      className="
                        mt-2
                        text-sm
                        leading-6
                        text-cyan-50
                      "
                    >
                      Nikmati seafood pilihan
                      dengan pengalaman
                      belanja yang aman dan
                      nyaman.
                    </p>
                  </div>

                  <div
                    className="
                      mt-10
                      space-y-5
                    "
                  >
                    <SideBenefit
                      icon={
                        <ShieldCheck
                          className="h-5 w-5"
                        />
                      }
                      title="Aman & Terpercaya"
                      description="Data akun Anda terlindungi."
                    />

                    <SideBenefit
                      icon={
                        <Fish
                          className="h-5 w-5"
                        />
                      }
                      title="Produk Segar"
                      description="Pilihan seafood berkualitas."
                    />

                    <SideBenefit
                      icon={
                        <Truck
                          className="h-5 w-5"
                        />
                      }
                      title="Pengiriman Cepat"
                      description="Pesanan diproses dengan cepat."
                    />
                  </div>

                  <div
                    className="
                      mt-auto
                      pt-10
                    "
                  >
                    <div
                      className="
                        rounded-2xl
                        border
                        border-white/15
                        bg-white/10
                        p-4
                      "
                    >
                      <p
                        className="
                          text-xs
                          leading-5
                          text-cyan-50
                        "
                      >
                        “Kesegaran hari ini,
                        kesehatan untuk keluarga.”
                      </p>

                      <p
                        className="
                          mt-2
                          text-xs
                          font-semibold
                          text-white
                        "
                      >
                        {storeName}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          {/* ================================================= */}
          {/* FOOTER TRUST */}
          {/* ================================================= */}

          <div
            className="
              mt-6
              text-center
            "
          >
            <p
              className="
                text-xs
                text-slate-400
                sm:text-sm
              "
            >
              Login Anda aman dan terlindungi.
            </p>

            <p
              className="
                mt-1
                text-xs
                text-slate-400
              "
            >
              {storeName} · Fresh Seafood
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * ============================================================
 * MOBILE BENEFIT
 * ============================================================
 */

function Benefit({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        text-center
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          bg-cyan-50
          text-cyan-700
        "
      >
        {icon}
      </div>

      <span
        className="
          mt-2
          text-xs
          font-semibold
          text-slate-700
        "
      >
        {title}
      </span>
    </div>
  );
}

/**
 * ============================================================
 * DESKTOP SIDE BENEFIT
 * ============================================================
 */

function SideBenefit({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-white/15
        "
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold">
          {title}
        </p>

        <p
          className="
            mt-1
            text-xs
            leading-5
            text-cyan-50
          "
        >
          {description}
        </p>
      </div>
    </div>
  );
}