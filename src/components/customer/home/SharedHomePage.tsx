import { auth } from "@/auth";

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

import HomeRepeatPurchaseProducts from
  "@/components/customer/home/HomeRepeatPurchaseProducts";

import CustomerHomeHeader from
  "@/components/customer/home/CustomerHomeHeader";

import { CustomerRepository } from
  "@/repositories/CustomerRepository";

import { OrderRepository } from
  "@/repositories/OrderRepository";

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
 * - Guest:
 *   /
 *
 * - Customer:
 *   /customer
 *
 * Perbedaan utama hanya pada:
 *
 * - navigation/header
 * - productsHref
 *
 * ============================================================
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
 *
 * ============================================================
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

          sku:
            item.sku
              ? {
                  id:
                    item.sku.id,

                  sku:
                    item.sku.sku,

                  price:
                    item.sku.price.toNumber(),

                  stock:
                    item.sku.stock,
                }
              : null,
        })
      ),
  };
}

/**
 * ============================================================
 * SERIALIZE HOMEPAGE PRODUCT
 * ============================================================
 *
 * Harga homepage mengikuti SKU aktif dengan harga terendah.
 *
 * Untuk product single-SKU:
 *
 * - harga = SKU.price
 * - stok  = SKU.stock
 *
 * Untuk product multi-variant:
 *
 * - harga = harga SKU aktif terendah
 * - stok tidak ditampilkan sebagai stok product-level
 *
 * ============================================================
 */

