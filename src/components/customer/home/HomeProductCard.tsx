"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  Clock,
  Flame,
  Package,
  Plus,
  Sparkles,
} from "lucide-react";

import HomeProductQuickAddSheet from "@/components/customer/home/HomeProductQuickAddSheet";

/**
 * ============================================================
 * HOME PRODUCT CARD
 * ============================================================
 *
 * Reusable product card untuk:
 *
 * - Produk Pilihan
 * - Produk Terlaris
 * - Produk Terbaru
 *
 * Optimized untuk:
 *
 * Mobile kecil  → 3 produk
 * Mobile besar  → 4 produk
 * Desktop       → 6 produk
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export interface HomeProductImage {
  id: string;

  image:
    | string
    | null;

  sortOrder:
    | number
    | null;

  isThumbnail?: boolean;
}

export interface HomeProductCardProduct {
  id: string;

  name: string;

  slug: string;

  price: number;

  stock: number | null;

  images: HomeProductImage[];

  soldQuantity?: number;

  hasVariants?: boolean;

  isOutOfStock?: boolean;

  isPreOrder?: boolean;

  preOrderMinDays?: number | null;

  preOrderMaxDays?: number | null;
}

export type HomeProductBadge =
  | "featured"
  | "best-seller"
  | "new"
  | null;

interface HomeProductCardProps {
  product:
    HomeProductCardProduct;

  productsHref: string;

  badge?: HomeProductBadge;

  rank?: number;
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

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
  ).format(
    Math.max(
      0,
      value
    )
  );
}

function getProductImage(
  images:
    | HomeProductImage[]
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
      (image) =>
        image.isThumbnail
    );

  return (
    thumbnail?.image ??
    images[0]?.image ??
    null
  );
}

/**
 * ============================================================
 * PRODUCT BADGE
 * ============================================================
 */

function ProductBadge({
  badge,
  rank,
}: {
  badge: HomeProductBadge;

  rank?: number;
}) {
  /**
   * ==========================================================
   * NEW PRODUCT
   * ==========================================================
   */

  if (
    badge === "new"
  ) {
    return (
      <div
        className="
          absolute
          z-30
          right-1
          top-1
          inline-flex
          items-center
          gap-0.5
          rounded-md
          border
          border-white/30
          bg-(--fresh-600)
          px-1.5
          py-1
          text-[8px]
          font-black
          tracking-wide
          text-white
          shadow-lg

          sm:right-1.5
          sm:top-1.5
          sm:gap-1
          sm:px-2
          sm:text-[10px]
        "
      >
        <Sparkles
          className="
            h-2.5
            w-2.5

            sm:h-3
            sm:w-3
          "
        />

        <span>
          BARU
        </span>
      </div>
    );
  }

  /**
   * ==========================================================
   * BEST SELLER
   * ==========================================================
   *
   * HOT hanya untuk ranking 1-3.
   *
   * z-30 memastikan badge selalu berada
   * di atas gambar dan overlay.
   */

  if (
    badge === "best-seller" &&
    rank &&
    rank <= 3
  ) {
    return (
      <div
        className="
          absolute
          z-30
          right-1
          top-1
          inline-flex
          items-center
          gap-0.5
          rounded-md
          border
          border-orange-300/60
          bg-linear-to-r
          from-orange-500
          to-red-500
          px-1.5
          py-1
          text-[8px]
          font-black
          tracking-wide
          text-white
          shadow-lg
          shadow-orange-500/30

          sm:right-1.5
          sm:top-1.5
          sm:gap-1
          sm:px-2
          sm:text-[10px]
        "
      >
        <Flame
          className="
            h-2.5
            w-2.5
            fill-current

            sm:h-3
            sm:w-3
          "
        />

        <span>
          HOT
        </span>
      </div>
    );
  }

  return null;
}

/**
 * ============================================================
 * HOME PRODUCT CARD
 * ============================================================
 */

