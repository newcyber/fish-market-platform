"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
  Star,
  X,
} from "lucide-react";

interface AdminReview {
  id: string;
  username: string;
  email: string | null;
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

interface AdminReviewDetail extends AdminReview {
  product: AdminReview["product"] & {
    images?: Array<{
      id: string;
      image: string;
      isThumbnail: boolean | null;
    }>;
  };
}

interface ReviewResponse {
  reviews: AdminReview[];
  total: number;
}

interface ReviewSummary {
  total: number;
  pending: number;
  fiveStar: number;
  oneStar: number;
}

const PAGE_SIZE = 25;

const statusFilters = [
  { value: "", label: "Semua" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const ratingFilters = [
  { value: "", label: "Semua rating" },
  { value: "5", label: "5 bintang" },
  { value: "4", label: "4 bintang" },
  { value: "3", label: "3 bintang" },
  { value: "2", label: "2 bintang" },
  { value: "1", label: "1 bintang" },
];

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "highest-rating", label: "Rating tertinggi" },
  { value: "lowest-rating", label: "Rating terendah" },
];

function maskEmail(email: string | null | undefined) {
  if (!email) return "Email tidak tersedia";
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `•••@${domain}`;
  return `${local.slice(0, 2)}•••@${domain}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Stars({ value }: { value: number }) {
  return (
    <span
      className="whitespace-nowrap text-amber-500"
      aria-label={`${value} dari 5 bintang`}
    >
      {"★".repeat(value)}
      <span className="text-slate-200">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function statusLabel(status: AdminReview["status"]) {
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  return "Pending";
}

function statusClass(status: AdminReview["status"]) {
  if (status === "APPROVED") return "bg-emerald-50 text-emerald-700";
  if (status === "REJECTED") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

function buildPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);
  if (currentPage > 2) pages.add(currentPage - 1);
  if (currentPage < totalPages - 1) pages.add(currentPage + 1);
  if (currentPage <= 3) pages.add(2);
  if (currentPage >= totalPages - 2) pages.add(totalPages - 1);

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("ellipsis");
    result.push(page);
  });

  return result;
}

interface ProductReviewModerationTableProps {
  initialPage: number;
  initialStatus: string;
  initialRating: string;
  initialSearch: string;
  initialSort: string;
}

export default function ProductReviewModerationTable({
  initialPage,
  initialStatus,
  initialRating,
  initialSearch,
  initialSort,
}: ProductReviewModerationTableProps) {
  const [status, setStatus] = useState(initialStatus);
  const [rating, setRating] = useState(initialRating);
  const [sort, setSort] = useState(initialSort);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<AdminReviewDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminReview | null>(null);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const pageItems = useMemo(
    () => buildPageItems(page, totalPages),
    [page, totalPages],
  );

  const fetchSummary = useCallback(async () => {
    const response = await fetch("/api/admin/product-reviews?summary=1", {
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok || !payload?.success || !payload.data) {
      throw new Error(payload?.message || "Gagal mengambil ringkasan review.");
    }

    return payload.data as ReviewSummary;
  }, []);

  const fetchReviews = useCallback(
    async (
      statusValue: string,
      ratingValue: string,
      searchValue: string,
      sortValue: string,
      pageValue: number,
    ): Promise<ReviewResponse> => {
      const params = new URLSearchParams();
      params.set("page", String(pageValue));
      params.set("limit", String(PAGE_SIZE));
      if (statusValue) params.set("status", statusValue);
      if (ratingValue) params.set("rating", ratingValue);
      if (searchValue.trim()) params.set("search", searchValue.trim());
      if (sortValue) params.set("sort", sortValue);

      const response = await fetch(
        `/api/admin/product-reviews?${params.toString()}`,
        { cache: "no-store" },
      );
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Gagal mengambil review.");
      }

      return {
        reviews: payload.data?.reviews ?? [],
        total: payload.data?.total ?? 0,
      };
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      setSummaryLoading(true);

      try {
        const data = await fetchSummary();
        if (!cancelled) {
          setSummary(data);
        }
      } catch (summaryError) {
        if (!cancelled) {
          setError(
            summaryError instanceof Error
              ? summaryError.message
              : "Gagal mengambil ringkasan review.",
          );
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    };

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [fetchSummary]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const nextPage = Number(params.get("page") ?? "1");
      setPage(Number.isInteger(nextPage) && nextPage > 0 ? nextPage : 1);
      setStatus(params.get("status") ?? "");
      setRating(params.get("rating") ?? "");
      setSort(params.get("sort") ?? "newest");
      const nextSearch = params.get("search") ?? "";
      setSearchInput(nextSearch);
      setSearch(nextSearch);
    };

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page));
    if (status) params.set("status", status);
    else params.delete("status");
    if (rating) params.set("rating", rating);
    else params.delete("rating");
    if (search) params.set("search", search);
    else params.delete("search");
    if (sort !== "newest") params.set("sort", sort);
    else params.delete("sort");

    window.history.replaceState(
      null,
      "",
      `/admin/product-reviews?${params.toString()}`,
    );
  }, [page, rating, search, sort, status]);

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      setLoading(true);
      try {
        const data = await fetchReviews(status, rating, search, sort, page);
        if (cancelled) return;
        setReviews(data.reviews);
        setTotal(data.total);
        setError(null);
        setLoading(false);
      } catch (loadError) {
        if (cancelled) return;
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
  }, [fetchReviews, page, rating, search, sort, status]);

  const openDetail = useCallback(async (id: string) => {
    setSelectedReviewId(id);
    setSelectedReview(null);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/admin/product-reviews/${id}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.message || "Gagal mengambil detail review.");
      }

      setSelectedReview(payload.data as AdminReviewDetail);
    } catch (detailLoadError) {
      setDetailError(
        detailLoadError instanceof Error
          ? detailLoadError.message
          : "Gagal mengambil detail review.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  function closeDetail() {
    if (updatingId) return;
    setSelectedReviewId(null);
    setSelectedReview(null);
    setDetailError(null);
  }

  async function updateStatus(
    id: string,
    nextStatus: "APPROVED" | "REJECTED",
  ) {
    if (updatingId) return;

    setUpdatingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/product-reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Gagal memperbarui review.");
      }

      setSelectedReview((current) =>
        current ? { ...current, status: nextStatus } : current,
      );

      const data = await fetchReviews(status, rating, search, sort, page);

      if (data.reviews.length === 0 && page > 1) {
        setPage((current) => Math.max(current - 1, 1));
      } else {
        setReviews(data.reviews);
        setTotal(data.total);
      }

      setRejectTarget(null);
      setError(null);

      try {
        const refreshedSummary = await fetchSummary();
        setSummary(refreshedSummary);
      } catch {
        // The review mutation already succeeded. Keep the list state intact
        // if the non-critical KPI refresh fails.
      }
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

  function requestModeration(
    item: AdminReview,
    nextStatus: "APPROVED" | "REJECTED",
  ) {
    if (nextStatus === "REJECTED") {
      setRejectTarget(item);
      return;
    }

    void updateStatus(item.id, nextStatus);
  }

  function changeStatus(nextStatus: string) {
    setLoading(true);
    setError(null);
    setPage(1);
    setStatus(nextStatus);
  }

  function changeRating(nextRating: string) {
    setLoading(true);
    setError(null);
    setPage(1);
    setRating(nextRating);
  }

  function changeSort(nextSort: string) {
    setLoading(true);
    setError(null);
    setPage(1);
    setSort(nextSort);
  }

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setLoading(true);
    setPage(nextPage);
  }

  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setStatus("");
            setRating("");
            setSearch("");
            setSearchInput("");
            setSort("newest");
          }}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total Reviews
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summaryLoading ? (
                  <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-100" />
                ) : (
                  summary?.total.toLocaleString("id-ID") ?? "—"
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">Semua review</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <Search className="h-5 w-5" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setPage(1);
            setStatus("PENDING");
            setRating("");
            setSearch("");
            setSearchInput("");
            setSort("newest");
          }}
          className="rounded-2xl border border-amber-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Pending Moderation
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summaryLoading ? (
                  <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-100" />
                ) : (
                  summary?.pending.toLocaleString("id-ID") ?? "—"
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">Klik untuk melihat backlog</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Loader2 className="h-5 w-5" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setPage(1);
            setStatus("");
            setRating("5");
            setSearch("");
            setSearchInput("");
            setSort("newest");
          }}
          className="rounded-2xl border border-emerald-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Rating 5★
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summaryLoading ? (
                  <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-100" />
                ) : (
                  summary?.fiveStar.toLocaleString("id-ID") ?? "—"
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">Klik untuk memfilter</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Star className="h-5 w-5 fill-current" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setPage(1);
            setStatus("");
            setRating("1");
            setSearch("");
            setSearchInput("");
            setSort("newest");
          }}
          className="rounded-2xl border border-red-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Rating 1★
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summaryLoading ? (
                  <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-100" />
                ) : (
                  summary?.oneStar.toLocaleString("id-ID") ?? "—"
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">Klik untuk memfilter</p>
            </div>
            <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
              <Star className="h-5 w-5 fill-current" />
            </div>
          </div>
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari produk, customer, email, atau isi review..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => changeStatus(filter.value)}
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

        <div className="flex flex-wrap gap-3">
          <select
            value={rating}
            onChange={(event) => changeRating(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            {ratingFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => changeSort(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-500">
            {total.toLocaleString("id-ID")} review
          </p>
          {total > 0 ? (
            <p className="text-sm text-slate-500">
              Menampilkan {firstItem.toLocaleString("id-ID")}–
              {lastItem.toLocaleString("id-ID")}
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat review...
          </div>
        ) : reviews.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-slate-500">
            Tidak ada review yang sesuai dengan pencarian atau filter.
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
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}
                      >
                        {statusLabel(item.status)}
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
                      <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {item.review}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm italic text-slate-400">
                        Tidak ada komentar.
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void openDetail(item.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Lihat detail
                    </button>

                    {item.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          disabled={updatingId === item.id}
                          onClick={() => requestModeration(item, "APPROVED")}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {updatingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={updatingId === item.id}
                          onClick={() => requestModeration(item, "REJECTED")}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
            <p className="text-sm text-slate-500">
              Halaman {page.toLocaleString("id-ID")} dari {totalPages.toLocaleString("id-ID")}
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => changePage(page - 1)}
                aria-label="Halaman sebelumnya"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {pageItems.map((item, index) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-sm text-slate-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changePage(item)}
                    className={`h-9 min-w-9 rounded-lg px-2 text-sm font-medium ${
                      page === item
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => changePage(page + 1)}
                aria-label="Halaman berikutnya"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {selectedReviewId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-review-detail-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetail();
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Review detail
                </p>
                <h2
                  id="product-review-detail-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Detail Review
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                disabled={Boolean(updatingId)}
                aria-label="Tutup detail review"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6">
              {detailLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Memuat detail review...
                </div>
              ) : detailError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {detailError}
                </div>
              ) : selectedReview ? (
                <div className="space-y-6">
                  <div className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {selectedReview.product.images?.[0]?.image ? (
                        <img
                          src={selectedReview.product.images[0].image}
                          alt={selectedReview.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Produk
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedReview.product.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                          {selectedReview.product.isPublished
                            ? "Published"
                            : "Tidak dipublish"}
                        </span>
                        <Link
                          href={`/products/${selectedReview.product.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-semibold text-cyan-600 hover:text-cyan-700"
                        >
                          Lihat produk
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Customer
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedReview.username}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedReview.email || "Email tidak tersedia"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Waktu review
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDate(selectedReview.createdAt)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedReview.isVerifiedPurchase
                          ? "Pembelian terverifikasi"
                          : "Pembelian belum terverifikasi"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Rating
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Stars value={selectedReview.rating} />
                          <span className="text-sm font-semibold text-slate-700">
                            {selectedReview.rating}/5
                          </span>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(selectedReview.status)}`}
                      >
                        {statusLabel(selectedReview.status)}
                      </span>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Isi review
                      </p>
                      {selectedReview.review ? (
                        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
                          {selectedReview.review}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm italic text-slate-400">
                          Customer tidak menambahkan komentar.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {selectedReview ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={closeDetail}
                  disabled={Boolean(updatingId)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Tutup
                </button>

                {selectedReview.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={updatingId === selectedReview.id}
                      onClick={() =>
                        requestModeration(selectedReview, "REJECTED")
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === selectedReview.id}
                      onClick={() =>
                        requestModeration(selectedReview, "APPROVED")
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {updatingId === selectedReview.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {rejectTarget ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-review-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <X className="h-5 w-5" />
            </div>
            <h3
              id="reject-review-title"
              className="mt-4 text-lg font-bold text-slate-900"
            >
              Tolak review ini?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review dari <strong>{rejectTarget.username}</strong> akan berstatus
              Rejected dan tidak ditampilkan sebagai review yang disetujui.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={() => setRejectTarget(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={() => void updateStatus(rejectTarget.id, "REJECTED")}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {updatingId === rejectTarget.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Ya, Tolak Review
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
