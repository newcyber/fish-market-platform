import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Fish,
  Minus,
  Plus,
  Star,
} from "lucide-react";

import ProductService from "@/services/product/product.service";

import AddToCartButton from "@/components/customer/products/AddToCartButton";

import ToggleWishlistButton from "@/components/customer/wishlist/ToggleWishlistButton";

import { auth } from "@/auth";

import WishlistService from "@/services/wishlist/wishlist.service";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;

  const product =
    await ProductService.getProductBySlug(
      slug
    );

  /**
   * ============================================================
   * PRODUCT VALIDATION
   * ============================================================
   */

  if (
    !product ||
    !product.isPublished
  ) {
    notFound();
  }

  /**
 * ============================================================
 * WISHLIST STATE
 * ============================================================
 */
  const session = await auth();

  const initialInWishlist =
    session?.user?.id
      ? await WishlistService.isInWishlist(
        session.user.id,
        product.id
      )
      : false;

  /**
   * ============================================================
   * IMAGE SORTING
   * ============================================================
   */

  const images =
    [...product.images].sort(
      (a, b) => {
        if (
          a.isThumbnail &&
          !b.isThumbnail
        ) {
          return -1;
        }

        if (
          !a.isThumbnail &&
          b.isThumbnail
        ) {
          return 1;
        }

        return (
          a.sortOrder -
          b.sortOrder
        );
      }
    );

  const mainImage =
    images[0]?.image ?? null;

  /**
   * ============================================================
   * PRICE
   * ============================================================
   */

  const price =
    Number(product.price);

  const stock =
    product.stock;

  const outOfStock =
    stock <= 0;

  return (
    <main className="bg-slate-50">
      {/* ====================================================== */}
      {/* BREADCRUMB */}
      {/* ====================================================== */}

      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/customer/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Produk
          </Link>
        </div>
      </div>

      {/* ====================================================== */}
      {/* PRODUCT DETAIL */}
      {/* ====================================================== */}

      <section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            {/* ================================================= */}
            {/* GALLERY */}
            {/* ================================================= */}

            <ProductGallery
              images={images.map(
                (image) => ({
                  id: image.id,
                  image:
                    image.image,
                  sortOrder:
                    image.sortOrder,
                  isThumbnail:
                    image.isThumbnail,
                })
              )}
              mainImage={mainImage}
              productName={
                product.name
              }
            />

            {/* ================================================= */}
            {/* PRODUCT INFO */}
            {/* ================================================= */}

            <div className="flex flex-col">
              {/* Category */}

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  {
                    product.category
                      .name
                  }
                </span>

                {product.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Star className="h-3 w-3 fill-current" />
                    Produk Pilihan
                  </span>
                )}
              </div>

              {/* Name */}

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {product.name}
              </h1>

              {/* SKU */}

              {product.sku && (
                <p className="mt-2 text-xs text-slate-400">
                  SKU:{" "}
                  <span className="font-mono">
                    {product.sku}
                  </span>
                </p>
              )}

              {/* Price */}

              <div className="mt-7 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <div className="text-3xl font-bold tracking-tight text-slate-950">
                  {formatRupiah(
                    price
                  )}
                </div>

                <div className="mt-1 text-sm text-slate-400">
                  per {product.unit}
                </div>
              </div>

              {/* Stock */}

              <div className="mt-5">
                {outOfStock ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    Stok habis
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                    Stok tersedia ·{" "}
                    {stock}{" "}
                    {product.unit}
                  </div>
                )}
              </div>

              {/* Description */}

              <div className="mt-8">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-950">
                  Deskripsi Produk
                </h2>

                <div className="mt-3 text-sm leading-7 text-slate-600">
                  {product.description ? (
                    <p className="whitespace-pre-line">
                      {
                        product.description
                      }
                    </p>
                  ) : (
                    <p className="text-slate-400">
                      Belum ada deskripsi
                      produk.
                    </p>
                  )}
                </div>
              </div>

              {/* Product Information */}

              <div className="mt-7 grid grid-cols-2 gap-3">
                <InfoBox
                  label="Satuan"
                  value={
                    product.unit
                  }
                />

                <InfoBox
                  label="Berat"
                  value={`${formatNumber(
                    Number(
                      product.weight
                    )
                  )} kg`}
                />
              </div>

              {/* ================================================= */}
              {/* ADD TO CART AREA */}
              {/* ================================================= */}

              {/* ================================================= */}
              {/* ADD TO CART */}
              {/* ================================================= */}

              <div className="mt-8 border-t border-slate-200 pt-7">
                <div className="flex items-stretch gap-3">
                  {/* PRIMARY ACTION */}
                  <div className="min-w-0 flex-1">
                    <AddToCartButton
                      productId={product.id}
                      stock={product.stock}
                    />
                  </div>

                  {/* WISHLIST */}
                  <ToggleWishlistButton
                    productId={product.id}
                    initialInWishlist={initialInWishlist}
                    className="
    h-12
    w-12
    shrink-0
    rounded-2xl
  "
                  />
                </div>

                <p className="mt-3 text-center text-xs text-slate-400">
                  Simpan produk favorit Anda ke wishlist
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* TRUST SECTION */}
      {/* ====================================================== */}

      <section className="border-t bg-white">
        <div className="mx-auto grid max-w-7xl gap-px sm:grid-cols-3">
          <TrustItem
            title="Produk Segar"
            description="Pilihan seafood untuk kebutuhan Anda."
          />

          <TrustItem
            title="Kualitas Terjaga"
            description="Informasi produk dan stok ditampilkan secara transparan."
          />

          <TrustItem
            title="Checkout Mudah"
            description="Alamat dan lokasi pengiriman akan digunakan saat checkout."
          />
        </div>
      </section>
    </main>
  );
}

