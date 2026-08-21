import HomeBestSellingProducts from
  "@/components/customer/home/HomeBestSellingProducts";

import HomeCategoryShortcuts from
  "@/components/customer/home/HomeCategoryShortcuts";

import HomeFeaturedProducts from
  "@/components/customer/home/HomeFeaturedProducts";

import HomeFlashSaleSection from
  "@/components/customer/home/HomeFlashSaleSection";

import HomeHeroCarousel from
  "@/components/customer/home/HomeHeroCarousel";

import HomeNewestProducts from
  "@/components/customer/home/HomeNewestProducts";

import HomePromoBanner from
  "@/components/customer/home/HomePromoBanner";

import { prisma } from
  "@/lib/prisma";

import FlashSaleService from
  "@/services/flash-sale/flash-sale.service";

/**
 * ============================================================
 * SHARED HOME PAGE
 * ============================================================
 *
 * Shared homepage untuk:
 *
 * - Guest: /
 * - Customer: /customer
 *
 * Perbedaan utama hanya pada navigation/header dan productsHref.
 */

interface SharedHomePageProps {
  mode:
    | "guest"
    | "customer";
}

/**
 * ============================================================
 * SERIALIZE FLASH SALE
 * ============================================================
 *
 * Prisma Decimal dan Date harus diubah menjadi plain value
 * sebelum dikirim ke Client Component.
 */

function serializeFlashSale(
  flashSale: Awaited<
    ReturnType<
      typeof FlashSaleService.getActiveForHomepage
    >
  >
) {
  if (!flashSale) {
    return null;
  }

  return {
    id:
      flashSale.id,

    name:
      flashSale.name,

    endAt:
      flashSale.endAt.toISOString(),

    items:
      flashSale.items.map(
        (item) => ({
          id:
            item.id,

          originalPrice:
            item.originalPrice.toNumber(),

          flashPrice:
            item.flashPrice.toNumber(),

          stockLimit:
            item.stockLimit,

          soldQuantity:
            item.soldQuantity,

          product: {
            id:
              item.product.id,

            name:
              item.product.name,

            slug:
              item.product.slug,

            price:
              item.product.price.toNumber(),

            images:
              (
                item.product.images ??
                []
              ).map(
                (image) => ({
                  id:
                    image.id,

                  image:
                    image.image,

                  sortOrder:
                    image.sortOrder,

                  isThumbnail:
                    image.isThumbnail,
                })
              ),
          },

          weightOption:
            item.weightOption
              ? {
                  id:
                    item.weightOption.id,

                  label:
                    item.weightOption.label,

                  price:
                    item.weightOption.price.toNumber(),
                }
              : null,
        })
      ),
  };
}

/**
 * ============================================================
 * SHARED HOME PAGE
 * ============================================================
 */

