import type React from "react";
import type { Metadata } from "next";

import Link from "next/link";

import { buildSeoMetadata, type SeoSettings } from "@/lib/seo/seo-metadata";

import { notFound } from "next/navigation";

import { ProductJsonLd } from "@/lib/seo/product-jsonld";
import { buildProductSeoContent } from "@/lib/seo/seo.utils";

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
import ProductPricingService from "@/services/pricing/product-pricing.service";
import ProductInventoryAvailabilityService from "@/services/product/product-inventory-availability.service";
import { prisma } from "@/lib/prisma";
import settingsService from "@/services/settings/settings.service";
import { getSiteUrls } from "@/services/site/site-url.service";

import AddToCartButton from "@/components/customer/products/AddToCartButton";
import ProductShareButton from "@/components/customer/products/ProductShareButton";
import ProductTrustCard from "@/components/customer/products/ProductTrustCard";

import ProductDetailGallery from "@/components/customer/products/ProductDetailGallery";
import ProductDescription from "@/components/customer/products/ProductDescription";
import StickyMobileCartBar from "@/components/customer/cart/StickyMobileCartBar";
import ProductRecommendationSection from "@/components/customer/products/ProductRecommendationSection";
import ProductRecommendationService from "@/services/product/product-recommendation.service";
import ProductReviewService from "@/services/product-review/product-review.service";

import ToggleWishlistButton from "@/components/customer/wishlist/ToggleWishlistButton";
import ProductReviewSection from "@/components/customer/products/ProductReviewSection";

import { auth } from "@/auth";

import WishlistService from "@/services/wishlist/wishlist.service";

export const dynamic = "force-dynamic";

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
 * PRODUCT SEO METADATA
 * ============================================================
 */

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  const [product, settings, siteUrls] = await Promise.all([
    ProductService.getPublishedProductBySlug(slug),
    settingsService.getSettings(),
    getSiteUrls(),
  ]);

  const seoSettings: SeoSettings = {
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    seoKeywords: settings.seoKeywords,
    seoCanonicalUrl: settings.seoCanonicalUrl,
    seoOgTitle: settings.seoOgTitle,
    seoOgDescription: settings.seoOgDescription,
    seoOgImage: settings.seoOgImage,
    seoTwitterCard: settings.seoTwitterCard,
    seoRobotsIndex: settings.seoRobotsIndex,
    seoRobotsFollow: settings.seoRobotsFollow,
    seoGoogleVerification: settings.seoGoogleVerification,
    seoAiEnabled: settings.seoAiEnabled,
    storeName: settings.storeName,
    storeDescription: settings.storeDescription,
  };

  if (!product) {
    return buildSeoMetadata(seoSettings, {
      pathname: `/products/${encodeURIComponent(slug)}`,
      baseUrl: siteUrls.storefrontUrl,
      title: "Produk Tidak Ditemukan",
      noIndex: true,
      noFollow: true,
    });
  }

  const storeName = settings.storeName?.trim() || "Pisjo Market Platform";

  const productName = product.name.trim();

  const productSeo = buildProductSeoContent({
    productName,
    categoryName: product.category?.name,
    description: product.description,
    storeName,
    locationLabel: "Jogja",
  });

  const productDescription = productSeo.description;

  const productImage = product.images
    .filter(
      (image) =>
        !image.mediaType ||
        image.mediaType === "IMAGE",
    )
    .slice()
    .sort(
      (a, b) =>
        Number(b.isThumbnail) - Number(a.isThumbnail) ||
        a.sortOrder - b.sortOrder,
    )[0]?.image;

  const ogTitle = settings.seoOgTitle?.trim()
    ? `${productName} | ${settings.seoOgTitle.trim()}`
    : productName;

  const ogDescription = productDescription;

  return buildSeoMetadata(seoSettings, {
    pathname: `/products/${product.slug}`,
    baseUrl: siteUrls.storefrontUrl,
    title: productSeo.title,
    description: productDescription,
    ogTitle,
    ogDescription,
    image: productImage,
    // Published product pages are core storefront content and must remain
    // indexable/crawlable even if the global SEO toggle was accidentally
    // disabled elsewhere in the admin settings. Unpublished/preview pages
    // are handled separately above.
    forceIndex: true,
    forceFollow: true,
  });
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

  const [settings, siteUrls] = await Promise.all([
    settingsService.getSettings(),
    getSiteUrls(),
  ]);

  /**
   * ==========================================================
   * GET PRODUCT
   * ==========================================================
   */

