import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Percent,
  ShoppingBag,
  Sparkles,
  Tag,
} from "lucide-react";

import DynamicSiteFooter from "@/components/layout/DynamicSiteFooter";
import DynamicSiteHeader from "@/components/layout/DynamicSiteHeader";

import PromotionService from "@/services/promotion/promotion.service";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type PromotionDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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
      month: "long",
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

function getProductImage(
  images: Array<{
    id: string;
    image: string | null;
    isThumbnail: boolean;
    sortOrder: number;
  }>
) {
  const thumbnail =
    images.find(
      (image) =>
        image.isThumbnail &&
        image.image
    );

  return (
    thumbnail?.image ??
    images.find(
      (image) =>
        Boolean(image.image)
    )?.image ??
    null
  );
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default async function PromotionDetailPage({
  params,
}: PromotionDetailPageProps) {
  const { slug } =
    await params;

  const promotion =
    await PromotionService.getActiveBySlugForCustomer(
      slug
    );

  /**
   * ----------------------------------------------------------
   * NOT FOUND
   * ----------------------------------------------------------
   *
   * Jangan menampilkan draft / ended / cancelled.
   *
   * Repository customer sudah melakukan filtering:
   * - ACTIVE
   * - date range
   * - non deleted
   * - SKU aktif
   * - product published
   */

  if (!promotion) {
    return (
      <main className="min-h-screen bg-slate-50">
        <DynamicSiteHeader activePage="products" />

        <section
          className="
            mx-auto
            flex
            min-h-[65vh]
            w-full
            max-w-7xl
            items-center
            justify-center
            px-4
            py-12
            sm:px-6
            lg:px-8
          "
        >
          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              border
              border-[var(--ice-200)]
              bg-white
              p-8
              text-center
              shadow-sm
            "
          >
            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                text-slate-500
              "
            >
              <Tag className="h-7 w-7" />
            </div>

            <h1
              className="
                mt-5
                text-xl
                font-black
                text-[var(--ocean-950)]
              "
            >
              Promo Tidak Ditemukan
            </h1>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-500
              "
            >
              Promo mungkin sudah berakhir,
              belum aktif, atau tidak tersedia
              untuk customer.
            </p>

            <div
              className="
                mt-6
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:justify-center
              "
            >
              <Link
                href="/promotions"
                className="
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
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
                <ArrowLeft className="h-4 w-4" />

                Semua Promo
              </Link>

              <Link
                href="/products"
                className="
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-[var(--ice-200)]
                  bg-white
                  px-5
                  text-sm
                  font-bold
                  text-[var(--ocean-800)]
                  transition
                  hover:bg-slate-50
                "
              >
                Lihat Produk
              </Link>
            </div>
          </div>
        </section>

        <DynamicSiteFooter />
      </main>
    );
  }

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

  /**
   * ==========================================================
   * DEDUP PRODUCT
   * ==========================================================
   *
   * Satu product dapat memiliki beberapa SKU.
   *
   * Jangan menampilkan product yang sama berkali-kali
   * hanya karena promotion memiliki beberapa SKU.
   */

  const productMap =
    new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        images: Array<{
          id: string;
          image: string | null;
          isThumbnail: boolean;
          sortOrder: number;
        }>;
        skuCount: number;
      }
    >();

  for (
    const item of promotion.items
  ) {
    const product =
      item.sku.product;

    const existing =
      productMap.get(
        product.id
      );

    if (existing) {
      existing.skuCount += 1;
      continue;
    }

    productMap.set(
      product.id,
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        images: product.images,
        skuCount: 1,
      }
    );
  }

  const products =
    Array.from(
      productMap.values()
    );

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
        {promotion.banner ? (
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-cover
              bg-center
              opacity-25
            "
            style={{
              backgroundImage: `url("${promotion.banner}")`,
            }}
          />
        ) : null}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-br
            from-[var(--ocean-950)]/95
            via-[var(--ocean-900)]/90
            to-[var(--ocean-700)]/85
          "
        />

        <div
          className="
            relative
            mx-auto
            w-full
            max-w-7xl
            px-4
            py-10
            sm:px-6
            sm:py-14
            lg:px-8
            lg:py-16
          "
        >
          <Link
            href="/promotions"
            className="
              inline-flex
              min-h-10
              items-center
              gap-2
              text-xs
              font-bold
              text-white/70
              transition
              hover:text-white
              sm:text-sm
            "
          >
            <ArrowLeft className="h-4 w-4" />

            Semua Promo
          </Link>

          <div
            className="
              mt-8
              max-w-3xl
            "
          >
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
              "
            >
              <Sparkles className="h-3.5 w-3.5" />

              PROMO AKTIF
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
              {promotion.name}
            </h1>

            {promotion.description ? (
              <p
                className="
                  mt-4
                  max-w-2xl
                  text-sm
                  leading-6
                  text-white/75
                  sm:text-base
                  sm:leading-7
                "
              >
                {
                  promotion.description
                }
              </p>
            ) : null}

            <div
              className="
                mt-6
                flex
                flex-wrap
                gap-2
              "
            >
              {discountLabel ? (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-[var(--fresh-600)]
                    px-4
                    py-2.5
                    text-sm
                    font-black
                    text-white
                    shadow-lg
                  "
                >
                  <Percent className="h-4 w-4" />

                  {discountLabel}
                </span>
              ) : (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-white/10
                    px-4
                    py-2.5
                    text-sm
                    font-bold
                    text-white
                    backdrop-blur
                  "
                >
                  <Tag className="h-4 w-4" />

                  Promo Spesial
                </span>
              )}

              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-white/10
                  px-4
                  py-2.5
                  text-sm
                  font-bold
                  text-white
                  backdrop-blur
                "
              >
                <ShoppingBag className="h-4 w-4" />

                {products.length} Produk
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* PROMOTION INFO */}
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
        "
      >
        <div
          className="
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          <div
            className="
              rounded-2xl
              border
              border-[var(--ice-200)]
              bg-white
              p-5
              shadow-sm
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
                bg-[var(--ocean-50)]
                text-[var(--ocean-700)]
              "
            >
              <CalendarDays className="h-5 w-5" />
            </div>

            <p
              className="
                mt-4
                text-xs
                font-bold
                text-slate-500
              "
            >
              Periode Promo
            </p>

            <p
              className="
                mt-1
                text-sm
                font-black
                text-[var(--ocean-950)]
              "
            >
              {startDate ??
                "Mulai sekarang"}
            </p>

            <p
              className="
                mt-0.5
                text-xs
                text-slate-500
              "
            >
              sampai{" "}
              {endDate ??
                "tidak ditentukan"}
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-[var(--ice-200)]
              bg-white
              p-5
              shadow-sm
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
                bg-[var(--fresh-50)]
                text-[var(--fresh-700)]
              "
            >
              <Tag className="h-5 w-5" />
            </div>

            <p
              className="
                mt-4
                text-xs
                font-bold
                text-slate-500
              "
            >
              Produk Promo
            </p>

            <p
              className="
                mt-1
                text-sm
                font-black
                text-[var(--ocean-950)]
              "
            >
              {products.length} Produk
            </p>

            <p
              className="
                mt-0.5
                text-xs
                text-slate-500
              "
            >
              {promotion.items.length} SKU
              tersedia dalam campaign
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-[var(--ice-200)]
              bg-white
              p-5
              shadow-sm
              sm:col-span-2
              lg:col-span-1
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
                bg-emerald-50
                text-emerald-600
              "
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <p
              className="
                mt-4
                text-xs
                font-bold
                text-slate-500
              "
            >
              Status
            </p>

            <p
              className="
                mt-1
                text-sm
                font-black
                text-emerald-600
              "
            >
              Sedang Aktif
            </p>

            <p
              className="
                mt-0.5
                text-xs
                text-slate-500
              "
            >
              Promo dapat digunakan
              sesuai ketentuan campaign.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* PRODUCTS */}
      {/* ====================================================== */}

      <section
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          pb-12
          sm:px-6
          lg:px-8
        "
      >
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
              PRODUK PROMO
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
              Pilihan Produk
            </h2>
          </div>
        </div>

        <div
          className="
            grid
            grid-cols-2
            gap-4
            sm:grid-cols-3
            lg:grid-cols-4
          "
        >
          {products.map(
            (product) => {
              const image =
                getProductImage(
                  product.images
                );

              return (
                <Link
                  key={
                    product.id
                  }
                  href={`/products/${encodeURIComponent(
                    product.slug
                  )}`}
                  className="
                    group
                    overflow-hidden
                    rounded-2xl
                    border
                    border-[var(--ice-200)]
                    bg-white
                    shadow-[0_3px_12px_rgba(15,23,42,0.05)]
                    transition
                    duration-300
                    hover:-translate-y-1
                    hover:border-[var(--fresh-300)]
                    hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]
                  "
                >
                  {/* Product image */}

                  <div
                    className="
                      relative
                      aspect-square
                      overflow-hidden
                      bg-[var(--ice-100)]
                    "
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt={
                          product.name
                        }
                        fill
                        sizes="
                          (max-width: 639px) 50vw,
                          (max-width: 1023px) 33vw,
                          25vw
                        "
                        className="
                          object-cover
                          transition
                          duration-300
                          group-hover:scale-105
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
                          text-slate-300
                        "
                      >
                        <ShoppingBag className="h-10 w-10" />
                      </div>
                    )}

                    <div
                      className="
                        absolute
                        left-2
                        top-2
                        inline-flex
                        items-center
                        gap-1
                        rounded-lg
                        bg-[var(--fresh-600)]
                        px-2
                        py-1
                        text-[9px]
                        font-black
                        text-white
                        shadow
                      "
                    >
                      <Sparkles className="h-3 w-3" />

                      PROMO
                    </div>
                  </div>

                  {/* Product content */}

                  <div className="p-4">
                    <h3
                      className="
                        line-clamp-2
                        min-h-10
                        text-sm
                        font-black
                        leading-5
                        text-[var(--ocean-950)]
                        transition
                        group-hover:text-[var(--ocean-700)]
                      "
                    >
                      {product.name}
                    </h3>

                    <p
                      className="
                        mt-2
                        text-[10px]
                        font-medium
                        text-slate-500
                      "
                    >
                      {product.skuCount}{" "}
                      varian SKU dalam promo
                    </p>

                    <div
                      className="
                        mt-4
                        flex
                        items-center
                        justify-between
                        border-t
                        border-[var(--ice-100)]
                        pt-3
                      "
                    >
                      <span
                        className="
                          text-[10px]
                          font-bold
                          text-[var(--ocean-700)]
                        "
                      >
                        Lihat Produk
                      </span>

                      <span
                        className="
                          flex
                          h-7
                          w-7
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
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }
          )}
        </div>
      </section>

      <DynamicSiteFooter />
    </main>
  );
}