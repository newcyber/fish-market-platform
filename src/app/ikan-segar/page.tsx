import type { Metadata } from "next";
import Image from "next/image";

import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  Fish,
  MapPin,
  ShieldCheck,
  Truck,
} from "lucide-react";

import DynamicSiteFooter from "@/components/layout/DynamicSiteFooter";
import DynamicSiteHeader from "@/components/layout/DynamicSiteHeader";

import HomeProductCard, {
  type HomeProductCardProduct,
} from "@/components/customer/home/HomeProductCard";

import { prisma } from "@/lib/prisma";

import { getProductRatings } from "@/lib/products/get-product-ratings";

import CategoryService from "@/services/category/category.service";
import settingsService from "@/services/settings/settings.service";
import { ProductInventoryAvailabilityService } from "@/services/product/product-inventory-availability.service";

import { getSiteUrls } from "@/services/site/site-url.service";

import {
  buildSeoMetadata,
  type SeoSettings,
} from "@/lib/seo/seo-metadata";

const PAGE_PATH = "/ikan-segar";

const DEFAULT_TITLE =
  "Ikan Segar Jogja | Pusat Ikan Segar PISJO";

const DEFAULT_DESCRIPTION =
  "Belanja ikan segar Jogja di PISJO Market. Temukan ikan laut, ikan air tawar, seafood, dan pilihan frozen food berkualitas untuk kebutuhan rumah tangga maupun usaha.";

function buildSeoSettings(
  settings: Awaited<
    ReturnType<typeof settingsService.getSettings>
  >,
): SeoSettings {
  return {
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
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await settingsService.getSettings();
  const siteUrls = await getSiteUrls();

  const storeName =
    settings.storeName?.trim() || "PISJO";

  const description =
    settings.storeDescription?.trim()
      ? `Belanja ikan segar Jogja di ${storeName}. Temukan ikan laut, ikan air tawar, seafood, dan pilihan frozen food berkualitas secara online.`
      : DEFAULT_DESCRIPTION;

  return buildSeoMetadata(
    settings,
    {
      baseUrl: siteUrls.storefrontUrl,
      pathname: PAGE_PATH,
      title:
        storeName === "PISJO"
          ? DEFAULT_TITLE
          : `Ikan Segar Jogja | ${storeName}`,
      description,
      ogTitle:
        storeName === "PISJO"
          ? DEFAULT_TITLE
          : `Ikan Segar Jogja | ${storeName}`,
      ogDescription: description,
    },
  );
}

function serializeProducts(
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: unknown;
    stock: number | null;
    isPreOrder: boolean;
    preOrderMinDays: number | null;
    preOrderMaxDays: number | null;
    images: Array<{
      id: string;
      image: string;
      sortOrder: number;
      isThumbnail: boolean;
    }>;
    skus: Array<{
      id: string;
      price: unknown;
      stock: number;
    }>;
  }>,
  productRatings: Map<
    string,
    { averageRating: number | null; reviewCount: number }
  >,
  availabilityBySkuId: Map<
    string,
    Awaited<
      ReturnType<
        typeof ProductInventoryAvailabilityService.getSkuAvailabilities
      >
    >[number]
  >,
): HomeProductCardProduct[] {
  return products.map((product) => ({
    id: product.id,

    name: product.name,

    slug: product.slug,

    price:
      typeof product.price === "number"
        ? product.price
        : Number(
            (
              product.price as {
                toNumber?: () => number;
              }
            )?.toNumber?.() ?? product.price,
          ),

    rating:
      productRatings.get(product.id)?.averageRating ??
      null,

    reviewCount:
      productRatings.get(product.id)?.reviewCount ??
      0,

    stock: (() => {
      const availableStocks = product.skus
        .map(
          (sku) =>
            availabilityBySkuId.get(sku.id)?.availableQuantity ??
            0,
        );

      return product.skus.length > 0
        ? availableStocks.reduce(
            (total, stock) => total + stock,
            0,
          )
        : Math.max(0, product.stock ?? 0);
    })(),

    hasVariants: product.skus.length > 1,

    lowStockVariantStock: (() => {
      const lowStocks = product.skus
        .map(
          (sku) =>
            availabilityBySkuId.get(sku.id)?.availableQuantity ??
            0,
        )
        .filter(
          (stock) =>
            stock > 0 &&
            stock <= 5,
        );

      return lowStocks.length > 0
        ? Math.min(...lowStocks)
        : null;
    })(),

    isOutOfStock:
      product.skus.length > 0
        ? product.skus.every(
            (sku) =>
              (availabilityBySkuId.get(sku.id)?.availableQuantity ?? 0) <=
              0,
          )
        : (product.stock ?? 0) <= 0,

    isPreOrder:
      product.isPreOrder === true,

    preOrderMinDays:
      product.preOrderMinDays ?? null,

    preOrderMaxDays:
      product.preOrderMaxDays ?? null,

    images: product.images.map(
      (image) => ({
        id: image.id,
        image: image.image,
        sortOrder: image.sortOrder,
        isThumbnail:
          image.isThumbnail,
      }),
    ),
  }));
}

