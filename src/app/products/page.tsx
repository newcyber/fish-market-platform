import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  Fish,
  Package,
  ShoppingBag,
  User,
} from "lucide-react";

import { auth } from "@/auth";

import DynamicSiteFooter from
  "@/components/layout/DynamicSiteFooter";

import DynamicSiteHeader from
  "@/components/layout/DynamicSiteHeader";

import HomeProductCard, {
  type HomeProductCardProduct,
} from
  "@/components/customer/home/HomeProductCard";

import { prisma } from "@/lib/prisma";

import CategoryService from
  "@/services/category/category.service";

import ProductCategoryNavigation from
  "@/components/customer/products/ProductCategoryNavigation";

/**
 * ============================================================
 * PUBLIC PRODUCTS PAGE
 * ============================================================
 *
 * Halaman semua produk.
 *
 * UI menggunakan design system yang sama dengan homepage:
 *
 * - Deep Ocean
 * - Fresh Green
 * - HomeProductCard
 * - Mobile-first
 * - Responsive grid
 *
 * Grid:
 *
 * Mobile        : 3 kolom
 * Tablet        : 4 kolom
 * Desktop       : 5 kolom
 * Large Desktop : 6 kolom
 */

/**
 * ============================================================
 * PRODUCTS PAGE
 * ============================================================
 */

interface ProductsPageProps {
  searchParams?: Promise<{
    category?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  /**
   * ==========================================================
   * SEARCH PARAMS
   * ==========================================================
   */

  const params =
    (await searchParams) ?? {};

  const categoryId =
    params.category &&
    params.category !== "all"
      ? params.category
      : undefined;
  /**
   * ==========================================================
   * AUTH
   * ==========================================================
   */

  const session =
    await auth();

  const user =
    session?.user ?? null;

  /**
   * ==========================================================
   * FETCH PAGE DATA
   * ==========================================================
   *
   * Mengambil data produk dan pengaturan toko secara paralel.
   *
   * heroSlide1Image menggunakan sumber yang sama dengan:
   *
   * Homepage
   * → SharedHomePage
   * → HomeHeroCarousel
   * → Hero Slider Slide 1
   */

  const [
    products,
    categories,
    storeSettings,
  ] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null,

        isPublished: true,

        ...(categoryId
          ? {
              categoryId,
            }
          : {}),
      },

      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    CategoryService.getCategories({
      active: true,
    }),

