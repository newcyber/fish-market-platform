import Image from "next/image";
import { redirect } from "next/navigation";

import {
  ArrowRight,
  Check,
  ChevronRight,
  Coins,
  Fish,
  Gift,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Truck,
} from "lucide-react";

import HomeFeaturedProducts from "@/components/customer/home/HomeFeaturedProducts";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import { serializeHomepageProduct } from "@/lib/products/serialize-homepage-product";
import landingPageService from "@/repositories/landing-page/landing-page.service";
import ProductRepository from "@/repositories/ProductRepository";
import LandingFaq from "./LandingFaq";
import LandingTestimonials from "./LandingTestimonials";

export default async function PisjoLandingPage() {
  const landing = await landingPageService.getPublicLandingPage();

  if (!landing.enabled) {
    redirect(landing.urls.store);
  }

  const { brand, config, rewards, urls } = landing;

  const productsHref = `${urls.store.replace(/\/+$/, "")}/customer/products`;

  const featuredProducts = (await ProductRepository.findFeatured(6)).map(
    serializeHomepageProduct,
  );

  const storeName = brand.storeName;
  const storeDescription = brand.storeDescription;
  const siteLogo = brand.siteLogo;

  const hero = config.hero ?? {};
  const benefits = config.benefits ?? [];
  const benefitsSection = config.benefitsSection ?? {};

  const rewardSection = config.rewardSection ?? {};

  const rewardButtonHref = (() => {
    const rawHref = rewardSection.buttonHref?.trim();

    if (!rawHref) {
      return null;
    }

    // URL absolut atau URL eksternal dipertahankan.
    if (!rawHref.startsWith("/")) {
      return rawHref;
    }

    // /rewards harus diarahkan ke halaman customer rewards.
    const normalizedPath =
      rawHref === "/rewards" ? "/customer/rewards" : rawHref;

    // Path internal diarahkan ke storefront.
    return `${urls.store.replace(/\/+$/, "")}/${normalizedPath.replace(/^\/+/, "")}`;
  })();

  const rewardFeaturedLimit = Math.max(
    1,
    Math.min(rewardSection.featuredLimit ?? 3, 10),
  );

  const rewardCompactLimit = Math.max(
    0,
    Math.min(rewardSection.compactLimit ?? 10, 20),
  );

  const featuredRewards = rewards.slice(0, rewardFeaturedLimit);

  const compactRewards = rewards
    .slice(rewardFeaturedLimit)
    .slice(0, rewardCompactLimit);

  const steps = config.steps ?? [];
  const cta = config.cta ?? {};

  const images = config.images ?? {};

  const heroImage = images.hero ?? null;

  const storeInitial =
    storeName
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PM";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4fbff] text-[var(--pisjo-navy)]">
      {/* ====================================================== */}
      {/* HEADER                                                  */}
      {/* ====================================================== */}

      <LandingHeader
        storeName={storeName}
        storeDescription={storeDescription}
        siteLogo={siteLogo}
        storeInitial={storeInitial}
        storeUrl={urls.store}
      />

      {/* ====================================================== */}
      {/* HERO                                                    */}
      {/* ====================================================== */}

      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#e8f8ff] via-[#f4fbff] to-white">
        {/* Ocean ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          {/* Soft sunlight */}
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#ffffff]/90 blur-3xl" />

          {/* Ocean blue glow */}
          <div className="absolute -right-32 top-20 h-[28rem] w-[28rem] rounded-full bg-[#8cddff]/30 blur-3xl" />

          {/* Cyan water glow */}
          <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-[#bdefff]/40 blur-3xl" />

          {/* Bottom water layer */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#d8f4ff] via-[#eafaff]/80 to-transparent" />

          {/* Ocean wave 1 */}
          <div className="absolute -bottom-20 left-[-10%] h-40 w-[120%] rounded-[50%] bg-white/80 blur-sm" />

          {/* Ocean wave 2 */}
          <div className="absolute -bottom-28 left-[-15%] h-48 w-[130%] rounded-[50%] border-t border-white/80 bg-[#bcecff]/35" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-7 px-4 pb-12 pt-8 sm:gap-12 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:pb-28 lg:pt-24">
          {/* Copy */}

          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#159ee8]/15 bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#0788e8] shadow-sm backdrop-blur-sm sm:mb-6 sm:px-3.5 sm:py-2 sm:text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              {hero.eyebrow || "Belanja seafood jadi lebih mudah"}
            </div>

            <h1 className="text-[2.15rem] font-black leading-[1.05] tracking-tight text-[var(--pisjo-navy)] sm:text-5xl lg:text-6xl">
              {hero.title || "Seafood pilihan,"}
              <span className="block text-[var(--pisjo-primary)]">
                {hero.highlight || "langsung lebih mudah."}
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--pisjo-text-secondary)] sm:mt-6 sm:text-lg sm:leading-8">
              {hero.description ||
                "Temukan berbagai kebutuhan seafood dan produk pilihan melalui Pisjo Market. Belanja lebih praktis, pesan dengan mudah, dan pantau pesanan Anda dalam satu tempat."}
            </p>

            {/* ================================================== */}
            {/* HERO CTA                                            */}
            {/* ================================================== */}

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              {/* Store */}
              <a
                href={urls.store}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--pisjo-primary)] px-6 text-sm font-black text-white shadow-lg shadow-[rgb(7_136_232_/_0.20)] transition hover:-translate-y-0.5 hover:bg-[var(--pisjo-ocean)] sm:w-auto sm:rounded-2xl"
              >
                <ShoppingBag className="h-5 w-5" />

                <span>{hero.primaryButtonLabel || "Belanja Sekarang"}</span>

                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-3 text-xs text-slate-500 sm:mt-8 sm:gap-x-6 sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-green)]/15 text-[var(--pisjo-green)]">
                  <Check className="h-3 w-3" />
                </span>

                <span>Praktis digunakan</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-green)]/15 text-[var(--pisjo-green)]">
                  <Check className="h-3 w-3" />
                </span>

                <span>Pesanan mudah dipantau</span>
              </div>
            </div>
          </div>

          {/* Visual */}

          <div className="relative mx-auto -mt-1 w-full max-w-xl lg:mt-0 lg:max-w-none">
            {heroImage ? (
              /* =========================
                 HERO IMAGE FROM ADMIN
                 ========================= */
              <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-white bg-white shadow-xl shadow-slate-900/10 sm:rounded-[2rem]">
                <Image
                  src={heroImage}
                  alt={hero.title || storeName}
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : (
              /* =========================
                 FALLBACK HERO MOCKUP
                 ========================= */
              <div className="relative mx-auto aspect-square max-w-[480px]">
                {/* Main card */}

                <div className="absolute inset-8 rounded-[3rem] bg-[var(--pisjo-gradient)] shadow-2xl shadow-[rgb(7_136_232_/_0.22)] sm:inset-10" />

                {/* Decorative bubbles */}

                <div className="absolute right-0 top-4 h-20 w-20 rounded-full bg-[var(--pisjo-cyan)]/20 blur-xl sm:h-28 sm:w-28" />

                <div className="absolute bottom-4 left-0 h-24 w-24 rounded-full bg-[var(--pisjo-green)]/20 blur-xl sm:h-32 sm:w-32" />

                {/* Phone */}

                <div className="absolute left-1/2 top-1/2 w-[57%] -translate-x-1/2 -translate-y-1/2 rotate-[-5deg] rounded-[2.25rem] border-[7px] border-slate-900 bg-white p-2 shadow-2xl sm:w-[54%]">
                  <div className="overflow-hidden rounded-[1.7rem] bg-[var(--pisjo-bg)]">
                    {/* Phone top bar */}

                    <div className="flex h-9 items-center justify-center bg-white">
                      <div className="h-1.5 w-16 rounded-full bg-slate-900" />
                    </div>

                    {/* Phone content */}

                    <div className="space-y-3 p-3 sm:p-4">
                      {/* Hero card inside phone */}

                      <div className="rounded-2xl bg-[var(--pisjo-gradient)] p-4 text-white">
                        <p className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
                          Pisjo Market
                        </p>

                        <p className="mt-1 text-sm font-black leading-tight sm:text-base">
                          Belanja seafood
                          <br />
                          lebih praktis.
                        </p>
                      </div>

                      {/* Product categories */}

                      <div className="grid grid-cols-2 gap-2">
                        {["Ikan Segar", "Udang", "Cumi", "Frozen Food"].map(
                          (item) => (
                            <div
                              key={item}
                              className="rounded-xl border border-slate-100 bg-white p-2 shadow-sm"
                            >
                              <div className="mb-2 flex h-10 items-center justify-center rounded-lg bg-[var(--pisjo-soft-blue)]">
                                <Fish className="h-5 w-5 text-[var(--pisjo-primary)]" />
                              </div>

                              <p className="truncate text-[9px] font-semibold text-slate-700">
                                {item}
                              </p>
                            </div>
                          ),
                        )}
                      </div>

                      {/* Order status */}

                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <PackageCheck className="h-4 w-4 text-[var(--pisjo-green)]" />

                          <div>
                            <p className="text-[8px] text-slate-400">Pesanan</p>

                            <p className="text-[10px] font-bold text-slate-800">
                              Siap diproses
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* FEATURED PRODUCTS                                      */}
      {/* ====================================================== */}

      <HomeFeaturedProducts
        products={featuredProducts}
        productsHref={productsHref}
      />

      {/* ====================================================== */}
      {/* MARKETPLACE CUSTOMER CONVERSION                         */}
      {/* ====================================================== */}

      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#062f49] via-[#075477] to-[#0b7891] px-6 py-10 text-white shadow-xl sm:px-10 lg:px-14 lg:py-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl"
            />

            <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Lebih untung belanja langsung
                </div>

                <h2 className="mt-4 max-w-xl text-2xl font-black leading-tight tracking-tight sm:mt-5 sm:text-4xl">
                  Sudah pernah belanja seafood melalui marketplace?
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-6 text-cyan-50 sm:mt-5 sm:text-base sm:leading-7">
                  Sekarang nikmati pengalaman belanja langsung di PISJO MARKET
                  dengan manfaat khusus untuk pelanggan setia.
                </p>

                <a
                  href={urls.store}
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[var(--pisjo-navy)] shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50 sm:mt-7"
                >
                  Mulai Belanja
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-1">
                <div className="flex min-w-0 gap-2.5 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:gap-3 sm:p-4">
                  <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100 sm:h-5 sm:w-5" />
                  <div>
                    <h3 className="text-xs font-extrabold leading-4 text-white sm:text-sm sm:leading-5">
                      Harga khusus PISJO
                    </h3>
                    <p className="mt-1 text-[10px] leading-4 text-cyan-100 sm:text-xs sm:leading-5">
                      Nikmati penawaran langsung dari PISJO MARKET.
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 gap-2.5 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:gap-3 sm:p-4">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100 sm:h-5 sm:w-5" />
                  <div>
                    <h3 className="text-xs font-extrabold leading-4 text-white sm:text-sm sm:leading-5">
                      Poin setiap transaksi
                    </h3>
                    <p className="mt-1 text-[10px] leading-4 text-cyan-100 sm:text-xs sm:leading-5">
                      Kumpulkan poin dari aktivitas belanja Anda.
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 gap-2.5 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:gap-3 sm:p-4">
                  <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100 sm:h-5 sm:w-5" />
                  <div>
                    <h3 className="text-xs font-extrabold leading-4 text-white sm:text-sm sm:leading-5">
                      Hadiah dari poin
                    </h3>
                    <p className="mt-1 text-[10px] leading-4 text-cyan-100 sm:text-xs sm:leading-5">
                      Tukarkan poin dengan reward yang tersedia.
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 gap-2.5 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:gap-3 sm:p-4">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100 sm:h-5 sm:w-5" />
                  <div>
                    <h3 className="text-xs font-extrabold leading-4 text-white sm:text-sm sm:leading-5">
                      Repeat order lebih mudah
                    </h3>
                    <p className="mt-1 text-[10px] leading-4 text-cyan-100 sm:text-xs sm:leading-5">
                      Kembali berbelanja tanpa proses yang rumit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* BENEFIT SHORTCUTS                                       */}
      {/* ====================================================== */}

      <section
        aria-label="Keuntungan Pisjo Market"
        className="relative bg-white px-4 py-5 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <a
              href={urls.store}
              className="group flex min-h-[118px] flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_5px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-[var(--pisjo-primary)]/30 hover:shadow-lg"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f5ff] text-[var(--pisjo-primary)]">
                <Store className="h-5 w-5" />
              </span>

              <span className="mt-4 text-xs font-black leading-5 text-[var(--pisjo-navy)] sm:text-sm">
                Harga Khusus
              </span>

              <span className="mt-1 text-[10px] font-medium leading-4 text-slate-500 sm:text-xs">
                Harga spesial untuk pelanggan Pisjo
              </span>
            </a>

            <a
              href={urls.store}
              className="group flex min-h-[118px] flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_5px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-[var(--pisjo-primary)]/30 hover:shadow-lg"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f5ff] text-[var(--pisjo-primary)]">
                <ShoppingBag className="h-5 w-5" />
              </span>

              <span className="mt-4 text-xs font-black leading-5 text-[var(--pisjo-navy)] sm:text-sm">
                Poin Belanja
              </span>

              <span className="mt-1 text-[10px] font-medium leading-4 text-slate-500 sm:text-xs">
                Kumpulkan poin setiap transaksi
              </span>
            </a>

            <a
              href={rewardButtonHref ?? urls.store}
              className="group flex min-h-[118px] flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_5px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-[var(--pisjo-primary)]/30 hover:shadow-lg"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f5ff] text-[var(--pisjo-primary)]">
                <PackageCheck className="h-5 w-5" />
              </span>

              <span className="mt-4 text-xs font-black leading-5 text-[var(--pisjo-navy)] sm:text-sm">
                Rewards
              </span>

              <span className="mt-1 text-[10px] font-medium leading-4 text-slate-500 sm:text-xs">
                Tukarkan poin dengan hadiah
              </span>
            </a>

            <a
              href={urls.store}
              className="group flex min-h-[118px] flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_5px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-[var(--pisjo-primary)]/30 hover:shadow-lg"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f5ff] text-[var(--pisjo-primary)]">
                <Fish className="h-5 w-5" />
              </span>

              <span className="mt-4 text-xs font-black leading-5 text-[var(--pisjo-navy)] sm:text-sm">
                Bersihkan Ikan
              </span>

              <span className="mt-1 text-[10px] font-medium leading-4 text-slate-500 sm:text-xs">
                Pilihan layanan seafood praktis
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* BENEFITS                                                */}
      {/* ====================================================== */}

      {benefits.length > 0 && (
        <section
          id="benefits"
          className="relative overflow-hidden bg-gradient-to-b from-white via-[#f1faff] to-[#e5f7ff]"
        >
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              {benefitsSection.eyebrow ? (
                <p className="text-sm font-bold text-[var(--pisjo-primary)]">
                  {benefitsSection.eyebrow}
                </p>
              ) : null}

              {benefitsSection.title ? (
                <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--pisjo-navy)] sm:text-4xl">
                  {benefitsSection.title}
                </h2>
              ) : null}

              {benefitsSection.description ? (
                <p className="mt-4 text-base leading-7 text-[var(--pisjo-text-secondary)]">
                  {benefitsSection.description}
                </p>
              ) : null}
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {benefits.slice(0, 6).map((benefit, index) => (
                <Benefit
                  key={`${benefit.title}-${index}`}
                  icon={<BenefitIcon name={benefit.icon} />}
                  title={benefit.title}
                  description={benefit.description}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====================================================== */}
      {/* TESTIMONIALS                                            */}
      {/* ====================================================== */}

      <LandingTestimonials section={config.testimonialsSection} />

      {/* ====================================================== */}
      {/* REWARD POINTS                                           */}
      {/* ====================================================== */}

      {rewardSection.enabled !== false && rewards.length > 0 && (
        <section className="relative overflow-hidden bg-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#ffe9a8]/30 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#bdefff]/30 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              {rewardSection.eyebrow ? (
                <p className="text-sm font-bold text-[var(--pisjo-primary)]">
                  {rewardSection.eyebrow}
                </p>
              ) : null}

              {rewardSection.title ? (
                <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--pisjo-navy)] sm:text-4xl">
                  {rewardSection.title}
                </h2>
              ) : null}

              {rewardSection.description ? (
                <p className="mt-4 text-base leading-7 text-[var(--pisjo-text-secondary)]">
                  {rewardSection.description}
                </p>
              ) : null}
            </div>

            {/* Featured rewards */}
            {featuredRewards.length > 0 ? (
              <div className="mt-8 !flex !flex-nowrap min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:!box-border [&>*]:basis-[calc((100%-0.75rem)/2)] [&>*]:min-w-[calc((100%-0.75rem)/2)] [&>*]:max-w-[calc((100%-0.75rem)/2)] [&>*]:shrink-0 [&>*]:snap-start sm:mt-12 sm:!grid sm:!flex-wrap sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pb-0 sm:[&>*]:basis-auto sm:[&>*]:min-w-0 sm:[&>*]:max-w-none sm:[&>*]:shrink lg:grid-cols-3">
                {featuredRewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    name={reward.name}
                    description={reward.description}
                    image={reward.image}
                    requiredPoints={reward.requiredPoints}
                  />
                ))}
              </div>
            ) : null}

            {/* Compact rewards */}
            {compactRewards.length > 0 ? (
              <div className="mt-6 flex min-w-0 snap-x gap-3 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:min-w-[184px] [&>*]:shrink-0 [&>*]:snap-start sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 sm:[&>*]:min-w-0 sm:[&>*]:shrink lg:grid-cols-5">
                {compactRewards.map((reward) => (
                  <CompactRewardCard
                    key={reward.id}
                    name={reward.name}
                    image={reward.image}
                    requiredPoints={reward.requiredPoints}
                  />
                ))}
              </div>
            ) : null}

            {rewardButtonHref && rewardSection.buttonLabel ? (
              <div className="mt-10 flex justify-center">
                <a
                  href={rewardButtonHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--pisjo-primary)] px-6 text-sm font-bold text-white shadow-lg shadow-[rgb(7_136_232_/_0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--pisjo-ocean)]"
                >
                  {rewardSection.buttonLabel}

                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* ====================================================== */}
      {/* BELANJA LANGSUNG DI PISJO                                */}
      {/* ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-[#e8f8ff] via-white to-[#fff9e9]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[#8cddff]/25 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#ffe9a8]/25 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0788e8]/15 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--pisjo-primary)] shadow-sm sm:text-xs">
              <Store className="h-3.5 w-3.5" />
              Belanja langsung di PISJO
            </div>

            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[var(--pisjo-navy)] sm:text-4xl lg:text-5xl">
              Sudah pernah belanja di marketplace kami?
              <span className="mt-1 block text-[var(--pisjo-primary)]">
                Sekarang bisa langsung di PISJO.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--pisjo-text-secondary)] sm:text-base sm:leading-7">
              Pengalaman belanja tetap praktis, pilihan seafood tetap beragam,
              dan Anda bisa mengumpulkan poin dari transaksi langsung di PISJO
              Market.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={urls.store}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--pisjo-primary)] px-6 text-sm font-black text-white shadow-lg shadow-[rgb(7_136_232_/_0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--pisjo-ocean)]"
              >
                <ShoppingBag className="h-5 w-5" />
                Coba Belanja di PISJO
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <p className="mt-4 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
              Tidak perlu download aplikasi — langsung belanja melalui browser
              HP Anda.
            </p>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-6 rounded-[3rem] bg-[#0788e8]/10 blur-3xl"
            />

            <div className="relative rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur-sm sm:p-6">
              <div className="rounded-[1.5rem] bg-gradient-to-br from-[#0b4f91] via-[#087fd1] to-[#12a9e8] p-5 text-white shadow-lg shadow-[#087fd1]/20 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <Store className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                      Pengalaman belanja
                    </p>
                    <p className="mt-1 text-base font-black">Tetap sama.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" />
                    <div>
                      <p className="text-sm font-black">
                        Harga dan pilihan seafood
                      </p>
                      <p className="mt-1 text-xs leading-5 text-cyan-100">
                        Pilih produk sesuai kebutuhan keluarga.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" />
                    <div>
                      <p className="text-sm font-black">Poin dari transaksi</p>
                      <p className="mt-1 text-xs leading-5 text-cyan-100">
                        Kumpulkan poin sesuai ketentuan program.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" />
                    <div>
                      <p className="text-sm font-black">
                        Belanja melalui browser
                      </p>
                      <p className="mt-1 text-xs leading-5 text-cyan-100">
                        Akses PISJO langsung dari HP Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                <div>
                  <p className="text-xs font-black text-[var(--pisjo-navy)]">
                    Siap mulai belanja?
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    Pilih produk favorit Anda.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-[var(--pisjo-primary)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* HOW IT WORKS                                            */}
      {/* ====================================================== */}

      <section className="relative overflow-hidden bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#e5f8ff] to-transparent"
        />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold text-[var(--pisjo-primary)]">
              CARA BELANJA
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--pisjo-navy)] sm:text-4xl">
              Mulai belanja dalam beberapa langkah
            </h2>

            <p className="mt-4 text-base leading-7 text-[var(--pisjo-text-secondary)]">
              Tidak perlu proses yang rumit. Buka Pisjo Market dan mulai pilih
              produk yang Anda butuhkan.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {steps.map((step) => (
              <Step
                key={step.number}
                number={String(step.number).padStart(2, "0")}
                icon={
                  step.number === 1 ? (
                    <Store className="h-5 w-5" />
                  ) : step.number === 2 ? (
                    <Fish className="h-5 w-5" />
                  ) : step.number === 3 ? (
                    <ShoppingBag className="h-5 w-5" />
                  ) : (
                    <PackageCheck className="h-5 w-5" />
                  )
                }
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* FAQ                                                     */}
      {/* ====================================================== */}

      <LandingFaq section={config.faqSection} />

      {/* ====================================================== */}
      {/* FINAL CTA                                               */}
      {/* ====================================================== */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#062b63] via-[#07599a] to-[#0788e8] px-6 py-12 text-white shadow-2xl shadow-[#0788e8]/15 sm:px-10 lg:px-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#62d8ff]/20 blur-3xl"
            />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--pisjo-cyan)]">
                  {cta.eyebrow || "SIAP BELANJA?"}
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  {cta.title || "Yuk, mulai belanja di Pisjo Market."}
                </h2>

                <p className="mt-4 text-base leading-7 text-white/75">
                  {cta.description ||
                    "Belanja seafood pilihan dengan praktis langsung melalui browser HP Anda. Pilih produk, checkout, dan pantau pesanan dalam satu pengalaman."}
                </p>
              </div>

              {/* ================================================== */}
              {/* FINAL CTA BUTTONS                                  */}
              {/* ================================================== */}

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:shrink-0">
                {/* Store */}
                <a
                  href={urls.store}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--pisjo-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <span>{cta.buttonLabel || "Mulai Belanja"}</span>

                  <ArrowRight className="h-4 w-4 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* FOOTER                                                  */}
      {/* ====================================================== */}

      <LandingFooter
        storeName={storeName}
        storeDescription={storeDescription}
        siteLogo={siteLogo}
        storeInitial={storeInitial}
        storeUrl={urls.store}
      />
    </main>
  );
}

