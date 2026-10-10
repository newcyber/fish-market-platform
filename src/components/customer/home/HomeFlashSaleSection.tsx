"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ChevronRight,
  Package,
  ShoppingCart,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import FlashSaleQuickAddModal from
  "@/components/customer/home/FlashSaleQuickAddModal";

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
  mediaType?: "IMAGE" | "VIDEO";
}

interface FlashSaleVariantOption {
  id: string;
  groupId: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

interface FlashSaleVariantGroup {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  options: FlashSaleVariantOption[];
}

interface FlashSaleSkuOption {
  id: string;
  skuId: string;
  variantOptionId: string;
  variantOption: FlashSaleVariantOption;
}

interface FlashSaleSku {
  id: string;
  sku: string;
  price: NumericValue;
  stock: number;
  isActive: boolean;
  skuOptions: FlashSaleSkuOption[];
}

interface FlashSaleProduct {
  id: string;
  name: string;
  slug: string;
  price: NumericValue;
  images?: FlashSaleProductImage[];
  variantGroups?: FlashSaleVariantGroup[];
  skus?: FlashSaleSku[];
}

interface FlashSaleItem {
  id: string;
  originalPrice: NumericValue;
  flashPrice: NumericValue;
  stockLimit: number;
  soldQuantity: number;
  perUserLimit: number | null;
  product: FlashSaleProduct;
  sku: FlashSaleSku | null;
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

  const imageOnly = images.filter(
    (item) =>
      !item.mediaType ||
      item.mediaType === "IMAGE"
  );

  const thumbnail = imageOnly.find(
    (item) => item.isThumbnail
  );

