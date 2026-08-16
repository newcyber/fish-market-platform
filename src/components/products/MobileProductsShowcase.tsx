"use client";

import Image from "next/image";
import Link from "next/link";

interface ShowcaseProduct {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    image: string | null;
}

interface MobileProductsShowcaseProps {
    products: ShowcaseProduct[];
}

function formatPrice(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

export default function MobileProductsShowcase({
    products,
}: MobileProductsShowcaseProps) {
    return (
        <section className="lg:hidden">
            {/* ====================================================== */}
            {/* MOBILE PROMO SLIDER */}
            {/* ====================================================== */}

            <div className="overflow-hidden bg-slate-50 px-3 pt-3">
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
                        href="/products"
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
                                Lihat Produk
                            </span>
                        </div>
                    </Link>

                    {/* SLIDE 2 */}

                    <Link
                        href="/products"
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
                                Belanja Sekarang
                            </span>
                        </div>
                    </Link>

                    {/* SLIDE 3 */}

                    <Link
                        href="/products"
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

            {/* ====================================================== */}
            {/* PRODUK PILIHAN */}
            {/* ====================================================== */}

            {products.length > 0 ? (
                <div className="mt-5 bg-white px-3 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-950">
                                Produk Pilihan
                            </h2>

                            <p className="mt-0.5 text-[11px] text-slate-500">
                                Pilihan produk terbaru untuk Anda
                            </p>
                        </div>

                        <Link
                            href="/products"
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
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
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
                                {/* PRODUCT IMAGE */}

                                <div className="relative aspect-square overflow-hidden bg-slate-100">
                                    {product.image ? (
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            sizes="128px"
                                            className="
                        object-cover
                        transition-transform
                        duration-300
                        group-hover:scale-105
                      "
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-3xl">
                                            🐟
                                        </div>
                                    )}

                                    {product.stock <= 0 ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                                            <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-slate-800">
                                                HABIS
                                            </span>
                                        </div>
                                    ) : null}
                                </div>

                                {/* PRODUCT INFO */}

                                <div className="p-2">
                                    <h3 className="line-clamp-2 min-h-8 text-[11px] font-medium leading-4 text-slate-800">
                                        {product.name}
                                    </h3>

                                    <p className="mt-1.5 text-xs font-bold text-cyan-600">
                                        {formatPrice(product.price)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    );
}