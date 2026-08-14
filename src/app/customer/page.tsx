import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  Fish,
  Leaf,
  Package,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

import ProductService from "@/services/product/product.service";

export const dynamic = "force-dynamic";

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function formatPrice(
  value: number | { toNumber: () => number }
) {
  const num =
    typeof value === "number"
      ? value
      : value.toNumber();

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(num);
}

/**
 * ============================================================
 * PRODUCT TYPES
 * ============================================================
 */

type CustomerProduct = {
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

/**
 * ============================================================
 * CUSTOMER DASHBOARD PAGE
 * ============================================================
 */

export default async function CustomerDashboardPage() {
  /**
   * ==========================================================
   * PRODUCT DATA
   * ==========================================================
   */

  let featuredProducts: CustomerProduct[] = [];

  let latestProducts: CustomerProduct[] = [];

  try {
    const [
      featuredResult,
      latestResult,
    ] = await Promise.all([
      ProductService.getProducts({
        published: true,
        featured: true,
      }),

      ProductService.getProducts({
        published: true,
      }),
    ]);

    featuredProducts =
      featuredResult as CustomerProduct[];

    latestProducts =
      latestResult as CustomerProduct[];
  } catch (error) {
    console.error(
      "[CUSTOMER_HOME_PRODUCT_LOAD_ERROR]",
      error
    );
  }

  /**
   * ==========================================================
   * FEATURED / HERO PRODUCTS
   * ==========================================================
   */

  const heroProducts =
    featuredProducts.length > 0
      ? featuredProducts.slice(0, 3)
      : latestProducts.slice(0, 3);

  /**
   * ==========================================================
   * MOBILE SHOWCASE
   * ==========================================================
   */

  const mobileShowcaseProducts =
    heroProducts.slice(0, 3);

  /**
   * ==========================================================
   * ALL PRODUCTS
   * ==========================================================
   */

  const catalogProducts =
    latestProducts;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ====================================================== */}
      {/* MOBILE SHOWCASE */}
      {/* ====================================================== */}

      <section className="lg:hidden">

        {/* ==================================================== */}
        {/* MOBILE SLIDER */}
        {/* ==================================================== */}

        <div className="bg-slate-50 px-3 pt-3">

          <div
            className="
              flex
              snap-x
              snap-mandatory
              gap-3
              overflow-x-auto
              pb-2
              [-ms-overflow-style:none]
              scrollbar-none
              [&::-webkit-scrollbar]:hidden
            "
          >

            {/* SLIDE 1 */}

            <Link
              href="/customer/products"
              className="
                relative
                min-w-full
                snap-center
                overflow-hidden
                rounded-2xl
                bg-slate-950
                p-5
                text-white
              "
            >

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,211,238,.35),transparent_30%),radial-gradient(circle_at_10%_100%,rgba(14,165,233,.2),transparent_40%)]" />

              <div className="relative min-h-37.5">

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Fresh Seafood
                </p>

                <h2 className="mt-2 max-w-55 text-xl font-bold leading-tight">
                  Seafood segar untuk kebutuhan Anda.
                </h2>

                <p className="mt-2 max-w-52.5 text-xs leading-5 text-slate-300">
                  Pilihan produk segar dengan kualitas terbaik.
                </p>

                <span className="mt-4 inline-flex rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950">
                  Belanja Sekarang
                </span>

              </div>

            </Link>

            {/* SLIDE 2 */}

            <Link
              href="/customer/products"
              className="
                relative
                min-w-full
                snap-center
                overflow-hidden
                rounded-2xl
                bg-cyan-600
                p-5
                text-white
              "
            >

              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

              <div className="relative min-h-37.5">

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">
                  Produk Pilihan
                </p>

                <h2 className="mt-2 max-w-55 text-xl font-bold leading-tight">
                  Temukan seafood favorit Anda.
                </h2>

                <p className="mt-2 max-w-52.5 text-xs leading-5 text-cyan-50/90">
                  Belanja lebih mudah dan pilih produk terbaik.
                </p>

                <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-cyan-700">
                  Lihat Produk
                </span>

              </div>

            </Link>

            {/* SLIDE 3 */}

            <Link
              href="/customer/products"
              className="
                relative
                min-w-full
                snap-center
                overflow-hidden
                rounded-2xl
                bg-slate-800
                p-5
                text-white
              "
            >

              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.08),transparent_50%)]" />

              <div className="relative min-h-37.5">

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Pilihan Hari Ini
                </p>

                <h2 className="mt-2 max-w-55 text-xl font-bold leading-tight">
                  Produk segar siap untuk Anda.
                </h2>

                <p className="mt-2 max-w-52.5 text-xs leading-5 text-slate-300">
                  Jelajahi berbagai pilihan seafood yang tersedia.
                </p>

                <span className="mt-4 inline-flex rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950">
                  Jelajahi Sekarang
                </span>

              </div>

            </Link>

          </div>

          {/* SLIDER INDICATOR */}

          <div className="mt-1 flex justify-center gap-1.5">

            <span className="h-1.5 w-5 rounded-full bg-cyan-500" />

            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />

            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />

          </div>

        </div>

        {/* ==================================================== */}
        {/* MOBILE PRODUCT SHOWCASE */}
        {/* ==================================================== */}

        {mobileShowcaseProducts.length > 0 ? (

          <section className="mt-4 bg-white px-3 py-4">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-base font-bold text-slate-950">
                  Produk Pilihan
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Pilihan terbaik untuk Anda
                </p>

              </div>

              <Link
                href="/customer/products"
                className="text-xs font-semibold text-cyan-600"
              >
                Lihat Semua
              </Link>

            </div>

            <div
              className="
                mt-4
                flex
                gap-3
                overflow-x-auto
                pb-1
                [-ms-overflow-style:none]
                scrollbar-none
                [&::-webkit-scrollbar]:hidden
              "
            >

              {mobileShowcaseProducts.map(
                (product) => {
                  const productImage =
                    product.images?.[0]?.image ??
                    null;

                  const price =
                    typeof product.price === "object" &&
                    product.price !== null &&
                    "toNumber" in product.price &&
                    typeof product.price.toNumber === "function"
                      ? product.price.toNumber()
                      : Number(product.price);

                  const stock =
                    typeof product.stock === "number"
                      ? product.stock
                      : 0;

                  return (
                    <Link
                      key={product.id}
                      href={`/customer/products/${product.slug}`}
                      className="
                        group
                        w-32
                        shrink-0
                        overflow-hidden
                        rounded-xl
                        border
                        border-slate-100
                        bg-white
                        shadow-sm
                      "
                    >

                      <div className="relative aspect-square overflow-hidden bg-slate-100">

                        {productImage ? (

                          <Image
                            src={productImage}
                            alt={product.name}
                            fill
                            sizes="128px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                        ) : (

                          <div className="flex h-full items-center justify-center">

                            <Fish className="h-9 w-9 text-slate-300" />

                          </div>

                        )}

                        {stock <= 0 ? (

                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">

                            <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-slate-800">
                              HABIS
                            </span>

                          </div>

                        ) : null}

                      </div>

                      <div className="p-2">

                        <h3 className="line-clamp-2 min-h-8 text-[11px] font-medium leading-4 text-slate-800">
                          {product.name}
                        </h3>

                        {product.unit ? (

                          <p className="mt-1 truncate text-[9px] text-slate-400">
                            {product.unit}
                          </p>

                        ) : null}

                        <p className="mt-1.5 text-xs font-bold text-cyan-600">
                          {formatPrice(price)}
                        </p>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>

          </section>

        ) : null}

      </section>

      {/* ====================================================== */}
      {/* DESKTOP HERO */}
      {/* ====================================================== */}

      <section className="hidden overflow-hidden bg-slate-950 text-white lg:block">

        <div className="mx-auto max-w-7xl px-8 py-20">

          <div className="grid items-center gap-16 lg:grid-cols-[1fr_1fr]">

            {/* HERO TEXT */}

            <div className="max-w-2xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300">

                <span className="h-2 w-2 rounded-full bg-cyan-400" />

                Seafood segar pilihan

              </div>

              <h1 className="mt-6 text-5xl font-bold tracking-tight">

                Seafood segar,

                <span className="block text-cyan-400">
                  langsung untuk Anda.
                </span>

              </h1>

              <p className="mt-6 max-w-xl text-lg leading-7 text-slate-300">

                Temukan pilihan ikan dan seafood berkualitas
                untuk kebutuhan rumah tangga, restoran,
                maupun bisnis Anda.

              </p>

              <div className="mt-8 flex gap-3">

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

            </div>

            {/* HERO PRODUCT LIST */}

            <div className="relative">

              <div className="absolute -inset-8 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-linear-to-br from-cyan-500/20 via-slate-800 to-slate-950 p-6 shadow-2xl">

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,.22),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,.15),transparent_40%)]" />

                <div className="relative">

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

                  {heroProducts.length > 0 ? (

                    <div className="space-y-3">

                      {heroProducts.map(
                        (product, index) => {
                          const price =
                            typeof product.price === "object" &&
                            product.price !== null &&
                            "toNumber" in product.price &&
                            typeof product.price.toNumber === "function"
                              ? product.price.toNumber()
                              : Number(product.price);

                          const stock =
                            typeof product.stock === "number"
                              ? product.stock
                              : 0;

                          return (
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

                                {product.unit ? (

                                  <p className="mt-1 text-xs text-slate-400">
                                    {product.unit}
                                  </p>

                                ) : null}

                              </div>

                              <div className="text-right">

                                <p className="text-sm font-bold text-cyan-300">
                                  {formatPrice(price)}
                                </p>

                                <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-400">

                                  <Package className="h-3 w-3" />

                                  Stok {stock}

                                </div>

                              </div>

                              <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300" />

                            </Link>
                          );
                        }
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

                    </div>

                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ====================================================== */}
      {/* TRUST FEATURES */}
      {/* ====================================================== */}

      <section className="hidden border-b bg-white lg:block">

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
      {/* ALL PRODUCTS */}
      {/* ====================================================== */}

      <section className="bg-slate-50">

        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8 lg:py-16">

          {/* ================================================== */}
          {/* SECTION HEADER */}
          {/* ================================================== */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 lg:text-sm">

                <Star className="h-4 w-4" />

                PILIHAN PRODUK

              </div>

              <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-900 sm:text-3xl">

                Semua Produk

              </h2>

              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">

                Jelajahi pilihan seafood segar yang tersedia
                dan siap untuk Anda pesan.

              </p>

            </div>

            <Link
              href="/customer/products"
              className="hidden items-center gap-2 self-start text-sm font-semibold text-slate-900 transition hover:text-cyan-600 sm:inline-flex sm:self-auto"
            >

              Lihat Semua

              <ArrowRight className="h-4 w-4" />

            </Link>

            <div className="flex items-center gap-1 text-xs text-slate-500 sm:hidden">

              <Search className="h-4 w-4" />

              <span>
                {catalogProducts.length} Produk
              </span>

            </div>

          </div>

          {/* ================================================== */}
          {/* PRODUCT GRID */}
          {/* ================================================== */}

          {catalogProducts.length > 0 ? (

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">

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

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">

          <div className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-center text-white sm:px-10 sm:py-12">

            <ShoppingCart className="mx-auto h-8 w-8 text-cyan-400" />

            <h2 className="mt-5 text-xl font-bold sm:text-3xl">
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

interface ProductCardProps {
  product: CustomerProduct;
}

function ProductCard({
  product,
}: ProductCardProps) {
  /**
   * ==========================================================
   * PRICE
   * ==========================================================
   */

  const priceNumber =
    typeof product.price === "object" &&
    product.price !== null &&
    "toNumber" in product.price &&
    typeof product.price.toNumber === "function"
      ? product.price.toNumber()
      : Number(product.price);

  /**
   * ==========================================================
   * STOCK
   * ==========================================================
   */

  const stock =
    typeof product.stock === "number"
      ? product.stock
      : 0;

  /**
   * ==========================================================
   * IMAGE
   * ==========================================================
   */

  const productImage =
    product.images?.[0]?.image ??
    null;

  return (
    <Link
      href={`/customer/products/${product.slug}`}
      className="
        group
        overflow-hidden
        rounded-lg
        border
        border-slate-200
        bg-white
        shadow-sm
        transition
        active:scale-[0.98]
        sm:rounded-2xl
        lg:hover:-translate-y-1
        lg:hover:border-cyan-200
        lg:hover:shadow-xl
      "
    >

      {/* ====================================================== */}
      {/* PRODUCT IMAGE */}
      {/* ====================================================== */}

      <div className="relative aspect-square overflow-hidden bg-slate-100">

        {productImage ? (

          <Image
            src={productImage}
            alt={product.name}
            fill
            sizes="
              (max-width: 640px) 50vw,
              (max-width: 1024px) 50vw,
              25vw
            "
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

        ) : (

          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.25),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,.15),transparent_35%)]" />

            <div className="relative flex h-full items-center justify-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/60 bg-white/60 text-cyan-600 shadow-sm backdrop-blur sm:h-20 sm:w-20">

                <Fish className="h-7 w-7 sm:h-10 sm:w-10" />

              </div>

            </div>
          </>

        )}

        {/* ==================================================== */}
        {/* STOCK BADGE */}
        {/* ==================================================== */}

        {stock > 0 ? (

          <div className="absolute left-1.5 top-1.5 z-10 rounded bg-emerald-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white sm:left-3 sm:top-3 sm:rounded-full sm:px-3 sm:py-1 sm:text-[10px]">

            Tersedia

          </div>

        ) : (

          <div className="absolute left-1.5 top-1.5 z-10 rounded bg-slate-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white sm:left-3 sm:top-3 sm:rounded-full sm:px-3 sm:py-1 sm:text-[10px]">

            Habis

          </div>

        )}

      </div>

      {/* ====================================================== */}
      {/* PRODUCT INFORMATION */}
      {/* ====================================================== */}

      <div className="p-2.5 sm:p-5">

        <div className="flex items-start justify-between gap-2 sm:gap-3">

          <div className="min-w-0">

            <h3 className="line-clamp-2 min-h-8 text-[11px] font-medium leading-4 text-slate-900 transition group-hover:text-cyan-600 sm:min-h-0 sm:truncate sm:text-base sm:font-semibold sm:leading-normal">

              {product.name}

            </h3>

            {product.unit ? (

              <p className="mt-1 truncate text-[10px] text-slate-500 sm:text-xs">

                {product.unit}

              </p>

            ) : null}

          </div>

          <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-cyan-600 sm:block" />

        </div>

        {product.description ? (

          <p className="mt-3 hidden line-clamp-2 text-sm leading-6 text-slate-500 sm:block">

            {product.description}

          </p>

        ) : null}

        <div className="mt-2 flex items-end justify-between gap-2 sm:mt-5 sm:gap-3">

          <div>

            <p className="hidden text-xs text-slate-400 sm:block">

              Harga

            </p>

            <p className="text-sm font-bold text-cyan-600 sm:mt-1 sm:text-base sm:text-slate-900">

              {formatPrice(priceNumber)}

            </p>

          </div>

          <div className="text-right">

            <p className="hidden text-xs text-slate-400 sm:block">

              Stok

            </p>

            <p className="text-[10px] text-slate-400 sm:mt-1 sm:text-sm sm:font-semibold sm:text-slate-700">

              Stok {stock}

            </p>

          </div>

        </div>

      </div>

    </Link>
  );
}