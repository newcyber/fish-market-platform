import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";

import { auth } from "@/auth";

import WishlistService from "@/services/wishlist/wishlist.service";

import EmptyWishlist from "@/components/customer/wishlist/EmptyWishlist";
import RemoveWishlistButton from "@/components/customer/wishlist/RemoveWishlistButton";

export const dynamic = "force-dynamic";

export default async function CustomerWishlistPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const wishlist =
    await WishlistService.getWishlist(
      session.user.id
    );

  const items =
    wishlist?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
              <Heart className="h-5 w-5 text-cyan-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Wishlist
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Produk favorit yang Anda simpan.
              </p>
            </div>
          </div>
        </div>

        <EmptyWishlist />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
            <Heart className="h-5 w-5 text-cyan-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Wishlist
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {items.length} produk tersimpan di wishlist Anda.
            </p>
          </div>
        </div>

        <Link
          href="/customer/products"
          className="
            inline-flex
            h-10
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            text-sm
            font-semibold
            text-slate-700
            transition
            hover:bg-slate-50
          "
        >
          Lihat Produk
        </Link>
      </div>

      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
        "
      >
        {items.map((item) => {
          const product = item.product;

          const image =
  product.images?.[0]?.image ??
  null;

          const price =
            Number(product.price);

          return (
            <article
              key={item.id}
              className="
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-sm
                transition
                hover:shadow-md
              "
            >
              <Link
                href={`/products/${product.slug}`}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  {image ? (
                    <img
                      src={image}
                      alt={product.name}
                      className="
                        h-full
                        w-full
                        object-cover
                        transition
                        duration-300
                        group-hover:scale-105
                      "
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      Gambar tidak tersedia
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {product.category && (
                      <p className="truncate text-xs font-medium text-cyan-600">
                        {product.category.name}
                      </p>
                    )}

                    <Link
                      href={`/products/${product.slug}`}
                      className="mt-1 block"
                    >
                      <h2 className="truncate text-base font-bold text-slate-900 hover:text-cyan-600">
                        {product.name}
                      </h2>
                    </Link>
                  </div>

                  <RemoveWishlistButton
                    productId={product.id}
                  />
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Harga
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {new Intl.NumberFormat(
                        "id-ID",
                        {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }
                      ).format(price)}
                    </p>
                  </div>

                  <Link
                    href={`/products/${product.slug}`}
                    className="
                      inline-flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-cyan-600
                      text-white
                      transition
                      hover:bg-cyan-700
                    "
                    aria-label={`Lihat ${product.name}`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}