import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Fish, ShoppingBag, Truck } from "lucide-react";

import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import InformationalJsonLd from "@/components/seo/InformationalJsonLd";
import settingsService from "@/services/settings/settings.service";
import { getSiteUrls } from "@/services/site/site-url.service";
import { buildSeoMetadata, type SeoSettings } from "@/lib/seo/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, siteUrls] = await Promise.all([
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

  return buildSeoMetadata(seoSettings, {
    baseUrl: siteUrls.landingPageUrl,
    pathname: "/tentang-kami",
    title: `Tentang Kami | ${settings.storeName?.trim() || "Pisjo Market"}`,
    description:
      "Kenali Pisjo Market, platform belanja seafood segar yang membantu pelanggan menemukan produk, melakukan pemesanan, dan mendapatkan layanan yang praktis.",
  });
}

export default async function AboutPage() {
  const [settings, siteUrls] = await Promise.all([
    settingsService.getSettings(),
    getSiteUrls(),
  ]);

  const name = settings.storeName?.trim() || "Pisjo Market";
  const description =
    settings.storeDescription?.trim() ||
    "Platform belanja seafood segar dengan proses pemesanan yang praktis.";
  const url = `${siteUrls.landingPageUrl}/tentang-kami`;

  const siteLogo = settings.siteLogo?.trim() || null;
  const storeInitial =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PM";

  return (
    <>
      <InformationalJsonLd
        type="AboutPage"
        name={`Tentang Kami | ${name}`}
        description={description}
        url={url}
        siteUrl={siteUrls.landingPageUrl}
        breadcrumbs={[
          { name: "Beranda", url: `${siteUrls.landingPageUrl}/` },
          { name: "Tentang Kami", url },
        ]}
      />

      <LandingHeader
        storeName={name}
        storeDescription={description}
        siteLogo={siteLogo}
        storeInitial={storeInitial}
        storeUrl={siteUrls.storefrontUrl}
      />

      <main className="min-h-screen bg-white text-slate-950">
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              {name}
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
              Tentang Kami
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              {description}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Belanja seafood dengan lebih praktis
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                {name} hadir untuk membuat proses menemukan produk, memilih
                kebutuhan, melakukan pemesanan, dan mendapatkan informasi
                layanan menjadi lebih sederhana dalam satu pengalaman belanja.
              </p>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Kami mengutamakan informasi produk yang jelas, proses checkout
                yang mudah dipahami, serta dukungan pelanggan ketika Anda
                membutuhkan bantuan.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [
                  Fish,
                  "Produk seafood",
                  "Temukan pilihan seafood yang tersedia di marketplace.",
                ],
                [
                  ShoppingBag,
                  "Belanja praktis",
                  "Pilih produk dan lanjutkan pemesanan dalam satu alur.",
                ],
                [
                  Truck,
                  "Informasi pengiriman",
                  "Dapatkan pilihan pengiriman sesuai layanan yang tersedia.",
                ],
                [
                  BadgeCheck,
                  "Layanan pelanggan",
                  "Hubungi tim kami ketika membutuhkan bantuan.",
                ],
              ].map(([Icon, title, text]) => {
                const IconComponent = Icon as typeof Fish;
                return (
                  <div
                    key={String(title)}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <IconComponent className="h-6 w-6 text-slate-800" />
                    <h3 className="mt-4 font-semibold">{String(title)}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {String(text)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-9 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Butuh informasi lebih lanjut?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Hubungi kami untuk pertanyaan mengenai produk, pemesanan,
                  pengiriman, atau layanan {name}.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/kontak-kami"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Kontak Kami <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={siteUrls.storefrontUrl}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Belanja Sekarang
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter
        storeName={name}
        storeDescription={description}
        siteLogo={siteLogo}
        storeInitial={storeInitial}
        storeUrl={siteUrls.storefrontUrl}
      />
    </>
  );
}
