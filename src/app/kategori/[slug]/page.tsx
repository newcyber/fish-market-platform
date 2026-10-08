import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Fish, Package } from "lucide-react";
import { notFound } from "next/navigation";

import DynamicSiteHeader from "@/components/layout/DynamicSiteHeader";
import DynamicSiteFooter from "@/components/layout/DynamicSiteFooter";
import HomeProductCard, {
  type HomeProductCardProduct,
} from "@/components/customer/home/HomeProductCard";

import { prisma } from "@/lib/prisma";
import { getProductRatings } from "@/lib/products/get-product-ratings";
import { getProductCardPricing } from "@/lib/products/get-product-card-pricing";
import { serializeHomepageProduct } from "@/lib/products/serialize-homepage-product";

import CategoryService from "@/services/category/category.service";
import settingsService from "@/services/settings/settings.service";
import { getSiteUrls } from "@/services/site/site-url.service";

import {
  buildSeoMetadata,
  type SeoSettings,
} from "@/lib/seo/seo-metadata";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getCategory(slug: string) {
  return prisma.category.findFirst({
    where: {
      slug,
      deletedAt: null,
      isActive: true,
      products: {
        some: {
          deletedAt: null,
          isPublished: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      updatedAt: true,
    },
  });
}

function resolveImageUrl(
  image: string | null | undefined,
  baseUrl: string,
) {
  if (!image?.trim()) {
    return undefined;
  }

  try {
    return new URL(image.trim(), `${baseUrl}/`).toString();
  } catch {
    return undefined;
  }
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  const siteUrls = await getSiteUrls();

  const [settings, category] = await Promise.all([
    settingsService.getSettings(),
    getCategory(slug.trim().toLowerCase()),
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

  if (!category) {
    return buildSeoMetadata(seoSettings, {
      baseUrl: siteUrls.storefrontUrl,
      pathname: `/kategori/${encodeURIComponent(slug)}`,
      title: "Kategori Tidak Ditemukan",
      noIndex: true,
      noFollow: true,
    });
  }

  const storeName = settings.storeName?.trim() || "Pisjo Market";
  const title = `${category.name} | ${storeName}`;
  const description =
    category.description?.trim() ||
    `Belanja ${category.name.toLowerCase()} berkualitas di ${storeName}. Pilih produk segar, cek stok dan harga, lalu pesan online.`;

  return buildSeoMetadata(seoSettings, {
      baseUrl: siteUrls.storefrontUrl,
    pathname: `/kategori/${category.slug}`,
    title,
    description,
    image: category.image || settings.seoOgImage || undefined,
  });
}

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;

  const [settings, category, categories] = await Promise.all([
    settingsService.getSettings(),
    getCategory(slug.trim().toLowerCase()),
    CategoryService.getCategories({ active: true }),
  ]);

  if (!category) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId: category.id,
      deletedAt: null,
      isPublished: true,
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      variantGroups: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
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
          price: true,
          stock: true,
        },
      },
    },
    orderBy: [
      {
        featured: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: 24,
  });

  const productIds = products.map((product) => product.id);

  const [productRatings, productPricing] = await Promise.all([
    getProductRatings(productIds),
    getProductCardPricing(productIds),
  ]);

  const serializedProducts: HomeProductCardProduct[] = products.map(
    (product) =>
      serializeHomepageProduct(
        product,
        productRatings.get(product.id),
        productPricing.get(product.id),
      ),
  );

  const storeName = settings.storeName?.trim() || "Pisjo Market";
  const baseUrl =
    (
      settings.storefrontUrl?.trim() ||
      settings.seoCanonicalUrl?.trim() ||
      "https://app.pusatikansegar.com"
    ).replace(/\/+$/, "");

  const categoryUrl = new URL(
    `/kategori/${category.slug}`,
    `${baseUrl}/`,
  ).toString();

  const productsUrl = new URL("/products", `${baseUrl}/`).toString();
  const categoryImage = resolveImageUrl(category.image, baseUrl);

  const itemList = serializedProducts.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: product.name,
    url: new URL(
      `/products/${encodeURIComponent(product.slug)}`,
      `${baseUrl}/`,
    ).toString(),
  }));

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${categoryUrl}#collection`,
    name: category.name,
    description:
      category.description?.trim() ||
      `Koleksi ${category.name} di ${storeName}.`,
    url: categoryUrl,
    isPartOf: {
      "@type": "WebSite",
      url: baseUrl,
      name: storeName,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Beranda",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Produk",
          item: productsUrl,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: category.name,
          item: categoryUrl,
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: itemList,
    },
    ...(categoryImage ? { image: categoryImage } : {}),
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <DynamicSiteHeader activePage="products" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionJsonLd).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />

      <section className="border-b border-(--ice-200) bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 text-xs font-semibold text-slate-500 sm:text-sm"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="hover:text-(--fresh-700)"
                >
                  Beranda
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-(--fresh-700)"
                >
                  Produk
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-(--ocean-900)">{category.name}</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-(--fresh-50) px-3 py-1.5 text-xs font-black uppercase tracking-wide text-(--fresh-700)">
                <Fish className="h-3.5 w-3.5" />
                Kategori Produk
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-(--ocean-950) sm:text-4xl lg:text-5xl">
                {category.name}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                {category.description?.trim() ||
                  `Temukan pilihan ${category.name.toLowerCase()} berkualitas di ${storeName}. Pilih produk yang tersedia dan pesan dengan mudah secara online.`}
              </p>
            </div>

            {categoryImage ? (
              <div className="relative hidden aspect-4/3 overflow-hidden rounded-3xl bg-slate-100 lg:block">
                <Image
                  src={categoryImage}
                  alt={category.name}
                  fill
                  sizes="280px"
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-b border-(--ice-200) bg-white">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-max gap-2">
            {categories.map((item) => (
              <Link
                key={item.id}
                href={`/kategori/${encodeURIComponent(item.slug)}`}
                aria-current={
                  item.slug === category.slug
                    ? "page"
                    : undefined
                }
                className={
                  item.slug === category.slug
                    ? "rounded-full bg-(--fresh-500) px-4 py-2 text-xs font-black text-white"
                    : "rounded-full border border-(--ice-200) bg-white px-4 py-2 text-xs font-bold text-(--ocean-800) hover:border-(--fresh-300) hover:text-(--fresh-700)"
                }
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-(--ocean-950) sm:text-2xl">
              Produk {category.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pilihan produk yang tersedia saat ini.
            </p>
          </div>

          <Link
            href={`/products?category=${encodeURIComponent(category.slug)}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-(--fresh-700) hover:text-(--fresh-800)"
          >
            Lihat semua
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {serializedProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6">
            {serializedProducts.map((product) => (
              <HomeProductCard
                key={product.id}
                product={product}
                productsHref="/products"
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-(--ice-300) bg-white px-6 py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-4 text-lg font-black text-(--ocean-900)">
              Belum ada produk
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Produk dalam kategori ini belum tersedia.
            </p>
          </div>
        )}
      </section>

      <DynamicSiteFooter />
    </main>
  );
}
