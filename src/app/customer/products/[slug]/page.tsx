import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  Check,
  ChevronRight,
  Fish,
  Package,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

import ProductService from "@/services/product/product.service";

import {
  prisma,
} from "@/lib/prisma";

import AddToCartButton from "@/components/customer/products/AddToCartButton";

import ProductDetailGallery from "@/components/customer/products/ProductDetailGallery";

import {
  FlashSaleCountdown,
} from "@/components/customer/flash-sale/FlashSaleCountdown";

import ToggleWishlistButton from "@/components/customer/wishlist/ToggleWishlistButton";

import {
  auth,
} from "@/auth";

import WishlistService from "@/services/wishlist/wishlist.service";

export const dynamic =
  "force-dynamic";

/**
 * ============================================================
 * PROPS
 * ============================================================
 */

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * ============================================================
 * PRODUCT DETAIL PAGE
 * ============================================================
 */

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const {
    slug,
  } = await params;

  /**
   * ==========================================================
   * GET PRODUCT
   * ==========================================================
   */

  const product =
    await ProductService.getProductBySlug(
      slug
    );

  /**
   * ==========================================================
   * PRODUCT VALIDATION
   * ==========================================================
   */

  if (
    !product ||
    !product.isPublished
  ) {
    notFound();
  }

  /**
   * ==========================================================
   * AUTH / WISHLIST
   * ==========================================================
   */

  const session =
    await auth();

  const initialInWishlist =
    session?.user?.id
      ? await WishlistService.isInWishlist(
        session.user.id,
        product.id
      )
      : false;

  /**
   * ==========================================================
   * IMAGE SORTING
   * ==========================================================
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

  /**
   * ==========================================================
   * PRODUCT VARIANT OPTIONS
   * ==========================================================
   */

  const variantOptions =
    (
      product.variantOptions ??
      []
    )
      .filter(
        (option) =>
          option.isActive
      )
      .sort(
        (a, b) =>
          a.sortOrder -
          b.sortOrder
      )
      .map(
        (option) => ({
          id:
            option.id,

          label:
            option.label,

          priceAdjustment:
            Number(
              option.priceAdjustment ??
              0
            ),
        })
      );

  /**
   * ==========================================================
   * PRODUCT WEIGHT OPTIONS
   * ==========================================================
   */

  const weightOptions =
    (
      product.weightOptions ??
      []
    )
      .filter(
        (option) =>
          option.isActive
      )
      .sort(
        (a, b) =>
          a.sortOrder -
          b.sortOrder
      )
      .map(
        (option) => ({
          id:
            option.id,

          label:
            option.label,

          price:
            Number(
              option.price
            ),
        })
      );

  /**
* ==========================================================
* ACTIVE FLASH SALE ITEMS
* ==========================================================
*
* Ambil seluruh Flash Sale Item aktif
* untuk produk yang sedang dibuka.
*
* Data ini digunakan untuk display pricing
* di Product Detail dan Add To Cart.
*
* Backend Cart dan Checkout tetap melakukan
* validasi ulang melalui Pricing Engine.
*/
  const flashSaleNow =
    new Date();

  const flashSaleItems =
    await prisma.flashSaleItem.findMany({
      where: {
        productId:
          product.id,

        isActive:
          true,

        flashSale: {
          status:
            "ACTIVE",

          startAt: {
            lte:
              flashSaleNow,
          },

          endAt: {
            gt:
              flashSaleNow,
          },
        },
      },

      select: {
        id:
          true,

        weightOptionId:
          true,

        originalPrice:
          true,

        flashPrice:
          true,

        stockLimit:
          true,

        soldQuantity:
          true,

        flashSale: {
  select: {
    name:
      true,

    endAt:
      true,
  },
},
      },
    });

  /**
   * ==========================================================
   * NORMALIZE FLASH SALE ITEMS
   * ==========================================================
   *
   * Prisma Decimal tidak boleh diteruskan
   * langsung ke Client Component.
   */

  const normalizedFlashSaleItems =
    flashSaleItems
      .filter(
        (item) =>
          item.stockLimit >
          item.soldQuantity
      )
      .map(
        (item) => ({
          id:
            item.id,

          weightOptionId:
            item.weightOptionId,

          originalPrice:
            Number(
              item.originalPrice
            ),

          flashPrice:
            Number(
              item.flashPrice
            ),

          stockLimit:
            item.stockLimit,

          soldQuantity:
            item.soldQuantity,

          campaignName:
  item.flashSale.name,

endsAt:
  item.flashSale.endAt.toISOString(),
        })
      );

  /**
* ==========================================================
* PRODUCT DETAIL DISPLAY PRICING
* ==========================================================
*
* Untuk harga utama Product Detail:
*
* 1. Prioritaskan Flash Sale product-wide.
* 2. Jika tidak ada, gunakan Product Discount.
* 3. Jika tidak ada, gunakan harga normal.
*
* Flash Sale khusus weight tidak dipilih secara otomatis
* karena customer belum memilih weight option.
*/

  const productWideFlashSale =
    normalizedFlashSaleItems.find(
      (item) =>
        item.weightOptionId ===
        null
    ) ?? null;

  const baseProductPrice =
    Number(
      product.price
    );

  /**
   * ==========================================================
   * PRODUCT DISCOUNT STATUS
   * ==========================================================
   */

  const now =
    new Date();

  const isProductDiscountActive =
    product.isDiscountActive &&
    product.discountType !== null &&
    product.discountValue !== null &&
    (
      product.discountStartAt === null ||
      product.discountStartAt <= now
    ) &&
    (
      product.discountEndAt === null ||
      product.discountEndAt > now
    );

  /**
   * ==========================================================
   * PRODUCT DISCOUNT AMOUNT
   * ==========================================================
   */

  let productDiscountAmount =
    0;

  if (
    isProductDiscountActive
  ) {
    const discountValue =
      Number(
        product.discountValue
      );

    if (
      product.discountType ===
      "PERCENTAGE"
    ) {
      productDiscountAmount =
        (
          baseProductPrice *
          discountValue
        ) / 100;
    }

    if (
      product.discountType ===
      "FIXED_AMOUNT"
    ) {
      productDiscountAmount =
        discountValue;
    }

    productDiscountAmount =
      Math.min(
        baseProductPrice,
        Math.max(
          0,
          productDiscountAmount
        )
      );
  }

  /**
   * ==========================================================
   * FINAL DISPLAY PRICE
   * ==========================================================
   *
   * Priority:
   *
   * 1. Product-wide Flash Sale
   * 2. Product Discount
   * 3. Normal Price
   */

  const isFlashSaleDisplay =
    productWideFlashSale !==
    null;

  const displayOriginalPrice =
    isFlashSaleDisplay
      ? productWideFlashSale.originalPrice
      : baseProductPrice;

  const displayFinalPrice =
    isFlashSaleDisplay
      ? productWideFlashSale.flashPrice
      : Math.max(
        0,
        baseProductPrice -
        productDiscountAmount
      );

  const displaySaving =
    Math.max(
      0,
      displayOriginalPrice -
      displayFinalPrice
    );

  const displayDiscountPercentage =
    displayOriginalPrice > 0
      ? Math.round(
        (
          displaySaving /
          displayOriginalPrice
        ) * 100
      )
      : 0;

  /**
   * ==========================================================
   * WEIGHT-SPECIFIC FLASH SALE EXISTS
   * ==========================================================
   *
   * Digunakan untuk memberi informasi kepada customer
   * bahwa harga dapat berubah setelah memilih berat.
   */

  const hasWeightSpecificFlashSale =
    normalizedFlashSaleItems.some(
      (item) =>
        item.weightOptionId !==
        null
    );

  /**
 * ==========================================================
 * PRODUCT PRICE RANGE
 * ==========================================================
 *
 * Harga utama produk diambil dari seluruh weight option aktif.
 *
 * Jika produk tidak memiliki weight option:
 *
 * fallback menggunakan product.price.
 *
 * Product Discount diterapkan pada setiap harga weight.
 * Hasil akhirnya digunakan untuk menentukan:
 *
 * minimum price
 * maximum price
 */

  const price =
    Number(product.price);

  /**
   * ==========================================================
   * PRODUCT DISCOUNT
   * ==========================================================
   */

  const discountValue =
    product.discountValue !== null
      ? Number(
        product.discountValue
      )
      : 0;

  const hasDiscountStarted =
    !product.discountStartAt ||
    new Date(
      product.discountStartAt
    ) <= now;

  const hasDiscountEnded =
    !!product.discountEndAt &&
    new Date(
      product.discountEndAt
    ) <= now;

  const isDiscountCurrentlyActive =
    product.isDiscountActive &&
    product.discountType !== null &&
    discountValue > 0 &&
    hasDiscountStarted &&
    !hasDiscountEnded;

  /**
   * ==========================================================
   * APPLY PRODUCT DISCOUNT
   * ==========================================================
   *
   * Diskon diterapkan ke setiap harga.
   *
   * PERCENTAGE:
   *
   * price - percentage discount
   *
   * FIXED_AMOUNT:
   *
   * price - fixed discount
   */

  const applyProductDiscount = (
    originalPrice: number
  ) => {
    if (
      !isDiscountCurrentlyActive
    ) {
      return originalPrice;
    }

    if (
      product.discountType ===
      "PERCENTAGE"
    ) {
      const percentage =
        Math.min(
          100,
          Math.max(
            0,
            discountValue
          )
        );

      const discountAmount =
        originalPrice *
        (percentage / 100);

      return Math.max(
        0,
        originalPrice -
        discountAmount
      );
    }

    if (
      product.discountType ===
      "FIXED_AMOUNT"
    ) {
      const discountAmount =
        Math.min(
          originalPrice,
          Math.max(
            0,
            discountValue
          )
        );

      return Math.max(
        0,
        originalPrice -
        discountAmount
      );
    }

    return originalPrice;
  };

  /**
   * ==========================================================
   * ACTIVE WEIGHT PRICES
   * ==========================================================
   *
   * Jika tersedia weight option aktif,
   * gunakan seluruh harga weight.
   *
   * Jika tidak tersedia,
   * fallback ke harga dasar produk.
   */

  const originalPriceList =
    weightOptions.length > 0
      ? weightOptions.map(
        (option) =>
          option.price
      )
      : [price];

  /**
   * ==========================================================
   * ORIGINAL PRICE RANGE
   * ==========================================================
   */

  const minimumOriginalPrice =
    Math.min(
      ...originalPriceList
    );

  const maximumOriginalPrice =
    Math.max(
      ...originalPriceList
    );

  /**
   * ==========================================================
   * FINAL PRICE RANGE
   * ==========================================================
   *
   * Diskon diterapkan pada setiap harga weight.
   */

  const finalPriceList =
    originalPriceList.map(
      (originalPrice) =>
        applyProductDiscount(
          originalPrice
        )
    );

  const minimumFinalPrice =
    Math.min(
      ...finalPriceList
    );

  const maximumFinalPrice =
    Math.max(
      ...finalPriceList
    );

  /**
   * ==========================================================
   * TOTAL SAVING RANGE
   * ==========================================================
   */

  const minimumSaving =
    Math.max(
      0,
      minimumOriginalPrice -
      minimumFinalPrice
    );

  const maximumSaving =
    Math.max(
      0,
      maximumOriginalPrice -
      maximumFinalPrice
    );

  /**
   * ==========================================================
   * PRICE RANGE HELPERS
   * ==========================================================
   */

  const hasOriginalPriceRange =
    minimumOriginalPrice !==
    maximumOriginalPrice;

  const hasFinalPriceRange =
    minimumFinalPrice !==
    maximumFinalPrice;

  const hasPriceDiscount =
    isDiscountCurrentlyActive &&
    (
      minimumSaving > 0 ||
      maximumSaving > 0
    );

  /**
   * ==========================================================
   * STOCK
   * ==========================================================
   */

  const stock =
    product.stock;

  const outOfStock =
    stock <= 0;

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      {/* ==================================================== */}
      {/* BREADCRUMB */}
      {/* ==================================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-300 px-4 py-4 lg:px-0">
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            <Link
              href="/"
              className="text-slate-500 transition hover:text-cyan-600"
            >
              Beranda
            </Link>

            <ChevronRight className="h-4 w-4 text-slate-400" />

            <Link
              href="/customer/products"
              className="text-slate-500 transition hover:text-cyan-600"
            >
              Produk
            </Link>

            <ChevronRight className="h-4 w-4 text-slate-400" />

            <Link
              href="/customer/products"
              className="text-slate-500 transition hover:text-cyan-600"
            >
              {
                product.category
                  .name
              }
            </Link>

            <ChevronRight className="h-4 w-4 text-slate-400" />

            <span className="max-w-70 truncate text-slate-900">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* ==================================================== */}
      {/* PRODUCT MAIN */}
      {/* ==================================================== */}

      <section>
        <div className="mx-auto max-w-300 px-3 py-3 sm:px-4 lg:px-0">
          <div className="bg-white">
            <div className="grid lg:grid-cols-[480px_minmax(0,1fr)]">

              {/* ================================================= */}
              {/* PRODUCT GALLERY */}
              {/* ================================================= */}

              <div className="p-5 lg:p-6">
                <ProductDetailGallery
                  productName={
                    product.name
                  }
                  images={
                    images.map(
                      (image) => ({
                        id:
                          image.id,

                        image:
                          image.image,

                        isThumbnail:
                          image.isThumbnail,

                        sortOrder:
                          image.sortOrder,
                      })
                    )
                  }
                  favoriteButton={
                    <ToggleWishlistButton
                      productId={
                        product.id
                      }
                      initialInWishlist={
                        initialInWishlist
                      }
                      className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-slate-200/80
                  bg-white/95
                  text-slate-700
                  shadow-md
                  backdrop-blur-sm
                  transition-all
                  duration-200
                  hover:scale-105
                  hover:bg-white
                  hover:text-red-500
                  active:scale-95
                "
                    />
                  }
                />
              </div>

              {/* ================================================= */}
              {/* PRODUCT INFO */}
              {/* ================================================= */}

              <div className="min-w-0 p-5 pb-8 lg:p-6 lg:pl-4">
                {/* BADGES */}

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">
                    {
                      product.category
                        .name
                    }
                  </span>

                  {product.featured && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      <Star className="h-3 w-3 fill-current" />

                      Produk Pilihan
                    </span>
                  )}
                </div>

                {/* PRODUCT NAME */}

                <h1 className="text-[20px] font-medium leading-7 text-slate-900 lg:text-[24px]">
                  {product.name}
                </h1>

                {/* PRODUCT STATS */}

                <div className="mt-4 flex flex-wrap items-center gap-y-3 text-sm">
                  <div className="flex items-center gap-1 border-r border-slate-200 pr-5">
                    <span className="font-medium text-slate-900">
                      5.0
                    </span>

                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />

                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />

                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />

                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />

                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="border-r border-slate-200 px-5">
                    <span className="font-medium text-slate-900">
                      512
                    </span>

                    <span className="ml-2 text-slate-500">
                      Penilaian
                    </span>
                  </div>

                  <div className="px-5">
                    <span className="font-medium text-slate-900">
                      1025
                    </span>

                    <span className="ml-2 text-slate-500">
                      Terjual
                    </span>
                  </div>
                </div>

                {/* ====================================================== */}
{/* PRODUCT PRICE */}
{/* ====================================================== */}

