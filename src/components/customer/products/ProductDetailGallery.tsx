"use client";

import {
  type ReactNode,
  useMemo,
  useState,
} from "react";

import Image from "next/image";

import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from "lucide-react";

/**
 * ============================================================
 * PRODUCT DETAIL IMAGE
 * ============================================================
 */

export interface ProductDetailImage {
  id: string;

  image: string;

  isThumbnail?: boolean;

  sortOrder?: number;
}

/**
 * ============================================================
 * PRODUCT DETAIL GALLERY PROPS
 * ============================================================
 */

interface ProductDetailGalleryProps {
  productName: string;

  images: ProductDetailImage[];

  /**
   * OPTIONAL OVERLAY
   *
   * Digunakan untuk menampilkan komponen
   * seperti tombol wishlist di atas gambar.
   */

  favoriteButton?: ReactNode;
}

/**
 * ============================================================
 * PRODUCT DETAIL GALLERY
 * ============================================================
 *
 * Gallery khusus halaman detail produk customer.
 *
 * Features:
 * - Main image
 * - Thumbnail navigation
 * - Active thumbnail
 * - Previous / next image
 * - Favorite button overlay
 * - Empty state
 * - Responsive
 *
 * Tidak berhubungan dengan ProductGallery admin.
 *
 * ============================================================
 */

export default function ProductDetailGallery({
  productName,
  images,
  favoriteButton,
}: ProductDetailGalleryProps) {
  /**
   * ==========================================================
   * SORT IMAGES
   * ==========================================================
   */

  const sortedImages = useMemo(() => {
    return [...images].sort(
      (a, b) => {
        if (
          a.isThumbnail &&
          !b.isThumbnail
        ) {
          return -1;
        }

        if (
          !a.isThumbnail &&
          b.isThumbnail
        ) {
          return 1;
        }

        return (
          (a.sortOrder ?? 0) -
          (b.sortOrder ?? 0)
        );
      }
    );
  }, [images]);

  /**
   * ==========================================================
   * ACTIVE IMAGE
   * ==========================================================
   */

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const activeImage =
    sortedImages[activeIndex] ??
    null;

  const hasMultipleImages =
    sortedImages.length > 1;

  /**
   * ==========================================================
   * PREVIOUS IMAGE
   * ==========================================================
   */

  const showPrevious = () => {
    if (!hasMultipleImages) {
      return;
    }

    setActiveIndex(
      (current) =>
        current === 0
          ? sortedImages.length - 1
          : current - 1
    );
  };

  /**
   * ==========================================================
   * NEXT IMAGE
   * ==========================================================
   */

  const showNext = () => {
    if (!hasMultipleImages) {
      return;
    }

    setActiveIndex(
      (current) =>
        current ===
        sortedImages.length - 1
          ? 0
          : current + 1
    );
  };

  /**
   * ==========================================================
   * EMPTY STATE
   * ==========================================================
   */

  if (!activeImage) {
    return (
      <div className="w-full">
        <div className="flex aspect-square w-full items-center justify-center bg-muted">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ImageOff className="h-10 w-10" />

            <span className="text-sm">
              Belum ada gambar produk
            </span>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="w-full">

      {/* ======================================================
          MAIN IMAGE
      ====================================================== */}

      <div className="group relative aspect-square w-full overflow-hidden bg-muted">

        {/* PRODUCT IMAGE */}

        <Image
          src={activeImage.image}
          alt={productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 480px"
          className="object-cover"
          unoptimized
        />

        {/* ====================================================
            FAVORITE BUTTON
        ==================================================== */}

        {favoriteButton && (
          <div
            className="
              absolute
              right-3
              top-3
              z-30
              sm:right-4
              sm:top-4
            "
          >
            {favoriteButton}
          </div>
        )}

        {/* ====================================================
            IMAGE NAVIGATION
        ==================================================== */}

        {hasMultipleImages && (
          <>
            {/* PREVIOUS */}

            <button
              type="button"
              onClick={showPrevious}
              aria-label="Gambar sebelumnya"
              className="
                absolute
                left-3
                top-1/2
                z-20
                flex
                h-10
                w-10
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-black/50
                text-white
                shadow-sm
                transition-all
                hover:bg-black/70
                sm:opacity-0
                sm:group-hover:opacity-100
              "
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* NEXT */}

            <button
              type="button"
              onClick={showNext}
              aria-label="Gambar berikutnya"
              className="
                absolute
                right-3
                top-1/2
                z-20
                flex
                h-10
                w-10
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-black/50
                text-white
                shadow-sm
                transition-all
                hover:bg-black/70
                sm:opacity-0
                sm:group-hover:opacity-100
              "
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* ======================================================
          THUMBNAILS
      ====================================================== */}

      {hasMultipleImages && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">

          {sortedImages.map(
            (image, index) => {
              const isActive =
                index === activeIndex;

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() =>
                    setActiveIndex(index)
                  }
                  aria-label={`Lihat gambar ${
                    index + 1
                  }`}
                  className={[
                    "relative h-[72px] w-[72px]",
                    "shrink-0",
                    "overflow-hidden",
                    "rounded-lg",
                    "border-2",
                    "transition-all",
                    isActive
                      ? "border-cyan-600"
                      : [
                          "border-transparent",
                          "opacity-75",
                          "hover:border-slate-300",
                          "hover:opacity-100",
                        ].join(" "),
                  ].join(" ")}
                >
                  <Image
                    src={image.image}
                    alt={`${productName} ${
                      index + 1
                    }`}
                    fill
                    sizes="72px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}