/* ==========================================================
 * REWARD CARD
 * ========================================================== */

function RewardCard({
  name,
  description,
  image,
  requiredPoints,
}: {
  name: string;
  description: string | null;
  image: string | null;
  requiredPoints: number;
}) {
  return (
    <div className="group min-w-0 overflow-hidden rounded-[1.35rem] border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[1/1] overflow-hidden bg-[#f4fbff] sm:aspect-[4/3]">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain p-2.5 transition duration-300 group-hover:scale-105 sm:p-5"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
            Hadiah
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="line-clamp-2 text-[11px] font-black leading-4 text-[var(--pisjo-navy)] sm:text-base sm:leading-5">
          {name}
        </h3>

        {description ? (
          <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-[var(--pisjo-text-secondary)] sm:mt-2 sm:text-sm sm:leading-6">
            {description}
          </p>
        ) : null}

        <div className="mt-3 inline-flex items-center rounded-full bg-[#fff4d6] px-2.5 py-1 text-xs font-black text-[#b77900] sm:mt-4 sm:px-3 sm:py-1.5 sm:text-sm">
          {requiredPoints.toLocaleString("id-ID")} Poin
        </div>
      </div>
    </div>
  );
}

function CompactRewardCard({
  name,
  image,
  requiredPoints,
}: {
  name: string;
  image: string | null;
  requiredPoints: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:gap-4 sm:p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f4fbff] sm:h-20 sm:w-20">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain p-1.5 sm:p-2"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] font-semibold text-slate-400">
            Hadiah
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-xs font-bold leading-4 text-[var(--pisjo-navy)] sm:text-sm">
          {name}
        </h3>

        <p className="mt-1 text-xs font-black text-[#b77900]">
          {requiredPoints.toLocaleString("id-ID")} Poin
        </p>
      </div>
    </div>
  );
}

