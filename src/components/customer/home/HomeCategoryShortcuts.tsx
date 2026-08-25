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
 * Icon dan tampilan dipertahankan.
 *
 * Link sekarang dinamis berdasarkan slug category.
 *
 * ============================================================
 */

type HomeCategoryShortcutsProps = {
  productsHref: string;
};

/**
 * ============================================================
 * CATEGORY TONE
 * ============================================================
 */

type CategoryTone =
  | "ocean"
  | "blue"
  | "fresh";

/**
 * ============================================================
 * CATEGORY SLUG
 * ============================================================
 *
 * Slug ini adalah logical category homepage.
 *
 * Backend akan menentukan bagaimana slug tersebut
 * diterjemahkan menjadi filter database.
 *
 * ============================================================
 */

type CategorySlug =
  | "ikan-segar"
  | "udang"
  | "seafood"
  | "frozen"
  | "paket-hemat"
  | "promo";

/**
 * ============================================================
 * CATEGORY ITEM
 * ============================================================
 */

type CategoryItem = {
  name: string;

  description: string;

  icon: typeof Fish;

  tone: CategoryTone;

  slug: CategorySlug;
};

/**
 * ============================================================
 * CATEGORY DATA
 * ============================================================
 *
 * PENTING:
 *
 * Jangan menggunakan category database langsung di sini.
 *
 * Shortcut homepage adalah shortcut bisnis.
 *
 * Contoh:
 *
 * Ikan Segar
 * -> backend dapat memetakan ke:
 *    - ikan-laut
 *    - ikan-air-tawar
 *
 * Seafood
 * -> backend dapat memetakan ke:
 *    - kepiting
 *    - cumi
 *    - kerang
 *
 * Promo
 * -> backend dapat memfilter berdasarkan discount aktif.
 *
 * ============================================================
 */