/**
 * ============================================================
 * PRODUCT GALLERY
 * ============================================================
 */

function ProductGallery({
  images,
  mainImage,
  productName,
}: {
  images: {
    id: string;
    image: string;
    sortOrder: number;
    isThumbnail: boolean;
  }[];
  mainImage: string | null;
  productName: string;
}) {
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={productName}
            fill
            priority
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Fish className="h-20 w-20 text-slate-200" />
          </div>
        )}

        {/* Navigation visual */}

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label="Next image"
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images
            .slice(0, 5)
            .map((image, index) => (
              <div
                key={image.id}
                className={[
                  "relative aspect-square overflow-hidden rounded-xl bg-white ring-1",
                  index === 0
                    ? "ring-2 ring-cyan-500"
                    : "ring-slate-200",
                ].join(" ")}
              >
                <Image
                  src={image.image}
                  alt={`${productName} ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================
 * QUANTITY PREVIEW
 * ============================================================
 *
 * Untuk tahap ini masih UI-only.
 * Logic Cart akan kita implementasikan pada milestone berikutnya.
 * ============================================================
 */

function QuantityPreview({
  disabled,
}: {
  disabled: boolean;
}) {
  return (
    <div
      className={[
        "flex h-12 items-center justify-between rounded-full border bg-white px-2 sm:w-36",
        disabled
          ? "border-slate-200 opacity-60"
          : "border-slate-200",
      ].join(" ")}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label="Kurangi jumlah"
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span className="text-sm font-semibold">
        1
      </span>

      <button
        type="button"
        disabled={disabled}
        aria-label="Tambah jumlah"
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * ============================================================
 * INFO BOX
 * ============================================================
 */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

/**
 * ============================================================
 * TRUST ITEM
 * ============================================================
 */

function TrustItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-r-0 border-slate-100 px-6 py-8 text-center last:border-r-0 sm:border-r">
      <h3 className="text-sm font-semibold">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/**
 * ============================================================
 * FORMATTERS
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

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}