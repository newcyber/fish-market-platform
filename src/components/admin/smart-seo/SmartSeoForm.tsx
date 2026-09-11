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
import {
  FormEvent,
  useState,
  useTransition,
} from "react";

import {
  updateSeoSettingsAction,
} from "@/actions/admin/settings/update-seo-settings";

import {
  analyzeProductSeoAction,
} from "@/actions/admin/seo/analyze-product-seo";

import {
  generateProductSeoRecommendationAction,
} from "@/actions/admin/seo/generate-product-seo-recommendation";

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

  products: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 160;

function getInputValue(
  value: string | null,
): string {
  return value ?? "";
}

export default function SmartSeoForm({
  settings,
  products,
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

  const [
    seoOgDescription,
    setSeoOgDescription,
  ] = useState(
    getInputValue(settings.seoOgDescription),
  );

  const [seoOgImage, setSeoOgImage] = useState(
    getInputValue(settings.seoOgImage),
  );

  const [
    seoTwitterCard,
    setSeoTwitterCard,
  ] = useState(
    settings.seoTwitterCard ||
      "summary_large_image",
  );

  const [
    seoRobotsIndex,
    setSeoRobotsIndex,
  ] = useState(
    settings.seoRobotsIndex,
  );

  const [
    seoRobotsFollow,
    setSeoRobotsFollow,
  ] = useState(
    settings.seoRobotsFollow,
  );

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

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");

  const [
    analysisResult,
    setAnalysisResult,
  ] = useState<
    Awaited<
      ReturnType<
        typeof analyzeProductSeoAction
      >
    >["data"]
  >(null);

  const [
    analysisMessage,
    setAnalysisMessage,
  ] = useState<string | null>(null);

  const [
    analysisError,
    setAnalysisError,
  ] = useState<string | null>(null);

  const [
    isAnalyzing,
    startAnalysisTransition,
  ] = useTransition();

  const [
  aiRecommendation,
  setAiRecommendation,
] = useState<
  Awaited<
    ReturnType<
      typeof generateProductSeoRecommendationAction
    >
  >["data"] | null
>(null);

  const [
    aiRecommendationMessage,
    setAiRecommendationMessage,
  ] = useState<string | null>(null);

  const [
    aiRecommendationError,
    setAiRecommendationError,
  ] = useState<string | null>(null);

  const [
    isGeneratingAiRecommendation,
    startAiRecommendationTransition,
  ] = useTransition();

  const [
    message,
    setMessage,
  ] = useState<string | null>(null);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const analysisIssues =
    analysisResult?.analysis.issues ?? [];

  const analysisCounts = {
    error: analysisIssues.filter(
      (issue) =>
        issue.severity === "error",
    ).length,

    warning: analysisIssues.filter(
      (issue) =>
        issue.severity === "warning",
    ).length,

    success: analysisIssues.filter(
      (issue) =>
        issue.severity === "success",
    ).length,

    info: analysisIssues.filter(
      (issue) =>
        issue.severity === "info",
    ).length,
  };

  const analysisScore =
    analysisResult?.analysis.score ?? 0;

  const analysisScoreLabel =
    analysisScore >= 90
      ? "Sangat Baik"
      : analysisScore >= 75
        ? "Baik"
        : analysisScore >= 60
          ? "Perlu Optimasi"
          : "Perlu Perbaikan";

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

  const handleAnalyzeProduct = () => {
    setAnalysisMessage(null);
    setAnalysisError(null);
    setAnalysisResult(null);

    setAiRecommendationMessage(null);
    setAiRecommendationError(null);
    setAiRecommendation(null);

    if (!selectedProductId) {
      setAnalysisError(
        "Pilih produk terlebih dahulu.",
      );
      return;
    }

    startAnalysisTransition(async () => {
      const result =
        await analyzeProductSeoAction(
          selectedProductId,
        );

      if (result.success) {
        setAnalysisResult(
          result.data,
        );

        setAnalysisMessage(
          result.message,
        );

        return;
      }

      setAnalysisError(
        result.message,
      );
    });
  };

  const handleGenerateAiRecommendation =
    () => {
      setAiRecommendationMessage(null);
      setAiRecommendationError(null);
      setAiRecommendation(null);

      if (!selectedProductId) {
        setAiRecommendationError(
          "Pilih produk terlebih dahulu.",
        );
        return;
      }

      if (!seoAiEnabled) {
        setAiRecommendationError(
          "AI SEO sedang dinonaktifkan. Aktifkan AI SEO terlebih dahulu.",
        );
        return;
      }

      startAiRecommendationTransition(
        async () => {
          const result =
            await generateProductSeoRecommendationAction(
              selectedProductId,
            );

          if (result.success) {
            setAiRecommendation(
              result.data,
            );

            setAiRecommendationMessage(
              result.message,
            );

            return;
          }

          setAiRecommendationError(
            result.message,
          );
        },
      );
    };

  const handleProductChange = (
    productId: string,
  ) => {
    setSelectedProductId(productId);

    setAnalysisResult(null);
    setAnalysisMessage(null);
    setAnalysisError(null);

    setAiRecommendation(null);
    setAiRecommendationMessage(null);
    setAiRecommendationError(null);
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
                Metadata utama yang digunakan
                mesin pencari untuk memahami
                website Pisjo Market.
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
                setSeoTitle(
                  event.target.value,
                )
              }
              maxLength={TITLE_MAX_LENGTH}
              placeholder="Pisjo Market — Ikan Segar & Seafood"
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <p className="text-xs text-muted-foreground">
              Gunakan judul yang jelas, relevan,
              dan mengandung topik utama
              website.
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
              maxLength={
                DESCRIPTION_MAX_LENGTH
              }
              rows={4}
              placeholder="Belanja ikan segar, seafood, frozen food..."
              className="w-full resize-y rounded-xl border bg-background px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <p className="text-xs text-muted-foreground">
              Buat deskripsi yang menjelaskan
              nilai website dan mendorong
              pengguna membuka halaman.
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
              Pisahkan keyword dengan koma.
              Gunakan keyword yang benar-benar
              relevan dengan bisnis.
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
                Atur bagaimana crawler mesin
                pencari memperlakukan website.
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
                Izinkan search engine
                mengindeks halaman website.
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
                Izinkan crawler mengikuti
                link pada halaman.
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
              Masukkan nilai content dari meta
              tag Google site verification.
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
                Metadata yang digunakan ketika
                halaman dibagikan ke media
                sosial.
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
                setSeoOgTitle(
                  event.target.value,
                )
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
                setSeoOgImage(
                  event.target.value,
                )
              }
              placeholder="https://..."
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <p className="text-xs text-muted-foreground">
              URL gambar yang digunakan sebagai
              preview social sharing.
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
                Aktifkan fondasi AI SEO untuk
                rekomendasi dan analisis
                metadata.
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
                AI memberikan saran SEO, analisis,
                dan kandidat metadata. AI tidak
                akan mengubah data produksi secara
                otomatis.
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* PRODUCT SEO ANALYZER */}
      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Product SEO Analyzer
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Analisis kualitas SEO produk
                berdasarkan metadata dan content
                yang tersedia.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* PRODUCT SELECT */}
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <label
                htmlFor="seoProduct"
                className="text-sm font-medium"
              >
                Pilih Produk
              </label>

              <select
                id="seoProduct"
                value={selectedProductId}
                onChange={(event) =>
                  handleProductChange(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">
                  Pilih produk untuk dianalisis
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name}
                  </option>
                ))}
              </select>

              <p className="text-xs text-muted-foreground">
                Hanya produk yang sudah
                dipublish yang ditampilkan.
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row lg:items-end">
              <button
                type="button"
                onClick={
                  handleAnalyzeProduct
                }
                disabled={
                  isAnalyzing ||
                  isGeneratingAiRecommendation ||
                  !selectedProductId
                }
                className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}

                {isAnalyzing
                  ? "Menganalisis..."
                  : "Analisis SEO"}
              </button>

              <button
                type="button"
                onClick={
                  handleGenerateAiRecommendation
                }
                disabled={
                  isGeneratingAiRecommendation ||
                  isAnalyzing ||
                  !selectedProductId ||
                  !seoAiEnabled
                }
                className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border border-primary bg-background px-5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingAiRecommendation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}

                {isGeneratingAiRecommendation
                  ? "Generating..."
                  : "Generate AI Recommendation"}
              </button>
            </div>
          </div>

          {/* ANALYSIS FEEDBACK */}
          {analysisMessage ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <p>{analysisMessage}</p>
            </div>
          ) : null}

          {analysisError ? (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <p>{analysisError}</p>
            </div>
          ) : null}

          {/* AI FEEDBACK */}
          {aiRecommendationMessage ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <p>
                {aiRecommendationMessage}
              </p>
            </div>
          ) : null}

          {aiRecommendationError ? (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <p>
                {aiRecommendationError}
              </p>
            </div>
          ) : null}

          {/* AI RECOMMENDATION */}
          {aiRecommendation ? (
            <div className="space-y-5 rounded-2xl border bg-background p-6">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />

                  <h3 className="text-base font-semibold">
                    AI SEO Recommendation
                  </h3>
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Rekomendasi ini dihasilkan
                  oleh AI berdasarkan data
                  produk dan hasil analisis SEO.
                  Belum diterapkan ke production.
                </p>
              </div>

              <div className="grid gap-4">
                {aiRecommendation.title ? (
                  <div className="rounded-xl border p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Recommended SEO Title
                    </div>

                    <div className="mt-2 text-sm font-medium">
                      {
                        aiRecommendation.title
                      }
                    </div>
                  </div>
                ) : null}

                {aiRecommendation.description ? (
                  <div className="rounded-xl border p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Recommended Meta Description
                    </div>

                    <div className="mt-2 text-sm leading-6">
                      {
                        aiRecommendation.description
                      }
                    </div>
                  </div>
                ) : null}

                {aiRecommendation.ogTitle ? (
                  <div className="rounded-xl border p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Recommended OG Title
                    </div>

                    <div className="mt-2 text-sm font-medium">
                      {
                        aiRecommendation.ogTitle
                      }
                    </div>
                  </div>
                ) : null}

                {aiRecommendation.ogDescription ? (
                  <div className="rounded-xl border p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Recommended OG Description
                    </div>

                    <div className="mt-2 text-sm leading-6">
                      {
                        aiRecommendation.ogDescription
                      }
                    </div>
                  </div>
                ) : null}
              </div>

              {aiRecommendation.reasoning
                .length > 0 ? (
                <div>
                  <div className="text-sm font-semibold">
                    AI Reasoning
                  </div>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                    {aiRecommendation.reasoning.map(
                      (
                        reason,
                        index,
                      ) => (
                        <li key={index}>
                          {reason}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-x-3 gap-y-1 border-t pt-4 text-xs text-muted-foreground">
                <span>
                  Provider:{" "}
                  {aiRecommendation.provider}
                </span>

                <span>•</span>

                <span>
                  Model:{" "}
                  {aiRecommendation.model}
                </span>

                <span>•</span>

                <span>
                  Generated:{" "}
                  {new Date(
                    aiRecommendation.generatedAt,
                  ).toLocaleString(
                    "id-ID",
                  )}
                </span>
              </div>
            </div>
          ) : null}

          {/* SEO ANALYSIS RESULT */}
          {analysisResult ? (
            <div className="space-y-6">
              {/* SCORE */}
              <div className="rounded-2xl border bg-background p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      SEO Score
                    </p>

                    <div className="mt-2 flex items-end gap-3">
                      <span className="text-4xl font-bold tracking-tight">
                        {analysisScore}
                      </span>

                      <span className="pb-1 text-lg text-muted-foreground">
                        /100
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-medium">
                      {analysisScoreLabel}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {analysisResult.name}
                    </p>
                  </div>

                  <div className="rounded-xl border px-5 py-4">
                    <p className="text-xs text-muted-foreground">
                      Total pemeriksaan
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {analysisIssues.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* SUMMARY */}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-background p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Error
                  </p>

                  <p className="mt-2 text-2xl font-bold text-destructive">
                    {analysisCounts.error}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Perlu diperbaiki
                  </p>
                </div>

                <div className="rounded-xl border bg-background p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Warning
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {analysisCounts.warning}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Disarankan dioptimasi
                  </p>
                </div>

                <div className="rounded-xl border bg-background p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Berhasil
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {analysisCounts.success}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Pemeriksaan terpenuhi
                  </p>
                </div>

                <div className="rounded-xl border bg-background p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Info
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {analysisCounts.info}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Informasi tambahan
                  </p>
                </div>
              </div>

              {/* CRITICAL ISSUES */}
              {analysisCounts.error > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Critical Issues
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Masalah yang sebaiknya
                      diperbaiki terlebih dahulu.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {analysisIssues
                      .filter(
                        (issue) =>
                          issue.severity ===
                          "error",
                      )
                      .map((issue) => (
                        <div
                          key={`${issue.code}-${issue.field}`}
                          className="rounded-xl border border-destructive/20 bg-destructive/5 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {issue.message}
                              </p>

                              {issue.recommendation ? (
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {
                                    issue.recommendation
                                  }
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              {/* WARNINGS */}
              {analysisCounts.warning > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Warnings
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Area SEO yang masih dapat
                      ditingkatkan.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {analysisIssues
                      .filter(
                        (issue) =>
                          issue.severity ===
                          "warning",
                      )
                      .map((issue) => (
                        <div
                          key={`${issue.code}-${issue.field}`}
                          className="rounded-xl border bg-background p-4"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {issue.message}
                              </p>

                              {issue.recommendation ? (
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {
                                    issue.recommendation
                                  }
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              {/* PASSED CHECKS */}
              {analysisCounts.success > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Passed Checks
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Pemeriksaan SEO yang sudah
                      terpenuhi.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {analysisIssues
                      .filter(
                        (issue) =>
                          issue.severity ===
                          "success",
                      )
                      .map((issue) => (
                        <div
                          key={`${issue.code}-${issue.field}`}
                          className="rounded-xl border bg-background p-4"
                        >
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {issue.message}
                              </p>

                              {issue.recommendation ? (
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {
                                    issue.recommendation
                                  }
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              {/* INFORMATION */}
              {analysisCounts.info > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Additional Information
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Informasi tambahan dari
                      analisis SEO.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {analysisIssues
                      .filter(
                        (issue) =>
                          issue.severity ===
                          "info",
                      )
                      .map((issue) => (
                        <div
                          key={`${issue.code}-${issue.field}`}
                          className="rounded-xl border bg-background p-4"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {issue.message}
                              </p>

                              {issue.recommendation ? (
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {
                                    issue.recommendation
                                  }
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
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