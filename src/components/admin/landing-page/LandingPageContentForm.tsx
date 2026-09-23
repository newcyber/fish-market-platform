"use client";

import Image from "next/image";

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Fish,
  Gift,
  Loader2,
  PackageCheck,
  Plus,
  Save,
  ShoppingBag,
  Smartphone,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import { FormEvent, useState, useTransition } from "react";

import { updateLandingPageAction } from "@/actions/admin/landing-page/update-landing-page";
import type {
  LandingPageBenefit,
  LandingPageConfig,
  LandingPageStep,
} from "@/repositories/landing-page/landing-page.types";

interface LandingPageContentFormProps {
  enabled: boolean;
  config: LandingPageConfig;
}

const MIN_LANDING_PAGE_ITEMS = 3;
const MAX_LANDING_PAGE_ITEMS = 6;

const BENEFIT_ICON_OPTIONS = [
  {
    value: "fish",
    label: "Fish",
    icon: Fish,
  },
  {
    value: "shopping-bag",
    label: "Shopping Bag",
    icon: ShoppingBag,
  },
  {
    value: "smartphone",
    label: "Smartphone",
    icon: Smartphone,
  },
  {
    value: "package-check",
    label: "Package Check",
    icon: PackageCheck,
  },
  {
    value: "truck",
    label: "Truck",
    icon: Truck,
  },
  {
    value: "store",
    label: "Store",
    icon: Store,
  },
] as const;

function getString(value: string | null | undefined, fallback = "") {
  return value ?? fallback;
}

