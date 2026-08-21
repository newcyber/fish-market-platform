"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  ChevronRight,
  Flame,
  Package,
} from "lucide-react";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type NumericValue =
  | number
  | {
      toNumber: () => number;
    };

interface FlashSaleProductImage {
  id?: string;

  image?: string | null;

  sortOrder?: number | null;

  isThumbnail?: boolean;
}

interface FlashSaleProduct {
  id: string;

  name: string;

  slug: string;

  price: NumericValue;

  images?: FlashSaleProductImage[];
}

interface FlashSaleWeightOption {
  id: string;

  label: string;

  price: NumericValue;
}

interface FlashSaleItem {
  id: string;

  originalPrice: NumericValue;

  flashPrice: NumericValue;

  stockLimit: number;

  soldQuantity: number;

  product: FlashSaleProduct;

  weightOption:
    | FlashSaleWeightOption
    | null;
}

interface FlashSaleData {
  id: string;

  name: string;

  endAt:
    | string
    | Date;

  items: FlashSaleItem[];
}

interface HomeFlashSaleSectionProps {
  flashSale: FlashSaleData;

  productsHref: string;
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function toNumber(
  value: NumericValue
) {
  if (
    typeof value ===
    "number"
  ) {
    return value;
  }

  return value.toNumber();
}

function formatRupiah(
  value: NumericValue
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
  ).format(
    Math.max(
      0,
      toNumber(value)
    )
  );
}

function getProductImage(
  images:
    | FlashSaleProductImage[]
    | undefined
) {
  if (
    !images ||
    images.length === 0
  ) {
    return null;
  }

  const thumbnail =
    images.find(
      (item) =>
        item.isThumbnail
    );

  return (
    thumbnail?.image ??
    images[0]?.image ??
    null
  );
}

function getRemainingTime(
  endAt:
    | string
    | Date
) {
  const endTime =
    new Date(
      endAt
    ).getTime();

  const now =
    Date.now();

  const difference =
    Math.max(
      0,
      endTime - now
    );

  const hours =
    Math.floor(
      difference /
        (1000 * 60 * 60)
    );

  const minutes =
    Math.floor(
      (
        difference %
        (1000 * 60 * 60)
      ) /
        (1000 * 60)
    );

  const seconds =
    Math.floor(
      (
        difference %
        (1000 * 60)
      ) /
        1000
    );

  return {
    hours:
      String(
        hours
      ).padStart(
        2,
        "0"
      ),

    minutes:
      String(
        minutes
      ).padStart(
        2,
        "0"
      ),

    seconds:
      String(
        seconds
      ).padStart(
        2,
        "0"
      ),

    isExpired:
      difference <= 0,
  };
}

/**
 * ============================================================
 * COUNTDOWN BOX
 * ============================================================
 */

