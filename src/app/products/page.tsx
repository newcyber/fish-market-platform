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

export default async function ProductsPage() {
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
   * FETCH PRODUCTS
   * ==========================================================
   */

  const products =
    await prisma.product.findMany({
      where: {
        deletedAt: null,

        isPublished: true,
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
    });

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
          overflow-hidden

          border-b
          border-[var(--ice-200)]

          bg-gradient-to-br
          from-[var(--ocean-950)]
          via-[var(--ocean-900)]
          to-[var(--ocean-700)]
        "
      >

        {/* ================================================== */}
        {/* BACKGROUND DECORATION */}
        {/* ================================================== */}

        <div className="pointer-events-none absolute inset-0">

          <div
            className="
              absolute

              -right-24
              -top-28

              h-64
              w-64

              rounded-full

              border
              border-white/[0.06]

              sm:-right-16
              sm:-top-20
              sm:h-80
              sm:w-80

              lg:h-[420px]
              lg:w-[420px]
            "
          />

          <div
            className="
              absolute

              right-[8%]
              top-1/2

              h-40
              w-40

              -translate-y-1/2

              rounded-full

              border
              border-white/[0.05]

              sm:h-52
              sm:w-52

              lg:h-72
              lg:w-72
            "
          />

          <div
            className="
              absolute

              -bottom-28
              left-[20%]

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

        {/* ================================================== */}
        {/* HERO CONTENT */}
        {/* ================================================== */}

        <div
          className="
            relative

            mx-auto
            w-full
            max-w-7xl

            px-4
            py-10

            sm:px-6
            sm:py-14

            lg:px-8
            lg:py-20
          "
        >

          <div
            className="
              max-w-3xl
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

                text-3xl
                font-black
                leading-tight
                tracking-tight

                text-white

                sm:mt-5
                sm:text-5xl

                lg:text-6xl
              "
            >

              Seafood segar untuk

              <span
                className="
                  block

                  text-[var(--fresh-300)]
                "
              >
                kebutuhan Anda.
              </span>

            </h1>

            {/* DESCRIPTION */}

            <p
              className="
                mt-4

                max-w-2xl

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

              Temukan berbagai pilihan ikan dan
              seafood berkualitas yang tersedia
              untuk kebutuhan rumah, usaha, dan
              keluarga Anda.

            </p>

            {/* PRODUCT COUNT */}

            <div
              className="
                mt-6

                inline-flex
                items-center
                gap-3

                rounded-2xl

                border
                border-white/10

                bg-white/[0.08]

                px-3
                py-2.5

                backdrop-blur

                sm:mt-8
                sm:px-4
                sm:py-3
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10

                  items-center
                  justify-center

                  rounded-xl

                  bg-[var(--fresh-500)]

                  text-white

                  sm:h-11
                  sm:w-11
                "
              >

                <Package
                  className="
                    h-5
                    w-5
                  "
                />

              </div>

              <div>

                <p
                  className="
                    text-sm
                    font-black
                    text-white
                  "
                >

                  {serializedProducts.length} Produk

                </p>

                <p
                  className="
                    text-[10px]
                    text-white/60

                    sm:text-xs
                  "
                >

                  siap untuk Anda pilih

                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ====================================================== */}
      {/* PRODUCTS SECTION */}
      {/* ====================================================== */}

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

                  text-[var(--ocean-700)]

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

                  text-[var(--ocean-950)]

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
                border-[var(--ice-200)]

                bg-white

                px-2.5
                py-2

                text-xs
                font-bold

                text-[var(--ocean-800)]

                shadow-sm

                sm:gap-2
                sm:px-3
              "
            >

              <Package
                className="
                  h-3.5
                  w-3.5

                  text-[var(--fresh-500)]

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
                    key={
                      product.id
                    }
                    product={
                      product
                    }
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
                border-[var(--ice-300)]

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

                  bg-[var(--ocean-900)]

                  px-5

                  text-sm
                  font-bold
                  text-white

                  transition

                  hover:bg-[var(--ocean-800)]
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
          border-[var(--ice-200)]

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

                bg-[var(--fresh-50)]

                text-[var(--fresh-600)]
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

                text-[var(--ocean-950)]

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

                  bg-[var(--ocean-900)]

                  px-6

                  text-sm
                  font-bold
                  text-white

                  transition

                  hover:bg-[var(--ocean-800)]
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

                    bg-[var(--ocean-900)]

                    px-6

                    text-sm
                    font-bold
                    text-white

                    transition

                    hover:bg-[var(--ocean-800)]
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
                    border-[var(--ice-200)]

                    bg-white

                    px-6

                    text-sm
                    font-bold

                    text-[var(--ocean-900)]

                    transition

                    hover:border-[var(--fresh-300)]
                    hover:bg-[var(--fresh-50)]
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