/* ========================================================== */
/* BENEFIT                                                    */
/* ========================================================== */

function BenefitIcon({ name }: { name?: string }) {
  switch (name) {
    case "shopping-bag":
      return <ShoppingBag className="h-5 w-5" />;

    case "smartphone":
      return <Smartphone className="h-5 w-5" />;

    case "package-check":
      return <PackageCheck className="h-5 w-5" />;

    case "truck":
      return <Truck className="h-5 w-5" />;

    case "store":
      return <Store className="h-5 w-5" />;

    case "coins":
      return <Coins className="h-5 w-5" />;

    case "gift":
      return <Gift className="h-5 w-5" />;

    case "star":
      return <Star className="h-5 w-5" />;

    case "refresh-cw":
    case "refresh":
      return <RefreshCw className="h-5 w-5" />;

    case "fish":
    default:
      return <Fish className="h-5 w-5" />;
  }
}

/* ========================================================== */
/* BENEFIT                                                    */
/* ========================================================== */

function Benefit({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex min-h-[166px] flex-col items-center rounded-2xl border border-[#d7edf7] bg-white/95 p-3 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#7ed8f7] hover:shadow-xl hover:shadow-[#0788e8]/10 sm:min-h-[190px] sm:p-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d9f5ff] to-[#bcecff] text-[#0788e8] transition duration-300 group-hover:scale-105 sm:h-12 sm:w-12">
        {icon}
      </div>

      <h3 className="mt-3 text-[11px] font-black leading-4 text-[var(--pisjo-navy)] sm:mt-4 sm:text-base sm:leading-5">
        {title}
      </h3>

      <p className="mt-1 max-w-xs text-[10px] leading-4 text-[var(--pisjo-text-secondary)] sm:mt-2 sm:text-sm sm:leading-6">
        {description}
      </p>
    </div>
  );
}

/* ========================================================== */
/* STEP                                                        */
/* ========================================================== */

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black tracking-widest text-[var(--pisjo-primary)]">
          {number}
        </span>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
          {icon}
        </div>
      </div>

      <h3 className="mt-6 text-base font-bold text-[var(--pisjo-navy)]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[var(--pisjo-text-secondary)]">
        {description}
      </p>
    </div>
  );
}
