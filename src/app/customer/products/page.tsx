import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  Fish,
  Flame,
  Package,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";

import ProductService from "@/services/product/product.service";
import CategoryService from "@/services/category/category.service";

import {
  prisma,
} from "@/lib/prisma";

import {
  auth,
} from "@/auth";

import WishlistService from "@/services/wishlist/wishlist.service";

import ToggleWishlistButton from "@/components/customer/wishlist/ToggleWishlistButton";

export const dynamic = "force-dynamic";

/**
 * ============================================================
 * CUSTOMER PRODUCTS PAGE
 * ============================================================
 *
 * Support:
 *
 * - Search
 * - Category filter
 * - Wishlist
 * - HOT product
 * - Flash Sale
 * - Discount percentage
 * - Stock status
 *
 * Responsive grid:
 *
 * Mobile        : 3 kolom
 * Tablet        : 4 kolom
 * Desktop       : 5 kolom
 * Large Desktop : 6 kolom
 * ============================================================
 */

interface ProductsPageProps {
  searchParams?: Promise<{
    search?: string;
    category?: string;
  }>;
}

export default async function CustomerProductsPage({
  searchParams,
}: ProductsPageProps) {
  /**
   * ==========================================================
   * SEARCH PARAMS
   * ==========================================================
   */

  const params =
    (await searchParams) ?? {};

  const search =
    params.search?.trim() ||
    undefined;

  const categoryId =
    params.category &&
      params.category !== "all"
      ? params.category
      : undefined;

  /**
   * ==========================================================
   * LOAD DATA
   * ==========================================================
   */

  const [
    products,
    categories,
    storeSettings,
  ] = await Promise.all([
    ProductService.getProducts({
      search,
      categoryId,
      published: true,
    }),

    CategoryService.getCategories({
      active: true,
    }),

    prisma.storeSettings.findFirst(),
  ]);

  /**
   * ==========================================================
   * HERO IMAGE
   * ==========================================================
   *
   * Menggunakan sumber yang sama dengan Homepage Slider Slide 1.
   */

  const heroImage =
    storeSettings?.heroSlide1Image ??
    null;

  /**
   * ==========================================================
   * ACTIVE FLASH SALE
   * ==========================================================
   *
   * Ambil seluruh Flash Sale aktif sekaligus
   * agar tidak terjadi N+1 query.
   */

  const now =
    new Date();

  const productIds =
    products.map(
      (product) =>
        product.id
    );

  const flashSaleItems =
    productIds.length > 0
      ? await prisma.flashSaleItem.findMany({
        where: {
          productId: {
            in: productIds,
          },

          isActive: true,

          flashSale: {
            status: "ACTIVE",

            startAt: {
              lte: now,
            },

            endAt: {
              gt: now,
            },
          },
        },

        select: {
          id: true,

          productId: true,

          weightOptionId: true,

          originalPrice: true,

          flashPrice: true,

          stockLimit: true,

          soldQuantity: true,

          flashSale: {
            select: {
              id: true,

              name: true,

              slug: true,
            },
          },
        },
      })
      : [];

  /**
   * ==========================================================
   * FLASH SALE MAP
   * ==========================================================
   *
   * Jika satu produk memiliki beberapa
   * Flash Sale aktif, gunakan harga promo
   * paling rendah yang kuotanya masih tersedia.
   */

  const flashSaleByProductId =
    new Map<
      string,
      {
        id: string;
        originalPrice: number;
        flashPrice: number;
        stockLimit: number;
        soldQuantity: number;
        campaignName: string;
      }
    >();

  for (
    const item of flashSaleItems
  ) {
    const remainingQuota =
      item.stockLimit -
      item.soldQuantity;

    /**
     * Jangan tampilkan promo
     * jika kuota sudah habis.
     */

    if (
      remainingQuota <= 0
    ) {
      continue;
    }

    const normalizedItem = {
      id:
        item.id,

      originalPrice:
        Number(
          item.originalPrice
        ),

      flashPrice:
        Number(
          item.flashPrice
        ),

      stockLimit:
        item.stockLimit,

      soldQuantity:
        item.soldQuantity,

      campaignName:
        item.flashSale.name,
    };

    const existingItem =
      flashSaleByProductId.get(
        item.productId
      );

    /**
     * Gunakan Flash Sale
     * dengan harga paling rendah.
     */

    if (
      !existingItem ||
      normalizedItem.flashPrice <
      existingItem.flashPrice
    ) {
      flashSaleByProductId.set(
        item.productId,
        normalizedItem
      );
    }
  }

  /**
   * ==========================================================
   * WISHLIST
   * ==========================================================
   */

  const session =
    await auth();

  const wishlist =
    session?.user?.id
      ? await WishlistService.getWishlist(
        session.user.id
      )
      : null;

  const wishlistProductIds =
    new Set(
      wishlist?.items.map(
        (item) =>
          item.productId
      ) ?? []
    );

  /**
   * ==========================================================
   * CATEGORY URL
   * ==========================================================
   */

  function categoryUrl(
    selectedCategoryId?: string
  ) {
    const query =
      new URLSearchParams();

    if (search) {
      query.set(
        "search",
        search
      );
    }

    if (
      selectedCategoryId
    ) {
      query.set(
        "category",
        selectedCategoryId
      );
    }

    const queryString =
      query.toString();

    return queryString
      ? `/customer/products?${queryString}`
      : "/customer/products";
  }

  return (
    <main
      className="
        min-h-screen
        bg-slate-50
      "
    >

      {/* ==================================================== */}
      {/* HERO */}
      {/* ==================================================== */}

      <section
        className="
          relative
          isolate
          overflow-hidden

          border-b
          border-white/10

          bg-gradient-to-br
          from-[var(--ocean-950)]
          via-[var(--ocean-900)]
          to-[var(--ocean-700)]
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            overflow-hidden
          "
        >
          <div
            className="
              absolute
              -right-20
              -top-24
              h-64
              w-64
              rounded-full
              border
              border-white/[0.06]
              sm:-right-10
              sm:-top-16
              sm:h-80
              sm:w-80
              lg:right-[6%]
              lg:top-1/2
              lg:h-[460px]
              lg:w-[460px]
              lg:-translate-y-1/2
            "
          />

          <div
            className="
              absolute
              right-[10%]
              top-1/2
              h-40
              w-40
              -translate-y-1/2
              rounded-full
              border
              border-white/[0.06]
              sm:h-52
              sm:w-52
              lg:h-[320px]
              lg:w-[320px]
            "
          />

          <div
            className="
              absolute
              right-[5%]
              top-1/2
              h-64
              w-64
              -translate-y-1/2
              rounded-full
              bg-[var(--fresh-500)]/[0.12]
              blur-3xl
              sm:h-80
              sm:w-80
              lg:h-[520px]
              lg:w-[520px]
            "
          />

          <div
            className="
              absolute
              -bottom-28
              left-[10%]
              h-56
              w-56
              rounded-full
              bg-[var(--fresh-500)]/[0.10]
              blur-3xl
              sm:h-72
              sm:w-72
            "
          />
        </div>

        <div
          className="
            relative
            z-10
            mx-auto
            w-full
            max-w-7xl
            px-4
            py-10
            sm:px-6
            sm:py-14
            lg:px-8
            lg:py-16
            xl:py-20
          "
        >
          <div
            className="
              relative
              grid
              items-center
              gap-6
              lg:grid-cols-[1.05fr_0.95fr]
              lg:gap-10
              xl:gap-16
            "
          >
            <div
              className="
                relative
                z-20
                max-w-3xl
                lg:max-w-2xl
              "
            >
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.08]
                  px-3
                  py-1.5
                  text-[9px]
                  font-black
                  tracking-[0.16em]
                  text-[var(--fresh-300)]
                  backdrop-blur
                  sm:px-4
                  sm:py-2
                  sm:text-xs
                "
              >
                <Fish className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                SEMUA PRODUK
              </div>

              <h1
                className="
                  mt-4
                  max-w-xl
                  text-3xl
                  font-black
                  leading-[1.08]
                  tracking-tight
                  text-white
                  sm:mt-5
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                Seafood segar untuk
                <span className="block text-[var(--fresh-300)]">
                  kebutuhan Anda.
                </span>
              </h1>

              <p
                className="
                  mt-4
                  max-w-xl
                  text-sm
                  leading-6
                  text-white/70
                  sm:mt-5
                  sm:text-base
                  sm:leading-7
                  lg:text-lg
                  lg:leading-8
                "
              >
                Temukan berbagai pilihan ikan dan seafood berkualitas
                yang tersedia untuk kebutuhan rumah, usaha, dan keluarga Anda.
              </p>

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  items-center
                  gap-3
                  sm:mt-6
                "
              >
                <Link
                  href="#produk"
                  className="
                    inline-flex
                    h-11
                    shrink-0
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    bg-white
                    px-5
                    text-sm
                    font-black
                    text-[var(--ocean-900)]
                    shadow-lg
                    transition
                    duration-200
                    hover:-translate-y-0.5
                    hover:shadow-xl
                    active:scale-[0.98]
                    sm:h-12
                    sm:px-6
                  "
                >
                  Lihat Produk
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div
                  className="
                    inline-flex
                    min-h-11
                    shrink-0
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.08]
                    px-3
                    py-2.5
                    backdrop-blur
                    sm:min-h-12
                    sm:px-4
                    sm:py-3
                  "
                >
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      bg-[var(--fresh-500)]
                      text-white
                      sm:h-11
                      sm:w-11
                    "
                  >
                    <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="whitespace-nowrap text-sm font-black text-white">
                      {products.length} Produk
                    </p>
                    <p className="whitespace-nowrap text-[10px] text-white/60 sm:text-xs">
                      siap untuk Anda pilih
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="
                pointer-events-none
                absolute
                inset-y-0
                right-0
                z-0
                flex
                w-full
                items-center
                justify-center
                overflow-hidden
                opacity-60
                sm:opacity-70
                md:w-[48%]
                lg:relative
                lg:inset-auto
                lg:z-10
                lg:w-full
                lg:opacity-100
              "
            >
              <div
                className="
                  absolute
                  h-[260px]
                  w-[260px]
                  rounded-full
                  bg-[var(--fresh-500)]/[0.14]
                  blur-3xl
                  sm:h-[340px]
                  sm:w-[340px]
                  lg:h-[420px]
                  lg:w-[420px]
                  xl:h-[480px]
                  xl:w-[480px]
                "
              />

              <div
                className="
                  absolute
                  h-[210px]
                  w-[210px]
                  rounded-full
                  border
                  border-white/10
                  sm:h-[280px]
                  sm:w-[280px]
                  lg:h-[360px]
                  lg:w-[360px]
                "
              />

              <div
                className="
                  absolute
                  h-[310px]
                  w-[310px]
                  rounded-full
                  border
                  border-white/[0.06]
                  sm:h-[400px]
                  sm:w-[400px]
                  lg:h-[500px]
                  lg:w-[500px]
                "
              />

              {heroImage ? (
                <div
                  className="
                    relative
                    z-10
                    flex
                    h-full
                    w-full
                    items-center
                    justify-center
                    animate-[heroProductFloat_6s_ease-in-out_infinite]
                    will-change-transform
                    motion-reduce:animate-none
                  "
                >
                  <img
                    src={heroImage}
                    alt="Seafood segar"
                    className="
                      relative
                      h-auto
                      w-[64%]
                      max-h-[230px]
                      max-w-[280px]
                      object-contain
                      drop-shadow-2xl
                      sm:w-[66%]
                      sm:max-h-[280px]
                      sm:max-w-[350px]
                      md:w-[72%]
                      md:max-h-[330px]
                      md:max-w-[420px]
                      lg:w-[78%]
                      lg:max-h-[390px]
                      lg:max-w-[500px]
                      xl:w-[82%]
                      xl:max-h-[440px]
                      xl:max-w-[560px]
                    "
                  />
                </div>
              ) : (
                <div
                  className="
                    relative
                    z-10
                    flex
                    h-28
                    w-28
                    items-center
                    justify-center
                    rounded-[1.75rem]
                    border
                    border-white/10
                    bg-white/10
                    shadow-2xl
                    backdrop-blur-md
                    sm:h-36
                    sm:w-36
                    lg:h-44
                    lg:w-44
                  "
                >
                  <Fish
                    className="
                      h-12
                      w-12
                      text-[var(--fresh-400)]
                      sm:h-16
                      sm:w-16
                      lg:h-20
                      lg:w-20
                    "
                    strokeWidth={1.7}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes heroProductFloat {
            0%, 100% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(0, -12px, 0);
            }
          }
        `}</style>
      </section>

      {/* ==================================================== */}
      {/* FILTER */}
      {/* ==================================================== */}

      <section
        className="
          border-b
          border-(--ice-200)

          bg-white
        "
      >

        <div
          className="
            mx-auto
            w-full
            max-w-7xl

            px-4
            py-4

            sm:px-6
            sm:py-5

            lg:px-8
          "
        >

          <form
            method="GET"
            action="/customer/products"
            className="
              flex
              flex-col
              gap-3

              lg:flex-row
            "
          >

            {/* SEARCH */}

            <div
              className="
                relative
                flex-1
              "
            >

              <Search
                className="
                  pointer-events-none

                  absolute
                  left-4
                  top-1/2

                  h-4
                  w-4

                  -translate-y-1/2

                  text-slate-400
                "
              />

              <input
                type="search"
                name="search"
                defaultValue={
                  params.search ?? ""
                }
                placeholder="Cari ikan, udang, cumi..."
                className="
                  h-11
                  w-full

                  rounded-xl

                  border
                  border-(--ice-200)

                  bg-slate-50

                  pl-11
                  pr-4

                  text-sm

                  outline-none
                  transition

                  placeholder:text-slate-400

                  focus:border-(--fresh-400)
                  focus:bg-white
                  focus:ring-4
                  focus:ring-(--fresh-100)
                "
              />

            </div>

            {/* CATEGORY SELECT */}

            <div
              className="
                relative

                lg:w-64
              "
            >

              <SlidersHorizontal
                className="
                  pointer-events-none

                  absolute
                  left-4
                  top-1/2

                  h-4
                  w-4

                  -translate-y-1/2

                  text-slate-400
                "
              />

              <select
                name="category"
                defaultValue={
                  params.category ??
                  "all"
                }
                className="
                  h-11
                  w-full

                  appearance-none

                  rounded-xl

                  border
                  border-(--ice-200)

                  bg-slate-50

                  pl-11
                  pr-4

                  text-sm

                  outline-none
                  transition

                  focus:border-(--fresh-400)
                  focus:bg-white
                  focus:ring-4
                  focus:ring-(--fresh-100)
                "
              >

                <option value="all">
                  Semua Kategori
                </option>

                {categories.map(
                  (category) => (

                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >

                      {category.name}

                    </option>

                  )
                )}

              </select>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="
                h-11

                rounded-xl

                bg-(--ocean-900)

                px-6

                text-sm
                font-bold
                text-white

                transition

                hover:bg-(--ocean-800)
              "
            >

              Cari Produk

            </button>

          </form>

          {/* CATEGORY PILLS */}

          <div
            className="
              mt-4

              flex
              gap-2

              overflow-x-auto
              pb-1

              [-ms-overflow-style:none]
              scrollbar-none

              [&::-webkit-scrollbar]:hidden
            "
          >

            <Link
              href={
                categoryUrl()
              }
              className={[
                `
                  shrink-0

                  rounded-full

                  border

                  px-4
                  py-2

                  text-xs
                  font-bold

                  transition
                `,
                !categoryId
                  ? `
                    border-(--ocean-900)
                    bg-(--ocean-900)
                    text-white
                  `
                  : `
                    border-(--ice-200)
                    bg-white
                    text-slate-600

                    hover:border-(--fresh-300)
                    hover:text-(--fresh-700)
                  `,
              ].join(" ")}
            >

              Semua

            </Link>

            {categories.map(
              (category) => {
                const active =
                  categoryId ===
                  category.id;

                return (
                  <Link
                    key={
                      category.id
                    }
                    href={
                      categoryUrl(
                        category.id
                      )
                    }
                    className={[
                      `
                        shrink-0

                        rounded-full

                        border

                        px-4
                        py-2

                        text-xs
                        font-bold

                        transition
                      `,
                      active
                        ? `
                          border-(--fresh-500)
                          bg-(--fresh-500)
                          text-white
                        `
                        : `
                          border-(--ice-200)
                          bg-white
                          text-slate-600

                          hover:border-(--fresh-300)
                          hover:text-(--fresh-700)
                        `,
                    ].join(" ")}
                  >

                    {category.name}

                  </Link>
                );
              }
            )}

          </div>

        </div>

      </section>

      {/* ==================================================== */}
      {/* PRODUCTS */}
      {/* ==================================================== */}

      <section
        id="produk"
      >

        <div
          className="
            mx-auto
            w-full
            max-w-7xl

            px-4
            py-6

            sm:px-6
            sm:py-8

            lg:px-8
            lg:py-10
          "
        >

          {/* SECTION HEADER */}

          <div
            className="
              mb-4

              flex
              items-end
              justify-between
              gap-4

              sm:mb-5
            "
          >

            <div>

              <p
                className="
                  text-[9px]
                  font-black
                  tracking-[0.2em]

                  text-(--ocean-700)

                  sm:text-xs
                "
              >

                KOLEKSI SEAFOOD

              </p>

              <h2
                className="
                  mt-1

                  text-xl
                  font-black
                  tracking-tight

                  text-(--ocean-950)

                  sm:text-2xl
                  lg:text-[28px]
                "
              >

                Produk Tersedia

              </h2>

              <p
                className="
                  mt-1

                  text-xs
                  text-slate-500

                  sm:text-sm
                "
              >

                Pilih seafood favorit Anda.

              </p>

            </div>

            <div
              className="
                flex
                shrink-0
                items-center
                gap-1.5

                rounded-xl

                border
                          border-(--ice-200)

                bg-white

                px-2.5
                py-2

                text-xs
                font-bold

                text-(--ocean-800)

                shadow-sm
              "
            >

              <Package
                className="
                  h-3.5
                  w-3.5

                  text-(--fresh-500)
                "
              />

              {products.length}

            </div>

          </div>

          {products.length === 0 ? (

            <EmptyState
              search={search}
              category={categoryId}
            />

          ) : (

            <div
              className="
                grid

                grid-cols-3
                gap-2

                sm:grid-cols-4
                sm:gap-3

                lg:grid-cols-5
                lg:gap-4

                2xl:grid-cols-6
              "
            >

              {products.map(
                (product) => {
                  /**
                   * ============================================
                   * IMAGE
                   * ============================================
                   */

                  const thumbnail =
                    product.images?.find(
                      (image) =>
                        image.isThumbnail
                    ) ??
                    product.images?.[0] ??
                    null;

                  const image =
                    thumbnail?.image ??
                    null;

                  /**
                   * ============================================
                   * PRICE
                   * ============================================
                   */

                  const price =
                    Number(
                      product.price
                    );

                  /**
                   * ============================================
                   * FLASH SALE
                   * ============================================
                   */

                  const flashSale =
                    flashSaleByProductId.get(
                      product.id
                    ) ?? null;

                  const isFlashSale =
                    flashSale !== null;

                  const originalPrice =
                    isFlashSale
                      ? flashSale.originalPrice
                      : price;

                  const finalPrice =
                    isFlashSale
                      ? flashSale.flashPrice
                      : price;

                  const saving =
                    Math.max(
                      0,
                      originalPrice -
                      finalPrice
                    );

                  const discountPercentage =
                    originalPrice > 0
                      ? Math.round(
                        (
                          saving /
                          originalPrice
                        ) *
                        100
                      )
                      : 0;

                  /**
                   * ============================================
                   * STOCK
                   * ============================================
                   */

                  const stock =
                    Number(
                      product.stock ?? 0
                    );

                  const outOfStock =
                    stock <= 0;

                  /**
                   * ============================================
                   * HOT
                   * ============================================
                   */

                  const isHot =
                    product.featured ===
                    true;

                  /**
                   * ============================================
                   * WISHLIST
                   * ============================================
                   */

                  const initialInWishlist =
                    wishlistProductIds.has(
                      product.id
                    );

                  return (
                    <article
                      key={
                        product.id
                      }
                      className="
                        group
                        relative

                        flex
                        min-w-0
                        flex-col

                        overflow-hidden

                        rounded-xl

                        border
                          border-(--ice-200)

                        bg-white

                        shadow-[0_2px_10px_rgba(15,23,42,0.04)]

                        transition
                        duration-200

                        active:scale-[0.98]

                        sm:hover:-translate-y-0.5
                        sm:hover:border-(--fresh-200)
                        sm:hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]
                      "
                    >

                      {/* ====================================== */}
                      {/* WISHLIST */}
                      {/* ====================================== */}

                      <div
                        className="
                          absolute
                          right-1.5
                          top-1.5
                          z-30

                          sm:right-2
                          sm:top-2
                        "
                      >

                        <ToggleWishlistButton
                          productId={
                            product.id
                          }
                          initialInWishlist={
                            initialInWishlist
                          }
                          className="
                            flex
                            h-7
                            w-7

                            items-center
                            justify-center

                            rounded-full

                            bg-white/95

                            shadow-sm
                            backdrop-blur

                            sm:h-9
                            sm:w-9
                          "
                        />

                      </div>

                      {/* ====================================== */}
                      {/* PRODUCT IMAGE */}
                      {/* ====================================== */}

                      <Link
                        href={
                          `/customer/products/${product.slug}`
                        }
                        className="
                          block
                        "
                      >

                        <div
                          className="
                            relative

                            aspect-square
                            overflow-hidden

                            bg-(--ice-100)
                          "
                        >

                          {image ? (

                            <Image
                              src={
                                image
                              }
                              alt={
                                product.name
                              }
                              fill
                              unoptimized
                              sizes="
                                (max-width: 639px) 33vw,
                                (max-width: 1023px) 25vw,
                                (max-width: 1535px) 20vw,
                                16vw
                              "
                              className="
                                object-cover

                                transition
                                duration-300

                                sm:group-hover:scale-105
                              "
                            />

                          ) : (

                            <div
                              className="
                                flex
                                h-full
                                w-full

                                flex-col
                                items-center
                                justify-center
                                gap-1

                                text-(--ink-400)
                              "
                            >

                              <Fish
                                className="
                                  h-7
                                  w-7

                                  sm:h-9
                                  sm:w-9
                                "
                              />

                              <span
                                className="
                                  text-[8px]

                                  sm:text-xs
                                "
                              >

                                Belum ada gambar

                              </span>

                            </div>

                          )}

                          {/* ================================== */}
                          {/* BADGES */}
                          {/* ================================== */}

                          <div
                            className="
                              absolute
                              left-1.5
                              top-1.5
                              z-20

                              flex
                              flex-col
                              items-start
                              gap-1

                              sm:left-2
                              sm:top-2
                              sm:gap-1.5
                            "
                          >

                            {/* FLASH SALE */}

                            {isFlashSale && (

                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-1

                                  rounded-md

                                  bg-red-600

                                  px-1.5
                                  py-1

                                  text-[7px]
                                  font-black
                                  tracking-wide
                                  text-white

                                  shadow-md

                                  sm:px-2
                                  sm:text-[10px]
                                "
                              >

                                <Zap
                                  className="
                                    h-2.5
                                    w-2.5

                                    fill-current

                                    sm:h-3
                                    sm:w-3
                                  "
                                />

                                FLASH SALE

                              </span>

                            )}

                            {/* HOT */}

{isHot && (
  <div
    className="
      relative
      z-20

      inline-flex
      items-center
      gap-1

      rounded-md

      bg-orange-500
      px-1.5
      py-1

      text-[8px]
      font-black
      tracking-wide
      text-white

      shadow-[0_4px_10px_rgba(249,115,22,0.35)]

      sm:px-2
      sm:text-[10px]
    "
  >
    <Flame
      className="
        h-2.5
        w-2.5
        fill-current

        sm:h-3
        sm:w-3
      "
    />

    HOT
  </div>
)}

                          </div>

                          {/* ================================== */}
                          {/* OUT OF STOCK */}
                          {/* ================================== */}

                          {outOfStock && (

                            <div
                              className="
                                absolute
                                inset-0
                                z-20

                                flex
                                items-center
                                justify-center

                                bg-(--ocean-950)/45
                              "
                            >

                              <span
                                className="
                                  rounded-full

                                  bg-white

                                  px-2
                                  py-1

                                  text-[8px]
                                  font-black

                                  text-(--ocean-950)

                                  sm:px-3
                                  sm:py-1.5
                                  sm:text-xs
                                "
                              >

                                Stok Habis

                              </span>

                            </div>

                          )}

                        </div>

                      </Link>

                      {/* ====================================== */}
                      {/* CONTENT */}
                      {/* ====================================== */}

                      <div
                        className="
                          flex
                          flex-1
                          flex-col

                          p-2

                          sm:p-3
                        "
                      >

                        {/* CATEGORY */}

                        <p
                          className="
                            truncate

                            text-[7px]
                            font-black
                            tracking-wide

                            text-(--fresh-700)

                            sm:text-[10px]
                          "
                        >

                          {product.category?.name ??
                            "SEAFOOD"}

                        </p>

                        {/* PRODUCT NAME */}

                        <Link
                          href={
                            `/customer/products/${product.slug}`
                          }
                          className="
                            block
                          "
                        >

                          <h2
                            className="
                              mt-1

                              line-clamp-2
                              min-h-8

                              text-[10px]
                              font-bold
                              leading-4

                              text-(--ocean-950)

                              transition

                              group-hover:text-(--fresh-700)

                              sm:min-h-10
                              sm:text-sm
                              sm:leading-5
                            "
                          >

                            {product.name}

                          </h2>

                        </Link>

                        {/* ==================================== */}
                        {/* PRICE */}
                        {/* ==================================== */}

                        <div
                          className="
                            mt-2
                            min-h-11.25

                            sm:mt-3
                            sm:min-h-14.5
                          "
                        >

                          {isFlashSale ? (

                            <>

                              <div
                                className="
                                  flex
                                  items-center
                                  gap-1
                                  overflow-hidden
                                "
                              >

                                <span
                                  className="
                                    truncate

                                    text-[7px]
                                    text-slate-400
                                    line-through

                                    sm:text-xs
                                  "
                                >

                                  {formatRupiah(
                                    originalPrice
                                  )}

                                </span>

                                {discountPercentage >
                                  0 && (

                                    <span
                                      className="
                                      shrink-0

                                      rounded

                                      bg-red-50

                                      px-1
                                      py-0.5

                                      text-[7px]
                                      font-black

                                      text-red-600

                                      sm:px-1.5
                                      sm:text-[9px]
                                    "
                                    >

                                      -{
                                        discountPercentage
                                      }%

                                    </span>

                                  )}

                              </div>

                              <p
                                className="
                                  mt-0.5

                                  truncate

                                  text-[11px]
                                  font-black

                                  text-red-600

                                  sm:mt-1
                                  sm:text-base
                                "
                              >

                                {formatRupiah(
                                  finalPrice
                                )}

                              </p>

                              {saving > 0 && (

                                <p
                                  className="
                                    mt-0.5

                                    hidden

                                    text-[9px]
                                    font-medium

                                    text-(--fresh-700)

                                    sm:block
                                  "
                                >

                                  Hemat{" "}

                                  {formatRupiah(
                                    saving
                                  )}

                                </p>

                              )}

                            </>

                          ) : (

                            <p
                              className="
                                truncate

                                text-[11px]
                                font-black

                                text-(--fresh-700)

                                sm:text-base
                              "
                            >

                              {formatRupiah(
                                price
                              )}

                            </p>

                          )}

                        </div>

                        {/* ==================================== */}
                        {/* FOOTER */}
                        {/* ==================================== */}

                        <div
                          className="
                            mt-auto

                            flex
                            items-center
                            justify-between
                            gap-1

                            pt-2
                          "
                        >

                          <span
                            className="
                              truncate

                              text-[7px]
                              font-medium

                              text-(--ink-400)

                              sm:text-xs
                            "
                          >

                            {outOfStock
                              ? "Tidak tersedia"
                              : `Stok ${stock}`}

                          </span>

                          <Link
                            href={
                              `/customer/products/${product.slug}`
                            }
                            className={[
                              `
                                flex
                                h-6

                                shrink-0
                                items-center
                                justify-center

                                rounded-lg

                                px-1.5

                                text-[7px]
                                font-bold

                                transition

                                sm:h-8
                                sm:px-3
                                sm:text-xs
                              `,
                              outOfStock
                                ? `
                                  pointer-events-none

                                  bg-slate-100
                                  text-slate-400
                                `
                                : `
                                  bg-(--ocean-900)
                                  text-white

                                  hover:bg-(--fresh-600)
                                `,
                            ].join(" ")}
                          >

                            <ShoppingCart
                              className="
                                h-2.5
                                w-2.5

                                sm:mr-1
                                sm:h-3.5
                                sm:w-3.5
                              "
                            />

                            <span
                              className="
                                hidden

                                sm:inline
                              "
                            >

                              Lihat

                            </span>

                          </Link>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          )}

        </div>

      </section>

      {/* ==================================================== */}
      {/* BOTTOM CTA */}
      {/* ==================================================== */}

      <section
        className="
          border-t
                border-(--ice-200)

          bg-white
        "
      >

        <div
          className="
            mx-auto
            w-full
            max-w-7xl

            px-4
            py-10

            sm:px-6
            sm:py-14

            lg:px-8
          "
        >

          <div
            className="
              flex
              flex-col
              gap-5

              rounded-3xl

              bg-(--ocean-950)

              p-6
              text-white

              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:p-9
            "
          >

            <div>

              <p
                className="
                  text-[10px]
                  font-black
                  tracking-[0.18em]

                  text-(--fresh-300)
                "
              >

                BELANJA SEAFOOD

              </p>

              <h2
                className="
                  mt-2

                  text-xl
                  font-black

                  sm:text-2xl
                "
              >

                Temukan seafood favorit Anda.

              </h2>

              <p
                className="
                  mt-2

                  max-w-xl

                  text-sm
                  leading-6

                  text-white/60
                "
              >

                Pilih produk favorit,
                masukkan ke keranjang,
                lalu lanjutkan ke checkout.

              </p>

            </div>

            <Link
              href="/customer/cart"
              className="
                inline-flex
                h-11

                shrink-0
                items-center
                justify-center

                rounded-xl

                bg-(--fresh-500)

                px-5

                text-sm
                font-bold
                text-white

                transition

                hover:bg-(--fresh-600)
              "
            >

              Buka Keranjang

              <ArrowRight
                className="
                  ml-2
                  h-4
                  w-4
                "
              />

            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}

/**
 * ============================================================
 * EMPTY STATE
 * ============================================================
 */

function EmptyState({
  search,
  category,
}: {
  search?: string;
  category?: string;
}) {
  return (
    <div
      className="
        rounded-3xl

        border
        border-dashed
        border-(--ice-300)

        bg-white

        px-6
        py-16

        text-center

        sm:py-20
      "
    >

      <div
        className="
          mx-auto

          flex
          h-16
          w-16

          items-center
          justify-center

          rounded-2xl

          bg-(--fresh-50)

          text-(--fresh-600)
        "
      >

        <Sparkles
          className="
            h-8
            w-8
          "
        />

      </div>

      <h2
        className="
          mt-5

          text-lg
          font-black

          text-(--ocean-950)
        "
      >

        Produk tidak ditemukan

      </h2>

      <p
        className="
          mx-auto
          mt-2
          max-w-md

          text-sm
          leading-6

          text-slate-500
        "
      >

        {search
          ? `Tidak ada produk yang cocok dengan pencarian "${search}".`
          : category
            ? "Belum ada produk pada kategori ini."
            : "Belum ada produk yang dipublikasikan."}

      </p>

      <Link
        href="/customer/products"
        className="
          mt-6

          inline-flex
          h-10

          items-center
          justify-center

          rounded-xl

          bg-(--ocean-900)

          px-5

          text-sm
          font-bold
          text-white

          transition

          hover:bg-(--ocean-800)
        "
      >

        Lihat Semua Produk

      </Link>

    </div>
  );
}

/**
 * ============================================================
 * RUPIAH FORMAT
 * ============================================================
 */

function formatRupiah(
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
    Math.max(
      0,
      value
    )
  );
}