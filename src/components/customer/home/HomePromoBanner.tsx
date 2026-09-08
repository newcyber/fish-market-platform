import Link from "next/link";
import {
  ArrowRight,
  Fish,
  PackageCheck,
  Sparkles,
} from "lucide-react";

import Image from "next/image";

/**
 * ============================================================
 * HOME PROMO BANNER
 * ============================================================
 *
 * Promo statis homepage.
 *
 * Mobile:
 * - horizontal scroll
 * - card compact agar homepage tidak terlalu panjang
 *
 * Desktop:
 * - 2 kolom
 *
 * Routing promo dapat dikonfigurasi melalui Admin Settings.
 * Jika URL tidak diatur, promo akan menggunakan productsHref
 * sebagai fallback.
 *
 * ============================================================
 */

type PromoCardContent = {
  image: string | null;
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  button: string | null;
  href: string | null;
};

type HomePromoBannerProps = {
  productsHref: string;

  promoContent: {
    sectionLabel: string | null;
    sectionTitle: string | null;
    sectionLinkLabel: string | null;
    sectionLinkHref: string | null;

    card1: PromoCardContent;
    card2: PromoCardContent;
  };
};

const DEFAULT_PROMO = {
  sectionLabel: "PROMO PILIHAN",
  sectionTitle: "Belanja Lebih Hemat",
  sectionLinkLabel: "Lihat Produk",

  card1: {
    eyebrow: "PROMO PILIHAN",
    title: "Seafood Segar untuk Kebutuhan Anda",
    description:
      "Temukan berbagai pilihan ikan dan seafood segar untuk kebutuhan keluarga Anda.",
    button: "Lihat Produk",
  },

  card2: {
    eyebrow: "BELANJA PRAKTIS",
    title: "Belanja Seafood Lebih Praktis",
    description:
      "Pilih produk favorit Anda dan siapkan pesanan dengan lebih mudah dari satu tempat.",
    button: "Mulai Belanja",
  },
};

type PromoCardProps = {
  href: string;
  variant: "ocean" | "fresh";
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  icon: typeof Fish;
  image: string | null;
};

