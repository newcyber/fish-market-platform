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
 * Digunakan untuk:
 *
 * - Login
 * - Register
 * - Verify Email
 * - Forgot Password
 * - Reset Password
 *
 * ============================================================
 *
 * DESIGN:
 *
 * Desktop:
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ Header                                                  │
 * ├───────────────────────────────┬─────────────────────────┤
 * │                               │                         │
 * │       BRANDING AREA           │       AUTH CARD         │
 * │                               │                         │
 * │       Animated Ocean          │       Login             │
 * │       Wave Background         │       Register           │
 * │                               │       Verify             │
 * │                               │       Forgot             │
 * │                               │       Reset              │
 * │                               │                         │
 * └───────────────────────────────┴─────────────────────────┘
 *
 * Mobile:
 *
 * ┌───────────────────────────────┐
 * │ Header                        │
 * ├───────────────────────────────┤
 * │ Compact Branding              │
 * │                               │
 * │ Auth Card                     │
 * │                               │
 * │ Animated Ocean Waves          │
 * └───────────────────────────────┘
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

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <>
      {/* ======================================================
          AUTH ANIMATION STYLES
      ====================================================== */}

      <style>{`
        /* ====================================================
           OCEAN WAVE ANIMATION
        ==================================================== */

        @keyframes authWaveSlow {
          0% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(-3%, 0, 0);
          }

          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes authWaveMedium {
          0% {
            transform: translate3d(-2%, 0, 0);
          }

          50% {
            transform: translate3d(4%, -1%, 0);
          }

          100% {
            transform: translate3d(-2%, 0, 0);
          }
        }

        @keyframes authWaveFast {
          0% {
            transform: translate3d(3%, 0, 0);
          }

          50% {
            transform: translate3d(-4%, -1%, 0);
          }

          100% {
            transform: translate3d(3%, 0, 0);
          }
        }

        /* ====================================================
           OCEAN LIGHT
        ==================================================== */

        @keyframes authOceanLight {
          0% {
            transform:
              translate3d(-10%, 0, 0)
              scale(1);
            opacity: 0.25;
          }

          50% {
            transform:
              translate3d(10%, -3%, 0)
              scale(1.08);
            opacity: 0.45;
          }

          100% {
            transform:
              translate3d(-10%, 0, 0)
              scale(1);
            opacity: 0.25;
          }
        }

        /* ====================================================
           BUBBLES
        ==================================================== */

        @keyframes authBubbleOne {
          0% {
            transform:
              translate3d(0, 30px, 0)
              scale(0.85);
            opacity: 0;
          }

          15% {
            opacity: 0.35;
          }

          70% {
            opacity: 0.18;
          }

          100% {
            transform:
              translate3d(18px, -180px, 0)
              scale(1.1);
            opacity: 0;
          }
        }

        @keyframes authBubbleTwo {
          0% {
            transform:
              translate3d(0, 20px, 0)
              scale(0.75);
            opacity: 0;
          }

          20% {
            opacity: 0.28;
          }

          100% {
            transform:
              translate3d(-22px, -220px, 0)
              scale(1);
            opacity: 0;
          }
        }

        @keyframes authBubbleThree {
          0% {
            transform:
              translate3d(0, 20px, 0)
              scale(0.8);
            opacity: 0;
          }

          18% {
            opacity: 0.22;
          }

          100% {
            transform:
              translate3d(10px, -140px, 0)
              scale(1.05);
            opacity: 0;
          }
        }

        /* ====================================================
           FLOATING BRAND ICON
        ==================================================== */

        @keyframes authFloat {
          0% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0, -8px, 0);
          }

          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        /* ====================================================
           BRAND GLOW
        ==================================================== */

        @keyframes authGlow {
          0% {
            opacity: 0.3;
            transform: scale(0.95);
          }

          50% {
            opacity: 0.65;
            transform: scale(1.05);
          }

          100% {
            opacity: 0.3;
            transform: scale(0.95);
          }
        }

        /* ====================================================
           WAVE CLASSES
        ==================================================== */

        .auth-wave-slow {
          animation:
            authWaveSlow
            12s
            ease-in-out
            infinite;
          transform-origin: center;
          will-change: transform;
        }

        .auth-wave-medium {
          animation:
            authWaveMedium
            9s
            ease-in-out
            infinite;
          transform-origin: center;
          will-change: transform;
        }

        .auth-wave-fast {
          animation:
            authWaveFast
            7s
            ease-in-out
            infinite;
          transform-origin: center;
          will-change: transform;
        }

        .auth-ocean-light {
          animation:
            authOceanLight
            10s
            ease-in-out
            infinite;
          will-change: transform, opacity;
        }

        .auth-bubble-one {
          animation:
            authBubbleOne
            7s
            ease-in
            infinite;
        }

        .auth-bubble-two {
          animation:
            authBubbleTwo
            9s
            ease-in
            infinite;
          animation-delay: 2s;
        }

        .auth-bubble-three {
          animation:
            authBubbleThree
            8s
            ease-in
            infinite;
          animation-delay: 4s;
        }

        .auth-brand-float {
          animation:
            authFloat
            5s
            ease-in-out
            infinite;
          will-change: transform;
        }

        .auth-brand-glow {
          animation:
            authGlow
            5s
            ease-in-out
            infinite;
          will-change: transform, opacity;
        }

        /* ====================================================
           REDUCED MOTION
        ==================================================== */

        @media (prefers-reduced-motion: reduce) {
          .auth-wave-slow,
          .auth-wave-medium,
          .auth-wave-fast,
          .auth-ocean-light,
          .auth-bubble-one,
          .auth-bubble-two,
          .auth-bubble-three,
          .auth-brand-float,
          .auth-brand-glow {
            animation: none !important;
          }
        }

        /* ====================================================
           MOBILE PERFORMANCE
        ==================================================== */

        @media (max-width: 1023px) {
          .auth-wave-slow {
            animation-duration: 14s;
          }

          .auth-wave-medium {
            animation-duration: 11s;
          }

          .auth-wave-fast {
            animation-duration: 9s;
          }
        }
      `}</style>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main
        className="
          min-h-screen
          overflow-x-hidden
          bg-slate-100
        "
      >

        {/* ====================================================
            TOP HEADER
        ==================================================== */}

        <header
          className="
            relative
            z-50
            border-b
            border-slate-200/80
            bg-white
            shadow-sm
          "
        >
          <div
            className="
              mx-auto
              flex
              h-16
              w-full
              max-w-7xl
              items-center
              justify-between
              gap-4
              px-4
              sm:h-[72px]
              sm:px-6
              lg:px-8
            "
          >

            {/* ==================================================
                BRAND
            ================================================== */}

            <Link
              href="/"
              className="
                group
                flex
                min-w-0
                items-center
                gap-3
                rounded-xl
                outline-none
                transition-opacity
                duration-200
                hover:opacity-90
                focus-visible:ring-2
                focus-visible:ring-sky-500
                focus-visible:ring-offset-2
              "
            >

              {/* ==================================================
                  LOGO
              ================================================== */}

              <div
                className="
                  relative
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-xl
                  bg-sky-700
                  text-white
                  shadow-sm
                  ring-1
                  ring-sky-900/5
                  sm:h-11
                  sm:w-11
                "
              >
                {siteLogo ? (
                  <Image
                    src={siteLogo}
                    alt={`${storeName} Logo`}
                    fill
                    sizes="44px"
                    className="
                      bg-white
                      object-contain
                      p-1
                    "
                    priority
                  />
                ) : (
                  <span
                    className="
                      text-sm
                      font-bold
                    "
                  >
                    {storeInitial}
                  </span>
                )}
              </div>

              {/* ==================================================
                  STORE NAME
              ================================================== */}

              <div className="min-w-0">

                <div
                  className="
                    truncate
                    text-lg
                    font-semibold
                    tracking-tight
                    text-slate-900
                    sm:text-2xl
                  "
                >
                  {storeName}
                </div>

              </div>

            </Link>

            {/* ==================================================
                HELP
            ================================================== */}

            <Link
              href="https://wa.me/6287776414666"
              className="
                hidden
                min-h-11
                items-center
                gap-2
                rounded-xl
                px-3
                text-sm
                font-medium
                text-sky-700
                transition-all
                duration-200
                hover:bg-sky-50
                hover:text-sky-900
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-sky-500
                focus-visible:ring-offset-2
                sm:flex
                sm:min-h-0
              "
            >
              <CircleHelp
                className="
                  h-4
                  w-4
                  shrink-0
                "
              />

              <span>
                Butuh bantuan?
              </span>
            </Link>

          </div>
        </header>

        {/* ======================================================
            AUTH HERO
        ====================================================== */}

        <section
          className="
            relative
            isolate
            overflow-hidden
            bg-gradient-to-br
            from-sky-950
            via-sky-800
            to-blue-950
          "
        >

          {/* ==================================================
              OCEAN LIGHT
          ================================================== */}

          <div
            className="
              auth-ocean-light
              pointer-events-none
              absolute
              -left-32
              top-20
              h-96
              w-96
              rounded-full
              bg-cyan-300/20
              blur-3xl
            "
          />

          <div
            className="
              auth-ocean-light
              pointer-events-none
              absolute
              -right-32
              top-0
              h-[30rem]
              w-[30rem]
              rounded-full
              bg-blue-300/15
              blur-3xl
            "
            style={{
              animationDelay:
                "2s",
            }}
          />

          {/* ==================================================
              SUBTLE LIGHT RAYS
          ================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              h-72
              bg-gradient-to-b
              from-white/[0.07]
              to-transparent
            "
          />

          {/* ==================================================
              BUBBLES
          ================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              bottom-24
              left-[12%]
              h-3
              w-3
              rounded-full
              border
              border-white/30
              bg-white/10
              auth-bubble-one
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              bottom-20
              left-[28%]
              h-2
              w-2
              rounded-full
              border
              border-white/25
              bg-white/10
              auth-bubble-two
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              bottom-16
              right-[30%]
              h-4
              w-4
              rounded-full
              border
              border-white/25
              bg-white/10
              auth-bubble-three
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              bottom-28
              right-[12%]
              h-2
              w-2
              rounded-full
              border
              border-white/30
              bg-white/10
              auth-bubble-one
            "
            style={{
              animationDelay:
                "3s",
            }}
          />

          {/* ==================================================
              CONTENT
          ================================================== */}

          <div
            className="
              relative
              z-10
              mx-auto
              flex
              min-h-[calc(100vh-64px)]
              w-full
              max-w-7xl
              items-center
              px-4
              py-8
              sm:min-h-[calc(100vh-72px)]
              sm:px-6
              sm:py-12
              lg:px-8
              lg:py-16
            "
          >

            <div
              className="
                grid
                w-full
                items-center
                gap-8
                lg:grid-cols-[minmax(0,1fr)_400px]
                lg:gap-12
                xl:grid-cols-[minmax(0,1fr)_420px]
                xl:gap-16
              "
            >

              {/* =================================================
                  LEFT BRANDING
              ================================================= */}

              <div
                className="
                  hidden
                  justify-center
                  lg:flex
                "
              >

                <div
                  className="
                    relative
                    max-w-xl
                    text-center
                    text-white
                  "
                >

                  {/* =============================================
                      BRAND GLOW
                  ============================================= */}

                  <div
                    className="
                      auth-brand-glow
                      pointer-events-none
                      absolute
                      left-1/2
                      top-4
                      h-44
                      w-44
                      -translate-x-1/2
                      rounded-full
                      bg-cyan-300/20
                      blur-3xl
                    "
                  />

                  {/* =============================================
                      LOGO
                  ============================================= */}

                  <div
                    className="
                      auth-brand-float
                      relative
                      mx-auto
                      flex
                      h-32
                      w-32
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-[2rem]
                      border
                      border-white/20
                      bg-white/10
                      p-3
                      shadow-2xl
                      shadow-black/20
                      backdrop-blur-xl
                      xl:h-36
                      xl:w-36
                    "
                  >

                    <div
                      className="
                        relative
                        h-full
                        w-full
                        overflow-hidden
                        rounded-2xl
                        bg-white
                        shadow-inner
                      "
                    >
                      {siteLogo ? (
                        <Image
                          src={siteLogo}
                          alt={`${storeName} Logo`}
                          fill
                          sizes="136px"
                          className="
                            object-contain
                            p-2
                          "
                          priority
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-full
                            w-full
                            items-center
                            justify-center
                            text-4xl
                            font-bold
                            text-sky-800
                          "
                        >
                          {storeInitial}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* =============================================
                      BRAND NAME
                  ============================================= */}

                  <h1
                    className="
                      mt-7
                      text-4xl
                      font-bold
                      tracking-tight
                      drop-shadow-sm
                      sm:text-5xl
                      xl:mt-8
                      xl:text-6xl
                    "
                  >
                    {storeName}
                  </h1>

                  {/* =============================================
                      DESCRIPTION
                  ============================================= */}

                  <p
                    className="
                      mt-4
                      text-lg
                      font-medium
                      text-cyan-50
                      sm:text-xl
                      xl:text-2xl
                    "
                  >
                    {storeDescription}
                  </p>

                  {/* =============================================
                      DIVIDER
                  ============================================= */}

                  <div
                    className="
                      mx-auto
                      my-7
                      h-px
                      w-20
                      bg-gradient-to-r
                      from-transparent
                      via-white/50
                      to-transparent
                      xl:my-9
                    "
                  />

                  {/* =============================================
                      MAIN COPY
                  ============================================= */}

                  <h2
                    className="
                      text-2xl
                      font-bold
                      leading-tight
                      tracking-tight
                      sm:text-3xl
                    "
                  >
                    Belanja Seafood Segar
                    <br />
                    Lebih Mudah dan Terpercaya
                  </h2>

                  <p
                    className="
                      mx-auto
                      mt-5
                      max-w-lg
                      text-sm
                      leading-7
                      text-cyan-50/80
                      sm:text-base
                    "
                  >
                    Nikmati pengalaman berbelanja ikan
                    dan seafood segar dengan produk
                    berkualitas, proses pemesanan yang
                    praktis, dan layanan yang lebih mudah.
                  </p>

                  {/* =============================================
                      FEATURES
                  ============================================= */}

                  <div
                    className="
                      mt-8
                      grid
                      grid-cols-3
                      gap-3
                      sm:gap-4
                    "
                  >

                    <FeatureItem
                      icon={
                        <Fish
                          className="
                            h-5
                            w-5
                          "
                        />
                      }
                      label="Produk Segar"
                    />

                    <FeatureItem
                      icon={
                        <ShieldCheck
                          className="
                            h-5
                            w-5
                          "
                        />
                      }
                      label="Terpercaya"
                    />

                    <FeatureItem
                      icon={
                        <Truck
                          className="
                            h-5
                            w-5
                          "
                        />
                      }
                      label="Pengiriman"
                    />

                  </div>

                </div>

              </div>

              {/* =================================================
                  AUTH CARD
              ================================================= */}

              <div
                className="
                  flex
                  w-full
                  justify-center
                  lg:justify-end
                "
              >

                <AuthBrandingProvider
                  branding={{
                    storeName,
                    storeDescription,
                    siteLogo,
                    storeInitial,
                  }}
                >
                  <div
                    className="
                      w-full
                      max-w-md
                    "
                  >
                    {children}
                  </div>
                </AuthBrandingProvider>

              </div>

            </div>

          </div>

          {/* ==================================================
              MOBILE BRANDING
          ================================================== */}

          <div
            className="
              relative
              z-10
              border-t
              border-white/10
              bg-black/10
              px-4
              py-8
              backdrop-blur-sm
              lg:hidden
            "
          >

            <div
              className="
                mx-auto
                flex
                w-full
                max-w-md
                flex-col
                items-center
                text-center
              "
            >

              {/* ===============================================
                  MOBILE LOGO
              =============================================== */}

              <div
                className="
                  auth-brand-float
                  relative
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-2xl
                  border
                  border-white/20
                  bg-white/10
                  p-2
                  shadow-xl
                  backdrop-blur-xl
                "
              >

                <div
                  className="
                    relative
                    h-full
                    w-full
                    overflow-hidden
                    rounded-xl
                    bg-white
                  "
                >
                  {siteLogo ? (
                    <Image
                      src={siteLogo}
                      alt={`${storeName} Logo`}
                      fill
                      sizes="80px"
                      className="
                        object-contain
                        p-1.5
                      "
                    />
                  ) : (
                    <div
                      className="
                        flex
                        h-full
                        w-full
                        items-center
                        justify-center
                        text-xl
                        font-bold
                        text-sky-800
                      "
                    >
                      {storeInitial}
                    </div>
                  )}
                </div>

              </div>

              {/* ===============================================
                  MOBILE STORE NAME
              =============================================== */}

              <h1
                className="
                  mt-4
                  text-2xl
                  font-bold
                  tracking-tight
                  text-white
                "
              >
                {storeName}
              </h1>

              {/* ===============================================
                  MOBILE DESCRIPTION
              =============================================== */}

              <p
                className="
                  mt-1.5
                  text-sm
                  font-medium
                  text-cyan-100
                "
              >
                {storeDescription}
              </p>

              {/* ===============================================
                  MOBILE MESSAGE
              =============================================== */}

              <p
                className="
                  mt-4
                  max-w-sm
                  text-xs
                  leading-6
                  text-cyan-50/75
                "
              >
                Belanja seafood segar dengan
                mudah, praktis, dan terpercaya.
              </p>

              {/* ===============================================
                  MOBILE FEATURES
              =============================================== */}

              <div
                className="
                  mt-5
                  grid
                  w-full
                  grid-cols-3
                  gap-2
                "
              >

                <FeatureItem
                  icon={
                    <Fish
                      className="
                        h-4
                        w-4
                      "
                    />
                  }
                  label="Segar"
                />

                <FeatureItem
                  icon={
                    <ShieldCheck
                      className="
                        h-4
                        w-4
                      "
                    />
                  }
                  label="Terpercaya"
                />

                <FeatureItem
                  icon={
                    <Truck
                      className="
                        h-4
                        w-4
                      "
                    />
                  }
                  label="Kirim"
                />

              </div>

            </div>

          </div>

          {/* ==================================================
              OCEAN WAVES
          ================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              bottom-0
              left-0
              z-20
              h-32
              w-full
              overflow-hidden
              sm:h-36
            "
            aria-hidden="true"
          >

            {/* ================================================
                BACK WAVE
            ================================================ */}

            <svg
              className="
                auth-wave-slow
                absolute
                bottom-0
                left-[-8%]
                h-28
                w-[116%]
                min-w-[900px]
                sm:h-32
              "
              viewBox="0 0 1440 220"
              preserveAspectRatio="none"
            >
              <path
                d="
                  M0 110
                  C180 40 300 40 480 105
                  C660 170 780 175 960 105
                  C1140 35 1260 40 1440 105
                  L1440 220
                  L0 220
                  Z
                "
                fill="rgba(125,211,252,0.16)"
              />
            </svg>

            {/* ================================================
                MIDDLE WAVE
            ================================================ */}

            <svg
              className="
                auth-wave-medium
                absolute
                bottom-[-8px]
                left-[-10%]
                h-24
                w-[120%]
                min-w-[900px]
                sm:h-28
              "
              viewBox="0 0 1440 220"
              preserveAspectRatio="none"
            >
              <path
                d="
                  M0 125
                  C170 180 300 175 470 110
                  C640 45 780 45 950 115
                  C1120 185 1270 180 1440 115
                  L1440 220
                  L0 220
                  Z
                "
                fill="rgba(34,211,238,0.20)"
              />
            </svg>

            {/* ================================================
                FRONT WAVE
            ================================================ */}

            <svg
              className="
                auth-wave-fast
                absolute
                bottom-[-16px]
                left-[-12%]
                h-20
                w-[124%]
                min-w-[900px]
                sm:h-24
              "
              viewBox="0 0 1440 220"
              preserveAspectRatio="none"
            >
              <path
                d="
                  M0 135
                  C190 75 310 75 490 135
                  C670 195 800 195 980 130
                  C1160 65 1280 75 1440 135
                  L1440 220
                  L0 220
                  Z
                "
                fill="rgba(8,145,178,0.35)"
              />
            </svg>

            {/* ================================================
                FRONT FOAM
            ================================================ */}

            <div
              className="
                absolute
                bottom-8
                left-0
                h-px
                w-full
                bg-gradient-to-r
                from-transparent
                via-white/25
                to-transparent
              "
            />

          </div>

        </section>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer
          className="
            border-t
            border-slate-200
            bg-slate-50
          "
        >
          <div
            className="
              mx-auto
              flex
              min-h-16
              w-full
              max-w-7xl
              items-center
              justify-center
              px-4
              text-center
              text-xs
              text-slate-500
              sm:px-6
              lg:px-8
            "
          >
            <p>
              © {new Date().getFullYear()}{" "}
              {storeName}. Semua hak dilindungi.
            </p>
          </div>
        </footer>

      </main>
    </>
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
    <div
      className="
        flex
        min-w-0
        flex-col
        items-center
        gap-2
        rounded-xl
        border
        border-white/10
        bg-white/[0.06]
        px-2
        py-3
        backdrop-blur-md
        transition-all
        duration-300
        hover:border-white/20
        hover:bg-white/10
        sm:px-3
        sm:py-4
      "
    >

      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-white/10
          text-white
          ring-1
          ring-white/10
        "
      >
        {icon}
      </div>

      <span
        className="
          truncate
          text-[11px]
          font-medium
          text-cyan-50
          sm:text-xs
        "
      >
        {label}
      </span>

    </div>
  );
}