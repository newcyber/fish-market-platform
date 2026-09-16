"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  ChevronRight,
  Clock3,
  Plus,
} from "lucide-react";

import HomeProductQuickAddSheet from
  "@/components/customer/home/HomeProductQuickAddSheet";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface HomePreOrderProductImage {
  id: string;

  image: string | null;

  sortOrder: number | null;

  isThumbnail: boolean;
}

export interface HomePreOrderProduct {
  id: string;

  name: string;

  slug: string;

  price: number;

  stock: number | null;

  isPreOrder: boolean;

  preOrderMinDays: number | null;

  preOrderMaxDays: number | null;

  images: HomePreOrderProductImage[];

  hasVariants?: boolean;
}

interface HomePreOrderSectionProps {
  products: HomePreOrderProduct[];

  productsHref: string;

  onAdded?: () => void;
}

/**
 * ============================================================
 * CURRENCY
 * ============================================================
 */

function formatCurrency(
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
    Number.isFinite(value)
      ? Math.max(0, value)
      : 0
  );
}

/**
 * ============================================================
 * SECTION
 * ============================================================
 */

export default function HomePreOrderSection({
  products,

  productsHref,

  onAdded,
}: HomePreOrderSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section
      className="
        w-full
        bg-white
        py-7
        sm:py-9
        lg:py-12
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div
          className="
            mb-5
            flex
            items-start
            justify-between
            gap-4
            sm:mb-7
          "
        >
          <div className="min-w-0">
            <h2
              className="
                text-2xl
                font-black
                tracking-tight
                text-(--ocean-950)
                sm:text-3xl
                lg:text-[36px]
                lg:leading-tight
              "
            >
              Produk Pre-Order
            </h2>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-slate-500
                sm:text-base
                sm:leading-7
                lg:text-lg
                lg:leading-8
              "
            >
              Seafood pilihan yang tersedia untuk
              pemesanan lebih awal. Tetap segar,
              langsung dari nelayan.
            </p>
          </div>

          {/* ==================================================
              LIHAT SEMUA
          ================================================== */}

          <Link
            href={productsHref}
            className="
              group
              inline-flex
              shrink-0
              items-center
              gap-1
              rounded-full
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              text-sm
              font-bold
              text-(--ocean-950)
              shadow-[0_4px_15px_rgba(15,23,42,0.08)]
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:border-slate-300
              hover:shadow-[0_8px_20px_rgba(15,23,42,0.10)]
              sm:gap-1.5
              sm:px-5
              sm:py-3
              sm:text-base
            "
          >
            <span>
              Lihat Semua
            </span>

            <ChevronRight
              className="
                h-4
                w-4
                transition-transform
                duration-200
                group-hover:translate-x-0.5
                sm:h-5
                sm:w-5
              "
            />
          </Link>
        </div>

        {/* ====================================================
            PRODUCT GRID
        ==================================================== */}

        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:gap-5
            lg:grid-cols-4
            lg:gap-6
          "
        >
          {products
            .filter(
              (product) =>
                product.isPreOrder === true
            )
            .map(
              (product) => (
                <PreOrderProductCard
                  key={product.id}
                  product={product}
                  productsHref={
                    productsHref
                  }
                  onAdded={onAdded}
                />
              )
            )}
        </div>
      </div>
    </section>
  );
}

/**
 * ============================================================
 * PRODUCT CARD
 * ============================================================
 */

interface PreOrderProductCardProps {
  product: HomePreOrderProduct;

  productsHref: string;

  onAdded?: () => void;
}