function PromoCard({
  href,
  variant,
  eyebrow,
  title,
  description,
  cta,
  icon: Icon,
  image,
}: PromoCardProps) {
  const isOcean = variant === "ocean";

  return (
    <Link
      href={href}
      className={[
        "group relative block h-[198px] w-[calc(100vw-32px)] shrink-0 snap-center overflow-hidden rounded-3xl text-white",
        "shadow-[0_8px_24px_rgba(18,58,99,0.12)]",
        "transition duration-300 active:scale-[0.99]",
        "sm:h-[220px] sm:w-auto",
        "lg:h-[250px] lg:hover:-translate-y-1",
        isOcean
          ? "bg-gradient-to-br from-[var(--ocean-950)] via-[var(--ocean-900)] to-[var(--ocean-700)]"
          : "bg-gradient-to-br from-[var(--fresh-700)] via-[var(--fresh-600)] to-[var(--fresh-500)]",
      ].join(" ")}
    >
      {/* ====================================================
          BACKGROUND DECORATION
      ==================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className={[
            "absolute -right-20 -top-20 h-48 w-48 rounded-full border",
            isOcean
              ? "border-white/[0.08]"
              : "border-white/[0.12]",
          ].join(" ")}
        />

        <div
          className={[
            "absolute -bottom-28 right-16 h-56 w-56 rounded-full border",
            isOcean
              ? "border-white/[0.05]"
              : "border-white/[0.08]",
          ].join(" ")}
        />

        <div
          className={[
            "absolute right-20 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full blur-3xl",
            isOcean
              ? "bg-[var(--fresh-400)]/[0.08]"
              : "bg-white/[0.07]",
          ].join(" ")}
        />
      </div>

      {/* ====================================================
          VISUAL AREA
      ==================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-2
          top-1/2
          z-[1]
          h-[82%]
          w-[44%]
          -translate-y-1/2
          sm:right-4
          sm:w-[43%]
          lg:right-5
          lg:h-[92%]
          lg:w-[46%]
        "
      >
        {/* Soft visual panel */}
        <div
          className="
            absolute
            inset-y-[8%]
            right-0
            w-[82%]
            rounded-[2rem]
            border
            border-white/[0.10]
            bg-white/[0.06]
            backdrop-blur-[2px]
          "
        />

        {/* Admin image */}
        {image && (
          <div
            className="
              absolute
              inset-0
              z-[2]
            "
          >
            <Image
              src={image}
              alt=""
              fill
              sizes="
                (max-width: 640px) 180px,
                (max-width: 1024px) 260px,
                360px
              "
              className="
                object-contain
                object-center
                drop-shadow-[0_14px_20px_rgba(0,0,0,0.14)]
              "
              unoptimized
            />
          </div>
        )}

        {/* Decorative icon */}
        <div
          className="
            absolute
            bottom-1
            right-1
            z-[3]
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            border
            border-white/[0.12]
            bg-white/[0.08]
            text-[var(--fresh-400)]
            backdrop-blur-md
            transition
            duration-300
            group-hover:scale-105
            sm:bottom-2
            sm:right-2
            sm:h-14
            sm:w-14
            lg:h-16
            lg:w-16
            lg:rounded-2xl
          "
        >
          <Icon
            className="
              h-6
              w-6
              sm:h-7
              sm:w-7
              lg:h-8
              lg:w-8
            "
          />
        </div>
      </div>

      {/* ====================================================
          CONTENT
      ==================================================== */}
{/* ====================================================
    CONTENT
==================================================== */}
<div
  className="
    relative
    z-10
    flex
    h-full
    w-full
    flex-col
    px-5
    py-5
    pb-4
    sm:px-6
    sm:py-6
    sm:pb-5
    lg:w-[56%]
    lg:px-7
    lg:py-7
    lg:pb-7
  "
>
  {/* Eyebrow */}
  <div
    className="
      inline-flex
      w-fit
      max-w-full
      shrink-0
      items-center
      gap-1.5
      rounded-full
      border
      border-white/15
      bg-white/[0.09]
      px-2.5
      py-1
      text-[9px]
      font-black
      tracking-[0.14em]
      text-[var(--fresh-400)]
      backdrop-blur
      sm:px-3
      sm:py-1.5
      sm:text-[10px]
    "
  >
    <Sparkles
      aria-hidden="true"
      className="h-3 w-3 shrink-0"
    />

    <span className="truncate">
      {eyebrow}
    </span>
  </div>

  {/* Title */}
  <h3
    className="
      mt-3
      max-w-[250px]
      shrink-0
      line-clamp-2
      text-xl
      font-black
      leading-[1.08]
      tracking-tight
      sm:mt-4
      sm:max-w-[290px]
      sm:text-2xl
      lg:mt-4
      lg:max-w-[350px]
      lg:text-[28px]
      lg:leading-[1.08]
    "
  >
    {title}
  </h3>

  {/* Description */}
  <p
    className="
      mt-2
      max-w-[250px]
      shrink-0
      line-clamp-2
      text-[11px]
      leading-4
      text-white/75
      sm:max-w-[300px]
      sm:text-xs
      sm:leading-5
      lg:mt-3
      lg:max-w-[350px]
      lg:text-sm
      lg:leading-5
    "
  >
    {description}
  </p>

  {/* CTA */}
  <div
    className="
      mt-auto
      inline-flex
      w-fit
      shrink-0
      items-center
      gap-1.5
      pt-3
      text-[11px]
      font-bold
      sm:pt-4
      sm:text-xs
      lg:pt-4
      lg:text-sm
    "
  >
    <span
      className={[
        "rounded-full px-3.5 py-2 shadow-sm transition",
        isOcean
          ? "bg-[var(--fresh-500)] text-white group-hover:bg-[var(--fresh-600)]"
          : "bg-white text-[var(--fresh-700)] group-hover:bg-[var(--ice-100)]",
      ].join(" ")}
    >
      {cta}
    </span>

    <ArrowRight
      aria-hidden="true"
      className="
        h-4
        w-4
        transition-transform
        duration-200
        group-hover:translate-x-1
      "
    />
  </div>
</div>
    </Link>
  );
}

