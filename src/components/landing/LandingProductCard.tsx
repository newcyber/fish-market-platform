"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";

import type { HomeProductCardProduct } from "@/components/customer/home/HomeProductCard";

interface LandingProductCardProps {
  product: HomeProductCardProduct;
  productsHref: string;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}

function getProductImage(product: HomeProductCardProduct) {
  const thumbnail = product.images.find((image) => image.isThumbnail);

  return thumbnail?.image ?? product.images[0]?.image ?? null;
}

type OptionalProductMeta = {
  weightLabel?: string;
  rating?: number;
  reviewCount?: string | number;
};

function getOptionalProductMeta(
  product: HomeProductCardProduct,
): OptionalProductMeta {
  const productRecord = product as unknown as Record<string, unknown>;

  const rating =
    typeof productRecord.rating === "number" ? productRecord.rating : undefined;

  const reviewCount =
    typeof productRecord.reviewCount === "string" ||
    typeof productRecord.reviewCount === "number"
      ? productRecord.reviewCount
      : undefined;

  const weightLabel =
    typeof productRecord.weightLabel === "string"
      ? productRecord.weightLabel
      : typeof productRecord.weight === "string"
        ? productRecord.weight
        : undefined;

  return {
    rating,
    reviewCount,
    weightLabel,
  };
}

export default function LandingProductCard({
  product,
  productsHref,
}: LandingProductCardProps) {
  const image = getProductImage(product);

  const productHref = `${productsHref.replace(/\/+$/, "")}/${product.slug}`;

  const outOfStock =
    product.isPreOrder !== true &&
    (product.isOutOfStock === true ||
      (!product.hasVariants &&
        typeof product.stock === "number" &&
        product.stock <= 0));

  const meta = getOptionalProductMeta(product);

  const weightLabel = meta.weightLabel ?? "500 gr";

  const rating =
    typeof meta.rating === "number" ? meta.rating.toFixed(1) : "4.9";

  const reviewCount =
    meta.reviewCount !== undefined ? `(${meta.reviewCount})` : "(1,2k)";

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_3px_12px_rgba(20,58,110,0.10)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(20,58,110,0.16)]">
      {/* PRODUCT IMAGE */}
      <Link href={productHref} className="block overflow-hidden">
        <div className="relative aspect-square overflow-hidden bg-sky-50">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 639px) 46vw, (max-width: 1023px) 30vw, 19vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold text-sky-300">
              Foto produk belum tersedia
            </div>
          )}
        </div>
      </Link>

      {/* PRODUCT CONTENT */}
      <div className="flex flex-1 flex-col px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-3">
        {/* PRODUCT NAME */}
        <Link href={productHref}>
          <h3 className="line-clamp-2 min-h-[36px] text-[12px] font-extrabold leading-4 text-[#10215e] transition hover:text-blue-600 sm:min-h-[40px] sm:text-sm sm:leading-5">
            {product.name}
          </h3>
        </Link>

        {/* PRICE */}
        <div className="mt-2">
          <p className="text-[14px] font-black leading-5 text-[#10215e] sm:text-lg">
            {formatRupiah(product.price)}
          </p>

          {/* WEIGHT */}
          <p className="text-xs font-semibold leading-5 text-[#8494bd] sm:text-sm">
            / {weightLabel}
          </p>
        </div>

        {/* RATING */}
        <div className="mt-1 flex items-center gap-1">
          <Star
            className="h-4 w-4 fill-amber-400 text-amber-400"
            aria-hidden="true"
          />

          <span className="text-xs font-bold text-[#6f82b1] sm:text-sm">
            {rating}
          </span>

          <span className="text-xs font-semibold text-[#91a0c1] sm:text-sm">
            {reviewCount}
          </span>
        </div>

        {/* BUY BUTTON */}
        <Link
          href={productHref}
          aria-disabled={outOfStock}
          className={`mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[10px] font-extrabold text-white transition sm:min-h-11 sm:text-xs ${
            outOfStock
              ? "pointer-events-none bg-slate-300"
              : "bg-[#087cf5] shadow-[0_4px_10px_rgba(8,124,245,0.22)] hover:bg-[#0569d5]"
          }`}
        >
          <ShoppingCart
            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
            aria-hidden="true"
          />

          {outOfStock ? "Stok Habis" : "Beli Sekarang"}
        </Link>
      </div>
    </article>
  );
}