function PreOrderProductCard({
  product,

  productsHref,

  onAdded,
}: PreOrderProductCardProps) {
  const [
    quickAddOpen,
    setQuickAddOpen,
  ] = useState(false);

  /**
   * ==========================================================
   * PRODUCT IMAGE
   * ==========================================================
   */

  const image =
    product.images.find(
      (item) =>
        item.isThumbnail &&
        Boolean(item.image)
    )?.image ??
    product.images.find(
      (item) =>
        Boolean(item.image)
    )?.image ??
    null;

  /**
   * ==========================================================
   * PRE-ORDER ESTIMATE
   * ==========================================================
   */

  const hasEstimate =
    product.preOrderMinDays != null &&
    product.preOrderMaxDays != null;

  const estimateText =
    hasEstimate
      ? `Estimasi ${product.preOrderMinDays}-${product.preOrderMaxDays} hari`
      : "Estimasi Pre-Order";

  /**
   * ==========================================================
   * PRODUCT URL
   * ==========================================================
   */

  const productHref =
    `${productsHref}/${product.slug}`;

  /**
   * ==========================================================
   * QUICK ADD
   * ==========================================================
   */

  const handleAdded = () => {
    onAdded?.();
  };

  return (
    <>
      <article
        className="
          group
          relative
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-[0_6px_22px_rgba(15,23,42,0.07)]
          transition-all
          duration-200
          hover:-translate-y-1
          hover:shadow-[0_12px_30px_rgba(15,23,42,0.11)]
          sm:rounded-3xl
        "
      >
        {/* ==================================================
            IMAGE
        ================================================== */}

        <Link
          href={productHref}
          className="
            relative
            block
            aspect-[1.22]
            overflow-hidden
            bg-slate-100
          "
        >
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="
                (max-width: 639px) 50vw,
                (max-width: 1023px) 50vw,
                25vw
              "
              className="
                object-cover
                transition-transform
                duration-500
                group-hover:scale-[1.03]
              "
            />
          ) : (
            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                bg-slate-100
                text-xs
                font-semibold
                text-slate-400
              "
            >
              Tidak ada gambar
            </div>
          )}

          {/* ==================================================
              PRE-ORDER BADGE
          ================================================== */}

          <div
            className="
              absolute
              left-2.5
              top-2.5
              z-20
              inline-flex
              items-center
              gap-1.5
              rounded-full
              bg-[#ef3030]
              px-3
              py-1.5
              text-[11px]
              font-black
              tracking-tight
              text-white
              shadow-lg
              shadow-red-500/20
              sm:left-4
              sm:top-4
              sm:gap-2
              sm:px-4
              sm:py-2
              sm:text-sm
            "
          >
            <Clock3
              className="
                h-4
                w-4
                shrink-0
                stroke-[2.5]
                sm:h-5
                sm:w-5
              "
            />

            <span>
              Pre-Order
            </span>
          </div>

          {/* ==================================================
              ESTIMATE BADGE
          ================================================== */}

          <div
            className="
              absolute
              left-2.5
              top-[51px]
              z-20
              inline-flex
              items-center
              rounded-full
              bg-white
              px-3
              py-1.5
              text-[10px]
              font-bold
              text-(--ocean-700)
              shadow-md
              ring-1
              ring-black/5
              sm:left-4
              sm:top-[68px]
              sm:px-4
              sm:py-2
              sm:text-xs
            "
          >
            {estimateText}
          </div>
        </Link>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <div
          className="
            relative
            min-h-[145px]
            px-3
            pb-4
            pt-3
            sm:min-h-[174px]
            sm:px-5
            sm:pb-5
            sm:pt-4
          "
        >
          {/* ==================================================
              NAME
          ================================================== */}

          <Link
            href={productHref}
            className="
              block
              pr-12
              sm:pr-16
            "
          >
            <h3
              className="
                line-clamp-2
                min-h-[40px]
                text-sm
                font-black
                leading-5
                text-(--ocean-950)
                sm:min-h-[48px]
                sm:text-lg
                sm:leading-6
              "
            >
              {product.name}
            </h3>

            <p
              className="
                mt-0.5
                text-xs
                font-medium
                text-slate-500
                sm:text-sm
              "
            >
              Fresh Frozen
            </p>
          </Link>

          {/* ==================================================
              PRICE
          ================================================== */}

          <div
            className="
              mt-3
              text-lg
              font-black
              leading-none
              tracking-tight
              text-[#36b83f]
              sm:mt-4
              sm:text-2xl
            "
          >
            {formatCurrency(
              product.price
            )}
          </div>

          {/* ==================================================
              STOCK
          ================================================== */}

          <div
            className="
              mt-1
              text-xs
              font-medium
              leading-none
              text-slate-500
              sm:text-sm
            "
          >
            {product.stock ?? 0}
          </div>

          {/* ==================================================
              PLUS BUTTON
          ================================================== */}

          <button
            type="button"
            aria-label={
              `Tambah ${product.name}`
            }
            onClick={() =>
              setQuickAddOpen(true)
            }
            className="
              absolute
              bottom-3
              right-3
              z-20
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-[#42c947]
              text-white
              shadow-lg
              shadow-green-500/20
              transition-all
              duration-200
              hover:scale-105
              hover:bg-[#36bd3b]
              hover:shadow-xl
              hover:shadow-green-500/25
              active:scale-95
              sm:bottom-5
              sm:right-5
              sm:h-14
              sm:w-14
            "
          >
            <Plus
              className="
                h-7
                w-7
                stroke-[2.5]
                sm:h-8
                sm:w-8
              "
            />
          </button>
        </div>
      </article>

      {/* ======================================================
          QUICK ADD SHEET
      ====================================================== */}

      <HomeProductQuickAddSheet
        productId={product.id}
        productName={product.name}
        open={quickAddOpen}
        onClose={() =>
          setQuickAddOpen(false)
        }
        onAdded={handleAdded}
      />
    </>
  );
}