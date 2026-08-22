"use client";

import {
  useEffect,
  useRef,
} from "react";

import Link from "next/link";

interface ProductCategory {
  id: string;
  name: string;
}

interface ProductCategoryNavigationProps {
  categories: ProductCategory[];
  activeCategoryId?: string;
  basePath: string;
  searchQuery?: string;
}

/**
 * ============================================================
 * PRODUCT CATEGORY NAVIGATION
 * ============================================================
 *
 * Client Component khusus untuk:
 *
 * - Horizontal scroll pada mobile
 * - Auto-scroll kategori aktif
 * - Active state premium
 * - Micro-interaction
 * - Mempertahankan search query
 *
 * URL tetap menjadi source of truth.
 */

export default function ProductCategoryNavigation({
  categories,
  activeCategoryId,
  basePath,
  searchQuery,
}: ProductCategoryNavigationProps) {
  /**
   * ==========================================================
   * REFS
   * ==========================================================
   */

  const scrollContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const activeItemRef =
    useRef<HTMLAnchorElement | null>(
      null
    );

  /**
   * ==========================================================
   * AUTO SCROLL ACTIVE CATEGORY
   * ==========================================================
   */

  useEffect(
    () => {
      const container =
        scrollContainerRef.current;

      const activeItem =
        activeItemRef.current;

      if (
        !container ||
        !activeItem
      ) {
        return;
      }

      /**
       * Gunakan requestAnimationFrame agar layout
       * sudah selesai sebelum menghitung posisi.
       */

      const frame =
        window.requestAnimationFrame(
          () => {
            const containerRect =
              container.getBoundingClientRect();

            const activeItemRect =
              activeItem.getBoundingClientRect();

            const targetScrollLeft =
              container.scrollLeft +
              activeItemRect.left -
              containerRect.left -
              container.clientWidth / 2 +
              activeItem.clientWidth / 2;

            container.scrollTo({
              left: Math.max(
                0,
                targetScrollLeft
              ),
              behavior: "smooth",
            });
          }
        );

      return () => {
        window.cancelAnimationFrame(
          frame
        );
      };
    },
    [
      activeCategoryId,
    ]
  );

  /**
   * ==========================================================
   * CREATE CATEGORY URL
   * ==========================================================
   *
   * URL dibuat di Client Component agar tidak
   * mengirim function dari Server ke Client.
   *
   * Search query tetap dipertahankan.
   */

  const createCategoryUrl = (
    categoryId?: string
  ) => {
    const params =
      new URLSearchParams();

    if (searchQuery?.trim()) {
      params.set(
        "search",
        searchQuery.trim()
      );
    }

    if (categoryId) {
      params.set(
        "category",
        categoryId
      );
    }

    const queryString =
      params.toString();

    const url =
      queryString
        ? `${basePath}?${queryString}`
        : basePath;

    return `${url}#categories`;
  };

  /**
   * ==========================================================
   * ITEM CLASSNAME
   * ==========================================================
   */

  const getItemClassName = (
    isActive: boolean
  ) => {
    return `
      relative
      inline-flex

      min-h-10
      shrink-0

      items-center
      justify-center

      rounded-full

      border

      px-4
      py-2

      text-xs
      font-bold

      whitespace-nowrap

      transform-gpu

      transition-all
      duration-300
      ease-out

      active:scale-95

      motion-reduce:transition-none

      ${
        isActive
          ? `
            border-(--fresh-500)

            bg-(--fresh-500)

            text-white

            shadow-[0_8px_22px_rgba(22,163,74,0.22)]
          `
          : `
            border-(--ice-200)

            bg-white

            text-(--ocean-800)

            hover:-translate-y-0.5

            hover:border-(--fresh-300)

            hover:bg-(--fresh-50)

            hover:shadow-sm
          `
      }
    `;
  };

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div
      ref={scrollContainerRef}
      className="
        flex
        gap-2

        overflow-x-auto

        overscroll-x-contain

        scroll-smooth

        px-0.5
        pb-2

        [-ms-overflow-style:none]

        [scrollbar-width:none]

        [&::-webkit-scrollbar]:hidden

        sm:flex-wrap

        sm:overflow-visible

        sm:pb-0
      "
    >
      {/* ================================================== */}
      {/* SEMUA */}
      {/* ================================================== */}

      <Link
        ref={
          !activeCategoryId
            ? activeItemRef
            : undefined
        }
        href={createCategoryUrl()}
        className={getItemClassName(
          !activeCategoryId
        )}
      >
        <span>
          Semua
        </span>

        {!activeCategoryId ? (
          <span
            aria-hidden="true"
            className="
              absolute

              inset-x-4
              -bottom-1

              h-0.5

              rounded-full

              bg-white/80
            "
          />
        ) : null}
      </Link>

      {/* ================================================== */}
      {/* CATEGORY LIST */}
      {/* ================================================== */}

      {categories.map(
        (category) => {
          const isActive =
            category.id ===
            activeCategoryId;

          return (
            <Link
              key={category.id}
              ref={
                isActive
                  ? activeItemRef
                  : undefined
              }
              href={createCategoryUrl(
                category.id
              )}
              className={getItemClassName(
                isActive
              )}
            >
              <span>
                {category.name}
              </span>

              {isActive ? (
                <span
                  aria-hidden="true"
                  className="
                    absolute

                    inset-x-4
                    -bottom-1

                    h-0.5

                    rounded-full

                    bg-white/80
                  "
                />
              ) : null}
            </Link>
          );
        }
      )}
    </div>
  );
}