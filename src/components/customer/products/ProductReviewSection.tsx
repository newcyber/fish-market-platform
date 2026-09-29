"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";

interface ReviewItem {
  id: string;
  username: string;
  rating: number;
  review: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

interface DistributionItem {
  rating: number;
  count: number;
}

export interface ProductReviewSummary {
  averageRating: number;
  reviewCount: number;
  distribution: DistributionItem[];
  reviews: ReviewItem[];
}

interface ProductReviewSectionProps {
  productId: string;
  initialSummary: ProductReviewSummary;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function Stars({
  value,
  interactive = false,
  onSelect,
}: {
  value: number;
  interactive?: boolean;
  onSelect?: (rating: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${value} dari 5 bintang`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;

        const content = (
          <Star
            className={`h-5 w-5 ${
              filled
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            }`}
          />
        );

        if (!interactive) {
          return <span key={star}>{content}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onSelect?.(star)}
            aria-label={`${star} bintang`}
            className="rounded p-0.5 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export default function ProductReviewSection({
  productId,
  initialSummary,
}: ProductReviewSectionProps) {
  const summary = initialSummary;
  const [rating, setRating] = useState(0);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [review, setReview] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalReviews = summary.reviewCount;

  const distributionMap = useMemo(
    () =>
      new Map(
        summary.distribution.map((item) => [item.rating, item.count]),
      ),
    [summary.distribution],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (rating < 1) {
      setError("Silakan pilih rating 1–5 bintang.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/products/${productId}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            rating,
            review,
            website,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.message || "Gagal mengirim penilaian.",
        );
      }

      setMessage(
        "Terima kasih sudah berbagi pengalaman. Penilaian Anda sangat berarti bagi kami.",
      );

      setRating(0);
      setUsername("");
      setEmail("");
      setReview("");
      setWebsite("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal mengirim penilaian.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-3 bg-white px-5 py-6 lg:px-8 lg:py-8">
      <div className="max-w-5xl">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Penilaian Produk
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Bagikan pengalaman Anda agar pelanggan lain lebih mudah memilih.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-center">
              <div className="text-4xl font-bold tracking-tight text-slate-900">
                {summary.averageRating > 0
                  ? summary.averageRating.toFixed(1)
                  : "0.0"}
              </div>

              <div className="mt-2 flex justify-center">
                <Stars value={Math.round(summary.averageRating)} />
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {totalReviews.toLocaleString("id-ID")} penilaian
              </p>
            </div>

            <div className="mt-6 space-y-2">
              {summary.distribution.map((item) => {
                const percentage =
                  totalReviews > 0
                    ? (item.count / totalReviews) * 100
                    : 0;

                return (
                  <div
                    key={item.rating}
                    className="grid grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-2 text-xs"
                  >
                    <span className="text-slate-600">
                      {item.rating}★
                    </span>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="text-right text-slate-500">
                      {distributionMap.get(item.rating) ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Berikan Penilaian
                </h3>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-5 space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Rating{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="mt-2">
                    <Stars
                      value={rating}
                      interactive
                      onSelect={setRating}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="product-review-username"
                      className="text-sm font-medium text-slate-700"
                    >
                      Nama{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="product-review-username"
                      value={username}
                      onChange={(event) =>
                        setUsername(event.target.value)
                      }
                      required
                      maxLength={50}
                      autoComplete="name"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      placeholder="Nama Anda"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="product-review-email"
                      className="text-sm font-medium text-slate-700"
                    >
                      Email{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="product-review-email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      required
                      maxLength={160}
                      autoComplete="email"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                <div
                  className="hidden"
                  aria-hidden="true"
                >
                  <label htmlFor="product-review-website">
                    Website
                  </label>

                  <input
                    id="product-review-website"
                    value={website}
                    onChange={(event) =>
                      setWebsite(event.target.value)
                    }
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label
                    htmlFor="product-review-text"
                    className="text-sm font-medium text-slate-700"
                  >
                    Ulasan{" "}
                    <span className="text-slate-400">
                      (opsional)
                    </span>
                  </label>

                  <textarea
                    id="product-review-text"
                    value={review}
                    onChange={(event) =>
                      setReview(event.target.value)
                    }
                    maxLength={1000}
                    rows={4}
                    className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Bagaimana pengalaman Anda dengan produk ini?"
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                {message ? (
                  <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>{message}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Penilaian"
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 space-y-3">
              {summary.reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                  Belum ada penilaian yang dipublikasikan.
                </div>
              ) : (
                summary.reviews.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {item.username}
                          </span>

                          {item.isVerifiedPurchase ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              Pembelian Terverifikasi
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-1">
                          <Stars value={item.rating} />
                        </div>
                      </div>

                      <time
                        dateTime={item.createdAt}
                        className="text-xs text-slate-400"
                      >
                        {formatDate(item.createdAt)}
                      </time>
                    </div>

                    {item.review ? (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {item.review}
                      </p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}