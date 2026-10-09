import type { Metadata } from "next";

import Link from "next/link";
import Image from "next/image";

import {
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

import settingsService from "@/services/settings/settings.service";
import { getSiteUrls } from "@/services/site/site-url.service";

import {
  buildSeoMetadata,
  type SeoSettings,
} from "@/lib/seo/seo-metadata";

/**
 * ============================================================
 * CUSTOMER FLASH SALE PAGE
 * ============================================================
 *
 * Halaman customer untuk menampilkan Flash Sale yang sedang
 * aktif.
 *
 * Data berasal dari:
 *
 * FlashSaleRepository.findActiveForCustomer()
 *
 * Page ini READ-ONLY.
 *
 * Tidak melakukan:
 *
 * - consume quota
 * - update stock
 * - create order
 * - create purchase
 *
 * Checkout tetap melalui production OrderService.
 * ============================================================
 */

/**
 * ============================================================
 * FORMAT RUPIAH
 * ============================================================
 */

function formatRupiah(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style:
        "currency",
      currency:
        "IDR",
      maximumFractionDigits:
        0,
    }
  ).format(value);
}

/**
 * ============================================================
 * FORMAT DATE
 * ============================================================
 */

function formatDate(
  value: Date
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",
      month:
        "long",
      year:
        "numeric",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  ).format(value);
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrls = await getSiteUrls();

  const [settings, flashSales] =
    await Promise.all([
      settingsService.getSettings(),
      FlashSaleRepository.findActiveForCustomer(),
    ]);

  const seoSettings: SeoSettings = {
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    seoKeywords: settings.seoKeywords,
    seoCanonicalUrl: settings.seoCanonicalUrl,
    seoOgTitle: settings.seoOgTitle,
    seoOgDescription: settings.seoOgDescription,
    seoOgImage: settings.seoOgImage,
    seoTwitterCard: settings.seoTwitterCard,
    seoRobotsIndex: settings.seoRobotsIndex,
    seoRobotsFollow: settings.seoRobotsFollow,
    seoGoogleVerification: settings.seoGoogleVerification,
    seoAiEnabled: settings.seoAiEnabled,
    storeName: settings.storeName,
    storeDescription: settings.storeDescription,
  };

  const primaryCampaign =
    flashSales[0];

  const storeName =
    settings.storeName?.trim() ||
    "Pisjo Market Platform";

  const title =
    primaryCampaign?.name?.trim() ||
    `Flash Sale | ${storeName}`;

  const description =
    primaryCampaign?.description?.trim() ||
    `Dapatkan harga promo terbaik melalui Flash Sale di ${storeName}.`;

  return buildSeoMetadata(seoSettings, {
      baseUrl: siteUrls.storefrontUrl,
    pathname: "/flash-sale",
    title,
    description,
  });
}

/**
 * ============================================================
 * CUSTOMER FLASH SALE PAGE
 * ============================================================
 */