const categories: CategoryItem[] = [
  {
    name: "Ikan Segar",

    description:
      "Pilihan ikan",

    icon: Fish,

    tone: "ocean",

    slug: "ikan-segar",
  },

  {
    name: "Udang",

    description:
      "Udang pilihan",

    icon: Shrimp,

    tone: "blue",

    slug: "udang",
  },

  {
    name: "Seafood",

    description:
      "Beragam seafood",

    icon: Shell,

    tone: "ocean",

    slug: "seafood",
  },

  {
    name: "Frozen",

    description:
      "Produk beku",

    icon: Package,

    tone: "blue",

    slug: "frozen",
  },

  {
    name: "Paket Hemat",

    description:
      "Lebih praktis",

    icon: ShoppingBasket,

    tone: "fresh",

    slug: "paket-hemat",
  },

  {
    name: "Promo",

    description:
      "Penawaran pilihan",

    icon: Tag,

    tone: "fresh",

    slug: "promo",
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
  switch (tone) {
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
 * CATEGORY URL
 * ============================================================
 *
 * Membuat URL berdasarkan logical category slug.
 *
 * Contoh:
 *
 * /customer/products
 * +
 * ikan-segar
 *
 * menjadi:
 *
 * /customer/products?category=ikan-segar
 *
 * ============================================================
 */

function buildCategoryUrl(
  productsHref: string,
  categorySlug: CategorySlug
) {
  /**
   * ----------------------------------------------------------
   * Tentukan separator
   * ----------------------------------------------------------
   *
   * Jika productsHref sudah memiliki query parameter:
   *
   * /customer/products?search=ikan
   *
   * maka gunakan:
   *
   * &
   *
   * Jika belum:
   *
   * /customer/products
   *
   * maka gunakan:
   *
   * ?
   */

  const separator =
    productsHref.includes("?")
      ? "&"
      : "?";

  return `${productsHref}${separator}category=${encodeURIComponent(
    categorySlug
  )}`;
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
    <section
      className="
        w-full
        py-6

        sm:py-8

        lg:py-10
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

        {/* ================================================== */}
        {/* SECTION HEADER */}
        {/* ================================================== */}

        <div
          className="
            flex
            items-end
            justify-between
            gap-4
          "
        >
          <div
            className="
              min-w-0
            "
          >

            {/* ==================================================
                EYEBROW
            ================================================== */}

            <p
              className="
                text-[10px]
                font-black
                tracking-[0.2em]

                text-[var(--ocean-700)]

                sm:text-xs
              "
            >
              BELANJA BERDASARKAN
            </p>

            {/* ==================================================
                TITLE
            ================================================== */}

            <h2
              className="
                mt-1

                text-xl
                font-black
                tracking-tight

                text-[var(--ocean-950)]

                sm:text-2xl

                lg:text-[28px]
              "
            >
              Kategori Pilihan
            </h2>

          </div>

          {/* ====================================================
              VIEW ALL
          ==================================================== */}

          <Link
            href={
              productsHref
            }
            className="
              group
              inline-flex
              shrink-0
              items-center
              gap-1

              text-xs
              font-bold

              text-[var(--ocean-800)]

              transition

              hover:text-[var(--ocean-600)]

              sm:text-sm
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

                group-hover:translate-x-1
              "
            />
          </Link>

        </div>

        {/* ================================================== */}
        {/* CATEGORY GRID */}
        {/* ================================================== */}

        <div
          className="
            mt-5

            grid
            grid-cols-3
            gap-3

            sm:mt-6
            sm:grid-cols-6
            sm:gap-4

            lg:gap-5
          "
        >

          {categories.map(
            (category) => {

              /**
               * ==================================================
               * ICON
               * ==================================================
               */

              const Icon =
                category.icon;

              /**
               * ==================================================
               * ICON TONE
               * ==================================================
               */

              const tone =
                getIconTone(
                  category.tone
                );

              /**
               * ==================================================
               * CATEGORY URL
               * ==================================================
               *
               * IMPORTANT:
               *
               * Gunakan category.slug.
               *
               * BUKAN:
               *
               * category.category
               *
               * karena property tersebut tidak ada.
               * ==================================================
               */

              const href =
                buildCategoryUrl(
                  productsHref,
                  category.slug
                );

              return (
                <Link
                  key={
                    category.name
                  }
                  href={href}
                  className="
                    group
                    flex
                    min-w-0
                    flex-col
                    items-center

                    rounded-2xl

                    border
                    border-[var(--border)]

                    bg-white

                    px-2
                    py-4

                    text-center

                    shadow-[0_4px_18px_rgba(18,58,99,0.04)]

                    transition
                    duration-200

                    active:scale-[0.98]

                    sm:min-h-[188px]
                    sm:justify-center
                    sm:px-3
                    sm:py-5

                    sm:hover:-translate-y-1
                    sm:hover:border-[#c9ddeb]
                    sm:hover:shadow-[0_12px_30px_rgba(18,58,99,0.10)]

                    lg:min-h-[196px]
                  "
                >

                  {/* ==========================================
                      ICON
                  ========================================== */}

                  <div
                    className={[
                      `
                        flex
                        h-16
                        w-16
                        items-center
                        justify-center

                        rounded-full

                        border

                        transition
                        duration-200

                        sm:h-20
                        sm:w-20

                        lg:h-[88px]
                        lg:w-[88px]
                      `,
                      tone.wrapper,
                    ].join(" ")}
                  >
                    <Icon
                      className="
                        h-7
                        w-7

                        transition
                        duration-200

                        sm:h-9
                        sm:w-9

                        lg:h-10
                        lg:w-10
                      "
                    />
                  </div>

                  {/* ==========================================
                      NAME
                  ========================================== */}

                  <h3
                    className="
                      mt-3

                      line-clamp-1

                      text-xs
                      font-bold

                      text-[var(--ink-900)]

                      transition

                      group-hover:text-[var(--ocean-700)]

                      sm:mt-4
                      sm:text-sm

                      lg:text-[15px]
                    "
                  >
                    {
                      category.name
                    }
                  </h3>

                  {/* ==========================================
                      DESCRIPTION
                  ========================================== */}

                  <p
                    className="
                      mt-1

                      hidden
                      line-clamp-1

                      text-xs

                      text-[var(--ink-500)]

                      sm:block
                    "
                  >
                    {
                      category.description
                    }
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