function serializeHomepageProduct(
  product: {
    id: string;
    name: string;
    slug: string;
    price: {
      toNumber: () => number;
    };
    stock: number;
    images: Array<{
      id: string;
      image: string | null;
      sortOrder: number | null;
      isThumbnail: boolean;
    }>;
    variantGroups: Array<{
      id: string;
    }>;
    skus: Array<{
      price: {
        toNumber: () => number;
      };
      stock: number;
    }>;
  }
) {
  const hasVariants =
    product.variantGroups.length > 0;

  const lowestActiveSku =
    product.skus[0] ?? null;

  const displayPrice =
    lowestActiveSku
      ? lowestActiveSku.price.toNumber()
      : product.price.toNumber();

  const displayStock =
    !hasVariants && lowestActiveSku
      ? lowestActiveSku.stock
      : null;

  return {
    id:
      product.id,

    name:
      product.name,

    slug:
      product.slug,

    price:
      displayPrice,

    stock:
      displayStock,

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

    hasVariants,
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
   * CUSTOMER REPEAT PURCHASES
   * ==========================================================
   *
   * Hanya customer yang membutuhkan histori pembelian.
   *
   * Guest tidak melakukan query ini.
   */

  const session =
    mode === "customer"
      ? await auth()
      : null;

  const customerUserId =
    session?.user?.id ?? null;

  /**
   * ==========================================================
   * FETCH HOMEPAGE DATA
   * ==========================================================
   *
   * Semua data utama homepage diambil secara paralel.
   *
   * Category berasal dari database agar:
   *
   * - nama kategori mengikuti Admin
   * - gambar kategori dapat diatur dari Admin
   * - urutan mengikuti sortOrder
   * - kategori nonaktif tidak ditampilkan
   *
   * Product homepage:
   *
   * - menggunakan SKU aktif
   * - harga card menggunakan harga SKU terendah
   * - single SKU menggunakan stock SKU
   *
   * ==========================================================
   */

const [
  flashSale,
  featuredProducts,
  bestSellingGroups,
  newestProducts,
  categories,
  repeatPurchaseItems,
  customerHomeSummary,
  customerOrderSummary,
] = await Promise.all([

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

          variantGroups: {
            where: {
              isActive:
                true,
            },

            select: {
              id:
                true,
            },

            take:
              1,
          },

          skus: {
            where: {
              isActive:
                true,
            },

            orderBy: {
              price:
                "asc",
            },

            select: {
              price:
                true,

              stock:
                true,
            },

            take:
              1,
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

          variantGroups: {
            where: {
              isActive:
                true,
            },

            select: {
              id:
                true,
            },

            take:
              1,
          },

          skus: {
            where: {
              isActive:
                true,
            },

            orderBy: {
              price:
                "asc",
            },

            select: {
              price:
                true,

              stock:
                true,
            },

            take:
              1,
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
       * HOMEPAGE CATEGORIES
       * ========================================================
       */

      prisma.category.findMany({
        where: {
          isActive:
            true,

          deletedAt:
            null,
        },

        orderBy: [
          {
            sortOrder:
              "asc",
          },

          {
            name:
              "asc",
          },
        ],

        select: {
          id:
            true,

          name:
            true,

          slug:
            true,

          image:
            true,

          description:
            true,

          sortOrder:
            true,
        },
      }),
            /**
       * ========================================================
       * BELANJA LAGI
       * ========================================================
       *
       * Hanya customer.
       *
       * Order valid:
       * - userId sesuai session
       * - COMPLETED
       * - VERIFIED
       * - belum soft delete
       *
       * Item dibatasi pada histori terbaru agar homepage
       * tidak mengambil seluruh histori customer.
       */

      customerUserId
        ? prisma.orderItem.findMany({
            where: {
              order: {
                userId: customerUserId,

                status: "COMPLETED",

                paymentStatus: "VERIFIED",

                deletedAt: null,
              },

              product: {
                deletedAt: null,

                isPublished: true,
              },
            },

            orderBy: {
              order: {
                createdAt: "desc",
              },
            },

            take: 50,

            select: {
              productId: true,

              order: {
                select: {
                  createdAt: true,
                },
              },

              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  stock: true,

                  images: {
                    orderBy: {
                      sortOrder: "asc",
                    },

                    select: {
                      id: true,
                      image: true,
                      sortOrder: true,
                      isThumbnail: true,
                    },
                  },

                  variantGroups: {
                    where: {
                      isActive: true,
                    },

                    select: {
                      id: true,
                    },

                    take: 1,
                  },

                  skus: {
                    where: {
                      isActive: true,
                    },

                    orderBy: {
                      price: "asc",
                    },

                    select: {
                      price: true,
                      stock: true,
                    },

                    take: 1,
                  },
                },
              },
            },
          })
        : [],

      /**
       * ========================================================
       * CUSTOMER HOME SUMMARY
       * ========================================================
       *
       * Hanya customer.
       *
       * Berisi:
       * - nama
       * - reward points
       * - alamat aktif/default
       *
       * Guest tidak melakukan query customer.
       */

      customerUserId
        ? CustomerRepository.findHomeSummary(
            customerUserId
          )
        : null,

      /**
       * ========================================================
       * CUSTOMER ORDER SUMMARY
       * ========================================================
       *
       * Hanya customer.
       *
       * Digunakan untuk jumlah pesanan aktif
       * pada Customer Home Header.
       */

      customerUserId
        ? OrderRepository.getCustomerOrderSummary(
            customerUserId
          )
        : null,

    ]);

  /**
   * ==========================================================
   * CUSTOMER HOME HEADER DATA
   * ==========================================================
   */

  const activeOrderCount =
    customerOrderSummary
      ? customerOrderSummary.pending +
        customerOrderSummary.waitingPayment +
        customerOrderSummary.waitingVerification +
        customerOrderSummary.processing +
        customerOrderSummary.shipping
      : 0;

  /**
   * ==========================================================
   * STORE SETTINGS
   * ==========================================================
   */

  const storeSettings =
    await prisma.storeSettings.findFirst();

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
      (product) =>
        serializeHomepageProduct(
          product
        )
    );

  /**
   * ==========================================================
   * BEST SELLING PRODUCTS
   * ==========================================================
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

            variantGroups: {
              where: {
                isActive:
                  true,
              },

              select: {
                id:
                  true,
              },

              take:
                1,
            },

            skus: {
              where: {
                isActive:
                  true,
              },

              orderBy: {
                price:
                  "asc",
              },

              select: {
                price:
                  true,

                stock:
                  true,
              },

              take:
                1,
            },
          },
        })
      : [];

  /**
   * ==========================================================
   * PRODUCT MAP
   * ==========================================================
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

  /**
   * ==========================================================
   * SERIALIZE BEST SELLING PRODUCTS
   * ==========================================================
   */

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
            ...serializeHomepageProduct(
              product
            ),

            soldQuantity:
              group._sum.quantity ??
              0,
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
      (product) =>
        serializeHomepageProduct(
          product
        )
    );

      /**
   * ==========================================================
   * SERIALIZE BELANJA LAGI
   * ==========================================================
   *
   * Produk diurutkan berdasarkan pembelian terakhir.
   *
   * Satu produk hanya muncul satu kali walaupun dibeli
   * beberapa kali.
   */

  const repeatPurchaseProductMap =
    new Map<
      string,
      (typeof repeatPurchaseItems)[number]["product"]
    >();

  for (const item of repeatPurchaseItems) {
    if (!repeatPurchaseProductMap.has(item.productId)) {
      repeatPurchaseProductMap.set(
        item.productId,
        item.product
      );
    }

    if (
      repeatPurchaseProductMap.size >= 6
    ) {
      break;
    }
  }

  const serializedRepeatPurchaseProducts =
    Array.from(
      repeatPurchaseProductMap.values()
    ).map(
      (product) =>
        serializeHomepageProduct(product)
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
        bg-(--ice-50)
      "
    >

      {/* ======================================================
          CUSTOMER HOME HEADER
      ====================================================== */}

      {mode === "customer" && customerHomeSummary && (
        <CustomerHomeHeader
          customerName={
            customerHomeSummary.name?.trim() ||
            "Customer"
          }
          rewardPoints={
            customerHomeSummary.rewardPointsBalance ?? 0
          }
          address={
            customerHomeSummary.addresses[0] ?? null
          }
          activeOrderCount={
            activeOrderCount
          }
        />
      )}

      {/* ======================================================
          HERO
      ====================================================== */}

<HomeHeroCarousel
  productsHref={
    productsHref
  }

  heroImages={{
    slide1:
      storeSettings?.heroSlide1Image ??
      null,

    slide2:
      storeSettings?.heroSlide2Image ??
      null,

    slide3:
      storeSettings?.heroSlide3Image ??
      null,
  }}

  heroContent={{
    slide1: {
      eyebrow:
        storeSettings?.heroSlide1Eyebrow ?? null,
      title:
        storeSettings?.heroSlide1Title ?? null,
      highlight:
        storeSettings?.heroSlide1Highlight ?? null,
      description:
        storeSettings?.heroSlide1Description ?? null,
      button:
        storeSettings?.heroSlide1Button ?? null,
    },

    slide2: {
      eyebrow:
        storeSettings?.heroSlide2Eyebrow ?? null,
      title:
        storeSettings?.heroSlide2Title ?? null,
      highlight:
        storeSettings?.heroSlide2Highlight ?? null,
      description:
        storeSettings?.heroSlide2Description ?? null,
      button:
        storeSettings?.heroSlide2Button ?? null,
    },

    slide3: {
      eyebrow:
        storeSettings?.heroSlide3Eyebrow ?? null,
      title:
        storeSettings?.heroSlide3Title ?? null,
      highlight:
        storeSettings?.heroSlide3Highlight ?? null,
      description:
        storeSettings?.heroSlide3Description ?? null,
      button:
        storeSettings?.heroSlide3Button ?? null,
    },
  }}
/>

      {/* ======================================================
          CATEGORY
      ====================================================== */}

      <div
        className="
          relative
          z-10
        "
      >
        <HomeCategoryShortcuts
          productsHref={
            productsHref
          }

          categories={
            categories
          }
        />
      </div>

      {/* ======================================================
          FLASH SALE
      ====================================================== */}

      {serializedFlashSale && (
        <div
          className="
            relative
            z-10
          "
        >
{serializedFlashSale ? (
  <HomeFlashSaleSection
    flashSale={serializedFlashSale}
    productsHref={productsHref}
    bannerImage={
      storeSettings?.flashSaleBannerImage ?? null
    }
    bannerContent={{
      label:
        storeSettings?.flashSaleBannerLabel ?? null,
      title:
        storeSettings?.flashSaleBannerTitle ?? null,
      highlight:
        storeSettings?.flashSaleBannerHighlight ?? null,
      description:
        storeSettings?.flashSaleBannerDescription ?? null,
    }}
  />
) : null}
        </div>
      )}

      {/* ======================================================
          PROMO BANNER
      ====================================================== */}

      <div
        className="
          relative
          z-10
        "
      >
        <HomePromoBanner
          productsHref={
            productsHref
          }
        />
      </div>

      {/* ======================================================
          PRODUCT CONTENT AREA
      ====================================================== */}

      <div
        className="
          relative
          bg-(--ice-50)
          pb-10
          sm:pb-14
          lg:pb-16
        "
      >

        {/* ====================================================
            BELANJA LAGI
        ==================================================== */}

        {mode === "customer" && (
          <HomeRepeatPurchaseProducts
            products={
              serializedRepeatPurchaseProducts
            }
            productsHref={
              productsHref
            }
          />
        )}

        {/* ====================================================
            FEATURED PRODUCTS
        ==================================================== */}

        <HomeFeaturedProducts
          products={
            serializedFeaturedProducts
          }

          productsHref={
            productsHref
          }
        />

        {/* ====================================================
            BEST SELLING PRODUCTS
        ==================================================== */}

        <HomeBestSellingProducts
          products={
            serializedBestSellingProducts
          }

          productsHref={
            productsHref
          }
        />

        {/* ====================================================
            NEWEST PRODUCTS
        ==================================================== */}

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
