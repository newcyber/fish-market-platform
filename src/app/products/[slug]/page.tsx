import type React from "react";

import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import DynamicSiteHeader from "@/components/layout/DynamicSiteHeader";
import MobileBottomNavigation from "@/components/layout/MobileBottomNavigation";
import FlashSaleService from "@/services/flash-sale/flash-sale.service";
import { isAdmin } from "@/lib/auth/permissions";

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
  searchParams: Promise<{
    preview?: string;
  }>;
}

/**
 * ============================================================
 * PRODUCT DETAIL PAGE
 * ============================================================
 */

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;

  /**
   * ==========================================================
   * GET PRODUCT
   * ==========================================================
   */

  const product =
    await ProductService.getProductBySlug(
      slug
    );

  const session = await auth();

  const isAdminPreview =
    preview === "1" &&
    !!session?.user?.id &&
    session.user.isActive &&
    isAdmin(session.user.role);

  /**
   * ==========================================================
   * PRODUCT VALIDATION
   * ==========================================================
   */

if (!product) {
  notFound();
}

if (!product.isPublished && !isAdminPreview) {
  notFound();
}

  /**
   * ==========================================================
   * AUTH / WISHLIST
   * ==========================================================
   */

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

  const variantGroups =
  product.variantGroups
    .filter(
      (group) =>
        group.isActive &&
        group.options.some(
          (option) => option.isActive
        )
    )
    .sort(
      (a, b) =>
        a.sortOrder -
        b.sortOrder
    )
    .map((group) => ({
      id: group.id,
      name: group.name,
      sortOrder: group.sortOrder,
      isActive: group.isActive,

      options: group.options
        .filter(
          (option) =>
            option.isActive
        )
        .sort(
          (a, b) =>
            a.sortOrder -
            b.sortOrder
        )
        .map((option) => ({
          id: option.id,
          groupId: option.groupId,
          label: option.label,
          sortOrder: option.sortOrder,
          isActive: option.isActive,
        })),
    }));

  /**
   * ==========================================================
   * ACTIVE SKU DATA
   * ==========================================================
   *
   * SKU adalah canonical sellable unit.
   * Harga dan stok untuk product yang sudah menggunakan SKU
   * berasal dari SKU, bukan dari legacy weight data.
   */

  const activeSkus =
    product.skus
      .filter(
        (sku) =>
          sku.isActive &&
          sku.productId === product.id
      );

  const skuPriceList: number[] =
    activeSkus
      .map((sku) => Number(sku.price))
      .filter(
        (price) =>
          Number.isFinite(price) &&
          price >= 0
      );

/**
 * ==========================================================
 * ACTIVE FLASH SALE ITEMS
 * ==========================================================
 *
 * Flash Sale sekarang diarahkan ke SKU.
 * Harga promo tidak boleh dianggap sebagai harga product-wide
 * sebelum customer memilih kombinasi variant.
 *
 * Query melalui FlashSaleService agar Product Detail tidak
 * mengakses Prisma Flash Sale secara langsung.
 */
const flashSaleItems =
  await FlashSaleService.getActiveItemsByProductId(
    product.id
  );

  /**
   * ==========================================================
   * NORMALIZE FLASH SALE ITEMS
   * ==========================================================
   */

