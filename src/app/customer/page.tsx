import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  Fish,
  Leaf,
  Package,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

import ProductService from "@/services/product/product.service";

export const dynamic = "force-dynamic";

function formatPrice(value: number | { toNumber: () => number }) {
  const num = typeof value === "number" ? value : value.toNumber();
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default async function CustomerDashboardPage() {
  let featuredProducts: Awaited<
    ReturnType<typeof ProductService.getProducts>
  > = [];

  let latestProducts: Awaited<
    ReturnType<typeof ProductService.getProducts>
  > = [];

  try {
    const [featuredResult, latestResult] = await Promise.all([
      ProductService.getProducts({
        published: true,
        featured: true,
      }),

      ProductService.getProducts({
        published: true,
      }),
    ]);

    featuredProducts = featuredResult;
    latestProducts = latestResult;
  } catch (error) {
    console.error(
      "[CUSTOMER_HOME_PRODUCT_LOAD_ERROR]",
      error
    );
  }

  const heroProducts =
    featuredProducts.length > 0
      ? featuredProducts.slice(0, 3)
      : latestProducts.slice(0, 3);

  const catalogProducts =
    latestProducts.slice(0, 8);

  return (
    <div>
      {/* ====================================================== */}
      {/* HERO */}
      {/* ====================================================== */}

      <section className="overflow-hidden bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">

            {/* HERO TEXT */}

            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />

                Seafood segar pilihan
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Seafood segar,

                <span className="block text-cyan-400">
                  langsung untuk Anda.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Temukan pilihan ikan dan seafood berkualitas
                untuk kebutuhan rumah tangga, restoran,
                maupun bisnis Anda.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/customer/products"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-cyan-400 px-6 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Belanja Sekarang

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>

                <Link
                  href="/customer/products"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Lihat Produk
                </Link>
              </div>

              {heroProducts.length > 0 && (
                <div className="mt-10 flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex -space-x-2">
                    {heroProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-800 text-cyan-300"
                      >
                        <Fish className="h-4 w-4" />
                      </div>
                    ))}
                  </div>

                  <span>
                    Produk pilihan tersedia hari ini
                  </span>
                </div>
              )}
            </div>

            {/* HERO PRODUCT VISUAL */}

            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-linear-to-br from-cyan-500/20 via-slate-800 to-slate-950 p-4 shadow-2xl sm:p-6">

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,.22),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,.15),transparent_40%)]" />

                <div className="relative">

                  {/* HEADER */}

                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                        <Sparkles className="h-4 w-4" />

                        Produk Unggulan
                      </div>

                      <h2 className="mt-2 text-xl font-bold text-white">
                        Fresh Seafood Pilihan
                      </h2>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                      <Fish className="h-6 w-6 text-cyan-300" />
                    </div>
                  </div>

                  {/* PRODUCT LIST */}

                  {heroProducts.length > 0 ? (
                    <div className="space-y-3">
                      {heroProducts.map(
                        (
                          product,
                          index
                        ) => (
                          <Link
                            key={product.id}
                            href={`/customer/products/${product.slug}`}
                            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/10"
                          >
                            <div
                              className={[
                                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10",
                                index === 0
                                  ? "bg-cyan-400/20 text-cyan-300"
                                  : index === 1
                                    ? "bg-sky-400/15 text-sky-300"
                                    : "bg-teal-400/15 text-teal-300",
                              ].join(" ")}
                            >
                              <Fish className="h-7 w-7" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-sm font-semibold text-white">
                                {product.name}
                              </h3>

                              <p className="mt-1 text-xs text-slate-400">
                                {product.unit}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-bold text-cyan-300">
                                {formatPrice(
                                  product.price.toNumber()
                                )}
                              </p>

                              <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-400">
                                <Package className="h-3 w-3" />

                                Stok {product.stock}
                              </div>
                            </div>

                            <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
                          </Link>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="flex min-h-75 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                        <Fish className="h-10 w-10 text-cyan-300" />
                      </div>

                      <h3 className="mt-5 text-lg font-semibold">
                        Produk sedang disiapkan
                      </h3>

                      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                        Produk seafood akan muncul di sini
                        setelah dipublikasikan oleh admin.
                      </p>
                    </div>
                  )}

                  <Link
                    href="/customer/products"
                    className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Lihat Semua Produk

                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* TRUST FEATURES */}
      {/* ====================================================== */}

      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-7xl gap-px sm:grid-cols-2 lg:grid-cols-4">

          <Feature
            icon={
              <Fish className="h-5 w-5" />
            }
            title="Produk Segar"
            description="Pilihan seafood untuk kebutuhan Anda."
          />

          <Feature
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            title="Kualitas Terjaga"
            description="Produk diproses dengan perhatian."
          />

          <Feature
            icon={
              <Truck className="h-5 w-5" />
            }
            title="Pengiriman"
            description="Alamat dan lokasi tersimpan untuk checkout."
          />

          <Feature
            icon={
              <Leaf className="h-5 w-5" />
            }
            title="Fresh Experience"
            description="Belanja seafood lebih sederhana."
          />
        </div>
      </section>

      {/* ====================================================== */}
      {/* PRODUCT CATALOG */}
      {/* ====================================================== */}

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-600">
                <Star className="h-4 w-4" />

                PILIHAN PRODUK
              </div>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Temukan seafood favorit Anda
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Pilihan produk seafood yang tersedia
                dan siap untuk Anda pesan.
              </p>
            </div>

            <Link
              href="/customer/products"
              className="inline-flex items-center gap-2 self-start text-sm font-semibold text-slate-900 transition hover:text-cyan-600 sm:self-auto"
            >
              Lihat Semua

              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {catalogProducts.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {catalogProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Package className="h-8 w-8" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                Belum ada produk tersedia
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Produk yang sudah dipublikasikan
                akan otomatis muncul di halaman ini.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ====================================================== */}
      {/* CTA */}
      {/* ====================================================== */}

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

          <div className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-center text-white sm:px-10">

            <ShoppingCart className="mx-auto h-8 w-8 text-cyan-400" />

            <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
              Siap mulai berbelanja?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Jelajahi katalog seafood dan temukan produk
              yang sesuai kebutuhan Anda.
            </p>

            <Link
              href="/customer/products"
              className="mt-7 inline-flex h-11 items-center rounded-full bg-cyan-400 px-6 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Mulai Belanja

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
 * FEATURE
 * ============================================================
 */

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 border-r-0 border-slate-100 px-6 py-6 lg:border-r">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * PRODUCT CARD
 * ============================================================
 */

type ProductCardProduct = {
  id: string;
  name: string;
  slug: string;

  description?: string | null;
  unit?: string | null;

  price:
    | number
    | {
        toNumber: () => number;
      };

  stock?: number | null;

  images?: Array<{
  id?: string;
  image?: string | null;
  sortOrder?: number | null;
  isThumbnail?: boolean;
}>;
};

interface ProductCardProps {
  product: ProductCardProduct;
}

function ProductCard({
  product,
}: ProductCardProps) {
  /**
   * ==========================================================
   * PRICE NORMALIZATION
   * ==========================================================
   */

  const priceNumber =
    product.price &&
    typeof product.price === "object" &&
    "toNumber" in product.price &&
    typeof product.price.toNumber === "function"
      ? product.price.toNumber()
      : Number(product.price);

  /**
   * ==========================================================
   * STOCK NORMALIZATION
   * ==========================================================
   */

  const stock =
    typeof product.stock === "number"
      ? product.stock
      : 0;

  /**
   * ==========================================================
   * PRODUCT IMAGE
   * ==========================================================
   */

  const productImage =
  product.images?.[0]?.image ?? null;

  return (
    <Link
      href={`/customer/products/${product.slug}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl"
    >
      {/* ====================================================== */}
      {/* PRODUCT IMAGE */}
      {/* ====================================================== */}

      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {productImage ? (
          <Image
  src={productImage}
  alt={product.name}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
  className="object-cover transition-transform duration-500 group-hover:scale-105"
/>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.25),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,.15),transparent_35%)]" />

            <div className="relative flex h-full items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/60 bg-white/60 text-cyan-600 shadow-sm backdrop-blur">
                <Fish className="h-10 w-10" />
              </div>
            </div>
          </>
        )}

        {/* ==================================================== */}
        {/* STOCK BADGE */}
        {/* ==================================================== */}

        {stock > 0 ? (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Tersedia
          </div>
        ) : (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-slate-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Habis
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* PRODUCT INFORMATION */}
      {/* ====================================================== */}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900 transition group-hover:text-cyan-600">
              {product.name}
            </h3>

            {product.unit ? (
              <p className="mt-1 text-xs text-slate-500">
                {product.unit}
              </p>
            ) : null}
          </div>

          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-cyan-600" />
        </div>

        {product.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
            {product.description}
          </p>
        ) : null}

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">
              Harga
            </p>

            <p className="mt-1 text-base font-bold text-slate-900">
              {formatPrice(priceNumber)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">
              Stok
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {stock}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}