<div className="mt-5">
  {isFlashSaleDisplay &&
  productWideFlashSale ? (
    <div className="overflow-hidden bg-[#fff4f1]">

      {/* ================================================== */}
      {/* FLASH SALE HEADER */}
      {/* ================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          bg-gradient-to-r
          from-[#ff4d2d]
          to-[#ff6a3d]
          px-4
          py-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* FLASH SALE LABEL */}

        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <span
            className="
              text-lg
              font-black
              italic
              tracking-wide
              text-white
              sm:text-xl
            "
          >
            ⚡ FLASH SALE
          </span>

          {displayDiscountPercentage > 0 && (
            <span
              className="
                rounded
                bg-white/20
                px-2
                py-1
                text-xs
                font-bold
                text-white
              "
            >
              -{displayDiscountPercentage}%
            </span>
          )}
        </div>

        {/* COUNTDOWN */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            sm:justify-end
          "
        >
          <span
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wide
              text-white
              sm:text-sm
            "
          >
            Berakhir Dalam
          </span>

          <FlashSaleCountdown
            endsAt={
              productWideFlashSale.endsAt
            }
          />
        </div>
      </div>

      {/* ================================================== */}
      {/* FLASH SALE PRICE */}
      {/* ================================================== */}

      <div
        className="
          px-4
          py-5
          sm:px-5
        "
      >
        {/* CAMPAIGN NAME */}

        <p
          className="
            mb-3
            text-xs
            font-medium
            text-slate-500
          "
        >
          {productWideFlashSale.campaignName}
        </p>

        <div
          className="
            flex
            flex-wrap
            items-end
            gap-x-3
            gap-y-2
          "
        >
          {/* FLASH PRICE */}

          <div
            className="
              text-3xl
              font-bold
              tracking-tight
              text-[#ee4d2d]
              sm:text-4xl
            "
          >
            {formatRupiah(
              displayFinalPrice
            )}
          </div>

          {/* ORIGINAL PRICE */}

          <div
            className="
              pb-1
              text-sm
              text-slate-400
              line-through
            "
          >
            {formatRupiah(
              displayOriginalPrice
            )}
          </div>
        </div>

        {/* SAVING */}

        {displaySaving > 0 && (
          <div
            className="
              mt-3
              inline-flex
              items-center
              rounded
              bg-red-100
              px-2.5
              py-1
              text-xs
              font-semibold
              text-red-600
            "
          >
            Hemat{" "}
            {formatRupiah(
              displaySaving
            )}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div>
      {/* ================================================ */}
      {/* PRODUCT DISCOUNT */}
      {/* ================================================ */}

      {isProductDiscountActive &&
      displaySaving > 0 ? (
        <div className="space-y-1">
          <div className="text-sm text-slate-400 line-through">
            {formatRupiah(
              displayOriginalPrice
            )}
          </div>

          <div className="text-2xl font-bold text-slate-950 sm:text-3xl">
            {formatRupiah(
              displayFinalPrice
            )}
          </div>

          <div className="text-sm font-medium text-emerald-600">
            Hemat{" "}
            {formatRupiah(
              displaySaving
            )}
          </div>
        </div>
      ) : (
        /* ============================================== */
        /* NORMAL PRICE */
        /* ============================================== */

        <div className="text-2xl font-bold text-slate-950 sm:text-3xl">
          {formatRupiah(
            displayFinalPrice
          )}
        </div>
      )}
    </div>
  )}

  {/* ==================================================== */}
  {/* WEIGHT SPECIFIC FLASH SALE */}
  {/* ==================================================== */}

  {hasWeightSpecificFlashSale &&
  !isFlashSaleDisplay && (
    <div
      className="
        mt-3
        border-l-4
        border-[#ee4d2d]
        bg-[#fff4f1]
        px-3
        py-2.5
      "
    >
      <p
        className="
          text-xs
          font-medium
          text-[#ee4d2d]
        "
      >
        ⚡ Tersedia harga Flash Sale untuk pilihan berat tertentu.
      </p>
    </div>
  )}
</div>

                {/* PRODUCT META */}

                <div className="mt-6 space-y-6">
                  {/* SHIPPING */}

                  <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
                    <div className="text-sm text-slate-500">
                      Pengiriman
                    </div>

                    <div className="flex gap-3">
                      <Truck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />

                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Pengiriman tersedia
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Pilih alamat dan metode
                          pengiriman saat checkout.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* STOCK */}

                  <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
                    <div className="text-sm text-slate-500">
                      Ketersediaan
                    </div>

                    <div>
                      {outOfStock ? (
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-red-600">
                          Stok habis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                          <Check className="h-4 w-4 text-emerald-600" />

                          Stok tersedia

                          <span className="text-slate-500">
                            {stock} tersedia
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CATEGORY */}

                  <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
                    <div className="text-sm text-slate-500">
                      Kategori
                    </div>

                    <Link
                      href="/customer/products"
                      className="text-sm text-cyan-700 hover:underline"
                    >
                      {
                        product.category
                          .name
                      }
                    </Link>
                  </div>
                </div>

                {/* ================================================= */}
                {/* CART ACTION */}
                {/* ================================================= */}

                <div className="mt-8 border-t border-slate-200 pt-7">
                  <AddToCartButton
                    productId={product.id}
                    stock={product.stock}
                    basePrice={
                      Number(
                        product.price
                      )
                    }
                    variantOptions={
                      variantOptions
                    }
                    weightOptions={
                      weightOptions
                    }
                    flashSaleItems={
                      normalizedFlashSaleItems
                    }
                    isDiscountActive={
                      product.isDiscountActive
                    }
                    discountType={
                      product.discountType
                    }
                    discountValue={
                      product.discountValue
                        ? Number(
                          product.discountValue
                        )
                        : null
                    }
                    discountStartAt={
                      product.discountStartAt
                    }
                    discountEndAt={
                      product.discountEndAt
                    }
                  />


                </div>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* PRODUCT INFORMATION */}
          {/* ==================================================== */}

          <section className="mt-3 bg-white px-5 py-5 lg:px-8 lg:py-6">
            <h2 className="border-b border-slate-100 pb-4 text-lg font-medium text-slate-900">
              Informasi Produk
            </h2>

            <div className="mt-5 max-w-4xl">

              <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-y-4 text-sm sm:grid-cols-[180px_minmax(0,1fr)]">

                <div className="text-slate-500">
                  Kategori
                </div>

                <div className="text-slate-900">
                  {product.category.name}
                </div>

                <div className="text-slate-500">
                  SKU
                </div>

                <div className="font-mono text-slate-900">
                  {product.sku ?? "-"}
                </div>

                <div className="text-slate-500">
                  Stok
                </div>

                <div className="text-slate-900">
                  {stock} tersedia
                </div>

                <div className="text-slate-500">
                  Status
                </div>

                <div>
                  {outOfStock ? (
                    <span className="text-red-600">
                      Stok habis
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600">
                      <Check className="h-4 w-4" />

                      Tersedia
                    </span>
                  )}
                </div>

              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* DESCRIPTION */}
          {/* ==================================================== */}

          <section className="mt-3 bg-white px-5 py-5 lg:px-8 lg:py-6">
            <h2 className="border-b border-slate-100 pb-4 text-lg font-medium text-slate-900">
              Deskripsi Produk
            </h2>

            <div className="mt-5 max-w-212.5">

              {product.description ? (
                <div className="whitespace-pre-line text-sm leading-7 text-slate-700">
                  {product.description}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Belum ada deskripsi produk.
                </p>
              )}

            </div>
          </section>

          {/* ==================================================== */}
          {/* TRUST SECTION */}
          {/* ==================================================== */}

          <section className="mt-5 grid bg-white sm:grid-cols-3">
            <TrustItem
              icon={
                <Fish className="h-6 w-6" />
              }
              title="Produk Segar"
              description="Pilihan seafood untuk kebutuhan Anda."
            />

            <TrustItem
              icon={
                <ShieldCheck className="h-6 w-6" />
              }
              title="Kualitas Terjaga"
              description="Informasi produk dan stok ditampilkan secara transparan."
            />

            <TrustItem
              icon={
                <Package className="h-6 w-6" />
              }
              title="Checkout Mudah"
              description="Proses pembelian dirancang cepat dan praktis."
            />
          </section>
        </div>
      </section>
    </main>
  );
}

/**
 * ============================================================
 * TRUST ITEM
 * ============================================================
 */

function TrustItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 border-b border-slate-100 px-6 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-cyan-50 text-cyan-700">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-900">
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
 * FORMAT RUPIAH
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