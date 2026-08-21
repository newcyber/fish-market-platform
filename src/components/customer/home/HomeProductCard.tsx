import Image from "next/image";
import Link from "next/link";

import {
  Flame,
  Package,
  Sparkles,
} from "lucide-react";

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

  stock: number;

  images: HomeProductImage[];

  soldQuantity?: number;
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
          bg-[var(--fresh-600)]
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
          bg-gradient-to-r
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
  const image =
    getProductImage(
      product.images
    );

  const productHref =
    `${productsHref}/${product.slug}`;

  const hasSoldQuantity =
    typeof product.soldQuantity ===
    "number";

  return (
    <Link
      href={
        productHref
      }
      className="
        group
        relative
        flex
        min-w-0
        flex-col
        overflow-hidden
        rounded-lg
        border
        border-[var(--ice-200)]
        bg-white
        shadow-[0_2px_8px_rgba(15,23,42,0.05)]
        transition
        duration-200

        active:scale-[0.98]

        sm:rounded-xl
        sm:hover:-translate-y-1
        sm:hover:border-[var(--fresh-300)]
        sm:hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)]
      "
    >

      {/* ================================================== */}
      {/* IMAGE */}
      {/* ================================================== */}

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
            src={
              image
            }
            alt={
              product.name
            }
            fill
            sizes="
              (max-width: 639px) 33vw,
              (max-width: 1023px) 25vw,
              (max-width: 1279px) 20vw,
              16.66vw
            "
            className="
              object-cover
              transition
              duration-300

              sm:group-hover:scale-105
            "
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
              text-[var(--ink-400)]
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

        {/* ============================================== */}
        {/* IMAGE OVERLAY */}
        {/* ============================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            z-10
            h-10
            bg-gradient-to-t
            from-black/10
            to-transparent
          "
        />

        {/* ============================================== */}
        {/* RANK */}
        {/* ============================================== */}

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
                bg-[var(--ocean-950)]
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

        {/* ============================================== */}
        {/* BADGE */}
        {/* ============================================== */}

        <ProductBadge
          badge={
            badge
          }
          rank={
            rank
          }
        />

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

        {/* PRODUCT NAME */}

        <h3
          className="
            line-clamp-2
            min-h-[2rem]
            text-[10px]
            font-bold
            leading-4
            text-[var(--ocean-950)]
            transition

            sm:min-h-[2.5rem]
            sm:text-sm
            sm:leading-5
            sm:group-hover:text-[var(--ocean-700)]
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

          {/* ============================================ */}
          {/* PRICE */}
          {/* ============================================ */}

          <p
            className="
              truncate
              text-[11px]
              font-black
              leading-4
              text-[var(--fresh-700)]

              sm:text-base
              sm:leading-5
            "
          >
            {formatRupiah(
              product.price
            )}
          </p>

          {/* ============================================ */}
          {/* META */}
          {/* ============================================ */}

          <div
            className="
              mt-1
              flex
              min-h-3
              items-center
              justify-between
              gap-1
            "
          >

            {/* STOCK */}

            <p
              className="
                truncate
                text-[8px]
                text-[var(--ink-400)]

                sm:text-[11px]
              "
            >
              <span className="hidden sm:inline">
                Stok{" "}
              </span>

              <span
                className="
                  font-bold
                  text-[var(--ink-600)]
                "
              >
                {product.stock}
              </span>
            </p>

            {/* SOLD */}

            {hasSoldQuantity && (
              <p
                className="
                  shrink-0
                  text-[8px]
                  font-bold
                  text-[var(--ocean-700)]

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

          </div>

        </div>

      </div>

    </Link>
  );
}