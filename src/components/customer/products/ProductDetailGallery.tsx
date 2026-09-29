"use client";

import { useMemo, useState } from "react";
import type React from "react";

import Image from "next/image";

import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";

export interface ProductDetailImage {
  id: string;
  image: string;
  isThumbnail?: boolean;
  sortOrder?: number;
}

interface ProductDetailGalleryProps {
  productName: string;
  images: ProductDetailImage[];
  shareButton?: React.ReactNode;
  favoriteButton?: React.ReactNode;
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
 * - Empty state
 * - Responsive
 *
 * Tidak berhubungan dengan ProductGallery admin.
 * ============================================================
 */

export default function ProductDetailGallery({
  productName,
  images,
  shareButton,
  favoriteButton,
}: ProductDetailGalleryProps) {
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      if (a.isThumbnail && !b.isThumbnail) {
        return -1;
      }

      if (!a.isThumbnail && b.isThumbnail) {
        return 1;
      }

      return (
        (a.sortOrder ?? 0) -
        (b.sortOrder ?? 0)
      );
    });
  }, [images]);

  const [activeIndex, setActiveIndex] =
    useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const activeImage =
    sortedImages[activeIndex] ??
    null;

  const hasMultipleImages =
    sortedImages.length > 1;

  const showPrevious = () => {
    if (!hasMultipleImages) {
      return;
    }

    setActiveIndex((current) =>
      current === 0
        ? sortedImages.length - 1
        : current - 1
    );
  };

  const showNext = () => {
    if (!hasMultipleImages) {
      return;
    }

    setActiveIndex((current) =>
      current === sortedImages.length - 1
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

  return (
    <div className="w-full">
      {/* ======================================================
          MAIN IMAGE
      ====================================================== */}

      <div
        className="group relative mx-auto aspect-square w-full max-w-[calc(100vw-48px)] cursor-zoom-in overflow-hidden rounded-2xl bg-white sm:max-w-none"
        role="button"
        tabIndex={0}
        aria-label="Perbesar foto produk"
        onClick={() => setIsViewerOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsViewerOpen(true);
          }
        }}
      >
        <Image
          src={activeImage.image}
          alt={productName}
          fill
          priority
          sizes="(max-width: 1024px) calc(100vw - 48px), 480px"
          className="rounded-2xl object-contain"
          unoptimized
        />

        {(favoriteButton || shareButton) && (
          <div
            className="absolute right-3 top-3 z-20 flex items-center gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            {favoriteButton}
            {shareButton}
          </div>
        )}

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrevious();
              }}
              aria-label="Gambar sebelumnya"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/65 group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              aria-label="Gambar berikutnya"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/65 group-hover:opacity-100"
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
                    "relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border transition",
                    isActive
                      ? "border-primary"
                      : "border-transparent opacity-75 hover:opacity-100",
                  ].join(" ")}
                >
                  <Image
                    src={image.image}
                    alt={`${productName} ${
                      index + 1
                    }`}
                    fill
                    sizes="72px"
                    className="rounded-lg object-contain bg-white"
                    unoptimized
                  />
                </button>
              );
            }
          )}
        </div>
      )}

      {isViewerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto penuh ${productName}`}
          onClick={() => setIsViewerOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsViewerOpen(false)}
            aria-label="Tutup foto"
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative h-full w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeImage.image}
              alt={productName}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}