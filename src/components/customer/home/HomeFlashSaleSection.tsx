"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Flame,
  Package,
  Timer,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * ============================================================
 * HOME FLASH SALE
 * ============================================================
 *
 * Business logic tetap:
 * - hanya item dengan stockLimit > 0
 * - maksimal 12 item
 * - countdown realtime
 * - harga flashSale dari data campaign
 * - link menuju filter Flash Sale
 *
 * UI:
 * - Mobile: horizontal product rail
 * - Desktop: grid
 * - Banner Flash Sale dapat dikonfigurasi dari Admin Settings
 * - fokus pada harga promo dan urgensi countdown
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

interface FlashSaleItem {
  id: string;
  originalPrice: NumericValue;
  flashPrice: NumericValue;
  stockLimit: number;
  soldQuantity: number;
  product: FlashSaleProduct;
  sku:
    | {
        id: string;
        sku: string;
        price: NumericValue;
        stock: number;
      }
    | null;
}

interface FlashSaleData {
  id: string;
  name: string;
  endAt: string | Date;
  items: FlashSaleItem[];
}

interface HomeFlashSaleSectionProps {
  flashSale: FlashSaleData;
  productsHref: string;
  bannerImage?: string | null;
  bannerContent?: {
    label?: string | null;
    title?: string | null;
    highlight?: string | null;
    description?: string | null;
  };
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function toNumber(value: NumericValue): number {
  return typeof value === "number"
    ? value
    : value.toNumber();
}

function formatRupiah(value: NumericValue): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, toNumber(value)));
}

function getProductImage(
  images: FlashSaleProductImage[] | undefined
): string | null {
  if (!images?.length) {
    return null;
  }

  const thumbnail = images.find(
    (item) => item.isThumbnail
  );

  return (
    thumbnail?.image ??
    images.find((item) => item.image)?.image ??
    null
  );
}

function getDiscountPercent(
  originalPrice: NumericValue,
  flashPrice: NumericValue
): number {
  const original = toNumber(originalPrice);
  const flash = toNumber(flashPrice);

  if (original <= 0 || flash >= original) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(((original - flash) / original) * 100)
  );
}

function getRemainingTime(endAt: string | Date) {
  const difference = Math.max(
    0,
    new Date(endAt).getTime() - Date.now()
  );

  const totalSeconds = Math.floor(
    difference / 1000
  );

  const days = Math.floor(
    totalSeconds / 86400
  );

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: difference <= 0,
  };
}

/**
 * ============================================================
 * COUNTDOWN
 * ============================================================
 */

