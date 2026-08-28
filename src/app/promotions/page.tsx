import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  CalendarDays,
  Megaphone,
  Percent,
  Sparkles,
  Tag,
} from "lucide-react";

import DynamicSiteFooter from "@/components/layout/DynamicSiteFooter";
import DynamicSiteHeader from "@/components/layout/DynamicSiteHeader";

import PromotionService from "@/services/promotion/promotion.service";

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function formatDate(
  value: Date | string | null
) {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatRupiah(
  value: unknown
) {
  const number =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(number)) {
    return "Rp0";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(
    Math.max(0, number)
  );
}

function getPromotionTypeLabel(
  type: string
) {
  if (
    type === "PRICE_DISCOUNT"
  ) {
    return "DISKON";
  }

  return "PROMO";
}

function getDiscountLabel(
  promotion: {
    type: string;
    discountType:
      | string
      | null;
    discountValue:
      | unknown
      | null;
  }
) {
  if (
    promotion.type !==
    "PRICE_DISCOUNT"
  ) {
    return null;
  }

  if (
    promotion.discountType ===
      "PERCENTAGE" &&
    promotion.discountValue != null
  ) {
    return `Diskon ${Number(
      promotion.discountValue
    )}%`;
  }

  if (
    promotion.discountType ===
      "FIXED_AMOUNT" &&
    promotion.discountValue != null
  ) {
    return `Potongan ${formatRupiah(
      promotion.discountValue
    )}`;
  }

  return "Promo harga";
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default async function PromotionsPage() {
  const promotions =
    await PromotionService.getActiveForCustomer();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <DynamicSiteHeader activePage="products" />

      {/* ====================================================== */}
      {/* HERO */}
      {/* ====================================================== */}

      <section
        className="
          relative
          isolate
          overflow-hidden
          border-b
          border-[var(--ice-200)]
          bg-gradient-to-br
          from-[var(--ocean-950)]
          via-[var(--ocean-900)]
          to-[var(--ocean-700)]
          text-white
        "
      >
        {/* Decorative circles */}

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-72
            w-72
            rounded-full
            border
            border-white/10
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-32
            left-1/3
            h-80
            w-80
            rounded-full
            bg-[var(--fresh-400)]/10
            blur-3xl
          "
        />

        <div
          className="
            relative
            mx-auto
            w-full
            max-w-7xl
            px-4
            py-12
            sm:px-6
            sm:py-16
            lg:px-8
            lg:py-20
          "
        >
          <div className="max-w-2xl">
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/15
                bg-white/10
                px-3
                py-1.5
                text-[10px]
                font-black
                tracking-[0.18em]
                text-[var(--fresh-300)]
                backdrop-blur
                sm:text-xs
              "
            >
              <Sparkles className="h-3.5 w-3.5" />

              PROMO PILIHAN
            </div>

            <h1
              className="
                mt-4
                text-3xl
                font-black
                tracking-tight
                sm:text-4xl
                lg:text-5xl
              "
            >
              Belanja Lebih Hemat
            </h1>

            <p
              className="
                mt-4
                max-w-xl
                text-sm
                leading-6
                text-white/75
                sm:text-base
                sm:leading-7
              "
            >
              Temukan berbagai promo aktif
              dan penawaran harga menarik
              untuk produk ikan segar pilihan.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* CONTENT */}
      {/* ====================================================== */}

      <section
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          py-8
          sm:px-6
          sm:py-10
          lg:px-8
          lg:py-12
        "
      >
        {promotions.length === 0 ? (
          <div
            className="
              flex
              min-h-[320px]
              flex-col
              items-center
              justify-center
              rounded-2xl
              border
              border-[var(--ice-200)]
              bg-white
              px-6
              text-center
              shadow-sm
            "
          >
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-[var(--ocean-50)]
                text-[var(--ocean-700)]
              "
            >
              <Tag className="h-7 w-7" />
            </div>

            <h2
              className="
                mt-5
                text-lg
                font-black
                text-[var(--ocean-950)]
              "
            >
              Belum Ada Promo Aktif
            </h2>

            <p
              className="
                mt-2
                max-w-md
                text-sm
                leading-6
                text-slate-500
              "
            >
              Saat ini belum ada promo
              yang sedang berlangsung.
              Silakan cek kembali nanti.
            </p>

            <Link
              href="/products"
              className="
                mt-6
                inline-flex
                min-h-11
                items-center
                gap-2
                rounded-xl
                bg-[var(--ocean-900)]
                px-5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-[var(--ocean-800)]
              "
            >
              Lihat Produk

              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* ================================================= */}
            {/* SECTION HEADER */}
            {/* ================================================= */}

            <div
              className="
                mb-6
                flex
                items-end
                justify-between
                gap-4
              "
            >
              <div>
                <p
                  className="
                    text-[10px]
                    font-black
                    tracking-[0.2em]
                    text-[var(--ocean-700)]
                    sm:text-xs
                  "
                >
                  PROMOTION
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-black
                    tracking-tight
                    text-[var(--ocean-950)]
                    sm:text-2xl
                  "
                >
                  Promo Sedang Berlangsung
                </h2>
              </div>

              <span
                className="
                  shrink-0
                  rounded-full
                  bg-[var(--fresh-50)]
                  px-3
                  py-1.5
                  text-[10px]
                  font-bold
                  text-[var(--fresh-700)]
                  sm:text-xs
                "
              >
                {promotions.length} Promo Aktif
              </span>
            </div>

            {/* ================================================= */}
            {/* PROMOTION GRID */}
            {/* ================================================= */}

            <div
              className="
                grid
                grid-cols-1
                gap-5
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              {promotions.map(
                (promotion) => {
                  const discountLabel =
                    getDiscountLabel(
                      promotion
                    );

                  const startDate =
                    formatDate(
                      promotion.startAt
                    );

                  const endDate =
                    formatDate(
                      promotion.endAt
                    );

                  const itemCount =
                    promotion.items.length;

                  return (
                    <Link
                      key={
                        promotion.id
                      }
                      href={`/promotions/${encodeURIComponent(
                        promotion.slug
                      )}`}
                      className="
                        group
                        relative
                        flex
                        min-w-0
                        flex-col
                        overflow-hidden
                        rounded-2xl
                        border
                        border-[var(--ice-200)]
                        bg-white
                        shadow-[0_4px_16px_rgba(15,23,42,0.06)]
                        transition
                        duration-300
                        hover:-translate-y-1
                        hover:border-[var(--fresh-300)]
                        hover:shadow-[0_16px_35px_rgba(15,23,42,0.10)]
                      "
                    >
                      {/* Banner */}

                      <div
                        className="
                          relative
                          aspect-[16/8]
                          overflow-hidden
                          bg-gradient-to-br
                          from-[var(--ocean-950)]
                          via-[var(--ocean-800)]
                          to-[var(--ocean-600)]
                        "
                      >
                        {promotion.banner ? (
                          <div
                            className="
                              absolute
                              inset-0
                              bg-cover
                              bg-center
                              transition
                              duration-500
                              group-hover:scale-105
                            "
                            style={{
                              backgroundImage: `url("${promotion.banner}")`,
                            }}
                          />
                        ) : null}

                        <div
                          className="
                            absolute
                            inset-0
                            bg-gradient-to-t
                            from-black/55
                            via-black/10
                            to-transparent
                          "
                        />

                        <div
                          className="
                            absolute
                            left-4
                            top-4
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            border
                            border-white/20
                            bg-black/25
                            px-2.5
                            py-1.5
                            text-[9px]
                            font-black
                            tracking-wider
                            text-white
                            backdrop-blur
                          "
                        >
                          <Megaphone className="h-3 w-3" />

                          {getPromotionTypeLabel(
                            promotion.type
                          )}
                        </div>

                        {discountLabel ? (
                          <div
                            className="
                              absolute
                              bottom-4
                              left-4
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-xl
                              bg-[var(--fresh-600)]
                              px-3
                              py-2
                              text-xs
                              font-black
                              text-white
                              shadow-lg
                            "
                          >
                            <Percent className="h-3.5 w-3.5" />

                            {discountLabel}
                          </div>
                        ) : null}
                      </div>

                      {/* Content */}

                      <div
                        className="
                          flex
                          flex-1
                          flex-col
                          p-5
                        "
                      >
                        <h3
                          className="
                            line-clamp-2
                            text-base
                            font-black
                            leading-6
                            text-[var(--ocean-950)]
                            transition
                            group-hover:text-[var(--ocean-700)]
                          "
                        >
                          {promotion.name}
                        </h3>

                        {promotion.description ? (
                          <p
                            className="
                              mt-2
                              line-clamp-2
                              text-sm
                              leading-5
                              text-slate-500
                            "
                          >
                            {
                              promotion.description
                            }
                          </p>
                        ) : null}

                        <div
                          className="
                            mt-4
                            flex
                            flex-wrap
                            gap-2
                          "
                        >
                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-lg
                              bg-slate-50
                              px-2.5
                              py-1.5
                              text-[10px]
                              font-bold
                              text-slate-600
                            "
                          >
                            <Tag className="h-3 w-3" />

                            {itemCount} SKU
                          </span>

                          {startDate ||
                          endDate ? (
                            <span
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-lg
                                bg-slate-50
                                px-2.5
                                py-1.5
                                text-[10px]
                                font-bold
                                text-slate-600
                              "
                            >
                              <CalendarDays className="h-3 w-3" />

                              {startDate ??
                                "Mulai sekarang"}

                              {" — "}

                              {endDate ??
                                "Tanpa batas"}
                            </span>
                          ) : null}
                        </div>

                        <div
                          className="
                            mt-5
                            flex
                            items-center
                            justify-between
                            border-t
                            border-[var(--ice-100)]
                            pt-4
                          "
                        >
                          <span
                            className="
                              text-xs
                              font-bold
                              text-[var(--ocean-700)]
                            "
                          >
                            Lihat Promo
                          </span>

                          <span
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-[var(--ocean-50)]
                              text-[var(--ocean-700)]
                              transition
                              group-hover:bg-[var(--fresh-50)]
                              group-hover:text-[var(--fresh-700)]
                            "
                          >
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>

      <DynamicSiteFooter />
    </main>
  );
}