function CountdownBox({
  value,
}: {
  value: string;
}) {
  return (
    <span className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/10 bg-[#17324D] px-1.5 text-xs font-black text-white shadow-sm sm:h-8 sm:min-w-8 sm:px-2 sm:text-sm">
      {value}
    </span>
  );
}

/**
 * ============================================================
 * HOME FLASH SALE SECTION
 * ============================================================
 */

export default function HomeFlashSaleSection({
  flashSale,
  productsHref,
}: HomeFlashSaleSectionProps) {
  /**
   * ==========================================================
   * COUNTDOWN STATE
   * ==========================================================
   */

  const [
    remainingTime,
    setRemainingTime,
  ] =
    useState<
      ReturnType<
        typeof getRemainingTime
      >
      | null
    >(
      null
    );

  /**
   * ==========================================================
   * REALTIME COUNTDOWN
   * ==========================================================
   */

  useEffect(() => {
    const updateCountdown =
      () => {
        setRemainingTime(
          getRemainingTime(
            flashSale.endAt
          )
        );
      };

    updateCountdown();

    const interval =
      window.setInterval(
        updateCountdown,
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    flashSale.endAt,
  ]);

  /**
   * ==========================================================
   * FILTER ITEMS
   * ==========================================================
   */

  const items =
    useMemo(
      () =>
        flashSale.items
          .filter(
            (item) =>
              item.stockLimit > 0
          )
          .slice(
            0,
            12
          ),
      [
        flashSale.items,
      ]
    );

  /**
   * ==========================================================
   * EMPTY STATE
   * ==========================================================
   */

  if (
    items.length === 0
  ) {
    return null;
  }

  const flashSaleHref =
    `${productsHref}?flashSale=${flashSale.id}`;

  return (
    <section className="w-full py-4 sm:py-6">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div className="relative overflow-hidden bg-gradient-to-r from-[#17324D] via-[#1F3E5D] to-[#2B5779] px-4 py-4 sm:px-6 sm:py-5">

            {/* Decorative circles */}

            <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full border border-white/10" />

            <div className="pointer-events-none absolute right-16 top-4 h-24 w-24 rounded-full border border-white/10" />

            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              {/* LEFT */}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">

                {/* TITLE */}

                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#79A943] text-white shadow-lg shadow-black/10">
                    <Flame className="h-5 w-5 fill-current" />
                  </div>

                  <div>

                    <div className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#A7CC6C] sm:text-[10px]">
                      Promo Terbatas
                    </div>

                    <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                      FLASH SALE
                    </h2>

                    <p className="text-xs text-slate-300">
                      {flashSale.name}
                    </p>

                  </div>

                </div>

                {/* COUNTDOWN */}

                {remainingTime &&
                  !remainingTime.isExpired && (
                    <div className="flex flex-wrap items-center gap-2">

                      <span className="text-xs font-medium text-slate-300 sm:text-sm">
                        Berakhir dalam
                      </span>

                      <div className="flex items-center gap-1">

                        <CountdownBox
                          value={
                            remainingTime.hours
                          }
                        />

                        <span className="font-black text-[#A7CC6C]">
                          :
                        </span>

                        <CountdownBox
                          value={
                            remainingTime.minutes
                          }
                        />

                        <span className="font-black text-[#A7CC6C]">
                          :
                        </span>

                        <CountdownBox
                          value={
                            remainingTime.seconds
                          }
                        />

                      </div>

                    </div>
                  )}

                {/* EXPIRED */}

                {remainingTime?.isExpired && (
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                    Flash Sale telah berakhir
                  </span>
                )}

              </div>

              {/* RIGHT */}

              <Link
                href={
                  flashSaleHref
                }
                className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Lihat Semua

                <ChevronRight className="h-4 w-4" />
              </Link>

            </div>

          </div>

          {/* ================================================== */}
          {/* PRODUCTS GRID */}
          {/* ================================================== */}

          <div className="bg-slate-50/60 p-3 sm:p-4 lg:p-5">

            {/*
             * Mobile       : 3 kolom
             * Tablet       : 4 kolom
             * Desktop      : 5 kolom
             * Large Screen : 6 kolom
             */}

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">

              {items.map(
                (item) => (
                  <FlashSaleProductCard
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    productsHref={
                      productsHref
                    }
                  />
                )
              )}

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

/**
 * ============================================================
 * FLASH SALE PRODUCT CARD
 * ============================================================
 */

function FlashSaleProductCard({
  item,
  productsHref,
}: {
  item: FlashSaleItem;

  productsHref: string;
}) {
  /**
   * ==========================================================
   * PRICE
   * ==========================================================
   */

  const originalPrice =
    toNumber(
      item.originalPrice
    );

  const flashPrice =
    toNumber(
      item.flashPrice
    );

  /**
   * ==========================================================
   * STOCK
   * ==========================================================
   */

  const soldQuantity =
    Math.max(
      0,
      item.soldQuantity
    );

  const stockLimit =
    Math.max(
      0,
      item.stockLimit
    );

  /**
   * ==========================================================
   * PROGRESS
   * ==========================================================
   */

  const progress =
    stockLimit > 0
      ? Math.min(
          100,
          Math.round(
            (
              soldQuantity /
              stockLimit
            ) *
              100
          )
        )
      : 0;

  /**
   * ==========================================================
   * DISCOUNT
   * ==========================================================
   */

  const discountPercentage =
    originalPrice > 0
      ? Math.max(
          0,
          Math.round(
            (
              (
                originalPrice -
                flashPrice
              ) /
              originalPrice
            ) *
              100
          )
        )
      : 0;

  /**
   * ==========================================================
   * IMAGE
   * ==========================================================
   */

  const image =
    getProductImage(
      item.product.images
    );

  /**
   * ==========================================================
   * PRODUCT URL
   * ==========================================================
   */

  const productHref =
    `${productsHref}/${item.product.slug}`;

  return (
    <Link
      href={
        productHref
      }
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#79A943]/50 hover:shadow-md"
    >

      {/* ==================================================== */}
      {/* IMAGE */}
      {/* ==================================================== */}

      <div className="relative aspect-square overflow-hidden bg-slate-100">

        {image ? (
          <Image
            src={
              image
            }
            alt={
              item.product.name
            }
            fill
            sizes="(max-width: 639px) 33vw, (max-width: 1023px) 25vw, (max-width: 1279px) 20vw, 16vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-50 px-2 text-[#294866]">

            <Package className="h-6 w-6 sm:h-8 sm:w-8" />

            <span className="text-center text-[9px] leading-tight sm:text-xs">
              Gambar belum tersedia
            </span>

          </div>
        )}

        {/* DISCOUNT */}

        {discountPercentage > 0 && (
          <div className="absolute left-1 top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow-md sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-xs">
            -
            {discountPercentage}
            %
          </div>
        )}

      </div>

      {/* ==================================================== */}
      {/* CONTENT */}
      {/* ==================================================== */}

      <div className="flex min-h-0 flex-1 flex-col p-2 sm:p-3">

        {/* PRODUCT NAME */}

        <h3 className="line-clamp-2 min-h-8 text-[11px] font-bold leading-4 text-[#17324D] transition group-hover:text-[#5F9135] sm:min-h-10 sm:text-sm sm:leading-5">
          {item.product.name}
        </h3>

        {/* WEIGHT */}

        {item.weightOption && (
          <p className="mt-1 truncate text-[9px] text-slate-400 sm:text-xs">
            {item.weightOption.label}
          </p>
        )}

        {/* PRICE */}

        <div className="mt-2 sm:mt-3">

          <p className="truncate text-xs font-black text-red-600 sm:text-base">
            {formatRupiah(
              item.flashPrice
            )}
          </p>

          {originalPrice >
            flashPrice && (
            <p className="mt-0.5 truncate text-[9px] text-slate-400 line-through sm:text-xs">
              {formatRupiah(
                item.originalPrice
              )}
            </p>
          )}

        </div>

        {/* PROGRESS */}

        <div className="mt-2 sm:mt-3">

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 sm:h-2">

            <div
              className="h-full rounded-full bg-gradient-to-r from-[#79A943] to-[#A7CC6C] transition-all duration-500"
              style={{
                width:
                  `${progress}%`,
              }}
            />

          </div>

          <p className="mt-1 truncate text-[8px] font-medium text-slate-500 sm:mt-1.5 sm:text-[11px]">

            Terjual{" "}

            <span className="font-bold text-[#5F9135]">
              {soldQuantity}
            </span>

            {" / "}

            {stockLimit}

          </p>

        </div>

      </div>

    </Link>
  );
}