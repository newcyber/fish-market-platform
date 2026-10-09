"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ChevronRight,
  Package,
  Plus,
  Timer,
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
  product: FlashSaleProduct;
  /**
   * SKU can be null for legacy/migrated records.
   * Customer rendering must remain resilient to that state.
   */
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
      <div
        className="
          rounded-xl
          border
          border-[#FFD2C3]
          bg-gradient-to-r
          from-[#C91F1F]
          to-[#FF5A36]
          px-2.5
          py-1.5
          text-[10px]
          font-black
          text-white
          shadow-[0_0_14px_rgba(255,55,35,0.52)]
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
      style={{
        border: "1px solid rgba(255, 210, 195, 0.98)",
        background: "linear-gradient(135deg, #C91F1F 0%, #E52B20 48%, #FF5A36 100%)",
        boxShadow: "0 0 0 1px rgba(255, 74, 54, 0.38), 0 0 12px 3px rgba(255, 55, 35, 0.58), 0 0 26px 7px rgba(220, 25, 25, 0.38), inset 0 1px 0 rgba(255,255,255,0.32)",
      }}
      className="
        group/timer
        relative
        flex
        items-center
        gap-1.5
        rounded-xl
        border
        border-[#FFD2C3]
        bg-gradient-to-br
        from-[#C91F1F]
        via-[#E52B20]
        to-[#FF5A36]
        px-2
        py-1.5
        shadow-[0_0_20px_rgba(255,55,35,0.62)]
        ring-1
        ring-[#FFB09A]/80
        backdrop-blur-md
        transition-all
        duration-300
        hover:border-white
        hover:shadow-[0_0_28px_rgba(255,55,35,0.78)]
        hover:ring-[#FFD2C3]
        sm:gap-2
        sm:rounded-2xl
        sm:px-3
        sm:py-2
      "
    >
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -inset-1
          rounded-2xl
          bg-[#FF4A36]/40
          blur-md
          opacity-65
          transition-opacity
          duration-300
          group-hover/timer:opacity-100
        "
      />
      {/* TIMER ICON */}
      <div
        className="
          relative
          z-10
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-lg
          border
          border-rose-200
          bg-gradient-to-br
          from-rose-400/80
          to-red-300/55
          text-rose-50
          shadow-[0_0_12px_rgba(251,113,133,0.95)]
          ring-1
          ring-white/10
          transition
          duration-300
          group-hover/timer:scale-105
          group-hover/timer:shadow-[0_0_18px_rgba(251,113,133,1)]
          sm:h-8
          sm:w-8
          sm:rounded-xl
        "
      >
        <Timer
          aria-hidden="true"
          className="
            h-3.5
            w-3.5
            drop-shadow-[0_0_5px_rgba(254,205,211,1)]
            sm:h-4
            sm:w-4
          "
        />
      </div>

      {/* COUNTDOWN CONTENT */}
      <div className="relative z-10 min-w-0">
        <p
          style={{ color: "#FFFFFF" }}
          className="
            text-[8px]
            font-black
            uppercase
            leading-none
            tracking-[0.12em]
            text-white
            drop-shadow-[0_1px_2px_rgba(120,25,15,0.18)]
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
                style={{
                  border: "1px solid rgba(255, 225, 210, 0.98)",
                  background: "linear-gradient(180deg, rgba(255, 85, 55, 0.98), rgba(190, 20, 25, 0.98) 58%, rgba(105, 10, 18, 0.98))",
                  boxShadow: "0 0 8px 2px rgba(255, 65, 45, 0.70), 0 0 16px 3px rgba(220, 25, 25, 0.42), inset 0 0 10px rgba(255, 225, 210, 0.28)",
                  textShadow: "0 0 5px rgba(255,255,255,0.65), 0 0 12px rgba(255,65,45,0.72)",
                }}
                className="
                  min-w-[34px]
                  rounded-lg
                  border
                  border-rose-200/90
                  bg-gradient-to-b
                  from-sky-300/55
                  via-rose-800/85
                  to-rose-950/80
                  px-1
                  py-1
                  text-center
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_0_10px_rgba(251,113,133,0.82)]
                  ring-1
                  ring-rose-300/70
                  backdrop-blur-sm
                  transition
                  duration-300
                  group-hover/timer:border-rose-200
                  group-hover/timer:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_14px_rgba(251,113,133,1)]
                  sm:min-w-[40px]
                  sm:rounded-xl
                  sm:px-1.5
                  sm:py-1.5
                "
              >
                <div
                  style={{ color: "#FFFFFF", textShadow: "0 0 5px rgba(255,255,255,0.95), 0 0 10px rgba(255,65,45,0.95), 0 0 18px rgba(220,25,25,0.78)" }}
  className="
    text-xs
    font-black
    leading-4
    tabular-nums
    text-white
    drop-shadow-[0_0_6px_rgba(255,255,255,0.95)] drop-shadow-[0_0_14px_rgba(255,65,45,0.95)]
    transition
    duration-300
    group-hover/timer:text-rose-50
    group-hover/timer:drop-shadow-[0_0_10px_rgba(251,113,133,1)]
    sm:text-sm
  "
>
  {String(unit.value).padStart(2, "0")}
</div>

                <div
                  style={{ color: "#FFFFFF", textShadow: "0 0 4px rgba(255,255,255,0.28)" }}
                  className="
                    mt-0.5
                    text-[6px]
                    font-bold
                    uppercase
                    leading-none
                    tracking-wide
                    text-white
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
                    text-white/85
                    drop-shadow-[0_0_6px_rgba(255,65,45,0.82)]
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

    {/* SELECT VARIANT */}
    <button
  type="button"
  onClick={() =>
    onQuickAdd(item)
  }
  aria-label={`Tambah ${item.product.name} ke keranjang`}
  title="Tambah ke keranjang"
  className="
    inline-flex
    h-9
    w-9
    shrink-0
    items-center
    justify-center
    rounded-full
    bg-[var(--ocean-900)]
    text-white
    shadow-sm
    transition
    hover:scale-105
    hover:bg-[var(--ocean-950)]
    active:scale-95
    focus:outline-none
    focus:ring-2
    focus:ring-[var(--ocean-900)]/30
  "
>
  <Plus
    aria-hidden="true"
    className="h-5 w-5"
    strokeWidth={2.5}
  />
</button>
  </div>

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
                      relative
                      inline-flex
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
                        fill-yellow-300
                        text-yellow-100
                        drop-shadow-[0_0_5px_rgba(253,224,71,0.95)]
                      "
                    />

                    <span className="relative">
                      {bannerContent?.label ||
                        "Flash Sale"}
                    </span>
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
                    {bannerContent?.title ||
                      "Seafood Favorit,"}

                    <span
                      className="
                        block
                        text-[var(--fresh-400)]
                        drop-shadow-[0_0_10px_rgba(132,204,22,0.28)]
                      "
                    >
                      {bannerContent?.highlight ||
                        "Harga Lebih Menarik."}
                    </span>
                  </h2>
                </div>

                {/* COUNTDOWN */}

                <div className="shrink-0">
                  <Countdown
                    remaining={remaining}
                  />
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