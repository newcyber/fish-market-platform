"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  CircleHelp,
  FileText,
  LockKeyhole,
  Newspaper,
} from "lucide-react";
import { useEffect, useState } from "react";

interface MobileLoginLandingProps {
  storeName: string;
  storeDescription: string;
  siteLogo: string | null;
  storeInitial: string;
  onLogin: () => void;
}

const HERO_IMAGES = [
  {
    src: "/images/auth/slide1.webp",
    alt: "Ikan segar Pisjo Market",
  },
  {
    src: "/images/auth/slide2.webp",
    alt: "Seafood segar Pisjo Market",
  },
  {
    src: "/images/auth/slide3.webp",
    alt: "Produk seafood Pisjo Market",
  },
  {
    src: "/images/auth/slide4.webp",
    alt: "Hasil laut segar Pisjo Market",
  },
];

const MENU_ITEMS = [
  {
    label: "Beranda",
    href: "/",
    icon: Newspaper,
  },
  {
    label: "Kebijakan Privasi",
    href: "/privacy-policy",
    icon: LockKeyhole,
  },
  {
    label: "Syarat dan Ketentuan",
    href: "/terms-and-conditions",
    icon: FileText,
  },
  {
    label: "Bantuan",
    href: "/help",
    icon: CircleHelp,
  },
];

export default function MobileLoginLanding({
  storeName,
  storeDescription,
  siteLogo,
  storeInitial,
  onLogin,
}: MobileLoginLandingProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (
        current + 1
      ) % HERO_IMAGES.length);
    }, 5500);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div
      className="
        flex
        min-h-svh
        flex-col
        bg-white
        text-slate-900
      "
    >
      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        className="
          relative
          h-107.5
          w-full
          overflow-hidden
          bg-slate-900
        "
      >
        {/* IMAGES */}

        {HERO_IMAGES.map((image, index) => (
          <div
            key={image.src}
            className={`
              absolute
              inset-0
              transition-opacity
              duration-1000
              ${
                index === activeIndex
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="100vw"
              priority={index === 0}
              className="object-cover"
            />
          </div>
        ))}

        {/* DARK GRADIENT */}

        <div
          className="
            absolute
            inset-0
            bg-linear-to-b
            from-black/10
            via-black/25
            to-black/75
          "
        />

        {/* CONTENT */}

        <div
          className="
            relative
            z-10
            flex
            h-full
            flex-col
            items-center
            justify-end
            px-5
            pb-6
            text-center
          "
        >
          {/* LOGO */}

          <div
            className="
              relative
              mb-3
              flex
              h-16
              w-16
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              border
              border-white/30
              bg-white/95
              shadow-xl
            "
          >
            {siteLogo ? (
              <Image
                src={siteLogo}
                alt={`${storeName} Logo`}
                fill
                sizes="64px"
                className="object-contain p-1.5"
              />
            ) : (
              <span
                className="
                  text-lg
                  font-bold
                  text-sky-700
                "
              >
                {storeInitial}
              </span>
            )}
          </div>

          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-white
              drop-shadow-lg
            "
          >
            {storeName}
          </h1>

          <p
            className="
              mt-1.5
              max-w-sm
              text-sm
              font-medium
              leading-5
              text-white/90
              drop-shadow
            "
          >
            {storeDescription}
          </p>

          <p
            className="
              mt-2
              max-w-sm
              text-xs
              leading-5
              text-white/80
            "
          >
            Ikan segar langsung dari sumber
            terpercaya, mudah dan praktis.
          </p>

          {/* INDICATORS */}

          <div className="mt-4 flex items-center gap-1.5">
            {HERO_IMAGES.map((image, index) => (
              <span
                key={image.src}
                className={`
                  h-1.5
                  rounded-full
                  transition-all
                  duration-300
                  ${
                    index === activeIndex
                      ? "w-5 bg-white"
                      : "w-1.5 bg-white/50"
                  }
                `}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}

      <section className="px-4 py-4">
        <div className="mx-auto flex w-full max-w-md gap-3">
          <Link
            href="/register"
            className="
              flex
              h-12
              flex-1
              items-center
              justify-center
              rounded-full
              border
              border-sky-700
              bg-white
              px-4
              text-sm
              font-bold
              text-sky-700
              shadow-sm
              transition
              active:scale-[0.98]
            "
          >
            Daftar
          </Link>

          <button
            type="button"
            onClick={onLogin}
            className="
              flex
              h-12
              flex-1
              items-center
              justify-center
              rounded-full
              bg-sky-700
              px-4
              text-sm
              font-bold
              text-white
              shadow-md
              transition
              active:scale-[0.98]
            "
          >
            Masuk
          </button>
        </div>
      </section>

      {/* =====================================================
          MENU
      ====================================================== */}

      <section className="px-4">
        <div
          className="
            mx-auto
            w-full
            max-w-md
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
          "
        >
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex
                  min-h-14
                  items-center
                  gap-3
                  px-4
                  transition
                  active:bg-slate-50
                  ${
                    index !== MENU_ITEMS.length - 1
                      ? "border-b border-slate-200"
                      : ""
                  }
                `}
              >
                <Icon
                  className="
                    h-5
                    w-5
                    shrink-0
                    text-slate-500
                  "
                />

                <span
                  className="
                    flex-1
                    text-left
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  {item.label}
                </span>

                <ChevronRight
                  className="
                    h-5
                    w-5
                    shrink-0
                    text-slate-400
                  "
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer
        className="
          mt-auto
          px-4
          pb-[calc(1.5rem+env(safe-area-inset-bottom))]
          pt-6
          text-center
        "
      >
        <div
          className="
            flex
            items-center
            justify-center
            gap-1.5
            text-xs
            font-semibold
            text-slate-500
          "
        >
          <span>{storeName}</span>

          <ArrowRight className="h-3 w-3 -rotate-45" />

          <span>Fresh Seafood Market</span>
        </div>

        <p
          className="
            mt-1
            text-[11px]
            text-slate-400
          "
        >
          Belanja seafood segar dengan
          mudah dan terpercaya.
        </p>
      </footer>
    </div>
  );
}