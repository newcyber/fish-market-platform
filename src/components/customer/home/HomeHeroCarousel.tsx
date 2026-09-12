"use client";

import Image from "next/image";
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
 * Fokus V4:
 * - lebih compact di mobile
 * - lebih compact di desktop
 * - image tetap menjadi focal point
 * - CTA, autoplay, arrow, dan indicator tetap dipertahankan
 * - tidak mengubah sumber data hero
 *
 * ============================================================
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type HomeHeroCarouselProps = {
  productsHref: string;

  heroImages?: {
    slide1?: string | null;
    slide2?: string | null;
    slide3?: string | null;
  };

  heroContent?: {
    slide1?: {
      eyebrow?: string | null;
      title?: string | null;
      highlight?: string | null;
      description?: string | null;
      button?: string | null;
    };
    slide2?: {
      eyebrow?: string | null;
      title?: string | null;
      highlight?: string | null;
      description?: string | null;
      button?: string | null;
    };
    slide3?: {
      eyebrow?: string | null;
      title?: string | null;
      highlight?: string | null;
      description?: string | null;
      button?: string | null;
    };
  };
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
  image?: string | null;
  tone: SlideTone;
};

/**
 * ============================================================
 * HERO THEME
 * ============================================================
 */

function getHeroTheme(
  tone: SlideTone
) {
  switch (tone) {
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
  heroImages,
  heroContent,
}: HomeHeroCarouselProps) {
  const slides: HeroSlide[] = [
{
  eyebrow:
    heroContent?.slide1?.eyebrow ||
    "PUSAT IKAN SEGAR",

  title:
    heroContent?.slide1?.title ||
    "Ikan Segar,",

  highlight:
    heroContent?.slide1?.highlight ||
    "Langsung untuk Keluarga.",

  description:
    heroContent?.slide1?.description ||
    "Belanja ikan dan seafood pilihan dengan lebih mudah dari satu tempat.",

  button:
    heroContent?.slide1?.button ||
    "Belanja Sekarang",

  icon:
    Fish,

  image:
    heroImages?.slide1 ?? null,

  tone:
    "ocean",
},

{
  eyebrow:
    heroContent?.slide2?.eyebrow ||
    "PROMO PILIHAN",

  title:
    heroContent?.slide2?.title ||
    "Seafood Favorit,",

  highlight:
    heroContent?.slide2?.highlight ||
    "Harga Lebih Menarik.",

  description:
    heroContent?.slide2?.description ||
    "Temukan berbagai pilihan produk dan promo terbaik yang tersedia hari ini.",

  button:
    heroContent?.slide2?.button ||
    "Lihat Promo",

  icon:
    Zap,

  image:
    heroImages?.slide2 ?? null,

  tone:
    "promo",
},

{
  eyebrow:
    heroContent?.slide3?.eyebrow ||
    "BELANJA LEBIH MUDAH",

  title:
    heroContent?.slide3?.title ||
    "Pilih Produk,",

  highlight:
    heroContent?.slide3?.highlight ||
    "Kami Siapkan Pesanan Anda.",

  description:
    heroContent?.slide3?.description ||
    "Nikmati pengalaman belanja seafood yang praktis, segar, dan nyaman.",

  button:
    heroContent?.slide3?.button ||
    "Lihat Produk",

  icon:
    Package,

  image:
    heroImages?.slide3 ?? null,

  tone:
    "fresh",
},
  ];

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const activeSlide =
    slides[activeIndex];

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
  }, [slides.length]);

  /**
   * ==========================================================
   * PREVIOUS / NEXT
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
    <section
      className="
        w-full
        bg-(--ice-100)
        px-3
        py-3
        sm:px-6
        sm:py-4
        lg:px-8
        lg:py-5
      "
    >
      <div
        className="
          mx-auto
          max-w-7xl
        "
      >
        <div
          className={[
            "relative overflow-hidden rounded-2xl bg-linear-to-br text-white",
            "shadow-[0_10px_35px_rgba(11,36,61,0.14)]",
            "sm:rounded-3xl",
            theme.background,
          ].join(" ")}
        >
          {/* =================================================
              BACKGROUND DECORATION
          ================================================= */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              overflow-hidden
            "
            aria-hidden="true"
          >
            <div
              className={[
                "absolute -right-20 -top-24 h-56 w-56 rounded-full blur-3xl",
                theme.glow,
              ].join(" ")}
            />

            <div
              className="
                absolute
                -bottom-32
                left-[20%]
                h-64
                w-64
                rounded-full
                bg-white/5
                blur-3xl
              "
            />

            <div
              className="
                absolute
                right-[10%]
                top-1/2
                h-48
                w-48
                -translate-y-1/2
                rounded-full
                border
                border-white/10
              "
            />

            <div
              className="
                absolute
                right-[4%]
                top-1/2
                h-64
                w-64
                -translate-y-1/2
                rounded-full
                border
                border-white/[0.06]
              "
            />
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