    prisma.storeSettings.findFirst(),
  ]);

  /**
   * ==========================================================
   * SERIALIZE PRODUCTS
   * ==========================================================
   *
   * Menyamakan struktur data dengan HomeProductCard.
   */

  const serializedProducts:
    HomeProductCardProduct[] =
    products.map(
      (product) => ({
        id:
          product.id,

        name:
          product.name,

        slug:
          product.slug,

        price:
          typeof product.price ===
            "number"
            ? product.price
            : product.price.toNumber(),

        stock:
          product.stock ?? 0,

        images:
          product.images.map(
            (image) => ({
              id:
                image.id,

              image:
                image.image,

              sortOrder:
                image.sortOrder,

              isThumbnail:
                image.isThumbnail,
            })
          ),
      })
    );

  /**
   * ==========================================================
   * HERO IMAGE
   * ==========================================================
   *
   * Menggunakan gambar Hero Slider Slide 1 yang sama
   * dengan homepage.
   *
   * Sumber:
   *
   * StoreSettings.heroSlide1Image
   *
   * Jika belum ada gambar yang diupload,
   * akan menggunakan fallback icon Fish.
   */

  const heroImage =
    storeSettings?.heroSlide1Image ??
    null;

  /**
   * ==========================================================
   * CATEGORY URL
   * ==========================================================
   */

  const categoryUrl = (
    nextCategoryId?: string
  ) => {
    if (!nextCategoryId) {
      return "/products?category=all#categories";
    }

    return `/products?category=${encodeURIComponent(
      nextCategoryId
    )}#categories`;
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <DynamicSiteHeader
        activePage="products"
      />

      {/* ====================================================== */}
      {/* PAGE HERO */}
      {/* ====================================================== */}

      <section
        className="
          relative
          isolate
          overflow-hidden

          border-b
          border-(--ice-200)

          bg-linear-to-br
          from-(--ocean-950)
          via-(--ocean-900)
          to-(--ocean-700)
        "
      >
        {/* ==================================================== */}
        {/* BACKGROUND DECORATION */}
        {/* ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            overflow-hidden
          "
        >
          {/* LARGE CIRCLE */}

          <div
            className="
              absolute

              -right-20
              -top-24

              h-64
              w-64

              rounded-full

              border
              border-white/6

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

          {/* INNER CIRCLE */}

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
              border-white/6

              sm:h-52
              sm:w-52

              lg:h-80
              lg:w-[320px]
            "
          />

          {/* GLOW */}

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

          {/* BOTTOM GLOW */}

          <div
            className="
              absolute

              -bottom-28
              left-[10%]

              h-56
              w-56

              rounded-full

              bg-(--fresh-500)/10

              blur-3xl

              sm:h-72
              sm:w-72
            "
          />
        </div>

        {/* ==================================================== */}
        {/* HERO CONTENT */}
        {/* ==================================================== */}

        <div
          className="
    relative
    z-10

    mx-auto
    w-full
    max-w-6xl

    px-4
    py-8

    sm:px-6
    sm:py-10

    lg:px-8
    lg:py-12

    xl:py-14
  "
        >
          <div
            className="
      relative

      grid
      items-center

      min-h-[320px]

      gap-6

      sm:min-h-[350px]

      lg:min-h-[360px]
      lg:grid-cols-[1.12fr_0.88fr]
      lg:gap-8

      xl:min-h-[390px]
      xl:gap-10
    "
          >
            {/* ================================================== */}
            {/* HERO TEXT */}
            {/* ================================================== */}

            <div
              className="
        relative
        z-20

        max-w-xl

        lg:max-w-2xl
      "
            >
              {/* EYEBROW */}

              <div
                className="
          inline-flex
          items-center
          gap-2

          rounded-full

          border
          border-white/10

              bg-white/8

          px-3
          py-1.5

          text-[9px]
          font-black
          tracking-[0.16em]

          text-(--fresh-300)

          backdrop-blur

          sm:px-4
          sm:py-2
          sm:text-[11px]
        "
              >
                <Fish
                  className="
            h-3.5
            w-3.5

            sm:h-4
            sm:w-4
          "
                />

                SEMUA PRODUK
              </div>

              {/* TITLE */}

              <h1
                className="
          mt-4

          max-w-lg

          text-3xl
          font-black
          leading-[1.08]
          tracking-tight

          text-white

          sm:mt-5
          sm:text-5xl

          lg:text-[54px]

          xl:text-6xl
        "
              >
                Seafood segar untuk

                <span
                  className="
                  block

                  text-(--fresh-300)
                "
                >
                  kebutuhan Anda.
                </span>
              </h1>

              {/* DESCRIPTION */}

              <p
                className="
          mt-4

          max-w-xl

          text-sm
          leading-6

          text-white/70

          sm:text-base
          sm:leading-7

          lg:text-[17px]
        "
              >
                Temukan berbagai pilihan ikan dan seafood
                berkualitas yang tersedia untuk kebutuhan
                rumah, usaha, dan keluarga Anda.
              </p>

              {/* ================================================ */}
              {/* HERO ACTIONS */}
              {/* ================================================ */}

              <div
                className="
          mt-5

          flex
          flex-wrap
          items-center

          gap-3

          sm:mt-6
          sm:gap-4
        "
              >
                {/* BUTTON */}

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

            text-(--ocean-900)

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

                  <ArrowRight
                    className="
              h-4
              w-4
            "
                  />
                </Link>

                {/* PRODUCT COUNT */}

                <div
                  className="
            inline-flex

            min-w-0

            items-center
            gap-2.5

            rounded-2xl

            border
            border-white/10

              bg-white/8

            px-3
            py-2

            backdrop-blur

            sm:gap-3
            sm:px-3.5
            sm:py-2.5
          "
                >
                  <div
                    className="
              flex
              h-9
              w-9

              shrink-0

              items-center
              justify-center

              rounded-xl

              bg-(--fresh-500)

              text-white

              sm:h-10
              sm:w-10
            "
                  >
                    <Package
                      className="
                h-4.5
                w-4.5

                sm:h-5
                sm:w-5
              "
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                whitespace-nowrap

                text-sm
                font-black

                text-white
              "
                    >
                      {serializedProducts.length} Produk
                    </p>

                    <p
                      className="
                whitespace-nowrap

                text-[9px]

                text-white/60

                sm:text-[10px]
              "
                    >
                      siap untuk Anda pilih
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================== */}
            {/* HERO IMAGE */}
            {/* ================================================== */}

            <div
              className="
        pointer-events-none

        absolute
        inset-y-0
        right-0

        z-0

        flex

        w-[72%]

        items-center
        justify-end

        overflow-visible

        opacity-35

        sm:w-[62%]
        sm:opacity-40

        md:w-[52%]
        md:opacity-45

        lg:relative
        lg:inset-auto
        lg:z-10

        lg:w-full

        lg:items-center
        lg:justify-center

        lg:overflow-visible

        lg:opacity-100
      "
            >
              {/* GLOW */}

              <div
                className="
          absolute

          right-[-10%]

          h-[210px]
          w-[210px]

          rounded-full

          bg-[var(--fresh-500)]/[0.12]

          blur-3xl

          sm:h-[280px]
          sm:w-[280px]

          lg:right-auto

          lg:h-[330px]
          lg:w-[330px]

          xl:h-[380px]
          xl:w-[380px]
        "
              />

              {/* INNER DECORATIVE CIRCLE */}

              <div
                className="
          absolute

          right-[4%]

          h-[190px]
          w-[190px]

          rounded-full

          border
          border-white/[0.08]

          sm:h-[250px]
          sm:w-[250px]

          lg:right-auto

          lg:h-[290px]
          lg:w-[290px]

          xl:h-[340px]
          xl:w-[340px]
        "
              />

              {/* OUTER DECORATIVE CIRCLE */}

              <div
                className="
          absolute

          right-[-8%]

          h-[270px]
          w-[270px]

          rounded-full

          border
          border-white/[0.05]

          sm:h-[350px]
          sm:w-[350px]

          lg:right-auto

          lg:h-[410px]
          lg:w-[410px]

          xl:h-[460px]
          xl:w-[460px]
        "
              />

              {/* IMAGE */}

              {heroImage ? (
                <div
                  className="
            relative
            z-10

            flex

            w-full

            items-center
            justify-end

            lg:justify-center

            animate-[heroProductFloat_6s_ease-in-out_infinite]

            will-change-transform

            motion-reduce:animate-none
          "
                >
                  <Image
                    src={heroImage}
                    alt="Fresh seafood"
                    width={500}
                    height={390}
                    priority
                    className="
              h-auto

              w-[105%]

              max-h-[230px]
              max-w-[360px]

              translate-x-[12%]

              object-contain

              drop-shadow-2xl

              sm:w-full
              sm:max-h-70
              sm:max-w-107.5

              sm:translate-x-[8%]

              md:w-[92%]
              md:max-h-[320px]
              md:max-w-[480px]

              lg:w-[90%]
              lg:max-h-[350px]
              lg:max-w-[440px]

              lg:translate-x-0

              xl:w-[95%]
              xl:max-h-[390px]
              xl:max-w-[500px]
            "
                  />
                </div>
              ) : (
                <div
                  className="
            relative
            z-10

            flex
            h-24
            w-24

            items-center
            justify-center

            rounded-[1.5rem]

            border
            border-white/10

            bg-white/10

            shadow-2xl

            backdrop-blur-md

            sm:h-32
            sm:w-32

            lg:h-40
            lg:w-40
          "
                >
                  <Fish
                    className="
              h-10
              w-10

              text-(--fresh-400)

              sm:h-14
              sm:w-14

              lg:h-16
              lg:w-16
            "
                    strokeWidth={1.7}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* FLOATING ANIMATION */}
        {/* ==================================================== */}

        <style>
          {`
            @keyframes heroProductFloat {
              0%,
              100% {
                transform: translate3d(0, 0, 0);
              }

              50% {
                transform: translate3d(0, -12px, 0);
              }
            }
          `}
        </style>
      </section>

      {/* ====================================================== */}
      {/* PRODUCTS SECTION */}
      {/* ====================================================== */}

      <section
        id="produk"
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
          {/* CATEGORY CONTAINER */}
          {/* ================================================== */}

          <div
  id="categories"
  className="
    scroll-mt-24

    mb-5

    rounded-2xl
    border
    border-(--ice-200)

    bg-white/90

    p-3

    shadow-sm
    backdrop-blur

    sm:mb-6
    sm:p-4
  "
>
  <div
    className="
      mb-3

      flex
      items-center
      justify-between
      gap-3
    "
  >
    <div className="min-w-0">
      <p
        className="
          text-[9px]
          font-black
          tracking-[0.2em]

          text-(--ocean-700)

          sm:text-[10px]
        "
      >
        BELANJA BERDASARKAN
      </p>

      <h2
        className="
          mt-0.5

          text-base
          font-black
          tracking-tight

          text-(--ocean-950)

          sm:text-lg
        "
      >
        Kategori Produk
      </h2>
    </div>

    <span
      className="
        shrink-0

        rounded-full
        bg-(--fresh-50)

        px-2.5
        py-1

        text-[10px]
        font-bold

        text-(--fresh-700)

        sm:px-3
        sm:text-xs
      "
    >
      {categories.length} Kategori
    </span>
  </div>

  <ProductCategoryNavigation
  categories={categories.map(
    (category) => ({
      id: category.id,
      name: category.name,
    })
  )}
  activeCategoryId={categoryId}
  basePath="/customer/products"
/>
</div>

          {/* ================================================== */}
          {/* SECTION HEADER */}
          {/* ================================================== */}

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
            <div className="min-w-0">
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
                Semua Produk
              </h2>

              <p
                className="
                  mt-1

                  text-xs
                  leading-5

                  text-slate-500

                  sm:text-sm
                "
              >
                Jelajahi pilihan seafood segar
                yang tersedia hari ini.
              </p>
            </div>

            {/* PRODUCT COUNT */}

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

                sm:gap-2
                sm:px-3
              "
            >
              <Package
                className="
                  h-3.5
                  w-3.5

                  text-(--fresh-500)

                  sm:h-4
                  sm:w-4
                "
              />

              <span>
                {serializedProducts.length}
              </span>
            </div>
          </div>

          {/* ================================================== */}
          {/* PRODUCT GRID */}
          {/* ================================================== */}

          {serializedProducts.length > 0 ? (
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
              {serializedProducts.map(
                (product) => (
                  <HomeProductCard
                    key={product.id}
                    product={product}
                    productsHref="/products"
                  />
                )
              )}
            </div>
          ) : (
            <div
              className="
                rounded-2xl

                border
                border-dashed
                border-(--ice-300)

                bg-white

                px-5
                py-14

                text-center

                sm:px-8
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

                  bg-[var(--fresh-50)]

                  text-[var(--fresh-600)]

                  sm:h-20
                  sm:w-20
                "
              >
                <ShoppingBag
                  className="
                    h-8
                    w-8

                    sm:h-10
                    sm:w-10
                  "
                />
              </div>

              <h2
                className="
                  mt-5

                  text-lg
                  font-black

                  text-[var(--ocean-950)]

                  sm:mt-6
                  sm:text-xl
                "
              >
                Belum ada produk tersedia
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
                Produk yang telah dipublikasikan
                akan muncul secara otomatis
                di halaman ini.
              </p>

              <Link
                href="/"
                className="
                  mt-6

                  inline-flex
                  h-11

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
                Kembali ke Beranda

                <ArrowRight
                  className="
                    ml-2
                    h-4
                    w-4
                  "
                />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ====================================================== */}
      {/* BOTTOM CTA */}
      {/* ====================================================== */}

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
            py-12

            text-center

            sm:px-6
            sm:py-14

            lg:px-8
            lg:py-16
          "
        >
          <div className="mx-auto max-w-2xl">
            <div
              className="
                mx-auto

                flex
                h-12
                w-12

                items-center
                justify-center

                rounded-2xl

                bg-(--fresh-50)

                text-(--fresh-600)
              "
            >
              {user ? (
                <User className="h-6 w-6" />
              ) : (
                <ShoppingBag className="h-6 w-6" />
              )}
            </div>

            <h2
              className="
                mt-5

                text-2xl
                font-black
                tracking-tight

                text-(--ocean-950)

                sm:text-3xl
              "
            >
              {user
                ? "Siap mulai berbelanja?"
                : "Siap memesan produk pilihan Anda?"}
            </h2>

            <p
              className="
                mt-3

                text-sm
                leading-6

                text-slate-500

                sm:text-base
              "
            >
              {user
                ? "Lanjutkan belanja dan pilih produk seafood favorit Anda."
                : "Masuk atau buat akun untuk melanjutkan pembelian dan mengelola pesanan Anda."}
            </p>

            {user ? (
              <Link
                href="/customer"
                className="
                  mt-7

                  inline-flex
                  h-12

                  items-center
                  justify-center

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
                Mulai Belanja

                <ArrowRight
                  className="
                    ml-2
                    h-4
                    w-4
                  "
                />
              </Link>
            ) : (
              <div
                className="
                  mt-7

                  flex
                  flex-col
                  justify-center
                  gap-3

                  sm:flex-row
                "
              >
                <Link
                  href="/login"
                  className="
                    inline-flex
                    h-12

                    items-center
                    justify-center

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
                  Masuk untuk Belanja

                  <ArrowRight
                    className="
                      ml-2
                      h-4
                      w-4
                    "
                  />
                </Link>

                <Link
                  href="/register"
                  className="
                    inline-flex
                    h-12

                    items-center
                    justify-center

                    rounded-xl

                    border
                    border-(--ice-200)

                    bg-white

                    px-6

                    text-sm
                    font-bold

                    text-(--ocean-900)

                    transition

                    hover:border-(--fresh-300)
                    hover:bg-(--fresh-50)
                  "
                >
                  Buat Akun
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* FOOTER */}
      {/* ====================================================== */}

      <DynamicSiteFooter />
    </main>
  );
}