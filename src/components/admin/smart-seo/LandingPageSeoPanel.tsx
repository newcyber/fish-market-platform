"use client";

import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

import { useState, useTransition } from "react";

import {
  analyzeLandingPageSeoAction,
} from "@/actions/admin/seo/analyze-landing-page-seo";

import {
  generateLandingPageSeoRecommendationAction,
} from "@/actions/admin/seo/generate-landing-page-seo-recommendation";

export default function LandingPageSeoPanel() {
  const [
    analysisResult,
    setAnalysisResult,
  ] = useState<
    Awaited<
      ReturnType<
        typeof analyzeLandingPageSeoAction
      >
    >["data"] | null
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
        typeof generateLandingPageSeoRecommendationAction
      >
    >["data"] | null
  >(null);

  const [
    aiMessage,
    setAiMessage,
  ] = useState<string | null>(null);

  const [
    aiError,
    setAiError,
  ] = useState<string | null>(null);

  const [
    isGenerating,
    startAiTransition,
  ] = useTransition();

  const issues =
    analysisResult?.analysis.issues ?? [];

  const counts = {
    error: issues.filter(
      (issue) =>
        issue.severity === "error",
    ).length,

    warning: issues.filter(
      (issue) =>
        issue.severity === "warning",
    ).length,

    success: issues.filter(
      (issue) =>
        issue.severity === "success",
    ).length,

    info: issues.filter(
      (issue) =>
        issue.severity === "info",
    ).length,
  };

  const score =
    analysisResult?.analysis.score ?? 0;

  const scoreLabel =
    score >= 90
      ? "Sangat Baik"
      : score >= 75
        ? "Baik"
        : score >= 60
          ? "Perlu Optimasi"
          : "Perlu Perbaikan";

  const handleAnalyze = () => {
    setAnalysisMessage(null);
    setAnalysisError(null);
    setAiMessage(null);
    setAiError(null);
    setAiRecommendation(null);

    startAnalysisTransition(
      async () => {
        const result =
          await analyzeLandingPageSeoAction();

        if (result.success) {
          setAnalysisResult(
            result.data ?? null,
          );

          setAnalysisMessage(
            result.message,
          );

          return;
        }

        setAnalysisError(
          result.message,
        );
      },
    );
  };

  const handleGenerateAi = () => {
    setAiMessage(null);
    setAiError(null);
    setAiRecommendation(null);

    startAiTransition(
      async () => {
        const result =
          await generateLandingPageSeoRecommendationAction();

        if (result.success) {
          setAiRecommendation(
            result.data ?? null,
          );

          setAiMessage(
            result.message,
          );

          return;
        }

        setAiError(
          result.message,
        );
      },
    );
  };

  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="border-b p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Globe className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-semibold">
              Landing Page SEO
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Analisis SEO khusus halaman
              marketing pusatikansegar.com.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="rounded-xl border bg-background p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                Target SEO
              </p>

              <p className="mt-1 break-all text-sm text-muted-foreground">
                https://pusatikansegar.com/
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={
                  isAnalyzing ||
                  isGenerating
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
                onClick={handleGenerateAi}
                disabled={
                  isGenerating ||
                  isAnalyzing
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-background px-5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}

                {isGenerating
                  ? "Generating..."
                  : "Generate AI Recommendation"}
              </button>
            </div>
          </div>
        </div>

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

        {analysisResult ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border bg-background p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  SEO Score
                </p>

                <p className="mt-2 text-4xl font-bold tracking-tight">
                  {score}
                  <span className="ml-1 text-lg font-normal text-muted-foreground">
                    /100
                  </span>
                </p>

                <p className="mt-1 text-sm font-medium">
                  {scoreLabel}
                </p>
              </div>

              <div className="rounded-xl border bg-background p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Error
                </p>

                <p className="mt-2 text-3xl font-bold text-destructive">
                  {counts.error}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Perlu diperbaiki
                </p>
              </div>

              <div className="rounded-xl border bg-background p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Warning
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {counts.warning}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Perlu dioptimasi
                </p>
              </div>

              <div className="rounded-xl border bg-background p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Berhasil
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {counts.success}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Pemeriksaan terpenuhi
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-background p-5">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />

                <h3 className="text-base font-semibold">
                  SEO Checks
                </h3>
              </div>

              <div className="mt-4 space-y-3">
                {issues.map(
                  (issue) => (
                    <div
                      key={`${issue.code}-${issue.field}`}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex items-start gap-3">
                        {issue.severity ===
                        "success" ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        )}

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
                  ),
                )}
              </div>
            </div>
          </div>
        ) : null}

        {aiMessage ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <p>{aiMessage}</p>
          </div>
        ) : null}

        {aiError ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p>{aiError}</p>
          </div>
        ) : null}

        {aiRecommendation ? (
          <div className="space-y-5 rounded-2xl border bg-background p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary" />

              <div>
                <h3 className="text-base font-semibold">
                  AI SEO Recommendation
                </h3>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Rekomendasi dibuat berdasarkan
                  content dan hasil analisis
                  Landing Page. Belum diterapkan
                  otomatis ke production.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {aiRecommendation.title ? (
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Recommended SEO Title
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    {aiRecommendation.title}
                  </p>
                </div>
              ) : null}

              {aiRecommendation.description ? (
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Recommended Meta Description
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    {
                      aiRecommendation.description
                    }
                  </p>
                </div>
              ) : null}

              {aiRecommendation.ogTitle ? (
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Recommended OG Title
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    {aiRecommendation.ogTitle}
                  </p>
                </div>
              ) : null}

              {aiRecommendation.ogDescription ? (
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Recommended OG Description
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    {
                      aiRecommendation.ogDescription
                    }
                  </p>
                </div>
              ) : null}
            </div>

            {aiRecommendation.reasoning
              .length > 0 ? (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold">
                  AI Reasoning
                </p>

                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                  {aiRecommendation.reasoning.map(
                    (reason, index) => (
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
                ).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}