<div
  className="
    relative
    grid
    min-h-[205px]
    items-center
    overflow-hidden
    px-5
    py-5

    sm:min-h-[245px]
    sm:px-8
    sm:py-7

    lg:min-h-[350px]
    lg:grid-cols-[1.08fr_0.92fr]
    lg:px-10
    lg:py-8

    xl:min-h-[370px]
    xl:px-12
  "
>
            {/* =================================================
                MOBILE HERO IMAGE
            ================================================= */}

            {activeSlide.image ? (
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  z-0
                  overflow-hidden
                  lg:hidden
                "
                aria-hidden="true"
              >
                <div
                  className="
                    absolute
                    -bottom-16
                    -right-12
                    h-64
                    w-64
                    rounded-full
                    bg-(--fresh-400)/10
                    blur-3xl
                  "
                />

                <div
                  className="
                    absolute
                    -bottom-10
                    -right-8
                    flex
                    h-[285px]
                    w-[285px]
                    items-center
                    justify-center
                    opacity-[0.30]
                    animate-[heroFloat_6s_ease-in-out_infinite]
                    will-change-transform
                    motion-reduce:animate-none
                  "
                >
                  <Image
                    key={`mobile-${activeSlide.image}`}
                    src={activeSlide.image}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="285px"
                    unoptimized
                    className="
                      h-full
                      w-full
                      max-w-none
                      object-contain
                      drop-shadow-2xl
                      animate-in
                      fade-in
                      zoom-in-95
                      duration-700
                    "
                  />
                </div>
              </div>
            ) : null}

            {/* =================================================
                LEFT CONTENT
            ================================================= */}

            <div
              key={activeIndex}
              className="
                relative
                z-20
                max-w-2xl
                animate-in
                fade-in
                slide-in-from-left-2
                duration-500
              "
            >
              {/* EYEBROW */}

              <div
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-white/15
                  bg-white/10
                  px-2.5
                  py-1
                  text-[9px]
                  font-black
                  tracking-[0.16em]
                  text-white/90
                  backdrop-blur
                  sm:gap-2
                  sm:px-3
                  sm:py-1.5
                  sm:text-[10px]
                "
              >
                <Sparkles
                  aria-hidden="true"
                  className="
                    h-3
                    w-3
                    text-(--fresh-400)
                    sm:h-3.5
                    sm:w-3.5
                  "
                />

                {activeSlide.eyebrow}
              </div>

              {/* TITLE */}

              <h2
                className="
                  mt-3
                  max-w-xl
                  text-[25px]
                  font-black
                  leading-[1.04]
                  tracking-tight

                  sm:mt-4
                  sm:text-4xl

                  lg:text-[42px]
                  xl:text-[46px]
                "
              >
                {activeSlide.title}

                <span
                  className={[
                    "mt-1 block",
                    theme.highlight,
                  ].join(" ")}
                >
                  {activeSlide.highlight}
                </span>
              </h2>

              {/* DESCRIPTION */}

              <p
                className="
                  mt-3
                  max-w-lg
                  text-xs
                  leading-5
                  text-white/80

                  sm:mt-4
                  sm:text-sm
                  sm:leading-6

                  lg:max-w-xl
                  lg:text-[15px]
                  lg:leading-6
                "
              >
                {activeSlide.description}
              </p>

              {/* CTA */}

              <Link
                href={productsHref}
                className={`
                  mt-4
                  inline-flex
                  h-9
                  items-center
                  gap-1.5
                  rounded-full
                  px-4
                  text-xs
                  font-bold
                  shadow-lg
                  transition
                  duration-200
                  active:scale-[0.98]

                  sm:mt-5
                  sm:h-10
                  sm:px-5
                  sm:text-sm

                  lg:mt-5

                  ${theme.button}
                `}
              >
                {activeSlide.button}

                <ArrowRight
                  aria-hidden="true"
                  className="
                    h-3.5
                    w-3.5
                    sm:h-4
                    sm:w-4
                  "
                />
              </Link>
            </div>

            {/* =================================================
                DESKTOP RIGHT VISUAL
            ================================================= */}

            <div
              className="
                relative
                hidden
                min-h-[270px]
                items-center
                justify-center
                lg:flex
              "
            >
              <div
                className="
                  absolute
                  h-56
                  w-56
                  rounded-full
                  bg-white/4
                "
              />

              <div
                className="
                  absolute
                  h-44
                  w-44
                  rounded-full
                  border
                  border-white/8
                "
              />

              <div
                className="
                  absolute
                  h-32
                  w-32
                  rounded-full
                  border
                  border-white/12
                "
              />

              {activeSlide.image ? (
                <div
                  key={`desktop-${activeSlide.image}`}
                  className="
                    relative
                    z-10
                    flex
                    items-center
                    justify-center
                    animate-[heroFloat_6s_ease-in-out_infinite]
                    will-change-transform
                    motion-reduce:animate-none
                  "
                >
<Image
  src={activeSlide.image}
  alt={activeSlide.title}
  width={480}
  height={480}
  unoptimized
  className="
    h-auto
    w-[92%]
    max-w-[420px]
    object-contain
    drop-shadow-2xl
    animate-in
    fade-in
    zoom-in-95
    duration-700

    xl:w-[96%]
    xl:max-w-[470px]
  "
/>
                </div>
              ) : (
                <div
                  key={`icon-${activeIndex}`}
                  className="
                    relative
                    z-10
                    flex
                    h-36
                    w-36
                    items-center
                    justify-center
                    rounded-[2.25rem]
                    border
                    border-white/15
                    bg-white/8
                    shadow-2xl
                    backdrop-blur
                    animate-in
                    zoom-in-95
                    duration-500
                  "
                >
                  <Icon
                    aria-hidden="true"
                    className={[
                      "h-20 w-20",
                      theme.icon,
                    ].join(" ")}
                  />
                </div>
              )}

              {/* FLOATING INFO */}

              <div
                className="
                  absolute
                  bottom-1
                  right-2
                  z-20
                  rounded-xl
                  border
                  border-white/10
                  bg-slate-950/20
                  px-3
                  py-2
                  text-[10px]
                  font-medium
                  text-white/80
                  backdrop-blur

                  xl:bottom-2
                  xl:right-4
                  xl:px-4
                  xl:py-2.5
                  xl:text-xs
                "
              >
                Segar

                <span
                  className="
                    mx-1
                    text-(--fresh-400)
                    xl:mx-1.5
                  "
                >
                  •
                </span>

                Praktis

                <span
                  className="
                    mx-1
                    text-(--fresh-400)
                    xl:mx-1.5
                  "
                >
                  •
                </span>

                Terpercaya
              </div>
            </div>
          </div>

          {/* =================================================
              PREVIOUS
          ================================================= */}

          <button
            type="button"
            onClick={previousSlide}
            aria-label="Banner sebelumnya"
            className="
              absolute
              left-3
              top-1/2
              hidden
              h-9
              w-9
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-white/15
              bg-slate-950/20
              text-white
              backdrop-blur
              transition
              hover:bg-white/15
              lg:flex
            "
          >
            <ChevronLeft
              aria-hidden="true"
              className="h-4.5 w-4.5"
            />
          </button>

          {/* =================================================
              NEXT
          ================================================= */}

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Banner berikutnya"
            className="
              absolute
              right-3
              top-1/2
              hidden
              h-9
              w-9
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-white/15
              bg-slate-950/20
              text-white
              backdrop-blur
              transition
              hover:bg-white/15
              lg:flex
            "
          >
            <ChevronRight
              aria-hidden="true"
              className="h-4.5 w-4.5"
            />
          </button>

          {/* =================================================
              INDICATORS
          ================================================= */}

          <div
            className="
              absolute
              bottom-2.5
              left-1/2
              flex
              -translate-x-1/2
              gap-1.5
              sm:bottom-3.5
            "
          >
            {slides.map(
              (
                _,
                index
              ) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    setActiveIndex(index)
                  }
                  aria-label={`Tampilkan banner ${index + 1}`}
                  aria-current={
                    activeIndex === index
                      ? "true"
                      : undefined
                  }
                  className={[
                    "h-1.5 rounded-full transition-all duration-300",
                    activeIndex === index
                      ? "w-6 bg-(--fresh-400)"
                      : "w-1.5 bg-white/35 hover:bg-white/70",
                  ].join(" ")}
                />
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