function Countdown({
  remaining,
}: {
  remaining: ReturnType<typeof getRemainingTime>;
}) {
  if (remaining.isExpired) {
    return (
      <div
        className="
          rounded-xl
          border
          border-white/20
          bg-white/10
          px-2.5
          py-1.5
          text-[10px]
          font-bold
          text-white
          shadow-sm
          backdrop-blur-md
          sm:rounded-2xl
          sm:px-3
          sm:py-2
          sm:text-[11px]
        "
      >
        Promo berakhir
      </div>
    );
  }

  const units =
    remaining.days > 0
      ? [
          {
            value: remaining.days,
            label: "Hari",
          },
          {
            value: remaining.hours,
            label: "Jam",
          },
          {
            value: remaining.minutes,
            label: "Menit",
          },
        ]
      : [
          {
            value: remaining.hours,
            label: "Jam",
          },
          {
            value: remaining.minutes,
            label: "Menit",
          },
          {
            value: remaining.seconds,
            label: "Detik",
          },
        ];

  return (
    <div
      className="
        flex
        items-center
        gap-1.5
        rounded-xl
        border
        border-white/20
        bg-white/10
        px-2
        py-1.5
        shadow-sm
        backdrop-blur-md
        sm:gap-2
        sm:rounded-2xl
        sm:px-3
        sm:py-2
      "
    >
      {/* TIMER ICON */}
      <div
        className="
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-white/10
          text-[var(--fresh-400)]
          ring-1
          ring-white/10
          sm:h-8
          sm:w-8
          sm:rounded-xl
        "
      >
        <Timer
          aria-hidden="true"
          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
        />
      </div>

      {/* COUNTDOWN CONTENT */}
      <div className="min-w-0">
        <p
          className="
            text-[8px]
            font-black
            uppercase
            leading-none
            tracking-[0.12em]
            text-white/70
            sm:text-[9px]
            sm:tracking-[0.14em]
          "
        >
          Berakhir dalam
        </p>

        <div className="mt-1 flex items-center gap-0.5 sm:gap-1">
          {units.map((unit, index) => (
            <div
              key={unit.label}
              className="flex items-center gap-0.5 sm:gap-1"
            >
              {/* TIME BOX */}
              <div
                className="
                  min-w-[34px]
                  rounded-lg
                  border
                  border-white/15
                  bg-white/10
                  px-1
                  py-1
                  text-center
                  shadow-none
                  ring-0
                  backdrop-blur-sm
                  sm:min-w-[40px]
                  sm:rounded-xl
                  sm:px-1.5
                  sm:py-1.5
                "
              >
                <div
  className="
    text-xs
    font-black
    leading-4
    tabular-nums
    text-rose-500
    sm:text-sm
  "
>
  {String(unit.value).padStart(2, "0")}
</div>

                <div
                  className="
                    mt-0.5
                    text-[6px]
                    font-bold
                    uppercase
                    leading-none
                    tracking-wide
                    text-white/55
                    sm:text-[7px]
                  "
                >
                  {unit.label}
                </div>
              </div>

              {/* SEPARATOR */}
              {index < units.length - 1 && (
                <span
                  aria-hidden="true"
                  className="
                    px-0.5
                    text-[10px]
                    font-black
                    leading-none
                    text-white/45
                    sm:text-xs
                  "
                >
                  :
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * PRODUCT CARD
 * ============================================================
 */

function FlashSaleProductCard({
  item,
}: {
  item: FlashSaleItem;
}) {
  const image = getProductImage(
    item.product.images
  );

  const discount = getDiscountPercent(
    item.originalPrice,
    item.flashPrice
  );

  const soldPercent =
    item.stockLimit > 0
      ? Math.min(
          100,
          Math.round(
            (item.soldQuantity /
              item.stockLimit) *
              100
          )
        )
      : 0;

  return (
    <Link
      href={`/customer/products/${item.product.slug}`}
      className="
        group
        block
        w-[158px]
        shrink-0
        overflow-hidden
        rounded-2xl
        border
        border-slate-100
        bg-white
        shadow-[0_5px_18px_rgba(18,58,99,0.08)]
        transition
        duration-200
        active:scale-[0.99]
        sm:w-auto
        sm:min-w-0
        sm:rounded-2xl
        lg:hover:-translate-y-1
        lg:hover:shadow-[0_12px_28px_rgba(18,58,99,0.12)]
      "
    >
      {/* IMAGE */}
      <div
        className="
          relative
          aspect-square
          overflow-hidden
          bg-(--ice-50)
        "
      >
        {image ? (
          <Image
            src={image}
            alt={item.product.name}
            fill
            sizes="
              (max-width: 639px) 158px,
              (max-width: 1023px) 180px,
              210px
            "
            className="
              object-contain
              p-2
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
            <Package className="h-8 w-8" />
          </div>
        )}

        {discount > 0 && (
          <span
            className="
              absolute
              left-2
              top-2
              rounded-md
              bg-rose-500
              px-1.5
              py-1
              text-[9px]
              font-black
              text-white
            "
          >
            -{discount}%
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-3">
        <h3
          className="
            line-clamp-2
            min-h-8
            text-[11px]
            font-bold
            leading-4
            text-slate-800
            sm:text-xs
          "
        >
          {item.product.name}
        </h3>

        <p
          className="
            mt-2
            text-sm
            font-black
            leading-5
            text-[var(--ocean-900)]
            sm:text-base
          "
        >
          {formatRupiah(item.flashPrice)}
        </p>

        <p
          className="
            mt-0.5
            truncate
            text-[10px]
            text-slate-400
            line-through
          "
        >
          {formatRupiah(item.originalPrice)}
        </p>

        {/* STOCK */}
        <div className="mt-2">
          <div
            className="
              h-1.5
              overflow-hidden
              rounded-full
              bg-slate-100
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-rose-500
                transition-all
              "
              style={{
                width: `${soldPercent}%`,
              }}
            />
          </div>

          <p
            className="
              mt-1
              text-[9px]
              font-medium
              text-slate-400
            "
          >
            {item.soldQuantity > 0
              ? `${item.soldQuantity} terjual`
              : "Stok terbatas"}
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * ============================================================
 * MAIN COMPONENT
 * ============================================================
 */

export default function HomeFlashSaleSection({
  flashSale,
  productsHref,
  bannerImage,
  bannerContent,
}: HomeFlashSaleSectionProps) {
  const [remaining, setRemaining] =
    useState(
      getRemainingTime(
        flashSale.endAt
      )
    );

  useEffect(() => {
    const update = () => {
      setRemaining(
        getRemainingTime(
          flashSale.endAt
        )
      );
    };

    update();

    const interval =
      window.setInterval(update, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [flashSale.endAt]);

  const items = useMemo(
    () =>
      flashSale.items
        .filter(
          (item) => item.stockLimit > 0
        )
        .slice(0, 12),
    [flashSale.items]
  );

  if (
    items.length === 0 ||
    remaining.isExpired
  ) {
    return null;
  }

  const flashSaleHref =
    `${productsHref}?flashSale=${flashSale.id}`;

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-gradient-to-b
        from-[var(--ice-100)]
        via-[var(--ice-50)]
        to-white
        py-6
        sm:py-8
        lg:py-10
      "
    >
      {/* ====================================================
          PISJO OCEAN DECORATION
      ==================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
      >
        <div
          className="
            absolute
            -left-24
            top-10
            h-64
            w-64
            rounded-full
            bg-[var(--ocean-200)]/35
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -right-24
            top-0
            h-80
            w-80
            rounded-full
            bg-[var(--ocean-300)]/25
            blur-3xl
          "
        />

        <div
          className="
            absolute
            left-1/2
            top-32
            h-56
            w-56
            -translate-x-1/2
            rounded-full
            border
            border-white/70
          "
        />

        <div
          className="
            absolute
            left-1/2
            top-44
            h-72
            w-72
            -translate-x-1/2
            rounded-full
            border
            border-white/45
          "
        />
      </div>

      <div
        className="
          relative
          z-10
          mx-auto
          w-full
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
{/* ====================================================
    FLASH SALE BANNER
==================================================== */}

<div
  className="
    relative
    mx-auto
    mb-5
    w-full
    overflow-hidden
    rounded-3xl
    border
    border-white/70
    bg-[var(--ocean-900)]
    shadow-[0_10px_30px_rgba(0,80,150,0.12)]
    sm:mb-6
  "
>
  {/* BACKGROUND IMAGE */}
  {bannerImage ? (
    <div className="absolute inset-0">
      <Image
        src={bannerImage}
        alt="Flash Sale Pisjo Market"
        fill
        priority
        sizes="
          (max-width: 639px) 100vw,
          (max-width: 1279px) 100vw,
          1280px
        "
        className="object-cover object-center"
      />
    </div>
  ) : (
    <div
      aria-hidden="true"
      className="
        absolute
        inset-0
        bg-gradient-to-br
        from-[var(--ocean-950)]
        via-[var(--ocean-800)]
        to-[var(--ocean-500)]
      "
    />
  )}

  {/* OVERLAY */}
  <div
    aria-hidden="true"
    className="
      absolute
      inset-0
      bg-gradient-to-r
      from-[var(--ocean-950)]/90
      via-[var(--ocean-900)]/65
      to-transparent
    "
  />

  {/* CONTENT */}
  <div
    className="
      relative
      z-10
      flex
      min-h-[245px]
      flex-col
      justify-between
      px-5
      py-5
      sm:min-h-[255px]
      sm:px-8
      sm:py-6
      lg:min-h-[270px]
      lg:px-10
      lg:py-7
    "
  >
    {/* TOP */}
    <div
      className="
        flex
        items-start
        justify-between
        gap-4
      "
    >
      {/* LEFT */}
      <div className="min-w-0">
        {/* BADGE */}
        <div
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            border
            border-white/20
            bg-white/10
            px-3
            py-1.5
            text-[9px]
            font-black
            uppercase
            tracking-[0.14em]
            text-white
            backdrop-blur-sm
            sm:text-[10px]
          "
        >
          <Flame
            aria-hidden="true"
            className="
              h-3.5
              w-3.5
              text-[var(--fresh-400)]
            "
          />

          {bannerContent?.label || "Flash Sale"}
        </div>

        {/* TITLE */}
        <h2
          className="
            mt-4
            max-w-[420px]
            text-[23px]
            font-black
            leading-[1.05]
            tracking-tight
            text-white
            sm:text-3xl
            lg:text-4xl
          "
        >
          {bannerContent?.title || "Seafood Favorit,"}

<span
  className="
    block
    text-[var(--fresh-400)]
  "
>
  {bannerContent?.highlight ||
    "Harga Lebih Menarik."}
</span>
        </h2>
      </div>

      {/* COUNTDOWN */}
      <div className="shrink-0">
        <Countdown remaining={remaining} />
      </div>
    </div>

    {/* BOTTOM */}
    <div
      className="
        mt-6
        flex
        items-end
        justify-between
        gap-3
        border-t
        border-white/15
        pt-3
        sm:mt-7
        sm:pt-4
      "
    >
      <div className="min-w-0">
        <p
          className="
            text-[8px]
            font-black
            uppercase
            tracking-[0.16em]
            text-[var(--fresh-400)]
            sm:text-[9px]
          "
        >
          Flash Sale
        </p>

        <h3
          className="
            mt-0.5
            truncate
            text-sm
            font-black
            text-white
            sm:text-base
            lg:text-lg
          "
        >
          {flashSale.name}
        </h3>
      </div>

      <Link
        href={flashSaleHref}
        className="
          group
          inline-flex
          shrink-0
          items-center
          gap-0.5
          rounded-full
          border
          border-white/20
          bg-white/10
          px-3
          py-1.5
          text-[10px]
          font-bold
          text-white
          backdrop-blur-sm
          transition
          hover:bg-white/20
          sm:px-3.5
          sm:py-2
          sm:text-xs
        "
      >
        <span className="whitespace-nowrap">
          Lihat Semua
        </span>

        <ChevronRight
          aria-hidden="true"
          className="
            h-3.5
            w-3.5
            transition-transform
            group-hover:translate-x-0.5
            sm:h-4
            sm:w-4
          "
        />
      </Link>
    </div>
  </div>
</div>

        {/* ====================================================
            PRODUCT RAIL
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
            rounded-3xl
            px-4
            pb-3
            scrollbar-none

            sm:mx-0
            sm:grid
            sm:grid-cols-4
            sm:gap-4
            sm:overflow-visible
            sm:px-0

            lg:grid-cols-5
            lg:gap-5
          "
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="
                snap-start
              "
            >
              <FlashSaleProductCard
                item={item}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
