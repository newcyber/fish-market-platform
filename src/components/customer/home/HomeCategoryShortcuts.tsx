import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * ============================================================
 * HOME CATEGORY SHORTCUTS
 * ============================================================
 *
 * Kategori tetap berasal dari database.
 *
 * UI:
 * - Mobile: horizontal scroll, compact
 * - Desktop: grid
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

export default function HomeCategoryShortcuts({
  productsHref,
  categories,
}: HomeCategoryShortcutsProps) {
  if (categories.length === 0) {
    return null;
  }

  /**
   * Homepage hanya menampilkan shortcut kategori teratas.
   * Semua kategori tetap dapat diakses melalui "Lihat semua".
   *
   * Urutan categories sudah ditentukan oleh SharedHomePage:
   * sortOrder ASC, kemudian name ASC.
   */
  const visibleCategories =
    categories.slice(0, 8);

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
                text-slate-900
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
            CATEGORY LIST
        ==================================================== */}

        <div
          className="
            -mx-4
            overflow-x-auto
            px-4
            pb-1
            scrollbar-none

            sm:mx-0
            sm:grid
            sm:grid-cols-4
            sm:gap-4
            sm:overflow-visible
            sm:px-0

            lg:grid-cols-6
            xl:grid-cols-8
            lg:gap-5
          "
        >
          <div
            className="
              flex
              w-max
              gap-3

              sm:contents
            "
          >
            {visibleCategories.map(
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
                      w-[76px]
                      shrink-0
                      flex-col
                      items-center
                      text-center

                      sm:w-auto
                    "
                  >
                    {/* ========================================
                        CATEGORY IMAGE
                    ======================================== */}

                    <div
                      className="
                        relative
                        flex
                        h-[68px]
                        w-[68px]
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-2xl
                        bg-(--ice-50)
                        ring-1
                        ring-slate-100
                        transition
                        duration-200
                        group-hover:-translate-y-0.5
                        group-hover:ring-slate-200

                        sm:h-20
                        sm:w-20

                        lg:h-24
                        lg:w-24
                      "
                    >
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          sizes="
                            (max-width: 639px) 68px,
                            (max-width: 1023px) 80px,
                            96px
                          "
                          className="
                            object-contain
                            p-1.5
                            sm:p-2
                          "
                        />
                      ) : (
                        <span
                          className="
                            px-1
                            text-[9px]
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
                        mt-2
                        line-clamp-2
                        w-full
                        text-[11px]
                        font-semibold
                        leading-4
                        text-slate-700
                        transition
                        group-hover:text-(--pisjo-primary)

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
        </div>

        {/* ====================================================
            MOBILE SCROLL HINT
        ==================================================== */}

        {categories.length > visibleCategories.length && (
          <p
            className="
              mt-2
              text-center
              text-[10px]
              text-slate-400
              sm:hidden
            "
          >
            Geser untuk melihat kategori lainnya
          </p>
        )}
      </div>
    </section>
  );
}