function getNumber(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export default function LandingPageContentForm({
  enabled: initialEnabled,
  config: initialConfig,
}: LandingPageContentFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);

  const hero = initialConfig.hero ?? {};
  const app = initialConfig.app ?? {};
  const cta = initialConfig.cta ?? {};
  const benefitsSection = initialConfig.benefitsSection ?? {};
  const rewardSection = initialConfig.rewardSection ?? {};
  const tutorialSection = initialConfig.tutorialSection ?? {};

  const [heroEyebrow, setHeroEyebrow] = useState(getString(hero.eyebrow));

  const [heroTitle, setHeroTitle] = useState(getString(hero.title));

  const [heroHighlight, setHeroHighlight] = useState(getString(hero.highlight));

  const [heroDescription, setHeroDescription] = useState(
    getString(hero.description),
  );

  const [heroPrimaryButtonLabel, setHeroPrimaryButtonLabel] = useState(
    getString(hero.primaryButtonLabel, "Kunjungi Store"),
  );

  const [heroSecondaryButtonLabel, setHeroSecondaryButtonLabel] = useState(
    getString(hero.secondaryButtonLabel, "Download Android"),
  );

  const [benefitsEyebrow, setBenefitsEyebrow] = useState(
    getString(benefitsSection.eyebrow, "KENAPA PISJO MARKET?"),
  );

  const [benefitsTitle, setBenefitsTitle] = useState(
    getString(benefitsSection.title, "Belanja seafood jadi lebih mudah"),
  );

  const [benefitsDescription, setBenefitsDescription] = useState(
    getString(
      benefitsSection.description,
      "Pilihan ikan dan seafood berkualitas untuk kebutuhan rumah maupun usaha, dengan proses belanja yang praktis.",
    ),
  );

  const [rewardEnabled, setRewardEnabled] = useState(
    rewardSection.enabled !== false,
  );

  const [rewardEyebrow, setRewardEyebrow] = useState(
    getString(rewardSection.eyebrow, "REWARD POINT"),
  );

  const [rewardTitle, setRewardTitle] = useState(
    getString(rewardSection.title, "Hadiah Poin Menarik"),
  );

  const [rewardDescription, setRewardDescription] = useState(
    getString(
      rewardSection.description,
      "Belanja, kumpulkan poin, lalu tukarkan dengan berbagai hadiah menarik dari Pisjo Market.",
    ),
  );

  const [rewardButtonLabel, setRewardButtonLabel] = useState(
    getString(rewardSection.buttonLabel, "Lihat Semua Hadiah"),
  );

  const [rewardButtonHref, setRewardButtonHref] = useState(
    getString(rewardSection.buttonHref, "/customer/rewards"),
  );

  const [rewardFeaturedLimit, setRewardFeaturedLimit] = useState(
    getNumber(rewardSection.featuredLimit, 3),
  );

  const [rewardCompactLimit, setRewardCompactLimit] = useState(
    getNumber(rewardSection.compactLimit, 10),
  );

  const [tutorialEnabled, setTutorialEnabled] = useState(
    tutorialSection.enabled !== false,
  );

  const [tutorialEyebrow, setTutorialEyebrow] = useState(
    getString(tutorialSection.eyebrow, "PANDUAN INSTALASI"),
  );

  const [tutorialTitle, setTutorialTitle] = useState(
    getString(tutorialSection.title, "Cara Pasang PISJO di iPhone"),
  );

  const [tutorialDescription, setTutorialDescription] = useState(
    getString(
      tutorialSection.description,
      "Cukup buka PISJO Market di Safari, lalu simpan ke Home Screen seperti aplikasi.",
    ),
  );

  const [tutorialInfoText, setTutorialInfoText] = useState(
    getString(tutorialSection.infoText, "Tidak perlu App Store"),
  );

  const [tutorialImage, setTutorialImage] = useState<File | null>(null);

  const [tutorialStep1Title, setTutorialStep1Title] = useState(
    getString(tutorialSection.steps?.[0]?.title, "Buka di Safari"),
  );

  const [tutorialStep1Description, setTutorialStep1Description] = useState(
    getString(
      tutorialSection.steps?.[0]?.description,
      "Akses app.pusatikansegar.com melalui Safari di iPhone.",
    ),
  );

  const [tutorialStep2Title, setTutorialStep2Title] = useState(
    getString(tutorialSection.steps?.[1]?.title, "Tap Share"),
  );

  const [tutorialStep2Description, setTutorialStep2Description] = useState(
    getString(
      tutorialSection.steps?.[1]?.description,
      "Tekan ikon Share pada Safari.",
    ),
  );

  const [tutorialStep3Title, setTutorialStep3Title] = useState(
    getString(tutorialSection.steps?.[2]?.title, "Add to Home Screen"),
  );

  const [tutorialStep3Description, setTutorialStep3Description] = useState(
    getString(
      tutorialSection.steps?.[2]?.description,
      'Pilih "Add to Home Screen" agar PISJO tampil seperti aplikasi.',
    ),
  );

  const [appEnabled, setAppEnabled] = useState(app.enabled !== false);

  const [appTitle, setAppTitle] = useState(getString(app.title));

  const [appDescription, setAppDescription] = useState(
    getString(app.description),
  );

  const [appButtonLabel, setAppButtonLabel] = useState(
    getString(app.buttonLabel, "Download Aplikasi Android"),
  );

  const [ctaEyebrow, setCtaEyebrow] = useState(
    getString(cta.eyebrow, "SIAP BELANJA?"),
  );

  const [ctaTitle, setCtaTitle] = useState(
    getString(cta.title, "Yuk, mulai belanja di Pisjo Market."),
  );

  const [ctaDescription, setCtaDescription] = useState(
    getString(
      cta.description,
      "Kunjungi store Pisjo Market atau akses dari perangkat Android untuk mulai menikmati pengalaman belanja yang lebih praktis.",
    ),
  );

  const [ctaButtonLabel, setCtaButtonLabel] = useState(
    getString(cta.buttonLabel, "Kunjungi Store"),
  );

  const [benefits, setBenefits] = useState<LandingPageBenefit[]>(
    initialConfig.benefits ?? [],
  );

  const [steps, setSteps] = useState<LandingPageStep[]>(
    initialConfig.steps ?? [],
  );

  const [message, setMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const updateBenefit = (
    index: number,
    field: "title" | "description" | "icon",
    value: string,
  ) => {
    setBenefits((current) =>
      current.map((benefit, itemIndex) =>
        itemIndex === index
          ? {
              ...benefit,
              [field]: value,
            }
          : benefit,
      ),
    );
  };

  const addBenefit = () => {
    if (benefits.length >= MAX_LANDING_PAGE_ITEMS) {
      return;
    }

    setBenefits((current) => [
      ...current,
      {
        title: "",
        description: "",
        icon: "fish",
      },
    ]);
  };

  const removeBenefit = (index: number) => {
    if (benefits.length <= MIN_LANDING_PAGE_ITEMS) {
      return;
    }

    setBenefits((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const updateStep = (
    index: number,
    field: "title" | "description",
    value: string,
  ) => {
    setSteps((current) =>
      current.map((step, itemIndex) =>
        itemIndex === index
          ? {
              ...step,
              [field]: value,
            }
          : step,
      ),
    );
  };

  const addStep = () => {
    if (steps.length >= MAX_LANDING_PAGE_ITEMS) {
      return;
    }

    const nextNumber =
      steps.length > 0 ? Math.max(...steps.map((step) => step.number)) + 1 : 1;

    setSteps((current) => [
      ...current,
      {
        number: nextNumber,
        title: "",
        description: "",
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= MIN_LANDING_PAGE_ITEMS) {
      return;
    }

    setSteps((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((step, itemIndex) => ({
          ...step,
          number: itemIndex + 1,
        })),
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await updateLandingPageAction({
        enabled,

        /**
         * ==================================================
         * TUTORIAL IMAGE UPLOAD
         * ==================================================
         *
         * File dikirim sebagai property action,
         * bukan dimasukkan ke dalam config JSON.
         *
         * Action akan:
         * 1. Upload file ke StorageService
         * 2. Mendapatkan URL/path gambar
         * 3. Menyimpan URL tersebut ke tutorialSection.image
         */
        tutorialImage,

        config: {
          ...initialConfig,

          /**
           * ==================================================
           * HERO
           * ==================================================
           */
          hero: {
            ...hero,
            eyebrow: heroEyebrow,
            title: heroTitle,
            highlight: heroHighlight,
            description: heroDescription,
            primaryButtonLabel: heroPrimaryButtonLabel,
            secondaryButtonLabel: heroSecondaryButtonLabel,
          },

          /**
           * ==================================================
           * BENEFITS SECTION
           * ==================================================
           */
          benefitsSection: {
            ...benefitsSection,
            eyebrow: benefitsEyebrow,
            title: benefitsTitle,
            description: benefitsDescription,
          },

          benefits,

          /**
           * ==================================================
           * REWARD POINT SECTION
           * ==================================================
           */
          rewardSection: {
            ...rewardSection,
            enabled: rewardEnabled,
            eyebrow: rewardEyebrow,
            title: rewardTitle,
            description: rewardDescription,
            buttonLabel: rewardButtonLabel,
            buttonHref: rewardButtonHref,

            featuredLimit: Math.max(
              1,
              Math.min(Math.round(rewardFeaturedLimit), 10),
            ),

            compactLimit: Math.max(
              0,
              Math.min(Math.round(rewardCompactLimit), 20),
            ),
          },

          /**
           * ==================================================
           * TUTORIAL INSTALASI
           * ==================================================
           */
          tutorialSection: {
            ...tutorialSection,

            enabled: tutorialEnabled,

            eyebrow: tutorialEyebrow,

            title: tutorialTitle,

            description: tutorialDescription,

            /**
             * Jika tidak ada upload baru,
             * pertahankan gambar lama.
             *
             * Jika ada upload baru,
             * update-landing-page.ts akan mengganti
             * value ini dengan hasil StorageService.
             */
            image: tutorialSection.image ?? null,

            steps: [
              {
                title: tutorialStep1Title,
                description: tutorialStep1Description,
              },

              {
                title: tutorialStep2Title,
                description: tutorialStep2Description,
              },

              {
                title: tutorialStep3Title,
                description: tutorialStep3Description,
              },
            ],

            infoText: tutorialInfoText,
          },

          /**
           * ==================================================
           * APP SHOWCASE
           * ==================================================
           */
          app: {
            ...app,
            enabled: appEnabled,
            title: appTitle,
            description: appDescription,
            buttonLabel: appButtonLabel,
          },

          /**
           * ==================================================
           * HOW IT WORKS / STEPS
           * ==================================================
           */
          steps,

          /**
           * ==================================================
           * FINAL CTA
           * ==================================================
           */
          cta: {
            ...cta,
            eyebrow: ctaEyebrow,
            title: ctaTitle,
            description: ctaDescription,
            buttonLabel: ctaButtonLabel,
          },
        },
      });

      /**
       * ======================================================
       * RESULT
       * ======================================================
       */
      if (result.success) {
        setMessage(result.message);

        /**
         * Reset file input state setelah upload berhasil.
         */
        setTutorialImage(null);

        return;
      }

      setError(result.message);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STATUS */}

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Eye className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Status Landing Page</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Tentukan apakah Landing Page publik dapat ditampilkan.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <p className="text-sm font-medium">Aktifkan Landing Page</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Jika dinonaktifkan, halaman marketing tidak dianggap aktif.
              </p>
            </div>

            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>
        </div>
      </section>

      {/* HERO */}

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Hero Section</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Konten utama yang pertama kali dilihat pengunjung.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Eyebrow"
              value={heroEyebrow}
              onChange={setHeroEyebrow}
              placeholder="Belanja seafood jadi lebih mudah"
            />

            <Field
              label="Title"
              value={heroTitle}
              onChange={setHeroTitle}
              placeholder="Seafood pilihan,"
            />
          </div>

          <Field
            label="Highlight"
            value={heroHighlight}
            onChange={setHeroHighlight}
            placeholder="langsung lebih mudah."
          />

          <TextareaField
            label="Description"
            value={heroDescription}
            onChange={setHeroDescription}
            rows={4}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Primary Button"
              value={heroPrimaryButtonLabel}
              onChange={setHeroPrimaryButtonLabel}
            />

            <Field
              label="Android Button"
              value={heroSecondaryButtonLabel}
              onChange={setHeroSecondaryButtonLabel}
            />
          </div>
        </div>
      </section>

      {/* BENEFITS HEADER */}

      <div className="grid gap-5 border-b p-6">
        <div>
          <p className="text-sm font-semibold">Header Section</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Judul dan pengantar yang tampil sebelum daftar benefit pada Landing
            Page.
          </p>
        </div>

        <Field
          label="Eyebrow"
          value={benefitsEyebrow}
          onChange={setBenefitsEyebrow}
          placeholder="KENAPA PISJO MARKET?"
        />

        <Field
          label="Title"
          value={benefitsTitle}
          onChange={setBenefitsTitle}
          placeholder="Belanja seafood jadi lebih mudah"
        />

        <TextareaField
          label="Description"
          value={benefitsDescription}
          onChange={setBenefitsDescription}
          rows={3}
        />
      </div>

      {/* BENEFITS */}

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Benefits</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Alasan utama pelanggan memilih Pisjo Market. Kelola 3 sampai 6
                benefit.
              </p>
            </div>

            <button
              type="button"
              onClick={addBenefit}
              disabled={benefits.length >= MAX_LANDING_PAGE_ITEMS}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Tambah Benefit
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-6">
          {benefits.map((benefit, index) => (
            <div key={`benefit-${index}`} className="rounded-xl border p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Benefit {index + 1}
                </p>

                <button
                  type="button"
                  onClick={() => removeBenefit(index)}
                  disabled={benefits.length <= MIN_LANDING_PAGE_ITEMS}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                  title={
                    benefits.length <= MIN_LANDING_PAGE_ITEMS
                      ? "Minimal 3 benefit"
                      : "Hapus benefit"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </button>
              </div>

              <div className="grid gap-5">
                <Field
                  label="Title"
                  value={benefit.title}
                  onChange={(value) => updateBenefit(index, "title", value)}
                />

                <TextareaField
                  label="Description"
                  value={benefit.description}
                  onChange={(value) =>
                    updateBenefit(index, "description", value)
                  }
                  rows={3}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon</label>

                  <select
                    value={benefit.icon ?? "fish"}
                    onChange={(event) =>
                      updateBenefit(index, "icon", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    {BENEFIT_ICON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {benefits.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada benefit.
              </p>

              <button
                type="button"
                onClick={addBenefit}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Tambah Benefit
              </button>
            </div>
          )}
        </div>
      </section>

      {/* REWARD POINT */}

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gift className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Reward Point</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Atur section hadiah poin yang ditampilkan pada Landing Page.
                Data hadiah diambil otomatis dari Reward Catalog yang aktif dan
                masih memiliki stok.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <p className="text-sm font-medium">Tampilkan Reward Point</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Jika dinonaktifkan, section hadiah poin tidak ditampilkan pada
                Landing Page.
              </p>
            </div>

            <input
              type="checkbox"
              checked={rewardEnabled}
              onChange={(event) => setRewardEnabled(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Eyebrow"
              value={rewardEyebrow}
              onChange={setRewardEyebrow}
              placeholder="REWARD POINT"
            />

            <Field
              label="Title"
              value={rewardTitle}
              onChange={setRewardTitle}
              placeholder="Hadiah Poin Menarik"
            />
          </div>

          <TextareaField
            label="Description"
            value={rewardDescription}
            onChange={setRewardDescription}
            rows={4}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Button Label"
              value={rewardButtonLabel}
              onChange={setRewardButtonLabel}
              placeholder="Lihat Semua Hadiah"
            />

            <Field
              label="Button URL"
              value={rewardButtonHref}
              onChange={setRewardButtonHref}
              placeholder="/customer/rewards"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <NumberField
              label="Featured Rewards"
              value={rewardFeaturedLimit}
              min={1}
              max={10}
              onChange={setRewardFeaturedLimit}
              description="Jumlah hadiah besar yang ditampilkan pada bagian featured."
            />

            <NumberField
              label="Compact Rewards"
              value={rewardCompactLimit}
              min={0}
              max={20}
              onChange={setRewardCompactLimit}
              description="Jumlah hadiah compact tambahan yang ditampilkan setelah featured."
            />
          </div>

          <div className="rounded-xl border border-dashed bg-muted/30 p-4">
            <p className="text-sm font-semibold">Sumber Data Reward</p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Landing Page tidak perlu mengatur nama, gambar, harga poin, atau
              stok hadiah secara manual. Semua data akan mengikuti Reward
              Catalog di Admin. Hanya reward yang aktif dan memiliki stok yang
              akan ditampilkan.
            </p>
          </div>
        </div>
      </section>

      {/* TUTORIAL INSTALASI */}

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Tutorial Instalasi iPhone
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Atur panduan pemasangan PISJO ke Home Screen iPhone.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <p className="text-sm font-medium">
                Tampilkan Tutorial Instalasi
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Jika dinonaktifkan, section tutorial tidak ditampilkan.
              </p>
            </div>
            <input
              type="checkbox"
              checked={tutorialEnabled}
              onChange={(event) => setTutorialEnabled(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Eyebrow"
              value={tutorialEyebrow}
              onChange={setTutorialEyebrow}
              placeholder="PANDUAN INSTALASI"
            />
            <Field
              label="Title"
              value={tutorialTitle}
              onChange={setTutorialTitle}
              placeholder="Cara Pasang PISJO di iPhone"
            />
          </div>

          <TextareaField
            label="Description"
            value={tutorialDescription}
            onChange={setTutorialDescription}
            rows={3}
          />

          <div className="space-y-3 rounded-xl border p-4">
            <div>
              <p className="text-sm font-medium">Gambar Tutorial</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Upload screenshot atau mockup iPhone. File disimpan melalui
                Storage Service Landing Page.
              </p>
            </div>

            {tutorialSection.image ? (
              <div className="overflow-hidden rounded-xl border bg-muted/30 p-2">
                <div className="relative h-64 w-full">
                  <Image
                    src={tutorialSection.image}
                    alt="Gambar tutorial saat ini"
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="rounded-lg object-contain"
                    unoptimized
                  />
                </div>
              </div>
            ) : null}

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={(event) =>
                setTutorialImage(event.target.files?.[0] ?? null)
              }
              className="block w-full rounded-xl border bg-background p-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
            />

            {tutorialImage ? (
              <p className="text-xs font-medium text-primary">
                File baru: {tutorialImage.name}
              </p>
            ) : null}
          </div>

          <div className="grid gap-5">
            {[
              {
                number: 1,
                title: tutorialStep1Title,
                description: tutorialStep1Description,
                setTitle: setTutorialStep1Title,
                setDescription: setTutorialStep1Description,
                titlePlaceholder: "Buka di Safari",
              },
              {
                number: 2,
                title: tutorialStep2Title,
                description: tutorialStep2Description,
                setTitle: setTutorialStep2Title,
                setDescription: setTutorialStep2Description,
                titlePlaceholder: "Tap Share",
              },
              {
                number: 3,
                title: tutorialStep3Title,
                description: tutorialStep3Description,
                setTitle: setTutorialStep3Title,
                setDescription: setTutorialStep3Description,
                titlePlaceholder: "Add to Home Screen",
              },
            ].map((step) => (
              <div key={step.number} className="rounded-xl border p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {step.number}
                </p>
                <div className="grid gap-5">
                  <Field
                    label="Title"
                    value={step.title}
                    onChange={step.setTitle}
                    placeholder={step.titlePlaceholder}
                  />
                  <TextareaField
                    label="Description"
                    value={step.description}
                    onChange={step.setDescription}
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>

          <Field
            label="Info Text"
            value={tutorialInfoText}
            onChange={setTutorialInfoText}
            placeholder="Tidak perlu App Store"
          />
        </div>
      </section>

      {/* APP */}

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Android App Showcase</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Konten promosi aplikasi Android.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <p className="text-sm font-medium">Tampilkan App Showcase</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Section dapat dinonaktifkan tanpa menghapus kontennya.
              </p>
            </div>

            <input
              type="checkbox"
              checked={appEnabled}
              onChange={(event) => setAppEnabled(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>

          <Field label="Title" value={appTitle} onChange={setAppTitle} />

          <TextareaField
            label="Description"
            value={appDescription}
            onChange={setAppDescription}
            rows={4}
          />

          <Field
            label="Button Label"
            value={appButtonLabel}
            onChange={setAppButtonLabel}
          />
        </div>
      </section>

      {/* STEPS */}

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Cara Belanja</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Langkah yang ditampilkan pada Landing Page. Kelola 3 sampai 6
                langkah.
              </p>
            </div>

            <button
              type="button"
              onClick={addStep}
              disabled={steps.length >= MAX_LANDING_PAGE_ITEMS}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Tambah Langkah
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-6">
          {steps.map((step, index) => (
            <div key={`step-${index}`} className="rounded-xl border p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Langkah {index + 1}
                </p>

                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  disabled={steps.length <= MIN_LANDING_PAGE_ITEMS}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                  title={
                    steps.length <= MIN_LANDING_PAGE_ITEMS
                      ? "Minimal 3 langkah"
                      : "Hapus langkah"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </button>
              </div>

              <div className="grid gap-5">
                <Field
                  label="Title"
                  value={step.title}
                  onChange={(value) => updateStep(index, "title", value)}
                />

                <TextareaField
                  label="Description"
                  value={step.description}
                  onChange={(value) => updateStep(index, "description", value)}
                  rows={3}
                />
              </div>
            </div>
          ))}

          {steps.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada langkah.
              </p>

              <button
                type="button"
                onClick={addStep}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Tambah Langkah
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">Final CTA</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Ajakan terakhir sebelum pengunjung meninggalkan Landing Page.
          </p>
        </div>

        <div className="grid gap-6 p-6">
          <Field label="Eyebrow" value={ctaEyebrow} onChange={setCtaEyebrow} />

          <Field label="Title" value={ctaTitle} onChange={setCtaTitle} />

          <TextareaField
            label="Description"
            value={ctaDescription}
            onChange={setCtaDescription}
            rows={4}
          />

          <Field
            label="Button Label"
            value={ctaButtonLabel}
            onChange={setCtaButtonLabel}
          />
        </div>
      </section>

      {/* ACTION */}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  description,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => {
          const parsedValue = Number(event.target.value);

          if (Number.isFinite(parsedValue)) {
            onChange(parsedValue);
          }
        }}
        className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
      />

      {description && (
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-xl border bg-background px-3 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );
}
