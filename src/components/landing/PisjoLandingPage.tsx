import Image from "next/image";
import { redirect } from "next/navigation";

import {
  ArrowRight,
  Check,
  ChevronRight,
  Fish,
  PackageCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";

import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import landingPageService from "@/repositories/landing-page/landing-page.service";

export default async function PisjoLandingPage() {
  const landing = await landingPageService.getPublicLandingPage();

  if (!landing.enabled) {
    redirect(landing.urls.store);
  }

  const { brand, config, rewards, urls } = landing;

  const storeName = brand.storeName;
  const storeDescription = brand.storeDescription;
  const siteLogo = brand.siteLogo;

  const hero = config.hero ?? {};
  const benefits = config.benefits ?? [];
  const app = config.app ?? {};

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
      rawHref === "/rewards"
        ? "/customer/rewards"
        : rawHref;

    // Path internal diarahkan ke storefront.
    return `${urls.store.replace(/\/+$/, "")}/${normalizedPath.replace(/^\/+/, "")}`;
  })();

  const tutorialSection = config.tutorialSection ?? {};

  const tutorialSteps = (tutorialSection.steps ?? []).slice(0, 3);

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
  const appImage = images.app ?? null;

  /*
   * ============================================================
   * PLATFORM AVAILABILITY
   * ============================================================
   *
   * Android:
   * - tersedia jika URL APK tersedia
   *
   * iOS:
   * - tersedia jika App Store URL tersedia
   *
   * Tidak menggunakan fallback ke urls.store.
   * ============================================================
   */

  const androidAvailable = Boolean(urls.android);
  const androidUrl = urls.android;

  const iosAvailable = Boolean(urls.ios);
  const iosUrl = urls.ios;

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

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:pb-28 lg:pt-24">
          {/* Copy */}

          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#159ee8]/15 bg-white/80 px-3.5 py-2 text-xs font-bold text-[#0788e8] shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {hero.eyebrow || "Belanja seafood jadi lebih mudah"}
            </div>

            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-[var(--pisjo-navy)] sm:text-5xl lg:text-6xl">
              {hero.title || "Seafood pilihan,"}
              <span className="block text-[var(--pisjo-primary)]">
                {hero.highlight || "langsung lebih mudah."}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--pisjo-text-secondary)] sm:text-lg sm:leading-8">
              {hero.description ||
                "Temukan berbagai kebutuhan seafood dan produk pilihan melalui Pisjo Market. Belanja lebih praktis, pesan dengan mudah, dan pantau pesanan Anda dalam satu tempat."}
            </p>

            {/* ================================================== */}
            {/* HERO CTA                                            */}
            {/* ================================================== */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {/* Store */}
              <a
                href={urls.store}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--pisjo-primary)] px-6 text-sm font-bold text-white shadow-lg shadow-[rgb(7_136_232_/_0.20)] transition hover:-translate-y-0.5 hover:bg-[var(--pisjo-ocean)]"
              >
                <ShoppingBag className="h-5 w-5" />

                <span>{hero.primaryButtonLabel || "Belanja Sekarang"}</span>

                <ArrowRight className="h-4 w-4" />
              </a>

              {/* Android */}
              {androidAvailable && androidUrl ? (
                <a
                  href={androidUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[var(--pisjo-navy)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--pisjo-primary)]/30 hover:bg-[var(--pisjo-soft-blue)]"
                >
                  <Smartphone className="h-5 w-5 shrink-0 text-[var(--pisjo-primary)]" />

                  <span>{hero.secondaryButtonLabel || "Download Android"}</span>

                  <ArrowRight className="h-4 w-4 shrink-0" />
                </a>
              ) : null}

              {/* iOS */}
              {iosAvailable && iosUrl ? (
                <a
                  href={iosUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download iOS"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[var(--pisjo-navy)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--pisjo-primary)]/30 hover:bg-[var(--pisjo-soft-blue)]"
                >
                  {/* Apple Logo */}
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 fill-current text-[var(--pisjo-navy)]"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.33 4.5-3.74 4.25z" />
                  </svg>

                  <span>Download iOS</span>

                  <ArrowRight className="h-4 w-4 shrink-0" />
                </a>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
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

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            {heroImage ? (
              /* =========================
                 HERO IMAGE FROM ADMIN
                 ========================= */
              <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-slate-900/10">
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

                <h2 className="mt-5 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">
                  Sudah pernah belanja seafood melalui marketplace?
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-cyan-50 sm:text-base">
                  Sekarang nikmati pengalaman belanja langsung di PISJO MARKET
                  dengan manfaat khusus untuk pelanggan setia.
                </p>

                <a
                  href={urls.store}
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[var(--pisjo-navy)] shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50"
                >
                  Mulai Belanja
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <ShoppingBag className="mt-0.5 h-5 w-5 shrink-0 text-cyan-100" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Harga khusus PISJO
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-cyan-100">
                      Nikmati penawaran langsung dari PISJO MARKET.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-cyan-100" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Poin setiap transaksi
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-cyan-100">
                      Kumpulkan poin dari aktivitas belanja Anda.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-100" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Hadiah dari poin
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-cyan-100">
                      Tukarkan poin dengan reward yang tersedia.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <ArrowRight className="mt-0.5 h-5 w-5 shrink-0 text-cyan-100" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Repeat order lebih mudah
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-cyan-100">
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
      {/* BENEFITS                                                */}
      {/* ====================================================== */}

      {benefits.length > 0 && (
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#f1faff] to-[#e5f7ff]">
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

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit, index) => (
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

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
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
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
      {/* TUTORIAL INSTALASI                                     */}
      {/* ====================================================== */}

      {tutorialSection.enabled !== false ? (
        <section className="relative overflow-hidden bg-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-[#bdefff]/30 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-[#ffe9a8]/30 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
            <div className="flex justify-center">
              <div className="relative w-full max-w-sm">
                <div
                  aria-hidden="true"
                  className="absolute inset-8 rounded-[3rem] bg-[#0788e8]/10 blur-3xl"
                />

                {tutorialSection.image ? (
                  <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-4 shadow-xl">
                    <div className="relative overflow-hidden rounded-[2rem] bg-slate-50">
                      <Image
                        src={tutorialSection.image}
                        alt={
                          tutorialSection.title ||
                          "Tutorial instalasi PISJO di iPhone"
                        }
                        width={720}
                        height={960}
                        className="h-auto max-h-[38rem] w-full object-contain"
                        sizes="(max-width: 1024px) 90vw, 384px"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative mx-auto w-full max-w-[18rem] rounded-[2.8rem] border-[8px] border-slate-900 bg-white p-2 shadow-2xl">
                    <div className="overflow-hidden rounded-[2.1rem] bg-[#f4fbff]">
                      <div className="flex h-8 items-center justify-center bg-white">
                        <div className="h-1.5 w-20 rounded-full bg-slate-200" />
                      </div>

                      <div className="p-5">
                        <div className="rounded-2xl bg-white p-4 shadow-sm">
                          <p className="text-[10px] font-semibold text-slate-400">
                            Safari
                          </p>
                          <p className="mt-3 text-sm font-black text-[var(--pisjo-navy)]">
                            Pisjo Market
                          </p>
                          <div className="mt-4 h-24 rounded-xl bg-[var(--pisjo-gradient)]" />
                          <div className="mt-4 h-2 w-3/4 rounded-full bg-slate-200" />
                          <div className="mt-2 h-2 w-1/2 rounded-full bg-slate-100" />
                        </div>

                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center">
                          <p className="text-xs font-bold text-[var(--pisjo-primary)]">
                            Tambahkan ke Home Screen
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 max-w-2xl">
              {tutorialSection.eyebrow ? (
                <p className="text-sm font-bold text-[var(--pisjo-primary)]">
                  {tutorialSection.eyebrow}
                </p>
              ) : null}

              {tutorialSection.title ? (
                <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--pisjo-navy)] sm:text-4xl">
                  {tutorialSection.title}
                </h2>
              ) : null}

              {tutorialSection.description ? (
                <p className="mt-4 text-base leading-7 text-[var(--pisjo-text-secondary)]">
                  {tutorialSection.description}
                </p>
              ) : null}

              {tutorialSteps.length > 0 ? (
                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {tutorialSteps.map((step, index) => (
                    <div
                      key={`${step.title}-${index}`}
                      className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-sm font-black text-[var(--pisjo-primary)]">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <h3 className="mt-4 break-words text-sm font-black text-[var(--pisjo-navy)]">
                        {step.title}
                      </h3>

                      <p className="mt-2 break-words text-xs leading-5 text-[var(--pisjo-text-secondary)]">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {tutorialSection.infoText ? (
                <div className="mt-6 flex min-w-0 items-start gap-3 rounded-2xl border border-[#0788e8]/10 bg-[#f0faff] p-4 text-sm font-semibold text-[var(--pisjo-navy)]">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-primary)] text-xs font-black text-white">
                    i
                  </div>
                  <span className="min-w-0 break-words">
                    {tutorialSection.infoText}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ====================================================== */}
      {/* APP SHOWCASE                                            */}
      {/* ====================================================== */}

      {app.enabled !== false && (
        <section className="relative overflow-hidden bg-gradient-to-br from-[#e8f8ff] via-[#f5fcff] to-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-[#8cddff]/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 bottom-0 h-72 w-72 rounded-full bg-[#bdefff]/30 blur-3xl"
          />

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div className="max-w-xl">
              {/* Platform badges */}

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {androidAvailable ? (
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--pisjo-primary)]">
                    <Smartphone className="h-5 w-5 shrink-0" />

                    <span>Pisjo Market di Android</span>
                  </span>
                ) : null}

                {iosAvailable ? (
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--pisjo-primary)]">
                    {/* Apple Logo */}
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 fill-current text-[var(--pisjo-primary)]"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.33 4.5-3.74 4.25z" />
                    </svg>

                    <span>Pisjo Market di iOS</span>
                  </span>
                ) : null}

                {!androidAvailable && !iosAvailable ? (
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--pisjo-primary)]">
                    <Smartphone className="h-5 w-5 shrink-0" />

                    <span>Pisjo Market</span>
                  </span>
                ) : null}
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--pisjo-navy)] sm:text-4xl">
                {app.title || "Belanja kapan saja, langsung dari smartphone."}
              </h2>

              <p className="mt-5 text-base leading-7 text-[var(--pisjo-text-secondary)]">
                {app.description ||
                  "Akses Pisjo Market dari perangkat Anda untuk pengalaman belanja yang lebih praktis."}
              </p>

              {/* ================================================== */}
              {/* APP DOWNLOAD BUTTONS                              */}
              {/* ================================================== */}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {/* Android */}
                {androidAvailable && androidUrl ? (
                  <a
                    href={androidUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--pisjo-navy)] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    <Smartphone className="h-5 w-5 shrink-0" />

                    <span>
                      {app.buttonLabel || "Download Aplikasi Android"}
                    </span>

                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </a>
                ) : null}

                {/* iOS / App Store */}
                {iosAvailable && iosUrl ? (
                  <a
                    href={iosUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download Pisjo Market di App Store"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[var(--pisjo-navy)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--pisjo-primary)]/30 hover:bg-[var(--pisjo-soft-blue)]"
                  >
                    {/* Apple Logo */}
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 fill-current text-[var(--pisjo-navy)]"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.33 4.5-3.74 4.25z" />
                    </svg>

                    <span>Download di App Store</span>

                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="relative flex justify-center">
              {appImage ? (
                /* =========================
               APP IMAGE FROM ADMIN
               ========================= */
                <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-white bg-white p-4 shadow-xl sm:p-5">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-slate-50">
                    <Image
                      src={appImage}
                      alt={app.title || `${storeName} App`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 384px"
                    />
                  </div>
                </div>
              ) : (
                /* =========================
               FALLBACK APP MOCKUP
               ========================= */
                <>
                  <div
                    aria-hidden="true"
                    className="absolute h-72 w-72 rounded-full bg-[var(--pisjo-cyan)]/15 blur-3xl"
                  />

                  <div className="relative w-full max-w-sm rounded-[2.5rem] border border-white bg-white p-5 shadow-xl">
                    <div className="rounded-[2rem] bg-[var(--pisjo-gradient)] p-6 text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                          <Store className="h-6 w-6" />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-white/70">
                            Selamat datang di
                          </p>

                          <p className="font-bold">{storeName}</p>
                        </div>
                      </div>

                      <div className="mt-10 rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <p className="text-xs text-white/70">Mulai belanja</p>

                        <p className="mt-1 text-2xl font-black">
                          Seafood favoritmu
                        </p>

                        <div className="mt-5 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-bold text-[var(--pisjo-navy)]">
                          Belanja sekarang
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

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
                    "Kunjungi store Pisjo Market atau akses melalui aplikasi untuk mulai menikmati pengalaman belanja yang lebih praktis."}
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
                  <span>{cta.buttonLabel || "Kunjungi Store"}</span>

                  <ArrowRight className="h-4 w-4 shrink-0" />
                </a>

                {/* Android */}
                {androidAvailable && androidUrl ? (
                  <a
                    href={androidUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <Smartphone className="h-4 w-4 shrink-0" />

                    <span>Download Android</span>
                  </a>
                ) : null}

                {/* iOS */}
                {iosAvailable && iosUrl ? (
                  <a
                    href={iosUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download iOS"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    {/* Apple Logo */}
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 fill-current text-white"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.33 4.5-3.74 4.25z" />
                    </svg>

                    <span>Download iOS</span>
                  </a>
                ) : null}
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
        androidUrl={androidUrl}
        iosUrl={iosUrl}
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
    <div className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f4fbff]">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain p-5 transition duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
            Hadiah
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="line-clamp-2 text-base font-black text-[var(--pisjo-navy)]">
          {name}
        </h3>

        {description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--pisjo-text-secondary)]">
            {description}
          </p>
        ) : null}

        <div className="mt-4 inline-flex items-center rounded-full bg-[#fff4d6] px-3 py-1.5 text-sm font-black text-[#b77900]">
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
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f4fbff]">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain p-2"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] font-semibold text-slate-400">
            Hadiah
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-bold text-[var(--pisjo-navy)]">
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
    <div className="group rounded-2xl border border-[#d7edf7] bg-white/95 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#7ed8f7] hover:shadow-xl hover:shadow-[#0788e8]/10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d9f5ff] to-[#bcecff] text-[#0788e8] transition duration-300 group-hover:scale-105">
        {icon}
      </div>

      <h3 className="mt-5 text-base font-bold text-[var(--pisjo-navy)]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[var(--pisjo-text-secondary)]">
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
