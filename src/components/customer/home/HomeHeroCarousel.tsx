"use client";

import Link from "next/link";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Fish,
  Package,
  Sparkles,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

/**
 * ============================================================
 * HOME HERO CAROUSEL
 * ============================================================
 *
 * Hero carousel untuk:
 *
 * - Guest homepage
 * - Customer homepage
 *
 * Visual:
 * Deep Ocean Navy + Ocean Blue + Fresh Green
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type HomeHeroCarouselProps = {
  productsHref: string;
};

type SlideTone =
  | "ocean"
  | "promo"
  | "fresh";

type HeroSlide = {
  eyebrow: string;

  title: string;

  highlight: string;

  description: string;

  button: string;

  icon: typeof Fish;

  tone: SlideTone;
};

/**
 * ============================================================
 * SLIDES
 * ============================================================
 */

const slides: HeroSlide[] = [
  {
    eyebrow: "PUSAT IKAN SEGAR",
    title: "Ikan Segar,",
    highlight: "Langsung untuk Keluarga.",
    description:
      "Belanja ikan dan seafood pilihan dengan lebih mudah dari satu tempat.",
    button: "Belanja Sekarang",
    icon: Fish,
    tone: "ocean",
  },
  {
    eyebrow: "PROMO PILIHAN",
    title: "Seafood Favorit,",
    highlight: "Harga Lebih Menarik.",
    description:
      "Temukan berbagai pilihan produk dan promo terbaik yang tersedia hari ini.",
    button: "Lihat Promo",
    icon: Zap,
    tone: "promo",
  },
  {
    eyebrow: "BELANJA LEBIH MUDAH",
    title: "Pilih Produk,",
    highlight: "Kami Siapkan Pesanan Anda.",
    description:
      "Nikmati pengalaman belanja seafood yang praktis, segar, dan nyaman.",
    button: "Lihat Produk",
    icon: Package,
    tone: "fresh",
  },
];

/**
 * ============================================================
 * HERO THEME
 * ============================================================
 */

function getHeroTheme(
  tone: SlideTone
) {
  switch (
    tone
  ) {
    case "promo":
      return {
        background:
          "from-[var(--ocean-900)] via-[var(--ocean-800)] to-[var(--ocean-700)]",

        highlight:
          "text-[var(--fresh-400)]",

        icon:
          "text-[var(--fresh-400)]",

        glow:
          "bg-[var(--fresh-400)]/15",

        button:
          "bg-[var(--fresh-500)] text-white hover:bg-[var(--fresh-600)]",
      };

    case "fresh":
      return {
        background:
          "from-[var(--ocean-950)] via-[var(--ocean-900)] to-[var(--ocean-800)]",

        highlight:
          "text-[var(--fresh-400)]",

        icon:
          "text-[var(--fresh-400)]",

        glow:
          "bg-[var(--fresh-400)]/15",

        button:
          "bg-white text-[var(--ocean-900)] hover:bg-[var(--ice-100)]",
      };

    case "ocean":
    default:
      return {
        background:
          "from-[var(--ocean-950)] via-[var(--ocean-900)] to-[var(--ocean-800)]",

        highlight:
          "text-[var(--fresh-400)]",

        icon:
          "text-[#b9d9f2]",

        glow:
          "bg-[#7bb5df]/15",

        button:
          "bg-white text-[var(--ocean-900)] hover:bg-[var(--ice-100)]",
      };
  }
}

/**
 * ============================================================
 * HOME HERO CAROUSEL
 * ============================================================
 */