const normalizedFlashSaleItems =
  flashSaleItems.map(
    (item) => ({
          id:
            item.id,

          skuId:
            item.skuId,

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
   * PRODUCT BASE PRICE
   * ==========================================================
   */

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
   * SKU PRICE LIST
   * ==========================================================
   *
   * Harga range berasal dari SKU.price.
   * Product.price hanya menjadi fallback untuk product legacy.
   */

  const originalPriceList: number[] =
    skuPriceList.length > 0
      ? skuPriceList
      : [baseProductPrice];

  /**
   * ==========================================================
   * REMOVE DUPLICATE PRICES
   * ==========================================================
   */

  const uniqueOriginalPriceList: number[] =
    Array.from(
      new Set<number>(
        originalPriceList
      )
    );

  /**
   * ==========================================================
   * ORIGINAL PRICE RANGE
   * ==========================================================
   */

  const minimumOriginalPrice =
    Math.min(
      ...uniqueOriginalPriceList
    );

  const maximumOriginalPrice =
    Math.max(
      ...uniqueOriginalPriceList
    );

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
        (
          percentage /
          100
        );

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
   * FINAL PRICE LIST
   * ==========================================================
   */

  const finalPriceList: number[] =
    uniqueOriginalPriceList.map(
      (originalPrice) =>
        applyProductDiscount(
          originalPrice
        )
    );

  /**
   * ==========================================================
   * FINAL PRICE RANGE
   * ==========================================================
   */

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
   * PRODUCT DISPLAY PRICE
   * ==========================================================
   *
   * Flash Sale SKU baru ditentukan setelah customer memilih
   * variant di AddToCartButton.
   */

  const displayOriginalPrice =
    minimumOriginalPrice;

  const displayOriginalPriceMax =
    maximumOriginalPrice;

  const displayFinalPrice =
    minimumFinalPrice;

  const displayFinalPriceMax =
    maximumFinalPrice;

  const displaySaving =
    minimumSaving;

  const displaySavingMax =
    maximumSaving;

  const displayDiscountPercentage =
    displayOriginalPrice > 0
      ? Math.round(
          (
            (
              displayOriginalPrice -
              displayFinalPrice
            ) /
            displayOriginalPrice
          ) *
            100
        )
      : 0;

  /**
   * ==========================================================
   * FLASH SALE AVAILABILITY
   * ==========================================================
   */

  const hasFlashSale =
    normalizedFlashSaleItems.length > 0;

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
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <>
      {/* ====================================================== */}
      {/* PUBLIC SITE HEADER                                     */}
      {/* ====================================================== */}

      <DynamicSiteHeader activePage="products" />

      <main className="min-h-screen bg-[#f5f5f5]">

        {isAdminPreview && (
  <div className="border-b border-amber-200 bg-amber-50">
    <div className="mx-auto flex max-w-300 items-center gap-3 px-4 py-3 lg:px-0">
      <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
        Mode Preview
      </span>

      <p className="text-sm text-amber-800">
        Produk ini belum dipublish dan hanya dapat dilihat oleh administrator.
      </p>
    </div>
  </div>
)}

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
                href="/products"
                className="text-slate-500 transition hover:text-cyan-600"
              >
                Produk
              </Link>

              <ChevronRight className="h-4 w-4 text-slate-400" />

              <Link
                href="/products"
                className="text-slate-500 transition hover:text-cyan-600"
              >
                {product.category.name}
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

                {/* ==================================================== */}
                {/* PRODUCT PRICE */}
                {/* ==================================================== */}

                <div className="mt-5">

                  {hasFlashSale ? (
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

                            <p className="mt-0.5 text-xs text-white/75">
                              Promo tersedia untuk SKU tertentu
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-5 sm:px-5 sm:py-6">
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
                          Harga Produk
                        </p>

                        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                          <div
                            className="
                              text-3xl
                              font-bold
                              tracking-tight
                              text-slate-950
                              sm:text-4xl
                            "
                          >
                            {formatPriceRange(
                              displayFinalPrice,
                              displayFinalPriceMax
                            )}
                          </div>

                          {hasPriceDiscount && (
                            <div
                              className="
                                pb-1
                                text-sm
                                text-slate-400
                                line-through
                              "
                            >
                              {formatPriceRange(
                                displayOriginalPrice,
                                displayOriginalPriceMax
                              )}
                            </div>
                          )}
                        </div>

                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          Pilih varian produk untuk melihat harga dan
                          Flash Sale yang berlaku pada SKU tersebut.
                        </p>
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
                      {hasPriceDiscount ? (
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
                              {formatPriceRange(
                                displayFinalPrice,
                                displayFinalPriceMax
                              )}
                            </div>

                            <div
                              className="
                                pb-1
                                text-sm
                                text-slate-400
                                line-through
                              "
                            >
                              {formatPriceRange(
                                displayOriginalPrice,
                                displayOriginalPriceMax
                              )}
                            </div>
                          </div>

                          {displaySaving > 0 && (
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
                                Hemat{" "}
                                {formatPriceRange(
                                  displaySaving,
                                  displaySavingMax
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
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
                            {formatPriceRange(
                              displayFinalPrice,
                              displayFinalPriceMax
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {hasFlashSale && (
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
                        ⚡ Flash Sale tersedia untuk pilihan SKU tertentu.
                        Pilih varian untuk mendapatkan harga promo yang sesuai.
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
                        href="/products"
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
                    productId={
                      product.id
                    }

                    stock={
                      product.stock
                    }

                    basePrice={
                      Number(
                        product.price
                      )
                    }

                    variantGroups={
                      variantGroups
                    }

                    skus={
                      activeSkus.map(
                        (sku) => ({
                          id: sku.id,
                          sku: sku.sku,
                          productId: sku.productId,
                          price: Number(sku.price),
                          stock: sku.stock,
                          isActive: sku.isActive,
                          skuOptions:
                            sku.skuOptions.map(
                              (skuOption) => ({
                                id: skuOption.id,
                                skuId: skuOption.skuId,
                                variantOptionId:
                                  skuOption.variantOptionId,
                              })
                            ),
                        })
                      )
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

    <MobileBottomNavigation />
  </>
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

/**
 * ============================================================
 * FORMAT PRICE RANGE
 * ============================================================
 *
 * Jika min === max:
 *
 * Rp 30.000
 *
 * Jika berbeda:
 *
 * Rp 30.000 - Rp 50.000
 */

function formatPriceRange(
  minimum: number,
  maximum: number
) {
  if (
    minimum === maximum
  ) {
    return formatRupiah(
      minimum
    );
  }

  return `${formatRupiah(
    minimum
  )} - ${formatRupiah(
    maximum
  )}`;
}
