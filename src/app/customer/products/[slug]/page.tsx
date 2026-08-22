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
  Tag,
  X,
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

                {/* PRODUCT AVAILABILITY */}

<div className="mt-4 flex flex-wrap items-center gap-2">
  {outOfStock ? (
    <span
      className="
        inline-flex
        items-center
        rounded-full
        bg-red-50
        px-3
        py-1.5
        text-xs
        font-semibold
        text-red-600
      "
    >
      Stok sedang habis
    </span>
  ) : (
    <span
      className="
        inline-flex
        items-center
        rounded-full
        bg-emerald-50
        px-3
        py-1.5
        text-xs
        font-semibold
        text-emerald-700
      "
    >
      Stok tersedia
    </span>
  )}

  <span
    className="
      inline-flex
      items-center
      rounded-full
      bg-slate-100
      px-3
      py-1.5
      text-xs
      font-medium
      text-slate-600
    "
  >
    Kategori: {product.category.name}
  </span>
</div>

                {/* ====================================================== */}
{/* PRODUCT PRICE */}
{/* ====================================================== */}

<div className="mt-5">
  {isFlashSaleDisplay ? (
  <div
    className="
      overflow-hidden
      rounded-2xl
      border
      border-orange-200
      bg-white
      shadow-sm
    "
  >
    {/* ================================================== */}
    {/* FLASH SALE HEADER */}
    {/* ================================================== */}

    <div
      className="
        flex
        flex-col
        gap-3
        bg-linear-to-r
        from-[#2d81ee]
        to-[#45f9ff]
        px-4
        py-3.5
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >
      <div className="flex items-center gap-2">
        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            bg-white/15
            text-lg
          "
        >
          ⚡
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span
              className="
                text-base
                font-black
                tracking-wide
                text-white
                sm:text-lg
              "
            >
              FLASH SALE
            </span>

            {displayDiscountPercentage > 0 && (
              <span
                className="
                  rounded-md
                  bg-white/20
                  px-2
                  py-0.5
                  text-[11px]
                  font-bold
                  text-white
                "
              >
                -{displayDiscountPercentage}%
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-white/75">
            Promo terbatas untuk waktu tertentu
          </p>
        </div>
      </div>

      {/* COUNTDOWN */}

      <div
        className="
          flex
          items-center
          gap-2
          rounded-lg
          bg-black/10
          px-3
          py-2
          sm:justify-end
        "
      >
        <span
          className="
            text-[11px]
            font-semibold
            uppercase
            tracking-wide
            text-white/80
          "
        >
          Berakhir dalam
        </span>

        <FlashSaleCountdown
          endsAt={productWideFlashSale.endsAt}
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
        sm:py-6
      "
    >
      {/* CAMPAIGN */}

      <p
        className="
          mb-3
          text-xs
          font-medium
          uppercase
          tracking-wide
          text-slate-400
        "
      >
        {productWideFlashSale.campaignName}
      </p>

      {/* PRICE */}

      <div
        className="
          flex
          flex-wrap
          items-end
          gap-x-3
          gap-y-2
        "
      >
        <div
          className="
            text-3xl
            font-bold
            tracking-tight
            text-[#ff2a00]
            sm:text-4xl
          "
        >
          {formatRupiah(displayFinalPrice)}
        </div>

        <div
          className="
            pb-1
            text-sm
            text-slate-400
            line-through
          "
        >
          {formatRupiah(displayOriginalPrice)}
        </div>
      </div>

      {/* SAVING */}

      {displaySaving > 0 && (
        <div className="mt-4">
          <span
            className="
              inline-flex
              items-center
              rounded-lg
              bg-orange-50
              px-3
              py-1.5
              text-xs
              font-semibold
              text-[#ff2a00]
            "
          >
            Hemat {formatRupiah(displaySaving)}
          </span>
        </div>
      )}
    </div>
  </div>
) : (
  <div
    className="
      rounded-2xl
      border
      border-slate-200
      bg-slate-50
      px-4
      py-5
      sm:px-5
    "
  >
    {/* ================================================ */}
    {/* PRODUCT DISCOUNT */}
    {/* ================================================ */}

    {isProductDiscountActive &&
    displaySaving > 0 ? (
      <div>
        <p
          className="
            mb-2
            text-xs
            font-medium
            uppercase
            tracking-wide
            text-slate-400
          "
        >
          Harga Produk
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div
            className="
              text-3xl
              font-bold
              tracking-tight
              text-slate-950
              sm:text-4xl
            "
          >
            {formatRupiah(displayFinalPrice)}
          </div>

          <div
            className="
              pb-1
              text-sm
              text-slate-400
              line-through
            "
          >
            {formatRupiah(displayOriginalPrice)}
          </div>
        </div>

        <div className="mt-4">
          <span
            className="
              inline-flex
              items-center
              rounded-lg
              bg-emerald-50
              px-3
              py-1.5
              text-xs
              font-semibold
              text-emerald-700
            "
          >
            Hemat {formatRupiah(displaySaving)}
          </span>
        </div>
      </div>
    ) : (
      /* ============================================== */
      /* NORMAL PRICE */
      /* ============================================== */

      <div>
        <p
          className="
            mb-2
            text-xs
            font-medium
            uppercase
            tracking-wide
            text-slate-400
          "
        >
          Harga Produk
        </p>

        <div
          className="
            text-3xl
            font-bold
            tracking-tight
            text-slate-950
            sm:text-4xl
          "
        >
          {formatRupiah(displayFinalPrice)}
        </div>
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
      rounded-xl
      border
      border-orange-100
      border-l-4
      border-l-[#fc3e18]
      bg-[#fff8f5]
      px-4
      py-3
    "
  >
    <p
      className="
        text-xs
        font-medium
        leading-5
        text-[#ff2a00]
      "
    >
      ⚡ Tersedia harga Flash Sale untuk pilihan berat tertentu.
    </p>
  </div>
)}
</div>

                {/* ==================================================== */}
{/* PRODUCT META */}
{/* ==================================================== */}

<div
  className="
    mt-6
    overflow-hidden
    rounded-2xl
    border
    border-slate-200
    bg-white
  "
>
  {/* ================================================== */}
  {/* SHIPPING */}
  {/* ================================================== */}

  <div
    className="
      flex
      gap-4
      px-4
      py-4
      sm:px-5
    "
  >
    <div
      className="
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-cyan-50
      "
    >
      <Truck className="h-5 w-5 text-cyan-600" />
    </div>

    <div className="min-w-0">
      <p
        className="
          text-sm
          font-semibold
          text-slate-900
        "
      >
        Pengiriman
      </p>

      <p
        className="
          mt-1
          text-sm
          leading-6
          text-slate-500
        "
      >
        Pilih alamat dan metode pengiriman
        saat checkout.
      </p>
    </div>
  </div>

  <div className="mx-4 border-t border-slate-100 sm:mx-5" />

  {/* ================================================== */}
  {/* STOCK */}
  {/* ================================================== */}

  <div
    className="
      flex
      gap-4
      px-4
      py-4
      sm:px-5
    "
  >
    <div
      className={`
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        ${
          outOfStock
            ? "bg-red-50"
            : "bg-emerald-50"
        }
      `}
    >
      {outOfStock ? (
        <X className="h-5 w-5 text-red-600" />
      ) : (
        <Check className="h-5 w-5 text-emerald-600" />
      )}
    </div>

    <div className="min-w-0">
      <p
        className="
          text-sm
          font-semibold
          text-slate-900
        "
      >
        Ketersediaan
      </p>

      {outOfStock ? (
        <p className="mt-1 text-sm text-red-600">
          Stok sedang habis
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-500">
          Stok tersedia

          <span className="ml-1 font-medium text-slate-900">
            ({stock} tersedia)
          </span>
        </p>
      )}
    </div>
  </div>

  <div className="mx-4 border-t border-slate-100 sm:mx-5" />

  {/* ================================================== */}
  {/* CATEGORY */}
  {/* ================================================== */}

  <div
    className="
      flex
      gap-4
      px-4
      py-4
      sm:px-5
    "
  >
    <div
      className="
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-slate-100
      "
    >
      <Tag className="h-5 w-5 text-slate-600" />
    </div>

    <div className="min-w-0">
      <p
        className="
          text-sm
          font-semibold
          text-slate-900
        "
      >
        Kategori
      </p>

      <Link
        href="/customer/products"
        className="
          mt-1
          inline-flex
          text-sm
          font-medium
          text-cyan-700
          transition
          hover:text-cyan-800
          hover:underline
        "
      >
        {product.category.name}
      </Link>
    </div>
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

<section
  className="
    mt-3
    bg-white
    px-5
    py-5
    lg:px-8
    lg:py-6
  "
>
  <div className="max-w-4xl">
    <h2
      className="
        border-b
        border-slate-100
        pb-4
        text-lg
        font-semibold
        text-slate-900
      "
    >
      Informasi Produk
    </h2>

    <div
      className="
        mt-5
        overflow-hidden
        rounded-xl
        border
        border-slate-200
      "
    >
      {/* CATEGORY */}

      <div
        className="
          grid
          grid-cols-[110px_minmax(0,1fr)]
          items-center
          gap-4
          border-b
          border-slate-100
          px-4
          py-3.5
          text-sm
          sm:grid-cols-[160px_minmax(0,1fr)]
          sm:px-5
        "
      >
        <div className="text-slate-500">
          Kategori
        </div>

        <div className="font-medium text-slate-900">
          {product.category.name}
        </div>
      </div>

      {/* SKU */}

      <div
        className="
          grid
          grid-cols-[110px_minmax(0,1fr)]
          items-center
          gap-4
          px-4
          py-3.5
          text-sm
          sm:grid-cols-[160px_minmax(0,1fr)]
          sm:px-5
        "
      >
        <div className="text-slate-500">
          SKU
        </div>

        <div
          className="
            inline-flex
            w-fit
            rounded-md
            bg-slate-100
            px-2.5
            py-1
            font-mono
            text-xs
            font-medium
            text-slate-700
          "
        >
          {product.sku ?? "-"}
        </div>
      </div>
    </div>
  </div>
</section>

{/* ==================================================== */}
{/* DESCRIPTION */}
{/* ==================================================== */}

<section
  className="
    mt-3
    bg-white
    px-5
    py-5
    lg:px-8
    lg:py-6
  "
>
  <div className="max-w-4xl">
    <h2
      className="
        border-b
        border-slate-100
        pb-4
        text-lg
        font-semibold
        text-slate-900
      "
    >
      Deskripsi Produk
    </h2>

    <div
      className="
        mt-5
        rounded-xl
        border
        border-slate-100
        bg-slate-50/60
        px-4
        py-4
        sm:px-5
        sm:py-5
      "
    >
      {product.description ? (
        <div
          className="
            whitespace-pre-line
            text-sm
            leading-7
            text-slate-700
          "
        >
          {product.description}
        </div>
      ) : (
        <div
          className="
            flex
            items-center
            justify-center
            py-4
            text-sm
            text-slate-400
          "
        >
          Belum ada deskripsi produk.
        </div>
      )}
    </div>
  </div>
</section>
          {/* ==================================================== */}
{/* TRUST SECTION */}
{/* ==================================================== */}

<section
  className="
    mt-5
    overflow-hidden
    rounded-2xl
    border
    border-slate-200
    bg-white
  "
>
  <div
    className="
      border-b
      border-slate-100
      px-5
      py-5
      lg:px-8
    "
  >
    <h2
      className="
        text-lg
        font-semibold
        text-slate-900
      "
    >
      Kenapa Belanja di Sini?
    </h2>

    <p
      className="
        mt-1
        text-sm
        text-slate-500
      "
    >
      Kami berusaha memberikan pengalaman belanja seafood
      yang mudah dan nyaman.
    </p>
  </div>

  <div className="grid sm:grid-cols-3">
    <div className="border-b border-slate-100 sm:border-b-0 sm:border-r">
      <TrustItem
        icon={
          <Fish className="h-6 w-6" />
        }
        title="Produk Segar"
        description="Pilihan seafood untuk kebutuhan Anda."
      />
    </div>

    <div className="border-b border-slate-100 sm:border-b-0 sm:border-r">
      <TrustItem
        icon={
          <ShieldCheck className="h-6 w-6" />
        }
        title="Kualitas Terjaga"
        description="Informasi produk dan stok ditampilkan secara transparan."
      />
    </div>

    <div>
      <TrustItem
        icon={
          <Package className="h-6 w-6" />
        }
        title="Checkout Mudah"
        description="Proses pembelian dirancang cepat dan praktis."
      />
    </div>
  </div>
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
    <div
      className="
        flex
        h-full
        gap-4
        px-5
        py-5
        lg:px-6
        lg:py-6
      "
    >
      {/* ICON */}

      <div
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-cyan-50
          text-cyan-700
        "
      >
        {icon}
      </div>

      {/* CONTENT */}

      <div className="min-w-0">
        <h3
          className="
            text-sm
            font-semibold
            text-slate-900
          "
        >
          {title}
        </h3>

        <p
          className="
            mt-1
            text-xs
            leading-5
            text-slate-500
          "
        >
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