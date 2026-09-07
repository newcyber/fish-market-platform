import Link from "next/link";
import {
  ArrowRight,
  Fish,
  PackageCheck,
  Sparkles,
} from "lucide-react";

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
 * Tidak ada perubahan pada routing:
 * seluruh promo tetap menuju productsHref.
 *
 * ============================================================
 */

type HomePromoBannerProps = {
  productsHref: string;
};

type PromoCardProps = {
  href: string;
  variant: "ocean" | "fresh";
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  icon: typeof Fish;
};

function PromoCard({
  href,
  variant,
  eyebrow,
  title,
  description,
  cta,
  icon: Icon,
}: PromoCardProps) {
  const isOcean = variant === "ocean";

  return (
    <Link
      href={href}
      className={[
        "group relative block h-[198px] w-[calc(100vw-32px)] shrink-0 snap-center overflow-hidden rounded-3xl p-5 text-white",
        "shadow-[0_8px_24px_rgba(18,58,99,0.12)]",
        "transition duration-300 active:scale-[0.99]",
        "sm:h-[220px] sm:w-auto sm:p-6",
        "lg:h-[250px] lg:p-7 lg:hover:-translate-y-1",
        isOcean
          ? "bg-gradient-to-br from-[var(--ocean-950)] via-[var(--ocean-900)] to-[var(--ocean-700)]"
          : "bg-gradient-to-br from-[var(--fresh-700)] via-[var(--fresh-600)] to-[var(--fresh-500)]",
      ].join(" ")}
    >
      {/* Decorative circles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className={[
            "absolute -right-16 -top-16 h-44 w-44 rounded-full border",
            isOcean
              ? "border-white/[0.08]"
              : "bg-white/[0.06]",
          ].join(" ")}
        />

        <div
          className={[
            "absolute -bottom-24 right-8 h-48 w-48 rounded-full border",
            isOcean
              ? "border-white/[0.05]"
              : "border-white/[0.08]",
          ].join(" ")}
        />

        <div
          className={[
            "absolute right-10 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full blur-2xl",
            isOcean
              ? "bg-[var(--fresh-400)]/[0.10]"
              : "bg-white/[0.06]",
          ].join(" ")}
        />
      </div>

      {/* Decorative icon */}
      <div
        aria-hidden="true"
        className="
          absolute
          bottom-4
          right-4
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          border
          border-white/10
          bg-white/[0.08]
          text-[var(--fresh-400)]
          backdrop-blur
          transition
          duration-300
          group-hover:scale-105
          sm:bottom-5
          sm:right-5
          sm:h-20
          sm:w-20
          lg:bottom-6
          lg:right-6
          lg:h-24
          lg:w-24
          lg:rounded-3xl
        "
      >
        <Icon
          className="
            h-8
            w-8
            sm:h-10
            sm:w-10
            lg:h-12
            lg:w-12
          "
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-[calc(100%-72px)] max-w-[280px] flex-col sm:w-auto sm:max-w-[76%]">
        <div
          className="
            inline-flex
            w-fit
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
            className="h-3 w-3"
          />
          {eyebrow}
        </div>

        <h3
          className="
            mt-3
            max-w-[240px]
            text-xl
            font-black
            leading-[1.08]
            tracking-tight
            sm:mt-4
            sm:max-w-sm
            sm:text-2xl
            lg:text-3xl
          "
        >
          {title}
        </h3>

        <p
          className="
            mt-2
            max-w-[250px]
            text-[11px]
            leading-4.5
            text-white/75
            sm:max-w-sm
            sm:text-xs
            sm:leading-5
            lg:text-sm
            lg:leading-6
          "
        >
          {description}
        </p>

        <div
          className="
            mt-auto
            inline-flex
            w-fit
            items-center
            gap-1.5
            pt-3
            text-[11px]
            font-bold
            sm:pt-4
            sm:text-xs
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
}: HomePromoBannerProps) {
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
              PROMO PILIHAN
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
              Belanja Lebih Hemat
            </h2>
          </div>

          <Link
            href={productsHref}
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
              Lihat Produk
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
            href={productsHref}
            variant="ocean"
            eyebrow="PROMO PILIHAN"
            title="Seafood Segar untuk Kebutuhan Anda"
            description="Temukan berbagai pilihan ikan dan seafood segar untuk kebutuhan keluarga Anda."
            cta="Lihat Produk"
            icon={Fish}
          />

          <PromoCard
            href={productsHref}
            variant="fresh"
            eyebrow="BELANJA PRAKTIS"
            title="Belanja Seafood Lebih Praktis"
            description="Pilih produk favorit Anda dan siapkan pesanan dengan lebih mudah dari satu tempat."
            cta="Mulai Belanja"
            icon={PackageCheck}
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