export default async function SharedHomePage({
  mode,
}: SharedHomePageProps) {
  /**
   * ==========================================================
   * PRODUCTS HREF
   * ==========================================================
   */

  const productsHref =
    mode === "customer"
      ? "/customer/products"
      : "/products";

  /**
   * ==========================================================
   * FETCH HOMEPAGE DATA
   * ==========================================================
   */

  const [
    flashSale,
    featuredProducts,
    bestSellingGroups,
    newestProducts,
  ] =
    await Promise.all([
      /**
       * ========================================================
       * FLASH SALE
       * ========================================================
       */

      FlashSaleService
        .getActiveForHomepage()
        .catch(
          (error) => {
            console.error(
              "[HOME_FLASH_SALE_ERROR]",
              error
            );

            return null;
          }
        ),

      /**
       * ========================================================
       * FEATURED PRODUCTS
       * ========================================================
       */

      prisma.product.findMany({
        where: {
          deletedAt:
            null,

          isPublished:
            true,

          featured:
            true,
        },

        include: {
          images: {
            orderBy: {
              sortOrder:
                "asc",
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },

        take:
          10,
      }),

      /**
       * ========================================================
       * BEST SELLING PRODUCT GROUPS
       * ========================================================
       */

      prisma.orderItem.groupBy({
        by: [
          "productId",
        ],

        where: {
          order: {
            deletedAt:
              null,

            status: {
              in: [
                "PROCESSING",
                "SHIPPING",
                "COMPLETED",
              ],
            },
          },
        },

        _sum: {
          quantity:
            true,
        },

        orderBy: {
          _sum: {
            quantity:
              "desc",
          },
        },

        take:
          10,
      }),

      /**
       * ========================================================
       * NEWEST PRODUCTS
       * ========================================================
       */

      prisma.product.findMany({
        where: {
          deletedAt:
            null,

          isPublished:
            true,
        },

        include: {
          images: {
            orderBy: {
              sortOrder:
                "asc",
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },

        take:
          10,
      }),
    ]);

  /**
   * ==========================================================
   * SERIALIZE FLASH SALE
   * ==========================================================
   */

  const serializedFlashSale =
    serializeFlashSale(
      flashSale
    );

  /**
   * ==========================================================
   * SERIALIZE FEATURED PRODUCTS
   * ==========================================================
   */

  const serializedFeaturedProducts =
    featuredProducts.map(
      (product) => ({
        id:
          product.id,

        name:
          product.name,

        slug:
          product.slug,

        price:
          product.price.toNumber(),

        stock:
          product.stock,

        images:
          product.images.map(
            (image) => ({
              id:
                image.id,

              image:
                image.image,

              sortOrder:
                image.sortOrder,

              isThumbnail:
                image.isThumbnail,
            })
          ),
      })
    );

  /**
   * ==========================================================
   * BEST SELLING PRODUCTS
   * ==========================================================
   *
   * Ambil productId berdasarkan total quantity tertinggi.
   */

  const bestSellingProductIds =
    bestSellingGroups.map(
      (item) =>
        item.productId
    );

  const bestSellingProducts =
    bestSellingProductIds.length > 0
      ? await prisma.product.findMany({
          where: {
            id: {
              in:
                bestSellingProductIds,
            },

            deletedAt:
              null,

            isPublished:
              true,
          },

          include: {
            images: {
              orderBy: {
                sortOrder:
                  "asc",
              },
            },
          },
        })
      : [];

  /**
   * ==========================================================
   * PRODUCT MAP
   * ==========================================================
   *
   * Digunakan agar urutan ranking dari groupBy tetap terjaga.
   */

  const bestSellingProductMap =
    new Map(
      bestSellingProducts.map(
        (product) => [
          product.id,
          product,
        ]
      )
    );

  const serializedBestSellingProducts =
    bestSellingGroups
      .map(
        (group) => {
          const product =
            bestSellingProductMap.get(
              group.productId
            );

          if (!product) {
            return null;
          }

          return {
            id:
              product.id,

            name:
              product.name,

            slug:
              product.slug,

            price:
              product.price.toNumber(),

            stock:
              product.stock,

            soldQuantity:
              group._sum.quantity ??
              0,

            images:
              product.images.map(
                (image) => ({
                  id:
                    image.id,

                  image:
                    image.image,

                  sortOrder:
                    image.sortOrder,

                  isThumbnail:
                    image.isThumbnail,
                })
              ),
          };
        }
      )
      .filter(
        (
          product
        ): product is NonNullable<
          typeof product
        > =>
          product !== null
      );

  /**
   * ==========================================================
   * SERIALIZE NEWEST PRODUCTS
   * ==========================================================
   */

  const serializedNewestProducts =
    newestProducts.map(
      (product) => ({
        id:
          product.id,

        name:
          product.name,

        slug:
          product.slug,

        price:
          product.price.toNumber(),

        stock:
          product.stock,

        images:
          product.images.map(
            (image) => ({
              id:
                image.id,

              image:
                image.image,

              sortOrder:
                image.sortOrder,

              isThumbnail:
                image.isThumbnail,
            })
          ),
      })
    );

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <main
      className="
        min-h-screen
        overflow-x-hidden
        bg-[var(--ice-50)]
      "
    >

      {/* ====================================================== */}
      {/* HERO */}
      {/* ====================================================== */}

      <HomeHeroCarousel
        productsHref={
          productsHref
        }
      />

      {/* ====================================================== */}
      {/* CATEGORY */}
      {/* ====================================================== */}

      <div className="relative z-10">
        <HomeCategoryShortcuts
          productsHref={
            productsHref
          }
        />
      </div>

      {/* ====================================================== */}
      {/* FLASH SALE */}
      {/* ====================================================== */}

      {serializedFlashSale && (
        <div className="relative z-10">
          <HomeFlashSaleSection
            flashSale={
              serializedFlashSale
            }
            productsHref={
              productsHref
            }
          />
        </div>
      )}

      {/* ====================================================== */}
      {/* PROMO BANNER */}
      {/* ====================================================== */}

      <div className="relative z-10">
        <HomePromoBanner
          productsHref={
            productsHref
          }
        />
      </div>

      {/* ====================================================== */}
      {/* PRODUCT CONTENT AREA */}
      {/* ====================================================== */}

      <div
        className="
          relative
          bg-[var(--ice-50)]
          pb-10
          sm:pb-14
          lg:pb-16
        "
      >

        {/* ==================================================== */}
        {/* FEATURED PRODUCTS */}
        {/* ==================================================== */}

        <HomeFeaturedProducts
          products={
            serializedFeaturedProducts
          }
          productsHref={
            productsHref
          }
        />

        {/* ==================================================== */}
        {/* BEST SELLING PRODUCTS */}
        {/* ==================================================== */}

        <HomeBestSellingProducts
          products={
            serializedBestSellingProducts
          }
          productsHref={
            productsHref
          }
        />

        {/* ==================================================== */}
        {/* NEWEST PRODUCTS */}
        {/* ==================================================== */}

        <HomeNewestProducts
          products={
            serializedNewestProducts
          }
          productsHref={
            productsHref
          }
        />

      </div>

    </main>
  );
}