export default function HomeProductCard({
  product,
  productsHref,
  badge = null,
  rank,
}: HomeProductCardProps) {
  const [
    quickAddOpen,
    setQuickAddOpen,
  ] = useState(false);

  const image =
    getProductImage(
      product.images
    );

  const productHref =
    `${productsHref}/${product.slug}`;

  const hasSoldQuantity =
    typeof product.soldQuantity ===
    "number";

  const hasVariants =
    product.hasVariants === true;

  const displayPriceLabel =
    hasVariants
      ? "Mulai dari"
      : null;

  const hasStock =
  typeof product.stock === "number";

const isPreOrder =
  product.isPreOrder === true;

const outOfStock =
  !isPreOrder &&
  (
    product.isOutOfStock === true ||
    (hasStock && (product.stock ?? 0) <= 0)
  );

  const showPreOrderBadge =
    isPreOrder;

  const preOrderEstimate =
    isPreOrder &&
    product.preOrderMinDays != null &&
    product.preOrderMaxDays != null
      ? `${product.preOrderMinDays}–${product.preOrderMaxDays} hari`
      : null;

  return (
    <>
      <div
        className="
          group
          relative
          flex
          min-w-0
          flex-col
          overflow-hidden
          rounded-lg
          border
          border-(--ice-200)
          bg-white
          shadow-[0_2px_8px_rgba(15,23,42,0.05)]
          transition
          duration-200

          active:scale-[0.98]

          sm:rounded-xl
          sm:hover:-translate-y-1
          sm:hover:border-(--fresh-300)
          sm:hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)]
        "
      >
        {/* ================================================== */}
        {/* PRODUCT LINK */}
        {/* ================================================== */}

        <Link
          href={productHref}
          className="block"
        >
          {/* ================================================== */}
          {/* IMAGE */}
          {/* ================================================== */}

          <div
            className="
              relative
              aspect-square
              overflow-hidden
              bg-(--ice-100)
            "
          >
            {/* ================================================== */}
            {/* PRODUCT IMAGE / FALLBACK */}
            {/* ================================================== */}

            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                sizes="
                  (max-width: 639px) 33vw,
                  (max-width: 1023px) 25vw,
                  (max-width: 1279px) 20vw,
                  16.66vw
                "
                className={`
                  object-cover
                  transition-all
                  duration-300
                  ${
                    outOfStock
                      ? "grayscale opacity-60"
                      : "sm:group-hover:scale-105"
                  }
                `}
                unoptimized
              />
            ) : (
              <div
                className="
                  flex
                  h-full
                  w-full
                  flex-col
                  items-center
                  justify-center
                  gap-1
                  px-1
                  text-(--ink-400)
                "
              >
                <Package
                  className="
                    h-5
                    w-5

                    sm:h-7
                    sm:w-7
                  "
                />

                <span
                  className="
                    text-center
                    text-[8px]

                    sm:text-[10px]
                  "
                >
                  Gambar belum tersedia
                </span>
              </div>
            )}

{outOfStock && (
  <>
    {/* Darken image */}
    <div
      className="
        pointer-events-none
        absolute
        inset-0
        z-20
        bg-slate-950/20
      "
    />

    {/* ================================================== */}
    {/* FLOATING SOLD OUT BRUSH */}
    {/* ================================================== */}
    <div
      className="
        pointer-events-none
        absolute
        left-1/2
        top-1/2
        z-30
        w-[82%]
        -translate-x-1/2
        -translate-y-1/2
        rotate-[-10deg]
      "
    >
      <svg
  viewBox="0 0 500 130"
  className="
    block
    h-auto
    w-full
    overflow-visible
    drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)]
  "
  aria-hidden="true"
