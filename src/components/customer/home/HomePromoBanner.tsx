import Link from "next/link";

import {
  ArrowRight,
  Fish,
  PackageCheck,
  Sparkles,
} from "lucide-react";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type HomePromoBannerProps = {
  productsHref: string;
};

/**
 * ============================================================
 * HOME PROMO BANNER
 * ============================================================
 *
 * Responsive layout:
 *
 * Mobile:
 * - 1 kolom
 * - Banner full width
 * - Tidak horizontal scroll
 *
 * Tablet:
 * - 2 kolom
 *
 * Desktop:
 * - 2 kolom
 *
 * Visual:
 * Deep Ocean Navy + Fresh Green
 */

export default function HomePromoBanner({
  productsHref,
}: HomePromoBannerProps) {
  return (
    <section className="w-full py-6 sm:py-8 lg:py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* SECTION HEADER */}
        {/* ================================================== */}

        <div className="flex items-end justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p
              className="
                text-[9px]
                font-black
                tracking-[0.2em]
                text-[var(--ocean-700)]
                sm:text-xs
              "
            >
              PROMO PILIHAN
            </p>

            <h2
              className="
                mt-1
                text-lg
                font-black
                tracking-tight
                text-[var(--ocean-950)]
                sm:text-2xl
                lg:text-[28px]
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
              min-h-10
              shrink-0
              items-center
              gap-1

              text-[11px]
              font-bold
              text-[var(--ocean-800)]

              transition

              hover:text-[var(--ocean-600)]

              sm:min-h-11
              sm:text-sm
            "
          >
            <span className="whitespace-nowrap">
              Lihat Produk
            </span>

            <ArrowRight
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

        {/* ================================================== */}
        {/* BANNER GRID */}
        {/* ================================================== */}

        <div
          className="
            mt-5

            grid
            grid-cols-1
            gap-4

            sm:grid-cols-2
            sm:gap-5

            lg:mt-6
          "
        >

          {/* ============================================== */}
          {/* BANNER 1 */}
          {/* ============================================== */}

          <Link
            href={productsHref}
            className="
              group
              relative

              min-h-[230px]

              overflow-hidden
              rounded-2xl

              bg-gradient-to-br
              from-[var(--ocean-950)]
              via-[var(--ocean-900)]
              to-[var(--ocean-700)]

              p-5
              text-white

              shadow-[0_10px_30px_rgba(18,58,99,0.14)]

              transition
              duration-300

              active:scale-[0.99]

              sm:min-h-[270px]
              sm:p-6

              lg:min-h-[290px]
              lg:rounded-3xl
              lg:p-7
              lg:hover:-translate-y-1
              lg:hover:shadow-[0_18px_45px_rgba(18,58,99,0.20)]
            "
          >

            {/* ============================================ */}
            {/* BACKGROUND DECORATION */}
            {/* ============================================ */}

            <div className="pointer-events-none absolute inset-0">

              <div
                className="
                  absolute
                  -right-14
                  -top-14

                  h-44
                  w-44

                  rounded-full

                  border
                  border-white/[0.07]

                  sm:-right-16
                  sm:-top-16
                  sm:h-52
                  sm:w-52
                "
              />

              <div
                className="
                  absolute
                  -right-10
                  top-1/2

                  h-52
                  w-52

                  -translate-y-1/2

                  rounded-full

                  border
                  border-white/[0.05]

                  sm:-right-5
                  sm:h-72
                  sm:w-72
                "
              />

              <div
                className="
                  absolute
                  -bottom-20
                  left-[35%]

                  h-40
                  w-40

                  rounded-full

                  bg-[var(--fresh-400)]/[0.10]

                  blur-3xl

                  sm:h-48
                  sm:w-48
                "
              />
            </div>

            {/* ============================================ */}
            {/* CONTENT */}
            {/* ============================================ */}

            <div
              className="
                relative
                flex
                h-full
                min-h-[190px]
                flex-col
                justify-between

                sm:min-h-[220px]
                lg:min-h-[234px]
              "
            >

              {/* TOP */}

              <div className="relative z-10">

                <div
                  className="
                    inline-flex
                    items-center
                    gap-1.5

                    rounded-full

                    border
                    border-white/15

                    bg-white/[0.08]

                    px-2.5
                    py-1.5

                    text-[9px]
                    font-black
                    tracking-[0.14em]

                    text-[var(--fresh-400)]

                    backdrop-blur

                    sm:gap-2
                    sm:px-3
                    sm:text-[10px]
                    sm:tracking-[0.16em]
                  "
                >
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />

                  PROMO PILIHAN
                </div>

                <h3
                  className="
                    mt-4

                    max-w-[85%]

                    text-xl
                    font-black
                    leading-tight
                    tracking-tight

                    sm:max-w-sm
                    sm:text-2xl

                    lg:text-3xl
                  "
                >
                  Seafood Segar untuk Kebutuhan Anda
                </h3>

                <p
                  className="
                    mt-2

                    max-w-[78%]

                    text-xs
                    leading-5

                    text-white/70

                    sm:max-w-sm
                    sm:text-sm
                    sm:leading-6
                  "
                >
                  Temukan berbagai pilihan ikan dan seafood
                  segar untuk kebutuhan keluarga Anda.
                </p>
              </div>

              {/* CTA */}

              <div
                className="
                  relative
                  z-10

                  mt-5

                  inline-flex
                  items-center
                  gap-2

                  text-xs
                  font-bold

                  text-white

                  sm:mt-6
                  sm:text-sm
                "
              >
                <span
                  className="
                    rounded-full

                    bg-[var(--fresh-500)]

                    px-4
                    py-2.5

                    text-white

                    shadow-sm

                    transition

                    group-hover:bg-[var(--fresh-600)]

                    sm:px-5
                  "
                >
                  Lihat Produk
                </span>

                <ArrowRight
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

            {/* ============================================ */}
            {/* ICON */}
            {/* ============================================ */}

            <div
              className="
                absolute
                bottom-5
                right-5

                flex
                h-14
                w-14

                items-center
                justify-center

                rounded-2xl

                border
                border-white/10

                bg-white/[0.08]

                text-[var(--fresh-400)]

                backdrop-blur

                sm:h-20
                sm:w-20

                lg:bottom-7
                lg:right-7
                lg:h-24
                lg:w-24
                lg:rounded-3xl
              "
            >
              <Fish
                className="
                  h-7
                  w-7

                  sm:h-10
                  sm:w-10

                  lg:h-12
                  lg:w-12
                "
              />
            </div>
          </Link>

          {/* ============================================== */}
          {/* BANNER 2 */}
          {/* ============================================== */}

          <Link
            href={productsHref}
            className="
              group
              relative

              min-h-[230px]

              overflow-hidden
              rounded-2xl

              bg-gradient-to-br
              from-[var(--fresh-700)]
              via-[var(--fresh-600)]
              to-[var(--fresh-500)]

              p-5
              text-white

              shadow-[0_10px_30px_rgba(22,101,52,0.14)]

              transition
              duration-300

              active:scale-[0.99]

              sm:min-h-[270px]
              sm:p-6

              lg:min-h-[290px]
              lg:rounded-3xl
              lg:p-7
              lg:hover:-translate-y-1
              lg:hover:shadow-[0_18px_45px_rgba(22,101,52,0.18)]
            "
          >

            {/* ============================================ */}
            {/* BACKGROUND DECORATION */}
            {/* ============================================ */}

            <div className="pointer-events-none absolute inset-0">

              <div
                className="
                  absolute
                  -right-12
                  -top-16

                  h-44
                  w-44

                  rounded-full

                  bg-white/[0.06]

                  blur-2xl

                  sm:h-52
                  sm:w-52
                "
              />

              <div
                className="
                  absolute
                  -bottom-20
                  left-[25%]

                  h-40
                  w-40

                  rounded-full

                  border
                  border-white/[0.08]

                  sm:h-52
                  sm:w-52
                "
              />

              <div
                className="
                  absolute
                  right-[15%]
                  top-1/2

                  h-28
                  w-28

                  -translate-y-1/2

                  rounded-full

                  border
                  border-white/[0.08]

                  sm:h-36
                  sm:w-36
                "
              />
            </div>

            {/* ============================================ */}
            {/* CONTENT */}
            {/* ============================================ */}

            <div
              className="
                relative
                flex
                h-full
                min-h-[190px]
                flex-col
                justify-between

                sm:min-h-[220px]
                lg:min-h-[234px]
              "
            >

              {/* TOP */}

              <div className="relative z-10">

                <div
                  className="
                    inline-flex
                    items-center
                    gap-1.5

                    rounded-full

                    border
                    border-white/15

                    bg-white/[0.10]

                    px-2.5
                    py-1.5

                    text-[9px]
                    font-black
                    tracking-[0.14em]

                    text-white/95

                    backdrop-blur

                    sm:gap-2
                    sm:px-3
                    sm:text-[10px]
                    sm:tracking-[0.16em]
                  "
                >
                  <PackageCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />

                  BELANJA PRAKTIS
                </div>

                <h3
                  className="
                    mt-4

                    max-w-[85%]

                    text-xl
                    font-black
                    leading-tight
                    tracking-tight

                    sm:max-w-sm
                    sm:text-2xl

                    lg:text-3xl
                  "
                >
                  Belanja Seafood Lebih Praktis
                </h3>

                <p
                  className="
                    mt-2

                    max-w-[78%]

                    text-xs
                    leading-5

                    text-white/80

                    sm:max-w-sm
                    sm:text-sm
                    sm:leading-6
                  "
                >
                  Pilih produk favorit Anda dan siapkan pesanan
                  dengan lebih mudah dari satu tempat.
                </p>
              </div>

              {/* CTA */}

              <div
                className="
                  relative
                  z-10

                  mt-5

                  inline-flex
                  items-center
                  gap-2

                  text-xs
                  font-bold

                  text-white

                  sm:mt-6
                  sm:text-sm
                "
              >
                <span
                  className="
                    rounded-full

                    bg-white

                    px-4
                    py-2.5

                    text-[var(--fresh-700)]

                    shadow-sm

                    transition

                    group-hover:bg-[var(--ice-100)]

                    sm:px-5
                  "
                >
                  Mulai Belanja
                </span>

                <ArrowRight
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

            {/* ============================================ */}
            {/* ICON */}
            {/* ============================================ */}

            <div
              className="
                absolute
                bottom-5
                right-5

                flex
                h-14
                w-14

                items-center
                justify-center

                rounded-2xl

                border
                border-white/15

                bg-white/[0.10]

                text-white

                backdrop-blur

                sm:h-20
                sm:w-20

                lg:bottom-7
                lg:right-7
                lg:h-24
                lg:w-24
                lg:rounded-3xl
              "
            >
              <PackageCheck
                className="
                  h-7
                  w-7

                  sm:h-10
                  sm:w-10

                  lg:h-12
                  lg:w-12
                "
              />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}