"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * ============================================================
 * HOME CATEGORY
 * ============================================================
 *
 * Data kategori berasal dari database Category.
 *
 * Image kategori dapat diatur melalui:
 *
 * Admin -> Categories
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

/**
 * ============================================================
 * PROPS
 * ============================================================
 */

interface HomeCategoryShortcutsProps {
  productsHref: string;
  categories: HomeCategory[];
}

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function HomeCategoryShortcuts({
  productsHref,
  categories,
}: HomeCategoryShortcutsProps) {

  /**
   * ==========================================================
   * EMPTY STATE
   * ==========================================================
   *
   * Jika Admin belum memiliki kategori aktif,
   * section tidak ditampilkan.
   *
   * ==========================================================
   */

  if (categories.length === 0) {
    return null;
  }

  return (
    <section
      className="
        w-full
        bg-white
        py-5
        sm:py-7
        lg:py-8
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
            items-center
            justify-between
            gap-3
            sm:mb-5
          "
        >
          <div>
            <h2
              className="
                text-lg
                font-bold
                tracking-tight
                text-slate-900
                sm:text-xl
              "
            >
              Belanja berdasarkan kategori
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-slate-500
                sm:text-sm
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
              gap-1
              text-xs
              font-semibold
              text-slate-600
              transition
              hover:text-slate-900
              sm:text-sm
            "
          >
            Lihat semua

            <ChevronRight
              className="
                h-4
                w-4
              "
            />
          </Link>
        </div>

        {/* ====================================================
            CATEGORY LIST
        ==================================================== */}

        <div
          className="
            flex
            gap-3
            overflow-x-auto
            pb-2
            scrollbar-none
            sm:grid
            sm:grid-cols-4
            sm:gap-4
            sm:overflow-visible
            lg:grid-cols-6
          "
        >
          {categories.map(
            (category) => {

              const categoryHref =
                `${productsHref}?category=${encodeURIComponent(
                  category.slug
                )}`;

              return (
                <Link
                  key={category.id}
                  href={categoryHref}
                  className="
                    group
                    flex
                    min-w-24
                    shrink-0
                    flex-col
                    items-center
                    text-center
                    sm:min-w-0
                  "
                >

                  {/* ==========================================
                      CATEGORY IMAGE
                  ========================================== */}

                  <div
                    className="
                      relative
                      h-20
                      w-20
                      overflow-hidden
                      rounded-full
                      bg-slate-100
                      ring-1
                      ring-slate-200
                      transition
                      duration-200
                      group-hover:scale-105
                      group-hover:ring-slate-300
                      sm:h-24
                      sm:w-24
                      lg:h-28
                      lg:w-28
                    "
                  >
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="
                          (max-width: 639px) 80px,
                          (max-width: 1023px) 96px,
                          112px
                        "
                        className="
                          object-cover
                        "
                      />
                    ) : (
                      <div
                        className="
                          flex
                          h-full
                          w-full
                          items-center
                          justify-center
                          px-2
                          text-[10px]
                          font-medium
                          text-slate-400
                          sm:text-xs
                        "
                      >
                        Tidak ada gambar
                      </div>
                    )}
                  </div>

                  {/* ==========================================
                      CATEGORY NAME
                  ========================================== */}

                  <span
                    className="
                      mt-2
                      line-clamp-2
                      max-w-24
                      text-xs
                      font-semibold
                      leading-4
                      text-slate-700
                      transition
                      group-hover:text-slate-900
                      sm:max-w-28
                      sm:text-sm
                      sm:leading-5
                    "
                  >
                    {category.name}
                  </span>

                </Link>
              );
            }
          )}
        </div>

      </div>
    </section>
  );
}