export default async function FreshFishLandingPage() {
  const siteUrls = await getSiteUrls();

  const [
    settings,
    categories,
    products,
  ] = await Promise.all([
    settingsService.getSettings(),

    CategoryService.getCategories({
      active: true,
    }),

    prisma.product.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
      },

      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        skus: {
          where: {
            isActive: true,
          },

          orderBy: {
            price: "asc",
          },

          select: {
            id: true,
            price: true,
            stock: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 12,
    }),
  ]);

  const productRatings =
    await getProductRatings(
      products.map((product) => product.id),
    );

  const skuIds = products.flatMap((product) =>
    product.skus.map((sku) => sku.id),
  );

  const skuAvailabilities =
    await ProductInventoryAvailabilityService.getSkuAvailabilities(
      skuIds,
    );

  const availabilityBySkuId = new Map(
    skuAvailabilities.map((availability) => [
      availability.skuId,
      availability,
    ]),
  );

  const serializedProducts =
    serializeProducts(
      products,
      productRatings,
      availabilityBySkuId,
    );

  const storeName =
    settings.storeName?.trim() ||
    "PISJO";

  const heroImage =
    settings.heroSlide1Image?.trim() ||
    null;

  const hasLocation =
    Boolean(
      settings.address?.trim() ||
        settings.city?.trim() ||
        settings.province?.trim(),
    );

  const locationParts = [
    settings.address?.trim(),
    settings.city?.trim(),
    settings.province?.trim(),
    settings.postalCode?.trim(),
  ].filter(Boolean);

  const locationText =
    locationParts.join(", ");

  const pageDescription =
    settings.storeDescription?.trim() ||
    DEFAULT_DESCRIPTION;

  const storefrontUrl =
    siteUrls.storefrontUrl.replace(/\/$/, "");

  const pageUrl =
    `${storefrontUrl}${PAGE_PATH}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#collection`,
    url: pageUrl,
    name:
      storeName === "PISJO"
        ? "Ikan Segar Jogja | Pusat Ikan Segar PISJO"
        : `Ikan Segar Jogja | ${storeName}`,
    description: pageDescription,
    inLanguage: "id-ID",
    isPartOf: {
      "@id": `${storefrontUrl}/#website`,
    },
    about: {
      "@id": `${storefrontUrl}/#organization`,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement:
        serializedProducts.map(
          (product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${storefrontUrl}/products/${product.slug}`,
            name: product.name,
          }),
        ),
    },
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <DynamicSiteHeader activePage="products" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      {/* ======================================================
          BREADCRUMB
      ====================================================== */}

      <nav
        aria-label="Breadcrumb"
        className="border-b border-slate-100 bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <ol className="flex items-center gap-2 text-xs text-slate-500">
            <li>
              <Link
                href="/"
                className="transition hover:text-(--pisjo-primary)"
              >
                Beranda
              </Link>
            </li>

            <li aria-hidden="true">/</li>

            <li
              aria-current="page"
              className="font-semibold text-slate-800"
            >
              Ikan Segar
            </li>
          </ol>
        </div>
      </nav>

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-(--ice-200) bg-(--ice-50) px-3 py-1.5 text-xs font-bold text-(--ocean-800)">
              <Fish className="h-4 w-4" />
              Pilihan Ikan Segar
            </div>

            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-(--ocean-950) sm:text-4xl lg:text-5xl">
              Ikan Segar Online di Jogja
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {pageDescription}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-(--ocean-900) px-6 text-sm font-bold text-white transition hover:bg-(--ocean-800)"
              >
                Belanja Ikan Segar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="#kategori"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-(--ocean-900) transition hover:bg-slate-50"
              >
                Lihat Kategori
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-(--ice-50)">
            {heroImage ? (
              <div className="relative aspect-[16/10]">
                <Image
                  src={heroImage}
                  alt={`Ikan segar ${storeName}`}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center">
                <Fish className="h-20 w-20 text-(--ocean-300)" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ======================================================
          TRUST
      ====================================================== */}

      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--ice-50) text-(--ocean-900)">
              <Fish className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Pilihan produk
              </p>

              <p className="text-xs text-slate-500">
                Beragam ikan untuk kebutuhan Anda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--ice-50) text-(--ocean-900)">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Belanja lebih mudah
              </p>

              <p className="text-xs text-slate-500">
                Pesan langsung melalui marketplace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--ice-50) text-(--ocean-900)">
              <Truck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Opsi pengiriman
              </p>

              <p className="text-xs text-slate-500">
                Tersedia sesuai area dan metode pengiriman
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          CATEGORIES
      ====================================================== */}

      <section
        id="kategori"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
      >
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--pisjo-primary)">
              Jelajahi
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-(--ocean-950)">
              Kategori Ikan Segar
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Pilih kategori untuk menemukan produk
              yang sesuai kebutuhan Anda.
            </p>
          </div>

          <Link
            href="/products"
            className="hidden shrink-0 items-center gap-1 text-sm font-bold text-(--pisjo-primary) sm:inline-flex"
          >
            Lihat semua
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${encodeURIComponent(
                  category.slug,
                )}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-(--pisjo-primary) hover:shadow-sm"
              >
                {category.image ? (
                  <div className="relative aspect-[4/3] bg-slate-50">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-(--ice-50)">
                    <Fish className="h-10 w-10 text-(--ocean-300)" />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    {category.name}
                  </h3>

                  {category.description ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {category.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      Lihat pilihan produk
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <Fish className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Kategori belum tersedia
            </p>
          </div>
        )}
      </section>

      {/* ======================================================
          PRODUCTS
      ====================================================== */}

      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--pisjo-primary)">
                Pilihan Produk
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-(--ocean-950)">
                Ikan Segar Pilihan
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Jelajahi produk ikan yang tersedia di PISJO.
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-(--pisjo-primary)"
            >
              Semua Produk
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {serializedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-4 2xl:grid-cols-6">
              {serializedProducts.map(
                (product) => (
                  <HomeProductCard
                    key={product.id}
                    product={product}
                    productsHref="/products"
                  />
                ),
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <Fish className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Produk ikan belum tersedia
              </p>

              <Link
                href="/products"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-(--ocean-900) px-5 py-3 text-sm font-bold text-white"
              >
                Lihat Produk
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================
          WHY PISJO
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--pisjo-primary)">
              Mengapa PISJO
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-(--ocean-950) sm:text-3xl">
              Belanja ikan segar tanpa ribet
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              PISJO membantu Anda menemukan produk ikan
              melalui katalog online yang mudah digunakan,
              sehingga proses memilih produk dan melakukan
              pemesanan menjadi lebih praktis.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Katalog produk mudah dijelajahi",
              "Kategori produk lebih terstruktur",
              "Informasi produk tersedia sebelum membeli",
              "Pemesanan dilakukan langsung secara online",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <CheckCircle2 className="h-5 w-5 text-(--fresh-500)" />

                <p className="mt-3 text-sm font-bold text-slate-900">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          LOCATION
      ====================================================== */}

      {hasLocation && (
        <section className="border-t border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--ocean-900) text-white">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--pisjo-primary)">
                    Lokasi
                  </p>

                  <h2 className="mt-1 text-xl font-black text-(--ocean-950)">
                    Lokasi {storeName}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {locationText}
                  </p>

                  <Link
                    href="/kontak-kami"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-(--pisjo-primary)"
                  >
                    Lihat informasi kontak
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================
          CTA
      ====================================================== */}

      <section className="bg-(--ocean-950)">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Siap belanja ikan segar?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Jelajahi katalog PISJO dan temukan produk
            yang sesuai kebutuhan Anda.
          </p>

          <Link
            href="/products"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-black text-(--ocean-950) transition hover:bg-slate-100"
          >
            Belanja Sekarang
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      <DynamicSiteFooter />
    </main>
  );
}