  return (
    thumbnail?.image ??
    imageOnly.find((item) => item.image)?.image ??
    null
  );
}

function getSoldStatus(
  soldQuantity: number,
  stockLimit: number
): string {
  if (stockLimit <= 0) {
    return "Stok habis";
  }

  const percent = Math.min(
    100,
    Math.round(
      (soldQuantity / stockLimit) * 100
    )
  );

  if (percent >= 90) {
    return "Hampir habis";
  }

  if (percent >= 70) {
    return "Banyak dibeli";
  }

  if (percent >= 40) {
    return "Mulai diminati";
  }

  return "Masih tersedia";
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
      <div className="rounded-full border border-[#FFD2C3] bg-gradient-to-r from-[#C91F1F] to-[#FF5A36] px-3 py-2 text-[10px] font-black text-white shadow-[0_0_14px_rgba(255,55,35,0.52)] backdrop-blur-md sm:text-[11px]">
        Promo berakhir
      </div>
    );
  }

  const units =
    remaining.days > 0
      ? [
          { value: remaining.days, label: "Hari" },
          { value: remaining.hours, label: "Jam" },
          { value: remaining.minutes, label: "Menit" },
        ]
      : [
          { value: remaining.hours, label: "Jam" },
          { value: remaining.minutes, label: "Menit" },
          { value: remaining.seconds, label: "Detik" },
        ];

  return (
    <div className="group/timer relative flex shrink-0 items-center gap-1 sm:gap-2">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-full bg-red-500/20 blur-md sm:-inset-1.5 sm:bg-red-500/25"
      />

      <div className="relative z-10 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {units.map((unit, index) => (
            <div key={unit.label} className="flex items-center gap-1 sm:gap-2">
              <div
                style={{
                  border: "1px solid rgba(255, 225, 210, 0.98)",
                  background: "linear-gradient(180deg, #FF5544 0%, #E52B20 48%, #B91420 100%)",
                  boxShadow: "0 0 0 1px rgba(255, 74, 54, 0.24), 0 0 8px 2px rgba(255, 65, 45, 0.58), inset 0 1px 0 rgba(255,255,255,0.28)",
                  borderRadius: "50%",
                  aspectRatio: "1 / 1",
                  textShadow: "0 0 5px rgba(255,255,255,0.45)",
                }}
                className="relative box-border flex h-8 w-8 min-h-8 min-w-8 flex-none flex-col items-center justify-center rounded-full text-center [border-radius:9999px] sm:h-11 sm:w-11 sm:min-h-11 sm:min-w-[44px]"
              >
                <span className="block text-[11px] font-black leading-none tabular-nums text-white sm:text-base sm:leading-[17px]">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="mt-0.5 hidden text-[5px] font-semibold uppercase leading-[6px] tracking-normal text-white sm:block sm:text-[7px] sm:leading-[8px] sm:tracking-wide">
                  {unit.label}
                </span>
              </div>
              {index < units.length - 1 && (
                <span aria-hidden="true" className="text-[8px] font-black leading-none text-white/90 drop-shadow-[0_0_5px_rgba(255,65,45,0.75)] sm:text-xs">
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
  onQuickAdd,
}: {
  item: FlashSaleItem;
  onQuickAdd: (
    item: FlashSaleItem
  ) => void;
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

  const soldStatus = getSoldStatus(
    item.soldQuantity,
    item.stockLimit
  );

  return (
    <div
  className="
        group
        block
        w-[138px]
        shrink-0
        overflow-hidden
        rounded-xl
        border
        border-slate-100
        bg-white
        shadow-[0_3px_12px_rgba(18,58,99,0.06)]
        transition
        duration-200
        active:scale-[0.99]
        hover:border-red-100
        hover:shadow-[0_10px_26px_rgba(239,68,68,0.12)]
        sm:w-auto
        sm:min-w-0
        sm:rounded-xl
        lg:hover:-translate-y-0.5
        lg:hover:shadow-[0_8px_20px_rgba(18,58,99,0.10)]
      "
    >
{/* IMAGE */}
<Link
  href={`/customer/products/${item.product.slug}`}
  className="block"
>
  <div
    className="
      relative
      aspect-square
      overflow-hidden
      bg-(--ice-50)
      sm:aspect-[1.05/1]
    "
  >
    {image ? (
      <Image
        src={image}
        alt={item.product.name}
        fill
        sizes="
          (max-width: 639px) 138px,
          (max-width: 1023px) 170px,
          190px
        "
        className="
          object-contain
          p-1.5
          transition
          duration-300
          group-hover:scale-105
          sm:p-2
        "
        unoptimized
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
        <Package className="h-6 w-6" />
      </div>
    )}

    {/* DISCOUNT BADGE */}
    {discount > 0 && (
      <span
        className="
          absolute
          left-1.5
          top-1.5
          z-10
          rounded-md
          bg-rose-500
          px-2
          py-1
          text-[9px]
          font-black
          leading-none
          text-white
          shadow-sm
          sm:text-[10px]
        "
      >
        -{discount}%
      </span>
    )}

    {/* FLASH SALE BADGE — FIERY RED */}
    <div className="absolute bottom-1.5 left-1.5 z-10">
      <span
        aria-hidden="true"
        className="
          absolute
          inset-0
          rounded-md
          bg-red-500/70
          blur-[5px]
        "
      />
      <span
        className="
          group/flashbadge
          relative
          inline-flex
          items-center
          gap-1
          overflow-hidden
          rounded-md
          border
          border-orange-300/70
          bg-gradient-to-r
          from-red-700
          via-red-500
          to-orange-500
          px-1.5
          py-1
          text-[7px]
          font-black
          uppercase
          leading-none
          tracking-wide
          text-white
          shadow-[0_2px_8px_rgba(239,68,68,0.55)]
          ring-1
          ring-red-400/40
          sm:text-[8px]
        "
      >
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-y-0
            left-0
            w-6
            -translate-x-[160%]
            bg-white/35
            blur-[2px]
            transition-transform
            duration-500
            group-hover/flashbadge:translate-x-[520%]
          "
        />

        <Zap
          aria-hidden="true"
          className="
            h-2.5
            w-2.5
            shrink-0
            fill-yellow-300
            text-yellow-200
            drop-shadow-[0_0_3px_rgba(253,224,71,0.9)]
            transition
            duration-300
            group-hover/flashbadge:drop-shadow-[0_0_7px_rgba(253,224,71,1)]
            sm:h-3
            sm:w-3
          "
        />
        Flash Sale
      </span>
    </div>
  </div>
</Link>

{/* CONTENT */}
<div className="p-2.5 sm:p-3">
  <Link
    href={`/customer/products/${item.product.slug}`}
    className="
      line-clamp-2
      min-h-8
      text-[10px]
      font-bold
      leading-4
      text-slate-800
      transition
      hover:text-[var(--ocean-900)]
      sm:text-[11px]
    "
  >
    {item.product.name}
  </Link>

  {/* PRICE */}
  <div className="mt-1.5 flex items-center justify-between gap-2">
    <div className="min-w-0">
      <p
        className="
          text-[14px]
          font-black
          leading-5
          tracking-tight
          text-[var(--ocean-900)]
          sm:text-[15px]
        "
      >
        {formatRupiah(item.flashPrice)}
      </p>

      <p
        className="
          mt-0.5
          truncate
          text-[10px]
          leading-4
          text-slate-400
          line-through
          sm:text-[11px]
        "
      >
        {formatRupiah(item.originalPrice)}
      </p>
    </div>

  </div>

  {/* BUY NOW */}
  <button
    type="button"
    onClick={() => onQuickAdd(item)}
    disabled={item.stockLimit <= 0}
    aria-label={`Beli sekarang ${item.product.name}`}
    className="
      mt-2
      inline-flex
      h-9
      w-full
      items-center
      justify-center
      gap-2
      rounded-lg
      bg-gradient-to-r
      from-red-600
      to-orange-500
      px-3
      text-xs
      font-black
      text-white
      shadow-sm
      transition
      hover:from-red-700
      hover:to-orange-600
      active:scale-[0.98]
      focus:outline-none
      focus:ring-2
      focus:ring-red-500/40
      disabled:cursor-not-allowed
      disabled:opacity-50
      sm:h-10
      sm:text-sm
    "
  >
    <ShoppingCart aria-hidden="true" className="h-4 w-4" />
    Beli Sekarang
  </button>

  {/* STOCK */}
  <div className="mt-2">
    {/* FLASH SALE PROGRESS */}
    <div
      className="
        relative
        h-2.5
        overflow-hidden
        rounded-full
        border
        border-red-100
        bg-slate-100
        shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]
        sm:h-3
      "
      aria-label={`${soldPercent}% produk terjual`}
      role="progressbar"
      aria-valuenow={soldPercent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Soft glow around the filled portion */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-y-0
          left-0
          rounded-full
          bg-red-500/50
          blur-[5px]
          transition-all
          duration-500
        "
        style={{
          width: `${soldPercent}%`,
        }}
      />

      {/* Main fiery progress fill */}
      <div
        className="
          relative
          h-full
          overflow-hidden
          rounded-full
          bg-gradient-to-r
          from-red-600
          via-red-500
          to-orange-400
          shadow-[0_0_10px_rgba(239,68,68,0.65)]
          transition-all
          duration-500
        "
        style={{
          width: `${soldPercent}%`,
          boxShadow:
            soldPercent >= 70
              ? "0 0 12px rgba(239,68,68,0.78)"
              : "0 0 8px rgba(239,68,68,0.55)",
        }}
      >
        {/* Moving hot highlight */}
        <span
          aria-hidden="true"
          className="
            absolute
            inset-y-0
            left-0
            w-8
            -translate-x-full
            bg-gradient-to-r
            from-transparent
            via-white/55
            to-transparent
            blur-[1px]
            transition-transform
            duration-700
            group-hover:translate-x-[850%]
          "
        />
      </div>
    </div>

    <div
      className="
        mt-1
        flex
        items-center
        justify-between
        gap-2
      "
    >
      <p
        className="
          flex
          min-w-0
          items-center
          gap-1
          truncate
          text-[9px]
          font-bold
          leading-3
          text-slate-500
          sm:text-[10px]
        "
      >
        <span
          aria-hidden="true"
          className="
            text-[8px]
            text-red-500
            drop-shadow-[0_0_4px_rgba(239,68,68,0.45)]
            sm:text-[9px]
          "
        >
          🔥
        </span>
        <span className="truncate">
          {item.soldQuantity > 0
            ? `${item.soldQuantity} terjual`
            : `${soldPercent}% terjual`}
        </span>
      </p>

      <span
        className={`
          shrink-0
          rounded-full
          px-1.5
          py-0.5
          text-[7px]
          font-black
          uppercase
          leading-none
          tracking-wide
          sm:text-[8px]
          ${
            soldPercent >= 90
              ? "bg-red-50 text-red-600"
              : soldPercent >= 70
                ? "bg-orange-50 text-orange-600"
                : soldPercent >= 40
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-50 text-slate-500"
          }
        `}
      >
        {soldStatus}
      </span>
  </div>
</div>
</div>
</div>
  );
}

/**
 * ============================================================
 * MAIN COMPONENT
 * ============================================================
 */

export default function HomeFlashSaleSection({
  flashSale,
  bannerImage,
  bannerContent,
}: HomeFlashSaleSectionProps) {
  const [quickAddItem, setQuickAddItem] =
    useState<FlashSaleItem | null>(null);

  // Jangan hitung Date.now() saat render awal.
  // Component ini di-SSR oleh Next.js, sehingga nilai countdown server
  // dan client bisa berbeda beberapa detik dan menyebabkan hydration mismatch.
  const [remaining, setRemaining] = useState<
    ReturnType<typeof getRemainingTime> | null
  >(null);

  useEffect(() => {
    const update = () => {
      setRemaining(
        getRemainingTime(flashSale.endAt)
      );
    };

    update();

    const interval =
      window.setInterval(update, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [flashSale.endAt]);

  const items = useMemo(() => {
    const uniqueProducts = new Map<string, FlashSaleItem>();

    for (const item of flashSale.items) {
      if (item.stockLimit <= 0) {
        continue;
      }

      const existing = uniqueProducts.get(item.product.id);

      // Jika produk punya beberapa varian Flash Sale,
      // tampilkan satu kartu dengan varian berharga promo terendah.
      if (
        !existing ||
        toNumber(item.flashPrice) < toNumber(existing.flashPrice)
      ) {
        uniqueProducts.set(item.product.id, item);
      }
    }

    // Batas 12 diterapkan setelah deduplikasi produk.
    return Array.from(uniqueProducts.values()).slice(0, 12);
  }, [flashSale.items]);

  if (
    items.length === 0 ||
    !remaining ||
    remaining.isExpired
  ) {
    return null;
  }

  const flashSaleHref = "/flash-sale";

  return (
    <>
      {/* ============================================================
          FLASH SALE SECTION
      ============================================================ */}

      <section
        className="
          relative
          w-full
          overflow-hidden
          bg-gradient-to-b
          from-[var(--ice-100)]
          via-[var(--ice-50)]
          to-white
          py-4
          sm:py-7
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

        {/* ====================================================
            MAIN CONTENT
        ==================================================== */}

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
            style={{
              border: "1px solid rgba(148, 163, 184, 0.65)",
              boxShadow: "0 14px 38px rgba(0, 80, 150, 0.18)",
            }}
            className="
              relative
              mx-auto
              mb-5
              w-full
              overflow-hidden
              rounded-3xl
              group
              border
              border-white/70
              bg-[var(--ocean-900)]
              shadow-[0_14px_38px_rgba(0,80,150,0.18)]
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

            {/* FIERY PROMO LIGHTING */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-20
                -top-24
                h-72
                w-72
                rounded-full
                bg-red-500/30
                opacity-70
                blur-3xl
                transition-all
                duration-500
                group-hover:scale-125
                group-hover:bg-red-500/45
                group-hover:opacity-100
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                right-8
                bottom-[-110px]
                h-64
                w-64
                rounded-full
                bg-orange-400/25
                opacity-60
                blur-3xl
                transition-all
                duration-500
                group-hover:scale-125
                group-hover:bg-orange-400/40
                group-hover:opacity-100
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                right-0
                top-0
                h-1
                w-2/3
                bg-gradient-to-r
                from-transparent
                via-orange-300/70
                to-red-500/80
                shadow-[0_0_18px_rgba(249,115,22,0.85)]
                opacity-75
                transition-all
                duration-500
                group-hover:h-1.5
                group-hover:opacity-100
                group-hover:shadow-[0_0_26px_rgba(249,115,22,1)]
              "
            />

            {/* HOVER SHEEN */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-y-0
                left-0
                z-[1]
                w-1/3
                -translate-x-full
                skew-x-[-18deg]
                bg-gradient-to-r
                from-transparent
                via-white/12
                to-transparent
                transition-transform
                duration-700
                group-hover:translate-x-[430%]
              "
            />

            {/* OVERLAY */}
            <div
              aria-hidden="true"
              className="
                absolute
                inset-0
                bg-gradient-to-r
                from-[var(--ocean-950)]/95
                via-[var(--ocean-900)]/72
                to-[var(--ocean-500)]/40
              "
            />

            {/* SUBTLE HOT SHEEN */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-y-0
                right-0
                w-1/2
                bg-gradient-to-l
                from-red-500/10
                via-orange-400/5
                to-transparent
              "
            />

            {/* CONTENT */}

            <div
              className="
                relative
                z-10
                flex
                min-h-[185px]
                flex-col
                justify-between
                px-4
                py-4
                sm:min-h-[215px]
                sm:px-7
                sm:py-5
                lg:min-h-[250px]
                lg:px-10
                lg:py-7
              "
            >
              {/* TOP */}

              <div className="relative flex flex-col gap-2 sm:block">
                {/* BADGE + TITLE */}
                <div className="min-w-0 w-full sm:w-auto sm:pr-44">
{/* BADGE + COUNTDOWN: satu baris pada mobile */}
                  <div className="mb-2 flex min-w-0 items-center justify-between gap-2 sm:mb-0 sm:block">
                  <div
                    className="
                      relative
                      inline-flex
                      w-fit
                      max-w-full
                      shrink-0
                      items-center
                      gap-1.5
                      overflow-hidden
                      rounded-full
                      border
                      border-orange-300/70
                      bg-gradient-to-r
                      from-red-700/95
                      via-red-500/95
                      to-orange-500/95
                      px-3
                      py-1.5
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-white
                      shadow-[0_0_18px_rgba(239,68,68,0.45)]
                      ring-1
                      ring-red-300/30
                      backdrop-blur-sm
                      transition
                      duration-300
                      hover:scale-[1.02]
                      hover:shadow-[0_0_26px_rgba(239,68,68,0.72)]
                      sm:text-[10px]
                    "
                  >
                    <span
                      aria-hidden="true"
                      className="
                        absolute
                        inset-y-0
                        left-0
                        w-8
                        -translate-x-full
                        bg-white/25
                        blur-sm
                        transition-transform
                        duration-700
                        hover:translate-x-[500%]
                      "
                    />

                    <Zap
                      aria-hidden="true"
                      className="
                        relative
                        h-3.5
                        w-3.5
                        shrink-0
                        fill-yellow-300
                        text-yellow-100
                        drop-shadow-[0_0_5px_rgba(253,224,71,0.95)]
                      "
                    />

                    <span className="relative whitespace-nowrap">
                      {bannerContent?.label ||
                        "Flash Sale"}
                    </span>
                  </div>
                  <div className="shrink-0 sm:hidden">
                    <Countdown remaining={remaining} />
                  </div>
                  </div>
                  <div className="absolute right-0 top-0 hidden sm:block">
                    <Countdown remaining={remaining} />
                  </div>

                  {/* TITLE */}

                  <h2
                    className="
                      mt-0
                      block
                      min-w-0
                      w-full
                      max-w-full
                      [overflow-wrap:normal]
                      text-[16px]
                      font-black
                      leading-[1.2]
                      tracking-tight
                      text-white
                      sm:mt-4
                      sm:max-w-[420px]
                      sm:text-3xl
                      sm:leading-[1.05]
                      lg:text-4xl
                    "
                  >
                    {bannerContent?.title ||
                      "Seafood Favorit,"}

                    <span
                      className="
                        block
                        text-[var(--fresh-400)]
                        sm:inline
                        drop-shadow-[0_0_10px_rgba(132,204,22,0.28)]
                      "
                    >
                      {bannerContent?.highlight ||
                        "Harga Lebih Menarik."}
                    </span>
                  </h2>
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
                className="snap-start"
              >
                <FlashSaleProductCard
                  item={item}
                  onQuickAdd={setQuickAddItem}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          QUICK ADD MODAL

          PENTING:
          Modal sengaja diletakkan DI LUAR <section>.
          Dengan begitu overflow-hidden pada Flash Sale
          tidak akan memotong modal.
      ============================================================ */}

      {quickAddItem && (
        <FlashSaleQuickAddModal
          item={quickAddItem}
          flashSaleItems={flashSale.items}
          onClose={() =>
            setQuickAddItem(null)
          }
        />
      )}
    </>
  );
}