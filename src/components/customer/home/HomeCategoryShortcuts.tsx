"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

/**
 * ============================================================
 * HOME CATEGORY SHORTCUTS
 * ============================================================
 *
 * Kategori berasal dari database.
 *
 * UI:
 * - Mobile: 5 kategori pada kondisi collapsed
 * - Mobile: seluruh kategori pada kondisi expanded
 * - Desktop: 7 kategori pada kondisi collapsed
 * - Desktop: seluruh kategori pada kondisi expanded
 * - Semua kategori tetap berada di tengah
 * - Gambar menggunakan object-contain agar PNG transparan
 *   dari Admin tidak terpotong.
 *
 * ============================================================
 */

export interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  sortOrder: number;
}

interface HomeCategoryShortcutsProps {
  productsHref: string;
  categories: HomeCategory[];
}

/**
 * ============================================================
 * DISPLAY LIMIT
 * ============================================================
 *
 * Kondisi collapsed:
 * - Desktop menampilkan maksimal 7 kategori.
 * - Mobile hanya menampilkan 5 kategori pertama.
 *
 * Pada mobile:
 * 5 kategori = 1 baris.
 *
 * Pada desktop:
 * 7 kategori = 1 baris.
 *
 * Jika kategori lebih banyak, tombol expand akan muncul.
 *
 * ============================================================
 */

const COLLAPSED_CATEGORY_LIMIT = 7;
const MOBILE_CATEGORY_LIMIT = 5;

export default function HomeCategoryShortcuts({
  productsHref,
  categories,
}: HomeCategoryShortcutsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (categories.length === 0) {
    return null;
  }

  /**
   * ==========================================================
   * VISIBLE CATEGORIES
   * ==========================================================
   *
   * Desktop:
   * - collapsed → maksimal 7
   * - expanded  → seluruh kategori
   *
   * Mobile:
   * - collapsed → hanya 5 kategori pertama
   * - expanded  → seluruh kategori
   *
   * ==========================================================
   */

  const visibleCategories = isExpanded
    ? categories
    : categories.slice(0, COLLAPSED_CATEGORY_LIMIT);

  const canExpand =
    categories.length > COLLAPSED_CATEGORY_LIMIT;

  return (
    <section
      className="
        w-full
        bg-white
        py-5
        sm:py-6
        lg:py-7
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
            SECTION HEADER
        ==================================================== */}

        <div
          className="
            mb-4
            flex
            items-end
            justify-between
            gap-3
            sm:mb-5
          "
        >
          <div className="min-w-0">
            <h2
              className="
                text-base
                font-bold
                tracking-tight
                text-[var(--ocean-950)]
                sm:text-lg
              "
            >
              Belanja berdasarkan kategori
            </h2>

            <p
              className="
                mt-0.5
                hidden
                text-xs
                text-slate-500
                sm:block
              "
            >
              Temukan produk sesuai kebutuhan Anda
            </p>
          </div>

          <Link
            href={productsHref}
            className="
              flex
              shrink-0
              items-center
              gap-0.5
              text-xs
              font-semibold
              text-(--pisjo-primary)
              transition
              hover:opacity-80
              sm:text-sm
            "
          >
            Lihat semua

            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4"
            />
          </Link>
        </div>

        {/* ====================================================
            CATEGORY GRID
        ==================================================== */}

        <div
          className="
            mx-auto
            grid
            w-fit
            max-w-full
            grid-cols-5
            justify-items-center
            gap-x-3
            gap-y-4

            sm:grid-cols-4
            sm:gap-4

            lg:grid-cols-7
            lg:gap-6
          "
        >
          {visibleCategories.map(
            (category, index) => {
              const categoryHref =
                `${productsHref}?category=${encodeURIComponent(
                  category.slug
                )}`;

              return (
                <Link
                  key={category.id}
                  href={categoryHref}
                  className={`
                    group
                    flex
                    min-w-0
                    flex-col
                    items-center
                    text-center
                    ${
                      index >= MOBILE_CATEGORY_LIMIT &&
                      !isExpanded
                        ? "hidden sm:flex"
                        : ""
                    }
                  `}
                >
                  {/* ========================================
                      CATEGORY IMAGE
                  ======================================== */}

                  <div
                    className="
                      relative
                      flex
                      h-[58px]
                      w-[58px]
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-xl
                      bg-(--ice-50)
                      ring-1
                      ring-slate-100
                      transition
                      duration-200
                      group-hover:-translate-y-0.5
                      group-hover:ring-slate-200

                      sm:h-20
                      sm:w-20
                      sm:rounded-2xl

                      lg:h-32
                      lg:w-32
                    "
                  >
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="
                          (max-width: 639px) 58px,
                          (max-width: 1023px) 80px,
                          128px
                        "
                        className="
                          object-contain
                          p-1
                          sm:p-2
                        "
                        unoptimized
                      />
                    ) : (
                      <span
                        className="
                          px-1
                          text-center
                          text-[8px]
                          font-medium
                          leading-3
                          text-slate-400
                          sm:text-[10px]
                        "
                      >
                        Tidak ada gambar
                      </span>
                    )}
                  </div>

                  {/* ========================================
                      CATEGORY NAME
                  ======================================== */}

                  <span
                    className="
                      mt-1
                      line-clamp-2
                      w-full
                      px-0.5
                      text-[10px]
                      font-semibold
                      leading-[13px]
                      text-slate-700
                      transition
                      group-hover:text-(--pisjo-primary)

                      sm:mt-2
                      sm:text-xs
                      sm:leading-4

                      lg:text-sm
                    "
                  >
                    {category.name}
                  </span>
                </Link>
              );
            }
          )}
        </div>

        {/* ====================================================
            EXPAND / COLLAPSE
        ==================================================== */}

        {canExpand && (
          <div
            className="
              mt-5
              flex
              justify-center
            "
          >
            <button
              type="button"
              onClick={() =>
                setIsExpanded(
                  (previous) => !previous
                )
              }
              aria-expanded={isExpanded}
              className="
                inline-flex
                items-center
                gap-1
                rounded-lg
                px-3
                py-1.5
                text-xs
                font-bold
                text-(--pisjo-primary)
                transition
                hover:bg-(--ice-50)
                focus:outline-none
                focus:ring-2
                focus:ring-(--pisjo-primary)/20

                sm:text-sm
              "
            >
              {isExpanded ? (
                <>
                  Lihat Lebih Sedikit

                  <ChevronUp
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                </>
              ) : (
                <>
                  Lihat Lebih Banyak

                  <ChevronDown
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
