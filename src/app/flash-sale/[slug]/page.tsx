import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Flame,
  Package,
  Percent,
  ShoppingBag,
  Zap,
} from "lucide-react";

import DynamicSiteHeader from
  "@/components/layout/DynamicSiteHeader";

import DynamicSiteFooter from
  "@/components/layout/DynamicSiteFooter";

import FlashSaleRepository from
  "@/repositories/flash-sale/flash-sale.repository";

/**
 * ============================================================
 * FLASH SALE DETAIL PAGE
 * ============================================================
 *
 * Customer-facing detail page.
 *
 * READ-ONLY:
 *
 * - Tidak consume quota
 * - Tidak update stock
 * - Tidak create order
 * - Tidak create purchase
 *
 * Checkout tetap melalui:
 *
 * Product → Cart → Checkout → OrderService
 * ============================================================
 */

interface FlashSaleDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function formatRupiah(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function formatDate(
  value: Date
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(value);
}

export default async function FlashSaleDetailPage({
  params,
}: FlashSaleDetailPageProps) {
  const {
    slug,
  } = await params;

  /**
   * ==========================================================
   * GET ACTIVE CAMPAIGN
   * ==========================================================
   */

  const flashSale =
    await FlashSaleRepository.findActiveBySlugForCustomer(
      slug
    );

  /**
   * ==========================================================
   * NOT FOUND
   * ==========================================================
   *
   * Jangan membocorkan apakah campaign pernah ada,
   * sudah expired, cancelled, atau soft-deleted.
   *
   * Dari sisi customer semuanya dianggap tidak tersedia.
   */

  if (!flashSale) {
    return (
      <main className="min-h-screen bg-slate-50">
        <DynamicSiteHeader
          activePage="products"
        />

        <section
          className="
            mx-auto
            flex
            min-h-[70vh]
            max-w-7xl
            items-center
            justify-center
            px-4
            py-16
            sm:px-6
            lg:px-8
          "
        >
          <div className="max-w-md text-center">
            <div
              className="
                mx-auto
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                text-slate-400
              "
            >
              <Package
                className="h-8 w-8"
              />
            </div>

            <h1
              className="
                mt-5
                text-2xl
                font-black
                text-slate-900
              "
            >
              Flash Sale tidak tersedia
            </h1>

            <p
              className="
                mt-3
                text-sm
                leading-6
                text-slate-500
              "
            >
              Promo mungkin sudah berakhir,
              belum dimulai, atau kuotanya
              sudah habis.
            </p>

            <div
              className="
                mt-7
                flex
                flex-wrap
                justify-center
                gap-3
              "
            >
              <Link
                href="/flash-sale"
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-emerald-500
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-emerald-400
                "
              >
                <ArrowLeft
                  className="h-4 w-4"
                />

                Kembali ke Flash Sale
              </Link>

              <Link
                href="/products"
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-slate-700
                  transition
                  hover:border-emerald-300
                  hover:text-emerald-700
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

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">
      <DynamicSiteHeader
        activePage="products"
      />

      {/* ====================================================== */}
      {/* HERO */}
      {/* ====================================================== */}

      <section
        className="
          relative
          isolate
          overflow-hidden
          border-b
          border-(--ice-200)
          bg-linear-to-br
          from-slate-950
          via-slate-900
          to-emerald-950
        "
      >
        {flashSale.banner && (
          <div
            className="
              absolute
              inset-0
              -z-10
              opacity-25
            "
          >
            <Image
              src={
                flashSale.banner
              }
              alt=""
              fill
              priority
              className="object-cover"
            />
          </div>
        )}

        <div
          className="
            absolute
            -right-32
            -top-32
            -z-10
            h-96
            w-96
            rounded-full
            bg-emerald-500/20
            blur-3xl
          "
        />

        <div
          className="
            mx-auto
            max-w-7xl
            px-4
            py-12
            sm:px-6
            lg:px-8
            lg:py-20
          "
        >
          <Link
            href="/flash-sale"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-slate-300
              transition
              hover:text-white
            "
          >
            <ArrowLeft
              className="h-4 w-4"
            />

            Semua Flash Sale
          </Link>

          <div
            className="
              mt-8
              max-w-4xl
            "
          >
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-red-400/30
                bg-red-500/10
                px-4
                py-2
                text-sm
                font-black
                text-red-300
              "
            >
              <Flame
                className="h-4 w-4"
              />

              FLASH SALE
            </div>

            <h1
              className="
                mt-5
                text-4xl
                font-black
                tracking-tight
                text-white
                sm:text-5xl
                lg:text-6xl
              "
            >
              {flashSale.name}
            </h1>

            {flashSale.description && (
              <p
                className="
                  mt-5
                  max-w-3xl
                  text-base
                  leading-7
                  text-slate-300
                  sm:text-lg
                "
              >
                {
                  flashSale.description
                }
              </p>
            )}

            <div
              className="
                mt-7
                grid
                gap-3
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/5
                  p-4
                  backdrop-blur
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-sm
                    font-semibold
                    text-slate-400
                  "
                >
                  <Clock3
                    className="
                      h-4
                      w-4
                      text-emerald-400
                    "
                  />

                  Mulai
                </div>

                <p
                  className="
                    mt-2
                    text-sm
                    font-bold
                    text-white
                  "
                >
                  {formatDate(
                    flashSale.startAt
                  )}
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/5
                  p-4
                  backdrop-blur
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-sm
                    font-semibold
                    text-slate-400
                  "
                >
                  <Clock3
                    className="
                      h-4
                      w-4
                      text-red-400
                    "
                  />

                  Berakhir
                </div>

                <p
                  className="
                    mt-2
                    text-sm
                    font-bold
                    text-white
                  "
                >
                  {formatDate(
                    flashSale.endAt
                  )}
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/5
                  p-4
                  backdrop-blur
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-sm
                    font-semibold
                    text-slate-400
                  "
                >
                  <ShoppingBag
                    className="
                      h-4
                      w-4
                      text-emerald-400
                    "
                  />

                  Produk tersedia
                </div>

                <p
                  className="
                    mt-2
                    text-sm
                    font-bold
                    text-white
                  "
                >
                  {flashSale.items.length}{" "}
                  SKU promo
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* PRODUCTS */}
      {/* ====================================================== */}

      <section
        className="
          mx-auto
          max-w-7xl
          px-4
          py-10
          sm:px-6
          lg:px-8
          lg:py-14
        "
      >
        <div
          className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <div
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                font-black
                uppercase
                tracking-wider
                text-emerald-600
              "
            >
              <Zap
                className="h-4 w-4"
              />

              Harga khusus
            </div>

            <h2
              className="
                mt-2
                text-2xl
                font-black
                tracking-tight
                text-slate-900
                sm:text-3xl
              "
            >
              Produk Flash Sale
            </h2>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-500
              "
            >
              Promo berlaku selama kuota
              tersedia.
            </p>
          </div>
        </div>

        <div
          className="
            mt-8
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
          "
        >
          {flashSale.items.map(
            (item) => {
              const product =
                item.product;

              const sku =
                item.sku;

              const productImage =
                product.images.find(
                  (image) =>
                    image.isThumbnail
                ) ??
                product.images[0];

              const originalPrice =
                Number(
                  item.originalPrice
                );

              const flashPrice =
                Number(
                  item.flashPrice
                );

              return (
                <Link
                  key={
                    item.id
                  }
                  href={`/products/${product.slug}`}
                  className="
                    group
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                    transition
                    hover:-translate-y-1
                    hover:border-emerald-200
                    hover:shadow-lg
                  "
                >
                  {/* IMAGE */}

                  <div
                    className="
                      relative
                      aspect-square
                      overflow-hidden
                      bg-slate-100
                    "
                  >
                    {productImage ? (
                      <Image
                        src={
                          productImage.image
                        }
                        alt={
                          product.name
                        }
                        fill
                        sizes="
                          (max-width: 640px) 50vw,
                          (max-width: 768px) 33vw,
                          (max-width: 1024px) 25vw,
                          (max-width: 1280px) 20vw,
                          20vw
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
                          items-center
                          justify-center
                          text-slate-300
                        "
                      >
                        <Package
                          className="
                            h-12
                            w-12
                          "
                        />
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
                        bg-red-500
                        px-2
                        py-1
                        text-[10px]
                        font-black
                        text-white
                        shadow
                      "
                    >
                      <Percent
                        className="h-3 w-3"
                      />

                      -{
                        item.discountPercent
                      }%
                    </div>
                  </div>

                  {/* CONTENT */}

                  <div className="p-3">
                    <h3
                      className="
                        line-clamp-2
                        min-h-10
                        text-sm
                        font-bold
                        leading-5
                        text-slate-900
                      "
                    >
                      {product.name}
                    </h3>

                    {sku && (
                      <div
                        className="
                          mt-2
                          rounded-lg
                          bg-slate-50
                          px-2
                          py-1.5
                        "
                      >
                        <p
                          className="
                            truncate
                            text-[10px]
                            font-semibold
                            text-slate-500
                          "
                        >
                          {sku.sku}
                        </p>

                        {sku.skuOptions.length >
                          0 && (
                          <p
                            className="
                              mt-0.5
                              truncate
                              text-[10px]
                              text-slate-400
                            "
                          >
                            {sku.skuOptions
                              .map(
                                (
                                  option
                                ) =>
                                  option
                                    .variantOption
                                    .group
                                    .name +
                                    ": " +
                                    option
                                    .variantOption
                                .label
                              )
                              .join(
                                " • "
                              )}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-3">
                      <p
                        className="
                          text-[11px]
                          text-slate-400
                          line-through
                        "
                      >
                        {formatRupiah(
                          originalPrice
                        )}
                      </p>

                      <p
                        className="
                          text-base
                          font-black
                          text-emerald-600
                        "
                      >
                        {formatRupiah(
                          flashPrice
                        )}
                      </p>
                    </div>

                    <div
                      className="
                        mt-3
                        flex
                        items-center
                        justify-between
                        border-t
                        border-slate-100
                        pt-3
                      "
                    >
                      <div>
                        <p
                          className="
                            text-[10px]
                            font-semibold
                            text-slate-400
                          "
                        >
                          Sisa quota
                        </p>

                        <p
                          className="
                            text-xs
                            font-black
                            text-slate-700
                          "
                        >
                          {
                            item.remainingQuantity
                          }
                        </p>
                      </div>

                      <div
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          bg-emerald-50
                          text-emerald-600
                          transition
                          group-hover:bg-emerald-500
                          group-hover:text-white
                        "
                      >
                        <ArrowRight
                          className="
                            h-4
                            w-4
                          "
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }
          )}
        </div>
      </section>

      {/* ====================================================== */}
      {/* FOOTER CTA */}
      {/* ====================================================== */}

      <section
        className="
          mx-auto
          max-w-7xl
          px-4
          pb-14
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            rounded-3xl
            bg-emerald-600
            px-6
            py-8
            shadow-xl
            shadow-emerald-900/10
            sm:px-8
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-xl
                  font-black
                  text-white
                "
              >
                Jangan sampai kehabisan.
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-emerald-50
                "
              >
                Kuota Flash Sale terbatas
                dan berkurang setiap transaksi
                berhasil.
              </p>
            </div>

            <Link
              href="/products"
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-white
                px-5
                py-3
                text-sm
                font-black
                text-emerald-700
                transition
                hover:bg-emerald-50
              "
            >
              Lihat Semua Produk

              <ArrowRight
                className="h-4 w-4"
              />
            </Link>
          </div>
        </div>
      </section>

      <DynamicSiteFooter />
    </main>
  );
}