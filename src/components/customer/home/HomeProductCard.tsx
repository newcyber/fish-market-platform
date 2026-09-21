"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  AlertTriangle,
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

  /**
   * Stock terendah dari variant aktif
   * yang masih memiliki stock positif
   * dan berada pada range low stock.
   */
  lowStockVariantStock?: number | null;

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
 * CONSTANTS
 * ============================================================
 */

/**
 * Produk dengan stock 1-5 dianggap hampir habis.
 */
const LOW_STOCK_THRESHOLD = 5;

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
          relative
          z-30
          inline-flex
          shrink-0
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
          relative
          z-30
          inline-flex
          shrink-0
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

  /**
   * Produk memiliki variant.
   */
  const hasVariants =
    product.hasVariants === true;

  /**
   * Apakah field stock tersedia.
   */
  const hasStock =
    typeof product.stock === "number";

  /**
   * Pre-order tidak menggunakan
   * logic low-stock / sold-out biasa.
   */
  const isPreOrder =
    product.isPreOrder === true;

  /**
   * ==========================================================
   * OUT OF STOCK
   * ==========================================================
   *
   * Untuk produk variant, status HABIS ditentukan oleh
   * product.isOutOfStock dari server.
   *
   * Server menentukan HABIS berdasarkan seluruh SKU aktif:
   * semua variant harus stock <= 0.
   *
   * Jadi satu variant habis tidak membuat seluruh produk HABIS
   * selama masih ada variant lain yang memiliki stock.
   *
   * Pre-order tidak pernah dianggap habis.
   */

  const outOfStock =
    !isPreOrder &&
    (
      product.isOutOfStock === true ||
      (
        !hasVariants &&
        hasStock &&
        (product.stock ?? 0) <= 0
      )
    );

  /**
   * ==========================================================
   * CURRENT STOCK
   * ==========================================================
   *
   * Hanya digunakan untuk produk tanpa variant.
   *
   * Stock tidak pernah ditampilkan
   * sebagai angka negatif.
   */

  const currentStock =
    hasStock
      ? Math.max(
          0,
          product.stock ?? 0
        )
      : null;

  /**
   * ==========================================================
   * LOW STOCK
   * ==========================================================
   *
   * Rules:
   *
   * Non-variant:
   * stock 1-5 = Hampir Habis
   *
   * Variant:
   * minimal salah satu variant aktif
   * memiliki stock 1-5 = Hampir Habis.
   *
   * Pre-order tidak pernah menampilkan
   * Hampir Habis.
   *
   * Out-of-stock tidak pernah menampilkan
   * Hampir Habis.
   */

  const isLowStock =
    !isPreOrder &&
    !outOfStock &&
    (
      (
        hasVariants &&
        typeof product.lowStockVariantStock ===
          "number" &&
        product.lowStockVariantStock > 0 &&
        product.lowStockVariantStock <=
          LOW_STOCK_THRESHOLD
      ) ||
      (
        !hasVariants &&
        currentStock !== null &&
        currentStock > 0 &&
        currentStock <=
          LOW_STOCK_THRESHOLD
      )
    );

  /**
   * Stock yang ditampilkan pada badge
   * "Sisa N".
   */
  const lowStockDisplay =
    hasVariants
      ? product.lowStockVariantStock
      : currentStock;

  const displayPriceLabel =
    hasVariants
      ? "Mulai dari"
      : null;

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

            {/* ================================================== */}
            {/* LOW STOCK BADGE */}
            {/* ================================================== */}

            {/* ================================================== */}
            {/* OUT OF STOCK */}
            {/* ================================================== */}

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
            {/* TOP BADGE LAYER */}
            {/* ================================================== */}
            {/*
             * Mobile cards use 3 columns and can become very narrow.
             * Stack all top badges on mobile so they can never overlap.
             * From sm upward, restore the horizontal layout.
             */}

            <div
              className="
                pointer-events-none
                absolute
                inset-x-1
                top-1
                z-40
                flex
                flex-col
                items-start
                gap-1

                sm:inset-x-1.5
                sm:top-1.5
                sm:flex-row
                sm:flex-nowrap
                sm:items-start
                sm:gap-1.5
              "
            >
              {isLowStock && (
                <div
                  className="
                    min-w-0
                    max-w-full
                    shrink-0
                    flex
                    flex-col
                    items-start
                  "
                >
                  <div
                    className="
                      inline-flex
                      min-h-5
                      max-w-full
                      items-center
                      justify-center
                      gap-0.5
                      rounded-full
                      bg-red-500
                      px-1.5
                      py-0.5
                      text-white
                      shadow-[0_2px_6px_rgba(0,0,0,0.16)]

                      sm:min-h-6
                      sm:gap-1
                      sm:px-2.5
                    "
                  >
                    <AlertTriangle
                      className="
                        h-2.5
                        w-2.5
                        shrink-0
                        fill-yellow-300
                        text-yellow-300
                        stroke-[2.5]

                        sm:h-3
                        sm:w-3
                      "
                    />

                    <span
                      className="
                        whitespace-nowrap
                        text-[8px]
                        font-bold
                        leading-none

                        sm:text-[9px]
                      "
                    >
                      Hampir Habis
                    </span>
                  </div>

                  <div
                    className="
                      ml-1
                      mt-1
                      inline-flex
                      min-h-4
                      items-center
                      justify-center
                      rounded-full
                      bg-white
                      px-1.5
                      py-0.5
                      text-[7px]
                      font-semibold
                      leading-none
                      text-slate-700
                      shadow-[0_2px_5px_rgba(0,0,0,0.12)]

                      sm:min-h-[20px]
                      sm:px-2
                      sm:text-[8px]
                    "
                  >
                    Sisa{" "}
                    {lowStockDisplay}
                  </div>
                </div>
              )}

              {showPreOrderBadge && (
                <div
                  className="
                    min-w-0
                    max-w-full
                    shrink-0
                    flex
                    flex-col
                    items-start
                  "
                >
                  <div
                    className="
                      inline-flex
                      min-h-5
                      max-w-full
                      items-center
                      gap-0.5
                      rounded-full
                      bg-red-500
                      px-1.5
                      py-0.5
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
                        h-2.5
                        w-2.5
                        shrink-0
                        stroke-[2.5]

                        sm:h-3.5
                        sm:w-3.5
                      "
                    />

                    <span
                      className="
                        whitespace-nowrap
                        text-[8px]
                        font-bold
                        leading-none

                        sm:text-[10px]
                      "
                    >
                      Pre-Order
                    </span>
                  </div>

                  {preOrderEstimate && (
                    <div
                      className="
                        ml-0.5
                        mt-0.5
                        inline-flex
                        min-h-4
                        max-w-full
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        px-2
                        py-1
                        text-[7px]
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

              <div className="shrink-0 sm:ml-auto">
                <ProductBadge
                  badge={badge}
                  rank={rank}
                />
              </div>
            </div>

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