>
  {/* MAIN BRUSH */}
  <path
    d="
      M 42 30
      C 72 20, 102 27, 132 20
      C 164 16, 192 24, 222 18
      C 254 14, 282 23, 313 17
      C 344 14, 373 22, 402 17
      C 428 14, 449 21, 458 29

      L 452 101

      C 428 108, 402 104, 375 110
      C 345 115, 316 107, 286 112
      C 255 117, 226 109, 196 114
      C 165 118, 136 110, 108 115
      C 82 118, 59 111, 43 104

      L 48 88
      L 42 69
      Z
    "
    fill="#ef1010"
  />

  {/* LEFT UPPER BRUSH */}
  <path
    d="
      M 44 29
      C 34 29, 27 34, 20 39
      L 38 44
      L 49 37
      Z
    "
    fill="#ef1010"
  />

  {/* LEFT LOWER BRUSH */}
  <path
    d="
      M 44 98
      C 34 101, 27 106, 20 111
      L 41 108
      L 50 102
      Z
    "
    fill="#d90808"
  />

  {/* RIGHT UPPER BRUSH */}
  <path
    d="
      M 455 28
      C 466 28, 474 33, 481 39
      L 461 44
      L 451 36
      Z
    "
    fill="#ef1010"
  />

  {/* RIGHT LOWER BRUSH */}
  <path
    d="
      M 454 101
      C 466 99, 474 103, 481 109
      L 460 110
      L 451 103
      Z
    "
    fill="#d90808"
  />

  {/* TOP BRUSH STREAKS */}
  <path
    d="M 25 46 L 58 38"
    fill="none"
    stroke="#ff3333"
    strokeWidth="3"
    strokeLinecap="round"
  />

  <path
    d="M 438 37 L 477 45"
    fill="none"
    stroke="#ff3333"
    strokeWidth="3"
    strokeLinecap="round"
  />

  {/* BOTTOM BRUSH STREAKS */}
  <path
    d="M 25 105 L 61 112"
    fill="none"
    stroke="#c90707"
    strokeWidth="3"
    strokeLinecap="round"
  />

  <path
    d="M 439 110 L 477 102"
    fill="none"
    stroke="#c90707"
    strokeWidth="3"
    strokeLinecap="round"
  />

  {/* HABIS */}
  <text
    x="250"
    y="88"
    textAnchor="middle"
    fill="#ffffff"
    fontSize="48"
    fontWeight="900"
    fontFamily="Arial, Helvetica, sans-serif"
    letterSpacing="6"
  >
    HABIS
  </text>
</svg>
    </div>
  </>
)}
            {/* ================================================== */}
            {/* IMAGE BOTTOM GRADIENT */}
            {/* ================================================== */}

            <div
              className="
                pointer-events-none
                absolute
                inset-x-0
                bottom-0
                z-10
                h-10
                bg-linear-to-t
                from-black/10
                to-transparent
              "
            />

{/* ================================================== */}
{/* RANK */}
{/* ================================================== */}

{badge === "best-seller" &&
  rank && (
    <div
      className="
        absolute
        z-30
        left-1
        top-1
        flex
        h-6
        min-w-6
        items-center
        justify-center
        rounded-md
        border
        border-white/20
        bg-(--ocean-950)
        px-1
        text-[9px]
        font-black
        text-white
        shadow-lg

        sm:left-1.5
        sm:top-1.5
        sm:h-8
        sm:min-w-8
        sm:rounded-lg
        sm:px-2
        sm:text-sm
      "
    >
      #{rank}
    </div>
  )}

{/* ================================================== */}
{/* PRODUCT BADGE */}
{/* ================================================== */}

<ProductBadge
  badge={badge}
  rank={rank}
/>

{/* ================================================== */}
{/* PRE-ORDER BADGE */}
{/* ================================================== */}