export default async function FlashSalePage() {
  /**
   * ==========================================================
   * FETCH ACTIVE FLASH SALES
   * ==========================================================
   */

  const flashSales =
    await FlashSaleRepository.findActiveForCustomer();

  /**
   * ==========================================================
   * EMPTY STATE
   * ==========================================================
   */

  if (
    flashSales.length ===
    0
  ) {
    return (
      <main className="min-h-screen bg-slate-50">

        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

        <DynamicSiteHeader
          activePage="products"
        />

        {/* ==================================================== */}
        {/* EMPTY HERO */}
        {/* ==================================================== */}

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
          <div
            className="
              mx-auto
              max-w-7xl
              px-4
              py-16
              sm:px-6
              lg:px-8
              lg:py-24
            "
          >
            <div
              className="max-w-3xl"
            >

              <div
                className="
                  mb-5
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-emerald-400/30
                  bg-emerald-400/10
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-emerald-300
                "
              >
                <Zap
                  className="h-4 w-4"
                />

                Flash Sale
              </div>

              <h1
                className="
                  text-4xl
                  font-black
                  tracking-tight
                  text-white
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                Promo spesial untuk
                ikan segar pilihan.
              </h1>

              <p
                className="
                  mt-5
                  max-w-2xl
                  text-base
                  leading-7
                  text-white/90
                  drop-shadow-[0_1px_3px_rgba(0,20,60,0.35)]
                  sm:text-lg
                "
              >
                Saat ini belum ada Flash
                Sale yang sedang berlangsung.
                Silakan kembali lagi nanti
                untuk mendapatkan harga promo
                terbaik.
              </p>

              <div
                className="mt-8"
              >
                <Link
                  href="/products"
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
                    shadow-lg
                    shadow-emerald-950/30
                    transition
                    hover:bg-emerald-400
                  "
                >
                  Lihat Semua Produk

                  <ArrowRight
                    className="h-4 w-4"
                  />
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* EMPTY CONTENT */}
        {/* ==================================================== */}

        <section
          className="
            mx-auto
            flex
            min-h-80
            max-w-7xl
            items-center
            justify-center
            px-4
            py-16
            sm:px-6
            lg:px-8
          "
        >
          <div
            className="text-center"
          >
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

            <h2
              className="
                mt-5
                text-xl
                font-bold
                text-slate-900
              "
            >
              Belum ada promo aktif
            </h2>

            <p
              className="
                mt-2
                text-sm
                text-slate-500
              "
            >
              Produk promo akan muncul di
              halaman ini saat Flash Sale
              dimulai.
            </p>
          </div>
        </section>

        <DynamicSiteFooter />
      </main>
    );
  }

  /**
   * ==========================================================
   * ACTIVE CAMPAIGN
   * ==========================================================
   *
   * Repository mengurutkan campaign berdasarkan:
   *
   * 1. sortOrder
   * 2. startAt
   * 3. createdAt
   *
   * Campaign pertama menjadi campaign utama.
   */

  const primaryCampaign =
    flashSales[0];

  /**
   * ==========================================================
   * MAIN PAGE
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <DynamicSiteHeader
        activePage="products"
      />

      {/* ====================================================== */}
      {/* HERO */}
      {/* ====================================================== */}

      <section
        style={{
          background:
            "linear-gradient(105deg, #063B82 0%, #0877C9 48%, #0EA5E9 72%, #063B82 100%)",
          boxShadow: "0 18px 42px rgba(0, 94, 184, 0.18)",
        }}
        className="
          relative
          isolate
          overflow-hidden
          border-b
          border-sky-200/40
        "
      >

        {/* BLUE OCEAN GLOW */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_18%_15%,rgba(56,189,248,0.45),transparent_42%),radial-gradient(ellipse_at_82%_25%,rgba(34,211,238,0.24),transparent_38%),linear-gradient(105deg,rgba(3,37,91,0.82),rgba(0,104,190,0.42)_52%,rgba(3,37,91,0.16))]"
        />

        {/* HERO BACKGROUND */}
        {primaryCampaign.banner && (
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              z-0
              opacity-45
            "
          >
            <Image
              src={
                primaryCampaign.banner
              }
              alt=""
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        )}

        {/* DECORATION */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            z-0
            h-72
            w-72
            rounded-full
            bg-cyan-300/25
            blur-3xl
          "
        />

        <div
          className="
            relative
            z-10
            mx-auto
            max-w-7xl
            px-4
            py-14
            sm:px-6
            lg:px-8
            lg:py-20
          "
        >
          <div
            className="max-w-4xl"
          >

            {/* BADGE */}
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-orange-200/70
                bg-gradient-to-r
                from-red-600
                to-orange-500
                px-4
                py-2
                text-sm
                font-bold
                text-white
                shadow-[0_0_18px_rgba(255,90,54,0.30)]
              "
            >
              <Flame
                className="h-4 w-4"
              />

              FLASH SALE
            </div>

            {/* TITLE */}
            <h1
              className="
                mt-5
                text-4xl
                font-black
                tracking-tight
                text-white
                drop-shadow-[0_3px_18px_rgba(0,20,60,0.32)]
                sm:text-5xl
                lg:text-6xl
              "
            >
              {primaryCampaign.name
                .split(/(Akhir Pekan)/i)
                .map((part, index) =>
                  part.toLowerCase() === "akhir pekan" ? (
                    <span key={index} className="text-[#78F05A] drop-shadow-[0_2px_14px_rgba(120,240,90,0.18)]">
                      {part}
                    </span>
                  ) : (
                    <span key={index}>{part}</span>
                  )
                )}
            </h1>

            {/* DESCRIPTION */}
            {primaryCampaign.description && (
              <p
                className="
                  mt-5
                  max-w-2xl
                  text-base
                  leading-7
                  text-slate-300
                  sm:text-lg
                "
              >
                {
                  primaryCampaign.description
                }
              </p>
            )}

            {/* META */}
            <div
              className="
                mt-7
                flex
                flex-wrap
                gap-3
              "
            >

              {/* END DATE */}
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-sky-100/30
                  bg-blue-950/25
                  px-4
                  py-3
                  text-sm
                  text-white
                  shadow-[0_4px_18px_rgba(0,25,70,0.16)]
                  backdrop-blur-md
                "
              >
                <Clock3
                  className="
                    h-4
                    w-4
                    text-cyan-300
                  "
                />

                Berakhir{" "}
                {formatDate(
                  primaryCampaign.endAt
                )}
              </div>

              {/* ITEM COUNT */}
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-sky-100/30
                  bg-blue-950/25
                  px-4
                  py-3
                  text-sm
                  text-white
                  shadow-[0_4px_18px_rgba(0,25,70,0.16)]
                  backdrop-blur-md
                "
              >
                <ShoppingBag
                  className="
                    h-4
                    w-4
                    text-cyan-300
                  "
                />

                {
                  primaryCampaign.items
                    .length
                }{" "}
                produk promo
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* CAMPAIGNS */}
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

        {/* SECTION HEADER */}
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
                font-bold
                uppercase
                tracking-wider
                text-emerald-600
              "
            >
              <Zap
                className="h-4 w-4"
              />

              Promo terbatas
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
              Flash Sale Aktif
            </h2>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-slate-500
              "
            >
              Harga promo berlaku selama
              kuota Flash Sale masih tersedia.
            </p>

          </div>
        </div>

        {/* CAMPAIGN LIST */}
        <div
          className="
            mt-8
            space-y-12
          "
        >
          {flashSales.map(
            (
              campaign
            ) => (
              <section
                key={
                  campaign.id
                }
              >

                {/* ============================================ */}
                {/* CAMPAIGN HEADER */}
                {/* ============================================ */}

                <div
                  className="
                    mb-5
                    flex
                    flex-col
                    gap-3
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-5
                    shadow-sm
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div>

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <Flame
                        className="
                          h-5
                          w-5
                          text-red-500
                        "
                      />

                      <h3
                        className="
                          text-lg
                          font-black
                          text-slate-900
                        "
                      >
                        {
                          campaign.name
                        }
                      </h3>
                    </div>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-500
                      "
                    >
                      Berlaku sampai{" "}
                      {formatDate(
                        campaign.endAt
                      )}
                    </p>

                  </div>

                  <Link
                    href={`/flash-sale/${campaign.slug}`}
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-slate-200
                      px-4
                      py-2.5
                      text-sm
                      font-bold
                      text-slate-700
                      transition
                      hover:border-emerald-300
                      hover:text-emerald-700
                    "
                  >
                    Lihat Promo

                    <ArrowRight
                      className="h-4 w-4"
                    />
                  </Link>
                </div>

                {/* ============================================ */}
                {/* PRODUCTS */}
                {/* ============================================ */}

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-3
                    sm:grid-cols-3
                    md:grid-cols-4
                    lg:grid-cols-5
                    xl:grid-cols-6
                  "
                >
                  {campaign.items.map(
                    (
                      item
                    ) => {
                      const product =
                        item.product;

                      const sku =
                        item.sku;

                      /**
                       * ==================================================
                       * PRODUCT IMAGE
                       * ==================================================
                       *
                       * Repository menyediakan product.images
                       * dengan urutan:
                       *
                       * 1. thumbnail
                       * 2. sortOrder
                       *
                       * Karena itu kita cukup menggunakan image pertama.
                       *
                       * Tetap gunakan fallback find() agar aman jika
                       * urutan repository berubah di kemudian hari.
                       */

                      const productImage =
                        product.images?.find(
                          (
                            image
                          ) =>
                            image.isThumbnail
                        ) ??
                        product.images?.[0];

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

                          {/* ================================== */}
                          {/* IMAGE */}
                          {/* ================================== */}

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
                                  16vw
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

                            {/* DISCOUNT BADGE */}
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

                              -
                              {
                                item.discountPercent
                              }%
                            </div>

                            {/* REMAINING QUOTA */}
                            <div
                              className="
                                absolute
                                bottom-2
                                left-2
                                right-2
                                rounded-lg
                                bg-slate-950/80
                                px-2
                                py-1.5
                                text-center
                                text-[10px]
                                font-bold
                                text-white
                                backdrop-blur
                              "
                            >
                              Sisa{" "}
                              {
                                item.remainingQuantity
                              }{" "}
                              kuota
                            </div>

                          </div>

                          {/* ================================== */}
                          {/* CONTENT */}
                          {/* ================================== */}

                          <div
                            className="p-3"
                          >

                            <h4
                              className="
                                line-clamp-2
                                min-h-10
                                text-sm
                                font-bold
                                leading-5
                                text-slate-900
                              "
                            >
                              {
                                product.name
                              }
                            </h4>

                            {/* SKU */}
                            {sku && (
                              <p
                                className="
                                  mt-1
                                  truncate
                                  text-[11px]
                                  text-slate-400
                                "
                              >
                                SKU:{" "}
                                {sku.sku}
                              </p>
                            )}

                            {/* PRICES */}
                            <div
                              className="
                                mt-3
                              "
                            >

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

                            {/* CTA */}
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
                              <span
                                className="
                                  text-[11px]
                                  font-semibold
                                  text-slate-500
                                "
                              >
                                Beli sekarang
                              </span>

                              <ArrowRight
                                className="
                                  h-4
                                  w-4
                                  text-emerald-600
                                  transition
                                  group-hover:translate-x-1
                                "
                              />
                            </div>

                          </div>
                        </Link>
                      );
                    }
                  )}
                </div>

              </section>
            )
          )}
        </div>
      </section>

      {/* ====================================================== */}
      {/* FOOTER */}
      {/* ====================================================== */}

      <DynamicSiteFooter />

    </main>
  );
}
