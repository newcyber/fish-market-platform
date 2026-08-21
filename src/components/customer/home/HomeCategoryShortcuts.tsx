import Link from "next/link";

import {
  ChevronRight,
  Fish,
  Package,
  Shell,
  ShoppingBasket,
  Shrimp,
  Tag,
} from "lucide-react";

/**
 * ============================================================
 * HOME CATEGORY SHORTCUTS
 * ============================================================
 *
 * Shortcut kategori pada homepage.
 *
 * Digunakan untuk:
 * - Guest homepage
 * - Customer homepage
 *
 * Mobile-first dan mengikuti Pisjo Market
 * Ocean / Fresh Seafood design system.
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type HomeCategoryShortcutsProps = {
  productsHref: string;
};

type CategoryTone =
  | "ocean"
  | "blue"
  | "fresh";

type CategoryItem = {
  name: string;

  description: string;

  icon: typeof Fish;

  tone: CategoryTone;
};

/**
 * ============================================================
 * CATEGORY DATA
 * ============================================================
 */

const categories: CategoryItem[] = [
  {
    name: "Ikan Segar",
    description: "Pilihan ikan",
    icon: Fish,
    tone: "ocean",
  },
  {
    name: "Udang",
    description: "Udang pilihan",
    icon: Shrimp,
    tone: "blue",
  },
  {
    name: "Seafood",
    description: "Beragam seafood",
    icon: Shell,
    tone: "ocean",
  },
  {
    name: "Frozen",
    description: "Produk beku",
    icon: Package,
    tone: "blue",
  },
  {
    name: "Paket Hemat",
    description: "Lebih praktis",
    icon: ShoppingBasket,
    tone: "fresh",
  },
  {
    name: "Promo",
    description: "Penawaran pilihan",
    icon: Tag,
    tone: "fresh",
  },
];

/**
 * ============================================================
 * ICON TONE
 * ============================================================
 */

function getIconTone(
  tone: CategoryTone
) {
  switch (
    tone
  ) {
    case "fresh":
      return {
        wrapper:
          "border-[var(--fresh-100)] bg-[var(--fresh-100)] text-[var(--fresh-600)] group-hover:bg-[var(--fresh-500)] group-hover:text-white",
      };

    case "blue":
      return {
        wrapper:
          "border-[#e7f0f8] bg-[#edf5fb] text-[var(--ocean-700)] group-hover:bg-[var(--ocean-600)] group-hover:text-white",
      };

    case "ocean":
    default:
      return {
        wrapper:
          "border-[#e8f0f7] bg-[#eef4f8] text-[var(--ocean-800)] group-hover:bg-[var(--ocean-700)] group-hover:text-white",
      };
  }
}

/**
 * ============================================================
 * HOME CATEGORY SHORTCUTS
 * ============================================================
 */

export default function HomeCategoryShortcuts({
  productsHref,
}: HomeCategoryShortcutsProps) {
  return (
    <section className="w-full py-6 sm:py-8 lg:py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* SECTION HEADER */}
        {/* ================================================== */}

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">

            {/* EYEBROW */}

            <p className="text-[10px] font-black tracking-[0.2em] text-[var(--ocean-700)] sm:text-xs">
              BELANJA BERDASARKAN
            </p>

            {/* TITLE */}

            <h2 className="mt-1 text-xl font-black tracking-tight text-[var(--ocean-950)] sm:text-2xl lg:text-[28px]">
              Kategori Pilihan
            </h2>

          </div>

          {/* VIEW ALL */}

          <Link
            href={productsHref}
            className="group inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[var(--ocean-800)] transition hover:text-[var(--ocean-600)] sm:text-sm"
          >
            <span>
              Lihat Semua
            </span>

            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

        </div>

        {/* ================================================== */}
        {/* CATEGORY GRID */}
        {/* ================================================== */}

        <div className="mt-5 grid grid-cols-3 gap-3 sm:mt-6 sm:grid-cols-6 sm:gap-4 lg:gap-5">

          {categories.map(
            (
              category
            ) => {
              const Icon =
                category.icon;

              const tone =
                getIconTone(
                  category.tone
                );

              return (
                <Link
                  key={
                    category.name
                  }
                  href={
                    productsHref
                  }
                  className="group flex min-w-0 flex-col items-center rounded-2xl border border-[var(--border)] bg-white px-2 py-4 text-center shadow-[0_4px_18px_rgba(18,58,99,0.04)] transition duration-200 active:scale-[0.98] sm:min-h-[188px] sm:justify-center sm:px-3 sm:py-5 sm:hover:-translate-y-1 sm:hover:border-[#c9ddeb] sm:hover:shadow-[0_12px_30px_rgba(18,58,99,0.10)] lg:min-h-[196px]"
                >

                  {/* ========================================== */}
                  {/* ICON */}
                  {/* ========================================== */}

                  <div
                    className={[
                      "flex h-16 w-16 items-center justify-center rounded-full border transition duration-200 sm:h-20 sm:w-20 lg:h-[88px] lg:w-[88px]",
                      tone.wrapper,
                    ].join(
                      " "
                    )}
                  >
                    <Icon className="h-7 w-7 transition duration-200 sm:h-9 sm:w-9 lg:h-10 lg:w-10" />
                  </div>

                  {/* ========================================== */}
                  {/* NAME */}
                  {/* ========================================== */}

                  <h3 className="mt-3 line-clamp-1 text-xs font-bold text-[var(--ink-900)] transition group-hover:text-[var(--ocean-700)] sm:mt-4 sm:text-sm lg:text-[15px]">
                    {category.name}
                  </h3>

                  {/* ========================================== */}
                  {/* DESCRIPTION */}
                  {/* ========================================== */}

                  <p className="mt-1 hidden line-clamp-1 text-xs text-[var(--ink-500)] sm:block">
                    {category.description}
                  </p>

                </Link>
              );
            }
          )}

        </div>

      </div>
    </section>
  );
}