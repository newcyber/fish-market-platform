import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  Fish,
  Search,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";

import ProductService from "@/services/product/product.service";
import CategoryService from "@/services/category/category.service";

import { auth } from "@/auth";

import WishlistService from "@/services/wishlist/wishlist.service";

import ToggleWishlistButton from "@/components/customer/wishlist/ToggleWishlistButton";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams?: Promise<{
    search?: string;
    category?: string;
  }>;
}

export default async function CustomerProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = (await searchParams) ?? {};

  const search =
    params.search?.trim() || undefined;

  const categoryId =
    params.category &&
    params.category !== "all"
      ? params.category
      : undefined;

  /**
   * ============================================================
   * LOAD DATA
   * ============================================================
   */

  const [products, categories] =
    await Promise.all([
      ProductService.getProducts({
        search,
        categoryId,
        published: true,
      }),

      CategoryService.getCategories({
        active: true,
      }),
    ]);

    /**
 * ============================================================
 * WISHLIST STATE
 * ============================================================
 *
 * Ambil wishlist satu kali agar tidak melakukan
 * query isInWishlist() untuk setiap Product Card.
 */

const session = await auth();

const wishlist =
  session?.user?.id
    ? await WishlistService.getWishlist(
        session.user.id
      )
    : null;

const wishlistProductIds =
  new Set(
    wishlist?.items.map(
      (item) => item.productId
    ) ?? []
  );

  /**
   * ============================================================
   * CATEGORY FILTER URL
   * ============================================================
   */

  function categoryUrl(
    categoryId?: string
  ) {
    const query = new URLSearchParams();

    if (search) {
      query.set("search", search);
    }

    if (categoryId) {
      query.set(
        "category",
        categoryId
      );
    }

    const queryString =
      query.toString();

    return queryString
      ? `/customer/products?${queryString}`
      : "/customer/products";
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">
                <Fish className="h-3.5 w-3.5" />
                Fresh Seafood
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Produk Seafood
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Temukan pilihan ikan dan seafood segar
                untuk kebutuhan Anda.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">
                {products.length}
              </span>{" "}
              produk tersedia
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* FILTER */}
      {/* ====================================================== */}

      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <form
            method="GET"
            action="/customer/products"
            className="flex flex-col gap-3 lg:flex-row"
          >
            {/* Search */}

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                name="search"
                defaultValue={
                  params.search ?? ""
                }
                placeholder="Cari ikan, udang, cumi..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            {/* Category */}

            <div className="relative lg:w-64">
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                name="category"
                defaultValue={
                  params.category ??
                  "all"
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-50"
              >
                <option value="all">
                  Semua Kategori
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Submit */}

            <button
              type="submit"
              className="h-11 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Cari Produk
            </button>
          </form>

          {/* ================================================= */}
          {/* CATEGORY PILLS */}
          {/* ================================================= */}

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <Link
              href={categoryUrl()}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition",
                !categoryId
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400",
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
                    key={category.id}
                    href={categoryUrl(
                      category.id
                    )}
                    className={[
                      "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition",
                      active
                        ? "border-cyan-500 bg-cyan-500 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700",
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

      {/* ====================================================== */}
      {/* PRODUCT GRID */}
      {/* ====================================================== */}

      <section>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {products.length === 0 ? (
            <EmptyState
              search={search}
              category={categoryId}
            />
          ) : (
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-4 xl:grid-cols-6">
              {products.map(
                (product) => {
                  const thumbnail =
                    product.images.find(
                      (image) =>
                        image.isThumbnail
                    ) ??
                    product.images[0];

                  const image =
                    thumbnail?.image ??
                    null;

                  const price =
                    Number(
                      product.price
                    );

                  const stock =
                    product.stock;

                  const outOfStock =
                    stock <= 0;

                    const initialInWishlist =
  wishlistProductIds.has(
    product.id
  );

                  return (
                    <article
  key={product.id}
  className="
    group
    relative
    overflow-hidden
    rounded-2xl
    border
    border-slate-200
    bg-white
    transition
    duration-300
    hover:-translate-y-1
    hover:border-slate-300
    hover:shadow-xl
  "
>
  {/* ====================================================== */}
  {/* WISHLIST */}
  {/* ====================================================== */}

  <div className="absolute right-3 top-3 z-20">
    <ToggleWishlistButton
      productId={product.id}
      initialInWishlist={initialInWishlist}
      className="
        h-10
        w-10
        rounded-full
        bg-white/95
        shadow-md
        backdrop-blur
      "
    />
  </div>

  {/* ====================================================== */}
  {/* IMAGE */}
  {/* ====================================================== */}

  <Link
    href={`/customer/products/${product.slug}`}
    className="block"
  >
                        <div className="relative aspect-square overflow-hidden bg-slate-100">
                          {image ? (
                            <Image
                              src={image}
                              alt={
                                product.name
                              }
                              fill
                              unoptimized
                              className="object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200">
                              <Fish className="h-12 w-12 text-slate-300" />
                            </div>
                          )}

                          {/* Featured */}

                          {product.featured && (
                            <span className="absolute left-3 top-3 rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                              Pilihan
                            </span>
                          )}

                          {/* Stock */}

                          {outOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
                              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-900">
                                Stok Habis
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Content */}

                      <div className="p-4">
                        <div className="mb-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-cyan-600">
                            {
                              product
                                .category
                                .name
                            }
                          </span>
                        </div>

                        <Link
                          href={`/customer/products/${product.slug}`}
                          className="block"
                        >
                          <h2 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900 transition group-hover:text-cyan-700 sm:text-base">
                            {
                              product.name
                            }
                          </h2>
                        </Link>

                        <div className="mt-3">
                          <div className="text-base font-bold text-slate-950 sm:text-lg">
                            {formatRupiah(
                              price
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2">
                          <div className="text-[11px] text-slate-400">
                            {outOfStock
                              ? "Tidak tersedia"
                              : `Stok ${stock}`}
                          </div>

                          <Link
                            href={`/customer/products/${product.slug}`}
                            className={[
                              "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition",
                              outOfStock
                                ? "pointer-events-none bg-slate-100 text-slate-400"
                                : "bg-slate-950 text-white hover:bg-cyan-600",
                            ].join(" ")}
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />

                            Lihat
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

      {/* ====================================================== */}
      {/* BOTTOM CTA */}
      {/* ====================================================== */}

      <section className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 rounded-3xl bg-slate-950 p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
                Pisjo Market
              </p>

              <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                Temukan seafood favorit Anda.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Pilih produk, masukkan ke keranjang,
                lalu lanjutkan ke checkout.
              </p>
            </div>

            <Link
              href="/customer/cart"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-cyan-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Buka Keranjang
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
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
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Fish className="h-8 w-8 text-slate-400" />
      </div>

      <h2 className="mt-5 text-lg font-bold text-slate-900">
        Produk tidak ditemukan
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {search
          ? `Tidak ada produk yang cocok dengan pencarian "${search}".`
          : category
            ? "Belum ada produk pada kategori ini."
            : "Belum ada produk yang dipublikasikan."}
      </p>

      <Link
        href="/customer/products"
        className="mt-6 inline-flex h-10 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
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
  ).format(value);
}