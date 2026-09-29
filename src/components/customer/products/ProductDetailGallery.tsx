"use client";

import { useMemo, useState } from "react";
import type React from "react";

import Image from "next/image";

import {
  ChevronLeft,
  ChevronRight,
  Film,
  ImageOff,
  Play,
  X,
} from "lucide-react";

export interface ProductDetailImage {
  id: string;
  image: string;
  isThumbnail?: boolean;
  sortOrder?: number;
  mediaType?: "IMAGE" | "VIDEO";
}

interface ProductDetailGalleryProps {
  productName: string;
  images: ProductDetailImage[];
  shareButton?: React.ReactNode;
  favoriteButton?: React.ReactNode;
}

/**
 * ============================================================
 * PRODUCT DETAIL MEDIA GALLERY
 * ============================================================
 *
 * Backward-compatible dengan ProductImage lama:
 * - mediaType tidak ada => dianggap IMAGE
 * - IMAGE => image viewer/zoom
 * - VIDEO => native video player
 *
 * Urutan media tetap mengikuti thumbnail + sortOrder.
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

  const [activeIndex, setActiveIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const activeMedia =
    sortedImages[activeIndex] ?? null;

  const hasMultipleMedia =
    sortedImages.length > 1;

  const isVideo =
    activeMedia?.mediaType === "VIDEO";

  const showPrevious = () => {
    if (!hasMultipleMedia) {
      return;
    }

    setActiveIndex((current) =>
      current === 0
        ? sortedImages.length - 1
        : current - 1,
    );
  };

  const showNext = () => {
    if (!hasMultipleMedia) {
      return;
    }

    setActiveIndex((current) =>
      current === sortedImages.length - 1
        ? 0
        : current + 1,
    );
  };

  if (!activeMedia) {
    return (
      <div className="w-full">
        <div className="flex aspect-square w-full items-center justify-center bg-muted">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ImageOff className="h-10 w-10" />
            <span className="text-sm">
              Belum ada media produk
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className={[
          "group relative mx-auto aspect-square w-full max-w-[calc(100vw-48px)] overflow-hidden rounded-2xl bg-white sm:max-w-none",
          !isVideo ? "cursor-zoom-in" : "",
        ].join(" ")}
        role={!isVideo ? "button" : undefined}
        tabIndex={!isVideo ? 0 : undefined}
        aria-label={
          !isVideo
            ? "Perbesar foto produk"
            : undefined
        }
        onClick={() => {
          if (!isVideo) {
            setIsViewerOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (
            !isVideo &&
            (event.key === "Enter" ||
              event.key === " ")
          ) {
            event.preventDefault();
            setIsViewerOpen(true);
          }
        }}
      >
        {isVideo ? (
          <video
            key={activeMedia.id}
            src={activeMedia.image}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full rounded-2xl object-contain"
          />
        ) : (
          <Image
            src={activeMedia.image}
            alt={productName}
            fill
            priority
            sizes="(max-width: 1024px) calc(100vw - 48px), 480px"
            className="rounded-2xl object-contain"
            unoptimized
          />
        )}

        {(favoriteButton || shareButton) && (
          <div
            className="absolute right-3 top-3 z-20 flex items-center gap-2"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {favoriteButton}
            {shareButton}
          </div>
        )}

        {hasMultipleMedia && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrevious();
              }}
              aria-label="Media sebelumnya"
              className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/65 group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              aria-label="Media berikutnya"
              className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/65 group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {isVideo && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white">
            <Film className="h-3.5 w-3.5" />
            Video
          </div>
        )}
      </div>

      {hasMultipleMedia && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {sortedImages.map((media, index) => {
            const isActive = index === activeIndex;
            const mediaIsVideo =
              media.mediaType === "VIDEO";

            return (
              <button
                key={media.id}
                type="button"
                onClick={() =>
                  setActiveIndex(index)
                }
                aria-label={
                  mediaIsVideo
                    ? `Lihat video ${index + 1}`
                    : `Lihat gambar ${index + 1}`
                }
                className={[
                  "relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border bg-white transition",
                  isActive
                    ? "border-primary"
                    : "border-transparent opacity-75 hover:opacity-100",
                ].join(" ")}
              >
                {mediaIsVideo ? (
                  <>
                    <video
                      src={media.image}
                      muted
                      preload="metadata"
                      playsInline
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white">
                        <Play className="ml-0.5 h-4 w-4 fill-current" />
                      </span>
                    </span>
                  </>
                ) : (
                  <Image
                    src={media.image}
                    alt={`${productName} ${index + 1}`}
                    fill
                    sizes="72px"
                    className="rounded-lg object-contain"
                    unoptimized
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {isViewerOpen && !isVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto penuh ${productName}`}
          onClick={() =>
            setIsViewerOpen(false)
          }
        >
          <button
            type="button"
            onClick={() =>
              setIsViewerOpen(false)
            }
            aria-label="Tutup foto"
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative h-full w-full max-w-6xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <Image
              src={activeMedia.image}
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