{showPreOrderBadge && (
  <div
    className="
      absolute
      left-2
      top-2
      z-40
      flex
      flex-col
      items-start
    "
  >
    {/* PRE-ORDER */}
    <div
  className="
    inline-flex
    min-h-[25px]
    items-center
    gap-1
    rounded-full
    bg-red-500
    px-2.5
    py-1
    text-white
    shadow-[0_2px_6px_rgba(0,0,0,0.16)]

    sm:min-h-[28px]
    sm:gap-1.5
    sm:px-3
    sm:py-1.5
  "
>
  <Clock
    className="
      h-3
      w-3
      shrink-0
      stroke-[2.5]

      sm:h-3.5
      sm:w-3.5
    "
  />

  <span
    className="
      whitespace-nowrap
      text-[9px]
      font-bold
      leading-none

      sm:text-[10px]
    "
  >
    Pre-Order
  </span>
</div>

    {/* ESTIMASI */}
    {preOrderEstimate && (
  <div
    className="
      ml-1
      mt-1
      inline-flex
      min-h-[20px]
      items-center
      justify-center
      rounded-full
      bg-white
      px-2.5
      py-1
      text-[8px]
      font-semibold
      leading-none
      text-slate-700
      shadow-[0_2px_5px_rgba(0,0,0,0.12)]
      whitespace-nowrap

      sm:ml-1.5
      sm:mt-1
      sm:min-h-[22px]
      sm:px-3
      sm:text-[9px]
    "
  >
    Estimasi {preOrderEstimate}
  </div>
)}
  </div>
)}
          </div>

          {/* ================================================== */}
          {/* CONTENT */}
          {/* ================================================== */}

          <div
            className="
              flex
              flex-1
              flex-col
              p-2

              sm:p-3
            "
          >
            {/* ================================================== */}
            {/* PRODUCT NAME */}
            {/* ================================================== */}

            <h3
              className="
                line-clamp-2
                min-h-8
                text-[10px]
                font-bold
                leading-4
                text-(--ocean-950)
                transition

                sm:min-h-10
                sm:text-sm
                sm:leading-5
                sm:group-hover:text-(--ocean-700)
              "
            >
              {product.name}
            </h3>

            <div
              className="
                mt-auto
                pt-1.5

                sm:pt-3
              "
            >
              {/* ================================================== */}
              {/* PRICE */}
              {/* ================================================== */}

              <div
                className="
                  min-w-0
                "
              >
                {displayPriceLabel && (
                  <p
                    className="
                      text-[8px]
                      font-semibold
                      leading-3
                      text-(--ink-400)

                      sm:text-[10px]
                      sm:leading-4
                    "
                  >
                    {displayPriceLabel}
                  </p>
                )}

                <p
                  className="
                    truncate
                    text-[11px]
                    font-black
                    leading-4
                    text-(--fresh-700)

                    sm:text-base
                    sm:leading-5
                  "
                >
                  {formatRupiah(
                    product.price
                  )}
                </p>
              </div>

              {/* ================================================== */}
              {/* META */}
              {/* ================================================== */}

              <div
                className="
                  mt-1
                  flex
                  min-h-3
                  items-center
                  justify-start
                  gap-2
                  pr-10

                  sm:pr-12
                "
              >
                {/* ================================================== */}
                {/* SOLD */}
                {/* ================================================== */}

                {hasSoldQuantity && (
                  <p
                    className="
                      shrink-0
                      text-[8px]
                      font-bold
                      text-(--ocean-700)

                      sm:text-[11px]
                    "
                  >
                    {product.soldQuantity}

                    <span className="hidden sm:inline">
                      {" "}
                      terjual
                    </span>
                  </p>
                )}

                {/* ================================================== */}
                {/* STOCK */}
                {/* ================================================== */}

                {hasStock ? (
                  <p
                    className="
                      shrink-0
                      truncate
                      text-[8px]
                      text-(--ink-400)

                      sm:text-[11px]
                    "
                  >
                    <span className="hidden sm:inline">
                      Stok{" "}
                    </span>

                    <span
                      className="
                        font-bold
                        text-(--ink-600)
                      "
                    >
                      {product.stock}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </Link>

        {/* ================================================== */}
        {/* QUICK ADD */}
        {/* ================================================== */}

        <button
          type="button"
          aria-label={
            outOfStock
              ? `${product.name} sedang habis`
              : `Tambah ${product.name} ke keranjang`
          }
          disabled={outOfStock}
          onClick={() => {
            if (outOfStock) {
              return;
            }

            setQuickAddOpen(true);
          }}
          className={`
            absolute
            bottom-2
            right-2
            z-40
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            text-white
            shadow-lg
            transition

            ${
              outOfStock
                ? `
                  cursor-not-allowed
                  bg-slate-300
                  text-slate-500
                  shadow-none
                `
                : `
                  bg-(--fresh-600)
                  shadow-(--fresh-600)/25
                  active:scale-90
                  hover:bg-(--fresh-700)
                `
            }

            sm:bottom-3
            sm:right-3
            sm:h-9
            sm:w-9
          `}
        >
          <Plus
            className="
              h-4
              w-4
              stroke-[2.5]

              sm:h-5
              sm:w-5
            "
          />
        </button>
      </div>

      {/* ====================================================== */}
      {/* QUICK ADD SHEET */}
      {/* ====================================================== */}

      <HomeProductQuickAddSheet
        productId={product.id}
        productName={product.name}
        open={quickAddOpen}
        onClose={() =>
          setQuickAddOpen(false)
        }
      />
    </>
  );
}