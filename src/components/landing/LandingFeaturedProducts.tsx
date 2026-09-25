import Link from "next/link";
import { ArrowRight, Fish } from "lucide-react";

import type { HomeProductCardProduct } from "@/components/customer/home/HomeProductCard";

import LandingProductCard from "./LandingProductCard";

interface LandingFeaturedProductsProps {
  products: HomeProductCardProduct[];
  productsHref: string;
  section?: {
    enabled?: boolean;
    eyebrow?: string;
    title?: string;
    description?: string;
    buttonLabel?: string;
    mobileButtonLabel?: string;
    displayLimit?: number;
  };
}

export default function LandingFeaturedProducts({
  products,
  productsHref,
  section,
}: LandingFeaturedProductsProps) {
  if (section?.enabled === false || products.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="landing-featured-products-title"
      className="relative overflow-hidden bg-white py-8 sm:py-12 lg:py-14"
    >
      {/* DECORATIVE OCEAN BACKGROUND */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sky-100/90 via-sky-50/50 to-transparent"
      />

      <div className="relative mx-auto w-full max-w-[1370px] px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div className="min-w-0">
            {/* EYEBROW */}
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-600 sm:text-xs">
              <Fish className="h-3.5 w-3.5" />
              {section?.eyebrow ?? "Produk Pilihan"}
            </div>

            {/* HEADING */}
            <h2
              id="landing-featured-products-title"
              className="text-2xl font-black leading-[1.05] tracking-tight text-[#071b67] sm:text-3xl lg:text-[42px]"
            >
              {section?.title ?? "Seafood Favorit Pelanggan"}
            </h2>

            {/* DESCRIPTION */}
            <p className="mt-2 text-xs font-medium text-[#7182ae] sm:text-base">
              {section?.description ??
                "Pilihan ikan dan seafood segar dengan harga khusus PISJO."}
            </p>
          </div>

          {/* VIEW ALL LINK */}
          <Link
            href={productsHref}
            className="group inline-flex shrink-0 items-center gap-1.5 pb-1 text-xs font-bold text-blue-600 transition hover:text-blue-800 sm:text-base"
          >
            <span className="hidden sm:inline">
              {section?.buttonLabel ?? "Lihat Semua Produk"}
            </span>

            <span className="sm:hidden">
              {section?.mobileButtonLabel ?? "Lihat Semua"}
            </span>

            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
          </Link>
        </div>

        {/* PRODUCT GRID */}
        {/* MOBILE HORIZONTAL SCROLL / DESKTOP GRID */}
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
          {products
            .slice(0, Math.max(1, Math.min(section?.displayLimit ?? 5, 12)))
            .map((product) => (
              <div
                key={product.id}
                className="w-[160px] shrink-0 snap-start sm:w-auto"
              >
                <LandingProductCard
                  product={product}
                  productsHref={productsHref}
                />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
