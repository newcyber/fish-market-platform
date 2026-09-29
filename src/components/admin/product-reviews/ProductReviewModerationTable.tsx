"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, X } from "lucide-react";

interface AdminReview {
  id: string;
  username: string;
  email: string;
  rating: number;
  review: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isVerifiedPurchase: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    isPublished: boolean;
  };
}

interface ReviewResponse {
  reviews: AdminReview[];
  total: number;
}

const filters = [
  { value: "", label: "Semua" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function maskEmail(email: string) {
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    return email;
  }

  if (local.length <= 2) {
    return `•••@${domain}`;
  }

  return `${local.slice(0, 2)}•••@${domain}`;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="whitespace-nowrap text-amber-500">
      {"★".repeat(value)}
      <span className="text-slate-200">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function ProductReviewModerationTable() {
  const [status, setStatus] = useState("");
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch review data only.
   *
   * IMPORTANT:
   * Function ini tidak boleh melakukan setState.
   * Ini sengaja dipisahkan dari effect agar tidak terkena
   * react-hooks/set-state-in-effect.
   */
  const fetchReviews = useCallback(
    async (statusValue: string): Promise<ReviewResponse> => {
      const query = statusValue
        ? `?status=${encodeURIComponent(statusValue)}`
        : "";

      const response = await fetch(
        `/api/admin/product-reviews${query}`,
        {
          cache: "no-store",
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.message || "Gagal mengambil review.",
        );
      }

      return {
        reviews: payload.data?.reviews ?? [],
        total: payload.data?.total ?? 0,
      };
    },
    [],
  );

  /**
   * Load review ketika filter berubah.
   *
   * Tidak ada setState sebelum asynchronous operation.
   * Semua update state dilakukan setelah fetch selesai.
   */
  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      try {
        const data = await fetchReviews(status);

        if (cancelled) {
          return;
        }

        setReviews(data.reviews);
        setTotal(data.total);
        setError(null);
        setLoading(false);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal mengambil review.",
        );
        setLoading(false);
      }
    };

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, [fetchReviews, status]);

  async function updateStatus(
    id: string,
    nextStatus: "APPROVED" | "REJECTED",
  ) {
    setUpdatingId(id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/product-reviews/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.message || "Gagal memperbarui review.",
        );
      }

      const data = await fetchReviews(status);

      setReviews(data.reviews);
      setTotal(data.total);
      setError(null);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Gagal memperbarui review.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function handleFilterChange(nextStatus: string) {
    setLoading(true);
    setError(null);
    setStatus(nextStatus);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => handleFilterChange(filter.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              status === filter.value
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-500">
            {total.toLocaleString("id-ID")} review
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat review...
          </div>
        ) : reviews.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-slate-500">
            Tidak ada review pada filter ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((item) => (
              <div key={item.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/products/${item.product.slug}`}
                        target="_blank"
                        className="font-semibold text-slate-900 hover:text-cyan-600"
                      >
                        {item.product.name}
                      </Link>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status === "REJECTED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-medium text-slate-900">
                        {item.username}
                      </span>

                      <span className="text-slate-400">
                        {maskEmail(item.email)}
                      </span>

                      <Stars value={item.rating} />
                    </div>

                    {item.review ? (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {item.review}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm italic text-slate-400">
                        Tidak ada komentar.
                      </p>
                    )}
                  </div>

                  {item.status === "PENDING" ? (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() =>
                          void updateStatus(
                            item.id,
                            "APPROVED",
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() =>
                          void updateStatus(
                            item.id,
                            "REJECTED",
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}