export default function HomeHeroCarousel({
  productsHref,
}: HomeHeroCarouselProps) {
  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const activeSlide =
    slides[
      activeIndex
    ];

  const theme =
    getHeroTheme(
      activeSlide.tone
    );

  /**
   * ==========================================================
   * AUTO PLAY
   * ==========================================================
   */

  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          setActiveIndex(
            (current) =>
              current ===
              slides.length - 1
                ? 0
                : current + 1
          );
        },
        5000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, []);

  /**
   * ==========================================================
   * PREVIOUS
   * ==========================================================
   */

  function previousSlide() {
    setActiveIndex(
      (current) =>
        current === 0
          ? slides.length - 1
          : current - 1
    );
  }

  /**
   * ==========================================================
   * NEXT
   * ==========================================================
   */

  function nextSlide() {
    setActiveIndex(
      (current) =>
        current ===
        slides.length - 1
          ? 0
          : current + 1
    );
  }

  const Icon =
    activeSlide.icon;

  return (
    <section className="w-full bg-[var(--ice-100)] px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6">
      <div className="mx-auto max-w-7xl">

        <div
          className={[
            "relative overflow-hidden rounded-2xl bg-gradient-to-br text-white",
            "shadow-[0_14px_45px_rgba(11,36,61,0.16)]",
            "sm:rounded-3xl",
            theme.background,
          ].join(
            " "
          )}
        >

          {/* ================================================= */}
          {/* BACKGROUND DECORATION */}
          {/* ================================================= */}

          <div className="pointer-events-none absolute inset-0 overflow-hidden">

            <div
              className={[
                "absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl",
                theme.glow,
              ].join(
                " "
              )}
            />

            <div className="absolute -bottom-32 left-[20%] h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="absolute right-[16%] top-1/2 h-32 w-32 -translate-y-1/2 rounded-full border border-white/10" />

            <div className="absolute right-[9%] top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-white/[0.07]" />

            <div className="absolute right-[4%] top-1/2 h-80 w-80 -translate-y-1/2 rounded-full border border-white/[0.04]" />

          </div>

          {/* ================================================= */}
          {/* CONTENT */}
          {/* ================================================= */}

          <div className="relative grid min-h-[285px] items-center gap-6 px-5 py-7 sm:min-h-[340px] sm:px-10 sm:py-10 lg:min-h-[400px] lg:grid-cols-[1.15fr_0.85fr] lg:px-14 lg:py-12">

            {/* =============================================== */}
            {/* LEFT CONTENT */}
            {/* =============================================== */}

            <div
              key={
                activeIndex
              }
              className="animate-in fade-in slide-in-from-left-2 duration-500"
            >

              {/* EYEBROW */}

              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-[0.18em] text-white/90 backdrop-blur sm:text-xs">

                <Sparkles className="h-3.5 w-3.5 text-[var(--fresh-400)]" />

                {activeSlide.eyebrow}

              </div>

              {/* TITLE */}

              <h1 className="mt-4 max-w-xl text-[28px] font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl xl:text-[54px]">

                {activeSlide.title}

                <span
                  className={[
                    "mt-1 block",
                    theme.highlight,
                  ].join(
                    " "
                  )}
                >
                  {activeSlide.highlight}
                </span>

              </h1>

              {/* DESCRIPTION */}

              <p className="mt-4 max-w-lg text-sm leading-6 text-white/75 sm:mt-5 sm:text-base sm:leading-7">

                {activeSlide.description}

              </p>

              {/* CTA */}

              <Link
                href={
                  productsHref
                }
                className={[
                  "mt-5 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold",
                  "shadow-lg transition duration-200 active:scale-[0.98]",
                  "sm:mt-7 sm:h-12 sm:px-6 sm:hover:scale-[1.02]",
                  theme.button,
                ].join(
                  " "
                )}
              >

                {activeSlide.button}

                <ArrowRight className="h-4 w-4" />

              </Link>

            </div>

            {/* =============================================== */}
            {/* RIGHT VISUAL */}
            {/* =============================================== */}

            <div className="relative hidden min-h-[280px] items-center justify-center lg:flex">

              <div className="absolute h-72 w-72 rounded-full bg-white/[0.04]" />

              <div className="absolute h-56 w-56 rounded-full border border-white/[0.08]" />

              <div className="absolute h-40 w-40 rounded-full border border-white/[0.12]" />

              <div
                key={`icon-${activeIndex}`}
                className="relative flex h-44 w-44 items-center justify-center rounded-[2.75rem] border border-white/15 bg-white/[0.08] shadow-2xl backdrop-blur animate-in zoom-in-95 duration-500"
              >

                <Icon
                  className={[
                    "h-24 w-24",
                    theme.icon,
                  ].join(
                    " "
                  )}
                />

              </div>

              <div className="absolute bottom-3 right-5 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-xs font-medium text-white/80 backdrop-blur">

                Segar

                <span className="mx-1.5 text-[var(--fresh-400)]">
                  •
                </span>

                Praktis

                <span className="mx-1.5 text-[var(--fresh-400)]">
                  •
                </span>

                Terpercaya

              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* PREVIOUS */}
          {/* ================================================= */}

          <button
            type="button"
            onClick={
              previousSlide
            }
            aria-label="Banner sebelumnya"
            className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/20 text-white backdrop-blur transition hover:bg-white/15 lg:flex"
          >

            <ChevronLeft className="h-5 w-5" />

          </button>

          {/* ================================================= */}
          {/* NEXT */}
          {/* ================================================= */}

          <button
            type="button"
            onClick={
              nextSlide
            }
            aria-label="Banner berikutnya"
            className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/20 text-white backdrop-blur transition hover:bg-white/15 lg:flex"
          >

            <ChevronRight className="h-5 w-5" />

          </button>

          {/* ================================================= */}
          {/* INDICATORS */}
          {/* ================================================= */}

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-5">

            {slides.map(
              (
                _,
                index
              ) => (
                <button
                  key={
                    index
                  }
                  type="button"
                  onClick={() =>
                    setActiveIndex(
                      index
                    )
                  }
                  aria-label={`Tampilkan banner ${
                    index + 1
                  }`}
                  className={[
                    "h-1.5 rounded-full transition-all duration-300",
                    activeIndex ===
                    index
                      ? "w-7 bg-[var(--fresh-400)]"
                      : "w-1.5 bg-white/35 hover:bg-white/70",
                  ].join(
                    " "
                  )}
                />
              )
            )}

          </div>

        </div>

      </div>
    </section>
  );
}