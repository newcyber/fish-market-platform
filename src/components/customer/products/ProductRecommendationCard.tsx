"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";

import HomeProductQuickAddSheet from "@/components/customer/home/HomeProductQuickAddSheet";

export interface ProductRecommendation {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: Array<{
    id: string;
    image: string;
    sortOrder?: number | null;
    isThumbnail?: boolean | null;
  }>;
  hasVariants?: boolean;
  purchaseCount?: number;
}

interface ProductRecommendationCardProps {
  product: ProductRecommendation;
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function ProductRecommendationCard({
  product,
}: ProductRecommendationCardProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const image =
    product.images.find((item) => item.isThumbnail)?.image ??
    product.images[0]?.image ??
    null;

  const price = currencyFormatter.format(Number(product.price));
  const outOfStock = product.stock <= 0;

  return (
    <>
      <article className="group relative w-[148px] shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:w-[170px]">
        <Link
          href={`/products/${product.slug}`}
          className="block"
          aria-label={`Lihat ${product.name}`}
        >
          <div className="relative aspect-square overflow-hidden bg-slate-50">
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                sizes="170px"
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Tidak ada gambar
              </div>
            )}
          </div>

          <div className="min-h-[92px] p-3 pr-10">
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-800">
              {product.name}
            </h3>

            <p className="mt-2 text-sm font-bold text-slate-900">
              {price}
            </p>

            {product.stock > 0 ? (
              <p className="mt-1 text-[11px] text-slate-400">
                Stok {product.stock}
              </p>
            ) : (
              <p className="mt-1 text-[11px] font-medium text-red-500">
                Stok habis
              </p>
            )}
          </div>
        </Link>

        <button
          type="button"
          aria-label={
            outOfStock
              ? `${product.name} stok habis`
              : `Tambah ${product.name} ke keranjang`
          }
          disabled={outOfStock}
          onClick={() => setQuickAddOpen(true)}
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </article>

      <HomeProductQuickAddSheet
        productId={product.id}
        productName={product.name}
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </>
  );
}
