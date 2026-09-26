import Link from "next/link";
import {
  ArrowRight,
  Fish,
  HeartHandshake,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import landingPageService from "@/repositories/landing-page/landing-page.service";
import settingsService from "@/services/settings/settings.service";
import { getSiteUrls } from "@/services/site/site-url.service";

export default async function AboutUsPage() {
  const [settings, landing, siteUrls] = await Promise.all([
    settingsService.getSettings(),
    landingPageService.getPublicLandingPage(),
    getSiteUrls(),
  ]);

  const storeName =
    landing.brand.storeName?.trim() ||
    settings.storeName?.trim() ||
    "Pisjo Market";

  const storeDescription =
    landing.brand.storeDescription?.trim() ||
    settings.storeDescription?.trim() ||
    "";

  const siteLogo =
    landing.brand.siteLogo?.trim() || settings.siteLogo?.trim() || null;

  const storeUrl = landing.urls.store || siteUrls.storefrontUrl;

  const storeInitial =
    storeName
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PM";

  const description =
    settings.storeDescription?.trim() ||
    `Kenali ${storeName}, platform belanja ikan dan seafood segar yang membantu pelanggan berbelanja dengan lebih praktis.`;

  const highlights = [
    {
      Icon: Fish,
      title: "Produk Seafood",
      body: `Temukan pilihan ikan dan seafood yang tersedia melalui storefront ${storeName}.`,
    },
    {
      Icon: ShoppingBag,
      title: "Belanja Praktis",
      body: "Nikmati alur belanja yang dirancang agar pelanggan dapat memilih produk dan menyelesaikan pesanan dengan lebih mudah.",
    },
    {
      Icon: ShieldCheck,
      title: "Transaksi Lebih Jelas",
      body: "Informasi produk, pesanan, pembayaran, dan pengiriman disajikan dalam satu pengalaman belanja.",
    },
    {
      Icon: HeartHandshake,
      title: "Fokus Pelanggan",
      body: "Kami membangun pengalaman yang membantu pelanggan mendapatkan produk dan bantuan yang mereka perlukan.",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4fbff] text-[var(--pisjo-navy)]">
      <LandingHeader
        storeName={storeName}
        storeDescription={storeDescription}
        siteLogo={siteLogo}
        storeInitial={storeInitial}
        storeUrl={storeUrl}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Tentang {storeName}
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Belanja ikan dan seafood segar dengan lebih praktis.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {description}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={storeUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Mulai Belanja
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/kontak-kami"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Kontak Kami
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-950">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Sparkles className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Menghubungkan produk, pelanggan, dan pengalaman belanja.
              </h2>

              <p className="mt-4 text-base leading-8 text-slate-600">
                {storeName} hadir sebagai bagian dari ekosistem belanja yang
                memudahkan pelanggan menemukan produk, melihat informasi yang
                dibutuhkan, dan melanjutkan pesanan melalui platform digital.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Butuh bantuan?
              </p>

              <h2 className="mt-3 text-2xl font-semibold">
                Tim kami siap membantu.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Untuk pertanyaan produk, pemesanan, pengiriman, atau kebutuhan
                lainnya, kunjungi halaman kontak kami.
              </p>

              <Link
                href="/kontak-kami"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Hubungi Kami
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter
        storeName={storeName}
        storeDescription={storeDescription}
        siteLogo={siteLogo}
        storeInitial={storeInitial}
        storeUrl={storeUrl}
      />
    </main>
  );
}
