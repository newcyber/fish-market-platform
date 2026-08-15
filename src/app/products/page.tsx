import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  Fish,
  Menu,
  Package,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";

import { auth } from "@/auth";

import DynamicSiteFooter from "@/components/layout/DynamicSiteFooter";

import MobileProductsShowcase from "@/components/products/MobileProductsShowcase";

import { prisma } from "@/lib/prisma";

import settingsService from "@/services/settings/settings.service";

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function formatPrice(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

/**
 * ============================================================
 * GET PRODUCT IMAGE
 * ============================================================
 *
 * Mendukung struktur lama maupun struktur baru.
 *
 * image:
 * {
 *   image?: string
 *   url?: string
 * }
 *
 * Hal ini membuat halaman tetap kompatibel apabila
 * model ProductImage menggunakan field image atau url.
 */

function getProductImage(
  images: unknown
): string | null {
  if (
    !Array.isArray(images) ||
    images.length === 0
  ) {
    return null;
  }

  const firstImage =
    images[0] as {
      image?: string | null;
      url?: string | null;
    };

  return (
    firstImage?.url ??
    firstImage?.image ??
    null
  );
}

/**
 * ============================================================
 * PUBLIC PRODUCTS PAGE
 * ============================================================
 *
 * Halaman ini:
 *
 * ✓ Bisa dibuka tanpa login
 * ✓ User login tetap terdeteksi
 * ✓ Header mengambil nama toko dari Admin Settings
 * ✓ Tidak menggunakan HomeUserMenu
 * ✓ Tidak mengubah component lain
 * ✓ Mobile showcase tetap berjalan
 * ✓ Produk desktop dan mobile menggunakan gambar produk
 * ✓ Footer tetap DynamicSiteFooter
 *
 * ============================================================
 */

export default async function ProductsPage() {
  /**
   * ==========================================================
   * AUTH
   * ==========================================================
   *
   * auth() tidak melakukan redirect.
   *
   * Jika belum login:
   * session = null
   *
   * Halaman tetap dapat dibuka.
   */

  const session =
    await auth();

  const user =
    session?.user ?? null;

  const userName =
    user?.name?.trim() ||
    "Pengguna";

  /**
   * ==========================================================
   * STORE SETTINGS
   * ==========================================================
   *
   * Mengambil konfigurasi toko yang sama dengan
   * Admin Settings.
   */

  const settings =
    await settingsService.getSettings();

  const storeName =
    settings?.storeName?.trim() ||
    "Fish Market";

  const storeDescription =
    settings?.storeDescription?.trim() ||
    "Fresh Seafood";

  /**
   * ==========================================================
   * FETCH PRODUCTS
   * ==========================================================
   */

  const products =
    await prisma.product.findMany({
      where: {
        deletedAt: null,
      },

      include: {
        category: true,

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
   * MOBILE SHOWCASE PRODUCTS
   * ==========================================================
   *
   * Ambil maksimal 3 produk pertama.
   */

  const mobileShowcaseProducts =
    products
      .slice(0, 3)
      .map((product) => {
        const price =
          typeof product.price ===
          "number"
            ? product.price
            : product.price.toNumber();

        return {
          id: product.id,

          name: product.name,

          slug: product.slug,

          price,

          unit:
            product.unit ?? "",

          stock:
            product.stock ?? 0,

          image:
            getProductImage(
              product.images
            ),
        };
      });

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* ================================================== */}
          {/* STORE BRAND */}
          {/* ================================================== */}

          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-900/10">
              <Fish className="h-5 w-5" />
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-bold tracking-tight text-slate-950 sm:text-base">
                {storeName}
              </p>

              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-600 sm:text-[10px]">
                {storeDescription}
              </p>

            </div>
          </Link>

          {/* ================================================== */}
          {/* DESKTOP NAVIGATION */}
          {/* ================================================== */}

          <nav className="hidden items-center gap-7 md:flex">

            <Link
              href="/"
              className="text-sm font-medium text-slate-600 transition hover:text-cyan-600"
            >
              Beranda
            </Link>

            <Link
              href="/products"
              className="text-sm font-semibold text-slate-950 transition hover:text-cyan-600"
            >
              Produk
            </Link>

            <Link
              href="/customer"
              className="text-sm font-medium text-slate-600 transition hover:text-cyan-600"
            >
              Belanja
            </Link>

          </nav>

          {/* ================================================== */}
          {/* DESKTOP USER ACTION */}
          {/* ================================================== */}

          <div className="hidden items-center gap-3 md:flex">

            {user ? (
              <Link
                href="/customer"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
                  {userName
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <span className="max-w-35 truncate">
                  {userName}
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  Masuk
                </Link>

                <Link
                  href="/register"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Daftar

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </>
            )}

          </div>

          {/* ================================================== */}
          {/* MOBILE USER ACTION */}
          {/* ================================================== */}

          <Link
            href={
              user
                ? "/customer"
                : "/login"
            }
            aria-label={
              user
                ? "Buka akun"
                : "Masuk"
            }
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
          >
            {user ? (
              <span className="text-sm font-bold">
                {userName
                  .charAt(0)
                  .toUpperCase()}
              </span>
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Link>

        </div>

      </header>

      {/* ====================================================== */}
      {/* MOBILE SHOWCASE */}
      {/* ====================================================== */}

      <MobileProductsShowcase
        products={
          mobileShowcaseProducts
        }
      />

      {/* ====================================================== */}
      {/* DESKTOP HERO */}
      {/* ====================================================== */}

      <section className="hidden border-b border-slate-200 bg-white lg:block">

        <div className="mx-auto max-w-7xl px-8 py-16">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-700">

              <Fish className="h-4 w-4" />

              PRODUK SEAFOOD

            </div>

            <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-950">

              Temukan seafood

              <span className="block text-cyan-600">
                favorit Anda.
              </span>

            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-7 text-slate-500">

              Pilih berbagai produk seafood segar
              yang tersedia untuk kebutuhan rumah,
              restoran, maupun bisnis Anda.

            </p>

            {/* PRODUCT COUNT */}

            <div className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm">

                <Package className="h-5 w-5" />

              </div>

              <div>

                <p className="text-sm font-bold text-slate-900">
                  {products.length} Produk
                </p>

                <p className="text-xs text-slate-500">
                  tersedia untuk dilihat
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ====================================================== */}
      {/* MOBILE PRODUCTS */}
      {/* ====================================================== */}

      <section className="lg:hidden">

        <div className="mx-auto max-w-7xl px-3 py-5">

          {/* SECTION HEADER */}

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-lg font-bold text-slate-950">
                Semua Produk
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Jelajahi seafood segar pilihan kami
              </p>

            </div>

            <div className="flex items-center gap-1 text-xs text-slate-500">

              <Search className="h-4 w-4" />

              <span>
                {products.length}
              </span>

            </div>

          </div>

          {/* PRODUCT GRID */}

          {products.length > 0 ? (

            <div className="mt-4 grid grid-cols-3 gap-2">

              {products.map(
                (product) => {
                  const productImage =
                    getProductImage(
                      product.images
                    );

                  const price =
                    typeof product.price ===
                    "number"
                      ? product.price
                      : product.price.toNumber();

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition active:scale-[0.98]"
                    >

                      {/* IMAGE */}

                      <div className="relative aspect-square overflow-hidden bg-slate-100">

                        {productImage ? (

                          <Image
                            src={productImage}
                            alt={product.name}
                            fill
                            sizes="50vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                        ) : (

                          <div className="flex h-full w-full items-center justify-center">

                            <Fish className="h-9 w-9 text-slate-300" />

                          </div>

                        )}

                        {/* STOCK BADGE */}

                        {product.stock > 0 ? (

                          <div className="absolute left-1.5 top-1.5 rounded bg-emerald-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">

                            Tersedia

                          </div>

                        ) : (

                          <div className="absolute left-1.5 top-1.5 rounded bg-slate-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">

                            Habis

                          </div>

                        )}

                      </div>

                      {/* INFO */}

                      <div className="p-2.5">

                        <h3 className="line-clamp-2 min-h-8 text-[11px] font-medium leading-4 text-slate-800">

                          {product.name}

                        </h3>

                        <p className="mt-1 truncate text-[10px] text-slate-400">

                          {product.unit}

                        </p>

                        <p className="mt-2 text-sm font-bold leading-none text-cyan-600">

                          {formatPrice(price)}

                        </p>

                        <p className="mt-2 text-[10px] text-slate-400">

                          Stok {product.stock}

                        </p>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>

          ) : (

            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">

                <ShoppingBag className="h-8 w-8" />

              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">

                Belum ada produk tersedia

              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">

                Produk yang telah dipublikasikan admin
                akan muncul di sini.

              </p>

            </div>

          )}

        </div>

      </section>

      {/* ====================================================== */}
      {/* DESKTOP PRODUCTS */}
      {/* ====================================================== */}

      <section className="hidden lg:block">

        <div className="mx-auto max-w-7xl px-8 py-12">

          {/* SECTION HEADER */}

          <div className="flex items-center justify-between border-b border-slate-200 pb-6">

            <div>

              <h2 className="text-xl font-bold text-slate-950">

                Semua Produk

              </h2>

              <p className="mt-1 text-sm text-slate-500">

                Jelajahi produk seafood yang tersedia.

              </p>

            </div>

            <div className="inline-flex items-center gap-2 text-sm text-slate-500">

              <Search className="h-4 w-4" />

              <span>

                Klik produk untuk melihat detail

              </span>

            </div>

          </div>

          {/* PRODUCT GRID */}

          {products.length > 0 ? (

            <div className="mt-8 grid grid-cols-3 gap-4 xl:grid-cols-6">

              {products.map(
                (product) => {
                  const productImage =
                    getProductImage(
                      product.images
                    );

                  const price =
                    typeof product.price ===
                    "number"
                      ? product.price
                      : product.price.toNumber();

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg"
                    >

                      {/* IMAGE */}

                      <div className="relative aspect-square overflow-hidden bg-slate-100">

                        {productImage ? (

                          <Image
                            src={productImage}
                            alt={product.name}
                            fill
                            sizes="
                              (max-width: 1280px) 33vw,
                              25vw
                            "
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                        ) : (

                          <div className="flex h-full w-full items-center justify-center">

                            <Fish className="h-10 w-10 text-slate-300" />

                          </div>

                        )}

                        {product.stock > 0 ? (

                          <div className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">

                            Tersedia

                          </div>

                        ) : (

                          <div className="absolute left-3 top-3 rounded-full bg-slate-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">

                            Habis

                          </div>

                        )}

                      </div>

                      {/* PRODUCT INFO */}

                      <div className="p-4">

                        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-slate-800 transition group-hover:text-cyan-600">

                          {product.name}

                        </h3>

                        <p className="mt-1 text-xs text-slate-400">

                          {product.unit}

                        </p>

                        <div className="mt-4 flex items-end justify-between gap-3">

                          <div>

                            <p className="text-base font-bold text-cyan-600">

                              {formatPrice(price)}

                            </p>

                            <p className="mt-1 text-xs text-slate-400">

                              Stok {product.stock}

                            </p>

                          </div>

                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-600" />

                        </div>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>

          ) : (

            <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600">

                <ShoppingBag className="h-10 w-10" />

              </div>

              <h2 className="mt-6 text-xl font-bold text-slate-900">

                Belum ada produk tersedia

              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">

                Produk yang telah ditambahkan dan
                dipublikasikan oleh admin akan muncul
                secara otomatis di halaman ini.

              </p>

              <Link
                href="/"
                className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >

                Kembali ke Beranda

                <ArrowRight className="ml-2 h-4 w-4" />

              </Link>

            </div>

          )}

        </div>

      </section>

      {/* ====================================================== */}
      {/* CTA */}
      {/* ====================================================== */}

      <section className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 lg:px-8">

          <div className="mx-auto max-w-2xl">

            {user ? (

              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">

                  <User className="h-6 w-6" />

                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-950 sm:text-3xl">

                  Siap mulai berbelanja?

                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">

                  Lanjutkan ke halaman belanja untuk
                  melihat produk dan melakukan pemesanan.

                </p>

                <Link
                  href="/customer"
                  className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
                >

                  Mulai Belanja

                  <ArrowRight className="ml-2 h-4 w-4" />

                </Link>
              </>

            ) : (

              <>
                <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">

                  Siap memesan produk pilihan Anda?

                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">

                  Masuk atau buat akun untuk melanjutkan
                  pembelian dan mengelola pesanan Anda.

                </p>

                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >

                    Masuk untuk Belanja

                    <ArrowRight className="ml-2 h-4 w-4" />

                  </Link>

                  <Link
                    href="/register"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
                  >

                    Buat Akun

                  </Link>

                </div>
              </>

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