const session = await auth();

const isAdminPreview =
  preview === "1" &&
  !!session?.user?.id &&
  session.user.isActive &&
  isAdmin(session.user.role);

/**
 * ==========================================================
 * GET PRODUCT
 * ==========================================================
 *
 * Public storefront:
 *   hanya produk yang published.
 *
 * Admin preview:
 *   boleh membaca produk unpublished.
 *
 * Ini dibuat konsisten dengan generateMetadata().
 */
const product = isAdminPreview
  ? await ProductService.getProductBySlug(slug)
  : await ProductService.getPublishedProductBySlug(slug);

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

  const [initialInWishlist, productReviewSummary] = await Promise.all([
    session?.user?.id
      ? WishlistService.isInWishlist(session.user.id, product.id)
      : Promise.resolve(false),
    ProductReviewService.getPublicSummary(product.id),
  ]);

  /**
   * ==========================================================
   * PRODUCT ADDITIONAL INFORMATION
   * ==========================================================
   */

  const ingredients =
    typeof product.ingredients === "string" ? product.ingredients.trim() : "";

  const storageInstructions =
    typeof product.storageInstructions === "string"
      ? product.storageInstructions.trim()
      : "";

  const usageInstructions =
    typeof product.usageInstructions === "string"
      ? product.usageInstructions.trim()
      : "";

  const nutritionInformation = Array.isArray(product.nutritionInformation)
    ? product.nutritionInformation
        .filter(
          (
            item,
          ): item is {
            name: string;
            value: string;
            unit: string;
          } =>
            typeof item === "object" &&
            item !== null &&
            !Array.isArray(item) &&
            "name" in item &&
            "value" in item &&
            "unit" in item &&
            typeof item.name === "string" &&
            typeof item.value === "string" &&
            typeof item.unit === "string",
        )
        .filter(
          (item) =>
            item.name.trim().length > 0 ||
            item.value.trim().length > 0 ||
            item.unit.trim().length > 0,
        )
    : [];

  const hasAdditionalInformation =
    ingredients.length > 0 ||
    nutritionInformation.length > 0 ||
    storageInstructions.length > 0 ||
    usageInstructions.length > 0;

  const [frequentlyBoughtProducts, relatedProducts] = await Promise.all([
    ProductRecommendationService.getFrequentlyBoughtTogether(product.id, 8),
    ProductRecommendationService.getRelatedProducts(
      product.id,
      product.category.id,
      8,
    ),
  ]);

  /**
   * ==========================================================
   * IMAGE SORTING
   * ==========================================================
   */

  const images = [...product.images].sort((a, b) => {
    if (a.isThumbnail && !b.isThumbnail) {
      return -1;
    }

    if (!a.isThumbnail && b.isThumbnail) {
      return 1;
    }

    return a.sortOrder - b.sortOrder;
  });

  /**
   * ==========================================================
   * PRODUCT VARIANT OPTIONS
   * ==========================================================
   */

  const variantGroups = product.variantGroups
    .filter(
      (group) =>
        group.isActive && group.options.some((option) => option.isActive),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group) => ({
      id: group.id,
      name: group.name,
      sortOrder: group.sortOrder,
      isActive: group.isActive,

      options: group.options
        .filter((option) => option.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
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

  const activeSkus = product.skus.filter(
    (sku) => sku.isActive && sku.productId === product.id,
  );

  const skuAvailability =
    await ProductInventoryAvailabilityService.getSkuAvailabilities(
      activeSkus.map((sku) => sku.id),
    );

  const availabilityBySkuId = new Map(
    skuAvailability.map((item) => [
      item.skuId,
      item,
    ]),
  );

  const hasAvailableSku =
    activeSkus.some(
      (sku) =>
        (availabilityBySkuId.get(
          sku.id,
        )?.availableQuantity ?? 0) > 0,
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
  const flashSaleItems = await FlashSaleService.getActiveItemsByProductId(
    product.id,
  );

  const flashSalePurchaseUsage = new Map<string, number>();

  if (session?.user?.id && flashSaleItems.length > 0) {
    const campaignSkuPairs = new Map<
      string,
      {
        campaignId: string;
        skuId: string;
      }
    >();

    for (const item of flashSaleItems) {
      if (!item.skuId) continue;

      campaignSkuPairs.set(
        `${item.flashSale.id}::${item.skuId}`,
        {
          campaignId: item.flashSale.id,
          skuId: item.skuId,
        },
      );
    }

    const allCampaignItemIds =
      campaignSkuPairs.size > 0
        ? await prisma.flashSaleItem.findMany({
            where: {
              OR: Array.from(campaignSkuPairs.values()).map(
                ({ campaignId, skuId }) => ({
                  flashSaleId: campaignId,
                  skuId,
                }),
              ),
            },
            select: {
              id: true,
              flashSaleId: true,
              skuId: true,
            },
          })
        : [];

    const purchaseRows =
      allCampaignItemIds.length > 0
        ? await prisma.flashSalePurchase.findMany({
            where: {
              userId: session.user.id,
              flashSaleItemId: {
                in: allCampaignItemIds.map(
                  (item) => item.id
                ),
              },
            },
            select: {
              flashSaleItemId: true,
              quantity: true,
            },
          })
        : [];

    const usageByCampaignSku = new Map<string, number>();

    const itemKeyById = new Map(
      allCampaignItemIds.map((item) => [
        item.id,
        `${item.flashSaleId}::${item.skuId}`,
      ]),
    );

    for (const purchase of purchaseRows) {
      const key = itemKeyById.get(
        purchase.flashSaleItemId
      );

      if (!key) continue;

      usageByCampaignSku.set(
        key,
        (usageByCampaignSku.get(key) ?? 0) +
          purchase.quantity,
      );
    }

    for (const item of flashSaleItems) {
      if (!item.skuId) continue;

      const key = `${item.flashSale.id}::${item.skuId}`;

      flashSalePurchaseUsage.set(
        item.id,
        usageByCampaignSku.get(key) ?? 0,
      );
    }
  }

  /**
   * ==========================================================
   * NORMALIZE FLASH SALE ITEMS
   * ==========================================================
   */

  const normalizedFlashSaleItems = flashSaleItems.map((item) => ({
    id: item.id,

    skuId: item.skuId,

    originalPrice: Number(item.originalPrice),

    flashPrice: Number(item.flashPrice),

    stockLimit: item.stockLimit,

    soldQuantity: item.soldQuantity,

    perUserLimit: item.perUserLimit,

    userPurchasedQuantity:
      flashSalePurchaseUsage.get(item.id) ?? 0,

    campaignId: item.flashSale.id,

    campaignName: item.flashSale.name,

    endsAt: item.flashSale.endAt.toISOString(),
  }));

  /**
   * ==========================================================
   * STOREFRONT DISPLAY PRICE
   * ==========================================================
   *
   * Detail produk wajib menggunakan canonical ProductPricingService
   * agar harga yang ditampilkan konsisten dengan Cart/Checkout.
   *
   * Ini penting untuk Promotion PRICE_DISCOUNT:
   *
   * - PromotionItem.promoPrice adalah harga promo per-SKU.
   * - Flash Sale tetap memiliki prioritas lebih tinggi.
   * - SKU yang tidak masuk promotion tetap menggunakan harga normal.
   * - Hanya SKU aktif yang dipakai untuk harga storefront.
   *
   * Dengan demikian halaman detail tidak lagi hanya membaca
   * Product.price dan tidak akan melewatkan promotion per-SKU.
   */

  const storefrontPricing = await prisma.$transaction(async (tx) => {
    if (activeSkus.length === 0) {
      return [
        await ProductPricingService.resolve(tx, {
          productId: product.id,
          customerId: session?.user?.id ?? null,
          quantity: 1,
          fallbackPrice: product.price,
        }),
      ];
    }

    return Promise.all(
      activeSkus.map((sku) =>
        ProductPricingService.resolve(tx, {
          productId: product.id,
          skuId: sku.id,
          customerId: session?.user?.id ?? null,
          quantity: 1,
        }),
      ),
    );
  });

  const displayPricing =
    storefrontPricing.length > 0
      ? storefrontPricing
      : [
          {
            originalPrice: product.price,
            finalPrice: product.price,
            discountAmount: 0,
            isDiscountApplied: false,
            isFlashSaleApplied: false,
            promotionDiscountApplied: false,
            promotionId: null,
            promotionName: null,
            flashSaleName: null,
            discountSource: "NONE" as const,
            flashSaleItemId: null,
            flashSaleId: null,
          },
        ];

  const productJsonLd = (
    <ProductJsonLd
      product={{
        name: product.name,
        description: product.description,
        slug: product.slug,
        sku: product.sku,
        category: product.category,
        images: product.images.map((image) => ({
          image: image.image,
          isThumbnail: image.isThumbnail,
          sortOrder: image.sortOrder,
          mediaType: image.mediaType,
          createdAt: image.createdAt,
        })),
        skus: activeSkus.map((sku, index) => ({
          price: displayPricing[index]?.finalPrice ?? sku.price,
          stock:
            availabilityBySkuId.get(
              sku.id,
            )?.availableQuantity ?? 0,
          isActive: sku.isActive,
        })),
        price:
          activeSkus.length === 0
            ? displayPricing[0]?.finalPrice ?? product.price
            : undefined,
        stock:
          activeSkus.length === 0
            ? product.stock
            : null,
        isPublished: product.isPublished,
        isPreOrder: product.isPreOrder,

        aggregateRating:
          productReviewSummary.reviewCount > 0
            ? {
                ratingValue: productReviewSummary.averageRating,
                reviewCount: productReviewSummary.reviewCount,
              }
            : null,

        reviews: productReviewSummary.reviews.map((review) => ({
          username: review.username,
          rating: review.rating,
          review: review.review,
          createdAt: review.createdAt,
        })),
      }}
      options={{
        baseUrl: siteUrls.storefrontUrl,
        storeName: settings.storeName?.trim() || "Pisjo Market Platform",
        currency: "IDR",
      }}
    />
  );

  const displayOriginalPrices = displayPricing.map((pricing) =>
    Number(pricing.originalPrice),
  );

  const displayFinalPrices = displayPricing.map((pricing) =>
    Number(pricing.finalPrice),
  );

  const displayOriginalPrice = Math.min(...displayOriginalPrices);
  const displayOriginalPriceMax = Math.max(...displayOriginalPrices);

  const displayFinalPrice = Math.min(...displayFinalPrices);
  const displayFinalPriceMax = Math.max(...displayFinalPrices);

  const displaySavings = displayPricing
  .filter(
    (pricing) =>
      Number(pricing.discountAmount) > 0
  )
  .map((pricing) =>
    Number(pricing.discountAmount)
  );

  const displaySaving = displaySavings.length > 0
    ? Math.min(...displaySavings)
    : 0;

  const displaySavingMax = displaySavings.length > 0
    ? Math.max(...displaySavings)
    : 0;

  const hasPriceDiscount = displayPricing.some(
  (pricing) =>
    pricing.isDiscountApplied &&
    Number(pricing.discountAmount) > 0,
  );

  const hasFlashSale =
    normalizedFlashSaleItems.length > 0 ||
    displayPricing.some(
      (pricing) => pricing.isFlashSaleApplied,
    );


  /**
   * ==========================================================
   * STOCK
   * ==========================================================
   */

  const isPreOrder = product.isPreOrder === true;

  const stock = activeSkus.length > 0
    ? null
    : Math.max(0, product.stock ?? 0);

  const outOfStock =
    !isPreOrder &&
    (activeSkus.length > 0
      ? !hasAvailableSku
      : (stock ?? 0) <= 0);

  /**
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <>
      {productJsonLd}

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
                Produk ini belum dipublish dan hanya dapat dilihat oleh
                administrator.
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
                href={`/kategori/${encodeURIComponent(product.category.slug)}`}
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
                    productName={product.name}

                    images={images.map((image) => ({
                      id: image.id,
                      image: image.image,
                      isThumbnail: image.isThumbnail,
                      sortOrder: image.sortOrder,
                      mediaType: image.mediaType,
                    }))}

                    shareButton={
                      <ProductShareButton
                        productName={product.name}
                        productSlug={product.slug}
                      />
                    }
                    favoriteButton={
                      <ToggleWishlistButton
                        productId={product.id}

                        initialInWishlist={initialInWishlist}

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
                  {!hasFlashSale && (
                    <>
                    {/* PRODUCT SUMMARY */}

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                      {product.category.name}
                    </span>
                    {product.featured && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <Star className="h-3 w-3 fill-current" /> Pilihan
                      </span>
                    )}
                  </div>

                  <h1 className="text-[22px] font-semibold leading-7 tracking-tight text-slate-950 sm:text-2xl">
                    {product.name}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <a
                      href="#penilaian-produk"
                      className="inline-flex items-center gap-1 font-semibold text-amber-500 hover:text-amber-600"
                    >
                      <Star className="h-4 w-4 fill-current" />
                      {productReviewSummary.averageRating.toFixed(1)}
                    </a>
                    <span className="text-slate-300">•</span>
                    <a
                      href="#penilaian-produk"
                      className="font-medium text-cyan-700 underline underline-offset-2"
                    >
                      {productReviewSummary.reviewCount} Penilaian
                    </a>
                    <span className="text-slate-300">•</span>
                    <span className={outOfStock ? "font-medium text-red-600" : "font-medium text-emerald-600"}>
                      {isPreOrder
                        ? "Pre-Order"
                        : outOfStock
                          ? "Stok habis"
                          : activeSkus.length > 0
                           ? "Stok tersedia"
                           : `Stok tersedia (${stock} tersedia)`}
                    </span>
                  </div>

                    </>
                  )}

                  {isPreOrder && product.preOrderMinDays != null && product.preOrderMaxDays != null && (
                    <p className="mt-1 text-xs text-slate-500">
                      Estimasi {product.preOrderMinDays}–{product.preOrderMaxDays} hari
                    </p>
                  )}

                  {/* PRODUCT PRICE */}

                  {!hasFlashSale && (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Harga Produk
                    </p>
                    <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
                      <span className="text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">
                        {formatPriceRange(displayFinalPrice, displayFinalPriceMax)}
                      </span>
                      {hasPriceDiscount && (
                        <span className="pb-1 text-sm text-slate-400 line-through">
                          {formatPriceRange(displayOriginalPrice, displayOriginalPriceMax)}
                        </span>
                      )}
                    </div>
                    {displaySaving > 0 && (
                      <p className="mt-2 text-xs font-semibold text-emerald-600">
                        Hemat {formatPriceRange(displaySaving, displaySavingMax)}
                      </p>
                    )}
                    {hasFlashSale && (
                      <p className="mt-2 text-xs font-medium text-orange-600">
                        ⚡ Flash Sale tersedia pada varian tertentu.
                      </p>
                    )}
                  </div>
                  )}

                  {/* CART ACTION */}

                  <div
                    className={
                      hasFlashSale
                        ? "mt-0"
                        : "mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5"
                    }
                  >
                    <AddToCartButton
                      productId={product.id}
                      stock={
                        activeSkus.length > 0
                          ? undefined
                          : product.stock
                      }
                      basePrice={Number(product.price)}
                      isPreOrder={product.isPreOrder}
                      preOrderMinDays={product.preOrderMinDays}
                      preOrderMaxDays={product.preOrderMaxDays}
                      variantGroups={variantGroups}
                      skus={activeSkus.map((sku) => ({
                        id: sku.id,
                        sku: sku.sku,
                        productId: sku.productId,
                        price: Number(sku.price),
                        stock:
                          availabilityBySkuId.get(
                            sku.id,
                          )?.availableQuantity ?? 0,
                        isActive: sku.isActive,
                        skuOptions: sku.skuOptions.map((skuOption) => ({
                          id: skuOption.id,
                          skuId: skuOption.skuId,
                          variantOptionId: skuOption.variantOptionId,
                        })),
                      }))}
                      skuPricing={storefrontPricing.map((pricing, index) => ({
                        skuId: activeSkus[index]?.id ?? "",
                        originalPrice: Number(pricing.originalPrice),
                        finalPrice: Number(pricing.finalPrice),
                        discountAmount: Number(pricing.discountAmount),
                        isDiscountApplied: pricing.isDiscountApplied,
                        isFlashSaleApplied: pricing.isFlashSaleApplied,
                        promotionDiscountApplied: pricing.promotionDiscountApplied,
                        promotionId: pricing.promotionId,
                        promotionName: pricing.promotionName,
                        flashSaleName: pricing.flashSaleName,
                        discountSource: pricing.discountSource,
                        flashSaleItemId: pricing.flashSaleItemId,
                        flashSaleId: pricing.flashSaleId,
                      }))}
                      flashSaleItems={normalizedFlashSaleItems}
                      isDiscountActive={product.isDiscountActive}
                      discountType={product.discountType}
                      discountValue={product.discountValue ? Number(product.discountValue) : null}
                      discountStartAt={product.discountStartAt}
                      discountEndAt={product.discountEndAt}
                    />
                  </div>

                  {/* TRUST / DELIVERY / CATEGORY */}

                  <div className="mt-4 space-y-4">
                    <ProductTrustCard
                      condition={product.condition}
                      storageInstructions={storageInstructions}
                      weightGrams={product.weightGrams}
                      isPreOrder={product.isPreOrder}
                    />

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="flex gap-3 px-4 py-4">
                        <Truck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Pengiriman</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Pilih alamat dan metode pengiriman saat checkout.
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-slate-100" />
                      <div className="flex gap-3 px-4 py-4">
                        {outOfStock ? (
                          <X className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        ) : (
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Ketersediaan</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {outOfStock
                              ? "Stok sedang habis"
                              : activeSkus.length > 0
                                ? "Stok tersedia"
                                : `${stock} tersedia`}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-slate-100" />
                      <div className="flex gap-3 px-4 py-4">
                        <Tag className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Kategori</p>
                          <Link
                            href={`/kategori/${encodeURIComponent(product.category.slug)}`}
                            className="mt-1 inline-flex text-xs font-medium text-cyan-700 hover:underline"
                          >
                            {product.category.name}
                          </Link>
                        </div>
                      </div>
                    </div>
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
                    <div className="text-slate-500">Kategori</div>

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
                    <div className="text-slate-500">SKU</div>

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
                {/* ================================================== */}
                {/* DESKRIPSI PRODUK */}
                {/* ================================================== */}

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
                  <ProductDescription description={product.description ?? ""} />
                </div>

                {/* ================================================== */}
                {/* INFORMASI TAMBAHAN PRODUK */}
                {/* ================================================== */}

                {hasAdditionalInformation && (
                  <section
                    className="
                    mt-6
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                  "
                  >
                    <div
                      className="
                      border-b
                      border-slate-100
                      px-4
                      py-4
                      sm:px-5
                    "
                    >
                      <h2
                        className="
                        text-lg
                        font-semibold
                        text-slate-900
                      "
                      >
                        Informasi Produk
                      </h2>

                      <p
                        className="
                        mt-1
                        text-sm
                        text-slate-500
                      "
                      >
                        Informasi tambahan mengenai kandungan, nilai gizi,
                        penyimpanan, dan penggunaan produk.
                      </p>
                    </div>

                    <div
                      className="
                      divide-y
                      divide-slate-100
                    "
                    >
                      {/* ================================================== */}
                      {/* KANDUNGAN / INGREDIENTS */}
                      {/* ================================================== */}

                      {ingredients.length > 0 && (
                        <details className="group">
                          <summary
                            className="
                            flex
                            cursor-pointer
                            list-none
                            items-center
                            justify-between
                            gap-4
                            px-4
                            py-4
                            text-sm
                            font-semibold
                            text-slate-900
                            [&::-webkit-details-marker]:hidden
                            sm:px-5
                          "
                          >
                            <span>Kandungan / Ingredients</span>

                            <ChevronRight
                              className="
                              h-4
                              w-4
                              shrink-0
                              text-slate-400
                              transition-transform
                              group-open:rotate-90
                            "
                            />
                          </summary>

                          <div
                            className="
                            px-4
                            pb-5
                            text-sm
                            leading-7
                            text-slate-600
                            sm:px-5
                          "
                          >
                            <div className="whitespace-pre-line">
                              {ingredients}
                            </div>
                          </div>
                        </details>
                      )}

                      {/* ================================================== */}
                      {/* INFORMASI GIZI */}
                      {/* ================================================== */}

                      {nutritionInformation.length > 0 && (
                        <details className="group">
                          <summary
                            className="
                            flex
                            cursor-pointer
                            list-none
                            items-center
                            justify-between
                            gap-4
                            px-4
                            py-4
                            text-sm
                            font-semibold
                            text-slate-900
                            [&::-webkit-details-marker]:hidden
                            sm:px-5
                          "
                          >
                            <span>Informasi Gizi</span>

                            <ChevronRight
                              className="
                              h-4
                              w-4
                              shrink-0
                              text-slate-400
                              transition-transform
                              group-open:rotate-90
                            "
                            />
                          </summary>

                          <div
                            className="
                            px-4
                            pb-5
                            sm:px-5
                          "
                          >
                            <div
                              className="
                              overflow-hidden
                              rounded-lg
                              border
                              border-slate-200
                            "
                            >
                              <div
                                className="
                                grid
                                grid-cols-[minmax(0,1fr)_auto_auto]
                                gap-3
                                border-b
                                bg-slate-50
                                px-3
                                py-2.5
                                text-xs
                                font-semibold
                                text-slate-500
                                sm:px-4
                              "
                              >
                                <div>Nutrisi</div>

                                <div className="text-right">Nilai</div>

                                <div
                                  className="
                                  min-w-12
                                  text-right
                                "
                                >
                                  Satuan
                                </div>
                              </div>

                              {nutritionInformation.map((item, index) => (
                                <div
                                  key={`nutrition-${index}`}
                                  className="
                                    grid
                                    grid-cols-[minmax(0,1fr)_auto_auto]
                                    gap-3
                                    border-b
                                    border-slate-100
                                    px-3
                                    py-3
                                    text-sm
                                    last:border-b-0
                                    sm:px-4
                                  "
                                >
                                  <div
                                    className="
                                      font-medium
                                      text-slate-700
                                    "
                                  >
                                    {item.name}
                                  </div>

                                  <div
                                    className="
                                      text-right
                                      text-slate-700
                                    "
                                  >
                                    {item.value}
                                  </div>

                                  <div
                                    className="
                                      min-w-12
                                      text-right
                                      text-slate-500
                                    "
                                  >
                                    {item.unit || "-"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </details>
                      )}

                      {/* ================================================== */}
                      {/* PETUNJUK PENYIMPANAN */}
                      {/* ================================================== */}

                      {storageInstructions.length > 0 && (
                        <details className="group">
                          <summary
                            className="
                            flex
                            cursor-pointer
                            list-none
                            items-center
                            justify-between
                            gap-4
                            px-4
                            py-4
                            text-sm
                            font-semibold
                            text-slate-900
                            [&::-webkit-details-marker]:hidden
                            sm:px-5
                          "
                          >
                            <span>Petunjuk Penyimpanan</span>

                            <ChevronRight
                              className="
                              h-4
                              w-4
                              shrink-0
                              text-slate-400
                              transition-transform
                              group-open:rotate-90
                            "
                            />
                          </summary>

                          <div
                            className="
                            whitespace-pre-line
                            px-4
                            pb-5
                            text-sm
                            leading-7
                            text-slate-600
                            sm:px-5
                          "
                          >
                            {storageInstructions}
                          </div>
                        </details>
                      )}

                      {/* ================================================== */}
                      {/* PETUNJUK PENGGUNAAN */}
                      {/* ================================================== */}

                      {usageInstructions.length > 0 && (
                        <details className="group">
                          <summary
                            className="
                            flex
                            cursor-pointer
                            list-none
                            items-center
                            justify-between
                            gap-4
                            px-4
                            py-4
                            text-sm
                            font-semibold
                            text-slate-900
                            [&::-webkit-details-marker]:hidden
                            sm:px-5
                          "
                          >
                            <span>Petunjuk Penggunaan</span>

                            <ChevronRight
                              className="
                              h-4
                              w-4
                              shrink-0
                              text-slate-400
                              transition-transform
                              group-open:rotate-90
                            "
                            />
                          </summary>

                          <div
                            className="
                            whitespace-pre-line
                            px-4
                            pb-5
                            text-sm
                            leading-7
                            text-slate-600
                            sm:px-5
                          "
                          >
                            {usageInstructions}
                          </div>
                        </details>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </section>

            {/* ==================================================== */}
            {/* PRODUCT REVIEWS */}
            {/* ==================================================== */}

            <section id="penilaian-produk" className="scroll-mt-24">
              <ProductReviewSection
                productId={product.id}
                initialSummary={{
                averageRating: productReviewSummary.averageRating,
                reviewCount: productReviewSummary.reviewCount,
                distribution: productReviewSummary.distribution,
                reviews: productReviewSummary.reviews.map((review) => ({
                  ...review,
                  createdAt: review.createdAt.toISOString(),
                })),
                }}
              />
            </section>

            {/* ==================================================== */}
            {/* RECOMMENDATIONS */}
            {/* ==================================================== */}

            <ProductRecommendationSection
              title="Yang lain beli ini juga"
              products={frequentlyBoughtProducts}
            />

            <ProductRecommendationSection
              title="Produk terkait"
              products={relatedProducts}
              href={`/kategori/${encodeURIComponent(product.category.slug)}`}
              showViewAll
            />

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
                  Kami berusaha memberikan pengalaman belanja seafood yang mudah
                  dan nyaman.
                </p>
              </div>

              <div className="grid sm:grid-cols-3">
                <div
                  className="
                  border-b
                  border-slate-100
                  sm:border-b-0
                  sm:border-r
                "
                >
                  <TrustItem
                    icon={<Fish className="h-6 w-6" />}
                    title="Produk Segar"
                    description="Pilihan seafood untuk kebutuhan Anda."
                  />
                </div>

                <div
                  className="
                  border-b
                  border-slate-100
                  sm:border-b-0
                  sm:border-r
                "
                >
                  <TrustItem
                    icon={<ShieldCheck className="h-6 w-6" />}
                    title="Kualitas Terjaga"
                    description="Informasi produk dan stok ditampilkan secara transparan."
                  />
                </div>

                <div>
                  <TrustItem
                    icon={<Package className="h-6 w-6" />}
                    title="Checkout Mudah"
                    description="Proses pembelian dirancang cepat dan praktis."
                  />
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>

      <StickyMobileCartBar />

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

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
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

function formatPriceRange(minimum: number, maximum: number) {
  if (minimum === maximum) {
    return formatRupiah(minimum);
  }

  return `${formatRupiah(minimum)} - ${formatRupiah(maximum)}`;
}
