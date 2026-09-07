import Link from "next/link";

import {
  ChevronRight,
  RotateCcw,
} from "lucide-react";

import HomeProductCard, {
  type HomeProductCardProduct,
} from "@/components/customer/home/HomeProductCard";

/**
 * ============================================================
 * HOME REPEAT PURCHASE PRODUCTS
 * ============================================================
 *
 * Section "Belanja Lagi".
 *
 * Menampilkan produk yang sebelumnya pernah dibeli
 * oleh customer.
 *
 * Data harus sudah difilter dan diserialisasi oleh
 * parent/server component sebelum masuk ke sini.
 *
 * ============================================================
 */

interface HomeRepeatPurchaseProductsProps {
  products: HomeProductCardProduct[];

  productsHref: string;
}

export default function HomeRepeatPurchaseProducts({
  products,
  productsHref,
}: HomeRepeatPurchaseProductsProps) {
  /**
   * ==========================================================
   * EMPTY STATE
   * ==========================================================
   *
   * Jika customer belum pernah memiliki pembelian valid,
   * section tidak ditampilkan.
   */

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-7 sm:py-9 lg:py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* SECTION HEADER */}
        {/* ================================================== */}

        <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6 sm:gap-4">

          <div className="min-w-0">

            <div className="flex items-center gap-2.5 sm:gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--ocean-200)] bg-[var(--ocean-50)] text-[var(--ocean-700)] shadow-sm sm:h-10 sm:w-10">
                <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>

              <div className="min-w-0">

                <p className="text-[9px] font-black tracking-[0.18em] text-[var(--ocean-700)] sm:text-[10px]">
                  PERNAH DIBELI
                </p>

                <h2 className="mt-0.5 text-lg font-black tracking-tight text-[var(--ocean-950)] sm:text-2xl lg:text-[28px]">
                  Belanja Lagi
                </h2>

                <p className="mt-0.5 line-clamp-1 text-[10px] text-[var(--ink-500)] sm:text-sm">
                  Produk yang pernah Anda beli
                </p>

              </div>

            </div>

          </div>

          <Link
            href={productsHref}
            className="group inline-flex min-h-10 shrink-0 items-center gap-0.5 rounded-full px-1 text-[10px] font-bold text-[var(--ocean-800)] transition hover:text-[var(--fresh-700)] sm:min-h-11 sm:gap-1 sm:px-2 sm:text-sm"
          >
            <span>
              Lihat Semua
            </span>

            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
          </Link>

        </div>

        {/* ================================================== */}
        {/* PRODUCTS */}
        {/* ================================================== */}

        <div
          className="
            grid
            grid-cols-3
            gap-2

            sm:grid-cols-4
            sm:gap-3

            lg:grid-cols-5
            lg:gap-4

            xl:grid-cols-6
            xl:gap-4
          "
        >
          {products.map((product) => (
            <HomeProductCard
              key={product.id}
              product={product}
              productsHref={productsHref}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