export default function HomePromoBanner({
  productsHref,
  promoContent,
}: HomePromoBannerProps) {

  const sectionLabel =
    promoContent.sectionLabel?.trim() ||
    DEFAULT_PROMO.sectionLabel;

  const sectionTitle =
    promoContent.sectionTitle?.trim() ||
    DEFAULT_PROMO.sectionTitle;

  const sectionLinkLabel =
    promoContent.sectionLinkLabel?.trim() ||
    DEFAULT_PROMO.sectionLinkLabel;

  const sectionLinkHref =
    promoContent.sectionLinkHref?.trim() ||
    productsHref;

  const card1 = {
    image: promoContent.card1.image,
    eyebrow:
      promoContent.card1.eyebrow?.trim() ||
      DEFAULT_PROMO.card1.eyebrow,

    title:
      promoContent.card1.title?.trim() ||
      DEFAULT_PROMO.card1.title,

    description:
      promoContent.card1.description?.trim() ||
      DEFAULT_PROMO.card1.description,

    button:
      promoContent.card1.button?.trim() ||
      DEFAULT_PROMO.card1.button,

    href:
      promoContent.card1.href?.trim() ||
      productsHref,
  };

  const card2 = {
    image: promoContent.card2.image,
    eyebrow:
      promoContent.card2.eyebrow?.trim() ||
      DEFAULT_PROMO.card2.eyebrow,

    title:
      promoContent.card2.title?.trim() ||
      DEFAULT_PROMO.card2.title,

    description:
      promoContent.card2.description?.trim() ||
      DEFAULT_PROMO.card2.description,

    button:
      promoContent.card2.button?.trim() ||
      DEFAULT_PROMO.card2.button,

    href:
      promoContent.card2.href?.trim() ||
      productsHref,
  };

  return (
    <section
      className="
        w-full
        bg-(--ice-50)
        py-5
        sm:py-7
        lg:py-8
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* ====================================================
            SECTION HEADER
        ==================================================== */}

        <div
          className="
            mb-3
            flex
            items-end
            justify-between
            gap-3
            sm:mb-5
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-[9px]
                font-black
                tracking-[0.2em]
                text-[var(--ocean-700)]
                sm:text-[10px]
              "
            >
              {sectionLabel}
            </p>

            <h2
              className="
                mt-0.5
                text-base
                font-black
                tracking-tight
                text-[var(--ocean-950)]
                sm:mt-1
                sm:text-xl
                lg:text-2xl
              "
            >
              {sectionTitle}
            </h2>
          </div>

          <Link
            href={sectionLinkHref}
            className="
              group
              inline-flex
              min-h-8
              shrink-0
              items-center
              gap-0.5
              text-[11px]
              font-bold
              text-[var(--ocean-800)]
              transition
              hover:text-[var(--ocean-600)]
              sm:min-h-10
              sm:text-sm
            "
          >
            <span className="whitespace-nowrap">
              {sectionLinkLabel}
            </span>

            <ArrowRight
              aria-hidden="true"
              className="
                h-3.5
                w-3.5
                transition-transform
                duration-200
                group-hover:translate-x-1
                sm:h-4
                sm:w-4
              "
            />
          </Link>
        </div>

        {/* ====================================================
            PROMO CARDS
        ==================================================== */}

        <div
          className="
            -mx-4
            flex
            snap-x
            snap-mandatory
            gap-3
            overflow-x-auto
            overscroll-x-contain
            px-4
            pb-2
            scrollbar-none

            sm:mx-0
            sm:grid
            sm:grid-cols-2
            sm:gap-4
            sm:overflow-visible
            sm:px-0

            lg:gap-5
          "
        >
<PromoCard
  href={card1.href}
  variant="ocean"
  eyebrow={card1.eyebrow}
  title={card1.title}
  description={card1.description}
  cta={card1.button}
  icon={Fish}
  image={card1.image}
/>

<PromoCard
  href={card2.href}
  variant="fresh"
  eyebrow={card2.eyebrow}
  title={card2.title}
  description={card2.description}
  cta={card2.button}
  icon={PackageCheck}
  image={card2.image}
/>
        </div>

        <p
          className="
            mt-1
            text-center
            text-[10px]
            font-medium
            text-slate-400
            sm:hidden
          "
        >
          Geser untuk melihat promo lainnya
        </p>
      </div>
    </section>
  );
}
