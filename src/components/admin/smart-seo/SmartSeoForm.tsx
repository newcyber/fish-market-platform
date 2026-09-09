"use client";

import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  Link2,
  Loader2,
  Search,
  Save,
  Sparkles,
} from "lucide-react";
import { FormEvent, useState, useTransition } from "react";

import {
  updateSeoSettingsAction,
} from "@/actions/admin/settings/update-seo-settings";

interface SmartSeoFormProps {
  settings: {
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    seoCanonicalUrl: string | null;
    seoOgTitle: string | null;
    seoOgDescription: string | null;
    seoOgImage: string | null;
    seoTwitterCard: string;
    seoRobotsIndex: boolean;
    seoRobotsFollow: boolean;
    seoGoogleVerification: string | null;
    seoAiEnabled: boolean;
  };
}

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 160;

function getInputValue(value: string | null): string {
  return value ?? "";
}

export default function SmartSeoForm({
  settings,
}: SmartSeoFormProps) {
  const [seoTitle, setSeoTitle] = useState(
    getInputValue(settings.seoTitle),
  );

  const [seoDescription, setSeoDescription] =
    useState(
      getInputValue(settings.seoDescription),
    );

  const [seoKeywords, setSeoKeywords] =
    useState(
      getInputValue(settings.seoKeywords),
    );

  const [seoCanonicalUrl, setSeoCanonicalUrl] =
    useState(
      getInputValue(settings.seoCanonicalUrl),
    );

  const [seoOgTitle, setSeoOgTitle] = useState(
    getInputValue(settings.seoOgTitle),
  );

  const [seoOgDescription, setSeoOgDescription] =
    useState(
      getInputValue(settings.seoOgDescription),
    );

  const [seoOgImage, setSeoOgImage] = useState(
    getInputValue(settings.seoOgImage),
  );

  const [seoTwitterCard, setSeoTwitterCard] =
    useState(
      settings.seoTwitterCard ||
        "summary_large_image",
    );

  const [seoRobotsIndex, setSeoRobotsIndex] =
    useState(settings.seoRobotsIndex);

  const [seoRobotsFollow, setSeoRobotsFollow] =
    useState(settings.seoRobotsFollow);

  const [
    seoGoogleVerification,
    setSeoGoogleVerification,
  ] = useState(
    getInputValue(
      settings.seoGoogleVerification,
    ),
  );

  const [seoAiEnabled, setSeoAiEnabled] =
    useState(settings.seoAiEnabled);

  const [message, setMessage] = useState<
    string | null
  >(null);

  const [error, setError] = useState<
    string | null
  >(null);

  const [isPending, startTransition] =
    useTransition();

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result =
        await updateSeoSettingsAction({
          seoTitle,
          seoDescription,
          seoKeywords,
          seoCanonicalUrl,
          seoOgTitle,
          seoOgDescription,
          seoOgImage,
          seoTwitterCard,
          seoRobotsIndex,
          seoRobotsFollow,
          seoGoogleVerification,
          seoAiEnabled,
        });

      if (result.success) {
        setMessage(result.message);
        return;
      }

      setError(result.message);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* GLOBAL SEO */}
      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Search className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Global SEO
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Metadata utama yang digunakan mesin
                pencari untuk memahami website Pisjo
                Market.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="seoTitle"
                className="text-sm font-medium"
              >
                SEO Title
              </label>

              <span
                className={`text-xs ${
                  seoTitle.length >
                  TITLE_MAX_LENGTH
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {seoTitle.length}/
                {TITLE_MAX_LENGTH}
              </span>
            </div>

            <input
              id="seoTitle"
              value={seoTitle}
              onChange={(event) =>
                setSeoTitle(event.target.value)
              }
              maxLength={TITLE_MAX_LENGTH}
              placeholder="Pisjo Market — Ikan Segar & Seafood"
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <p className="text-xs text-muted-foreground">
              Gunakan judul yang jelas, relevan, dan
              mengandung topik utama website.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="seoDescription"
                className="text-sm font-medium"
              >
                Meta Description
              </label>

              <span
                className={`text-xs ${
                  seoDescription.length >
                  DESCRIPTION_MAX_LENGTH
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {seoDescription.length}/
                {DESCRIPTION_MAX_LENGTH}
              </span>
            </div>

            <textarea
              id="seoDescription"
              value={seoDescription}
              onChange={(event) =>
                setSeoDescription(
                  event.target.value,
                )
              }
              maxLength={DESCRIPTION_MAX_LENGTH}
              rows={4}
              placeholder="Belanja ikan segar, seafood, frozen food..."
              className="w-full resize-y rounded-xl border bg-background px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <p className="text-xs text-muted-foreground">
              Buat deskripsi yang menjelaskan nilai
              website dan mendorong pengguna membuka
              halaman.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="seoKeywords"
              className="text-sm font-medium"
            >
              Keywords
            </label>

            <textarea
              id="seoKeywords"
              value={seoKeywords}
              onChange={(event) =>
                setSeoKeywords(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="ikan segar, seafood, frozen food, ikan online"
              className="w-full resize-y rounded-xl border bg-background px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <p className="text-xs text-muted-foreground">
              Pisahkan keyword dengan koma. Gunakan
              keyword yang benar-benar relevan dengan
              bisnis.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="seoCanonicalUrl"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Link2 className="h-4 w-4" />
              Canonical URL
            </label>

            <input
              id="seoCanonicalUrl"
              type="url"
              value={seoCanonicalUrl}
              onChange={(event) =>
                setSeoCanonicalUrl(
                  event.target.value,
                )
              }
              placeholder="https://app.pusatikansegar.com"
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <p className="text-xs text-muted-foreground">
              URL canonical utama website.
            </p>
          </div>
        </div>
      </section>

      {/* SEARCH ENGINE */}
      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Search Engine
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Atur bagaimana crawler mesin pencari
                memperlakukan website.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-4">
            <input
              type="checkbox"
              checked={seoRobotsIndex}
              onChange={(event) =>
                setSeoRobotsIndex(
                  event.target.checked,
                )
              }
              className="mt-1 h-4 w-4 rounded"
            />

            <span>
              <span className="block text-sm font-medium">
                Allow Index
              </span>

              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Izinkan search engine mengindeks
                halaman website.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-4">
            <input
              type="checkbox"
              checked={seoRobotsFollow}
              onChange={(event) =>
                setSeoRobotsFollow(
                  event.target.checked,
                )
              }
              className="mt-1 h-4 w-4 rounded"
            />

            <span>
              <span className="block text-sm font-medium">
                Allow Follow
              </span>

              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Izinkan crawler mengikuti link pada
                halaman.
              </span>
            </span>
          </label>

          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="seoGoogleVerification"
              className="text-sm font-medium"
            >
              Google Search Console Verification
            </label>

            <input
              id="seoGoogleVerification"
              value={seoGoogleVerification}
              onChange={(event) =>
                setSeoGoogleVerification(
                  event.target.value,
                )
              }
              placeholder="Kode verification Google"
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <p className="text-xs text-muted-foreground">
              Masukkan nilai content dari meta tag
              Google site verification.
            </p>
          </div>
        </div>
      </section>

      {/* SOCIAL SHARING */}
      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Social Sharing
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Metadata yang digunakan ketika halaman
                dibagikan ke media sosial.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6">
          <div className="space-y-2">
            <label
              htmlFor="seoOgTitle"
              className="text-sm font-medium"
            >
              Open Graph Title
            </label>

            <input
              id="seoOgTitle"
              value={seoOgTitle}
              onChange={(event) =>
                setSeoOgTitle(event.target.value)
              }
              placeholder="Judul saat dibagikan"
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="seoOgDescription"
              className="text-sm font-medium"
            >
              Open Graph Description
            </label>

            <textarea
              id="seoOgDescription"
              value={seoOgDescription}
              onChange={(event) =>
                setSeoOgDescription(
                  event.target.value,
                )
              }
              rows={4}
              placeholder="Deskripsi saat halaman dibagikan"
              className="w-full resize-y rounded-xl border bg-background px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="seoOgImage"
              className="text-sm font-medium"
            >
              Open Graph Image
            </label>

            <input
              id="seoOgImage"
              type="url"
              value={seoOgImage}
              onChange={(event) =>
                setSeoOgImage(event.target.value)
              }
              placeholder="https://..."
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <p className="text-xs text-muted-foreground">
              URL gambar yang digunakan sebagai preview
              social sharing.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="seoTwitterCard"
              className="text-sm font-medium"
            >
              Twitter Card
            </label>

            <select
              id="seoTwitterCard"
              value={seoTwitterCard}
              onChange={(event) =>
                setSeoTwitterCard(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="summary_large_image">
                Summary Large Image
              </option>

              <option value="summary">
                Summary
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* AI SEO */}
      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                AI SEO
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Aktifkan fondasi AI SEO untuk rekomendasi
                dan analisis metadata di tahap berikutnya.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-4">
            <input
              type="checkbox"
              checked={seoAiEnabled}
              onChange={(event) =>
                setSeoAiEnabled(
                  event.target.checked,
                )
              }
              className="mt-1 h-4 w-4 rounded"
            />

            <span>
              <span className="block text-sm font-medium">
                Aktifkan AI SEO
              </span>

              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                AI nantinya memberikan saran SEO,
                analisis, dan kandidat metadata. AI tidak
                akan mengubah data produksi secara otomatis.
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* FEEDBACK */}
      {message ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <p>{message}</p>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <p>{error}</p>
        </div>
      ) : null}

      {/* SAVE */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {isPending
            ? "Menyimpan..."
            : "Simpan Pengaturan SEO"}
        </button>
      </div>
    </form>
  );
}
