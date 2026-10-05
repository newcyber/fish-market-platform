"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, RotateCcw, X } from "lucide-react";

type Status = "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "SKIPPED";

type Item = {
  id: string;
  assignmentId: string;
  courierId: string;
  orderId: string;
  eventKey: string;
  eventType: string;
  phone: string;
  message: string;
  status: Status;
  messageId: string | null;
  jid: string | null;
  attempts: number;
  errorMessage: string | null;
  processingStartedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  courier: { id: string; name: string | null; phone: string | null };
  order: { id: string; orderNumber: string; status: string; paymentStatus: string };
};

type Api = {
  success: boolean;
  message?: string;
  data?: {
    items: Item[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    statusCounts: Array<{ status: Status; count: number }>;
  };
};

const statuses: Array<{ value: "" | Status; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SENT", label: "Sent" },
  { value: "FAILED", label: "Failed" },
  { value: "SKIPPED", label: "Skipped" },
];

const events = [
  { value: "", label: "Semua event" },
  { value: "ASSIGNMENT", label: "Courier ditugaskan" },
  { value: "CANCELLATION", label: "Assignment dialihkan" },
];

const statusStyles: Record<Status, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SENT: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
  SKIPPED: "bg-slate-100 text-slate-700",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function eventLabel(value: string) {
  if (value === "ASSIGNMENT") return "Penugasan";
  if (value === "CANCELLATION") return "Dialihkan";
  return value;
}

export default function WapiCourierDeliveryCenter() {
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState<Array<{ status: Status; count: number }>>([]);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [status, setStatus] = useState<"" | Status>("");
  const [eventType, setEventType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
    });

    if (activeSearch) params.set("search", activeSearch);
    if (status) params.set("status", status);
    if (eventType) params.set("eventType", eventType);

    const response = await fetch(
      `/api/admin/notifications/wapi-courier-deliveries?${params}`,
      { cache: "no-store" },
    );

    const result = (await response.json()) as Api;

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || "Gagal mengambil delivery WAPI courier.");
    }

    return result.data;
  }, [activeSearch, eventType, page, status]);

  const applyData = useCallback((data: NonNullable<Api["data"]>) => {
    setItems(data.items ?? []);
    setCounts(data.statusCounts ?? []);
    setTotal(data.pagination.total);
    setTotalPages(data.pagination.totalPages);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (activeSearch) params.set("search", activeSearch);
      if (status) params.set("status", status);
      if (eventType) params.set("eventType", eventType);

      try {
        const response = await fetch(
          `/api/admin/notifications/wapi-courier-deliveries?${params}`,
          { cache: "no-store" },
        );

        const result = (await response.json()) as Api;

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message ||
              "Gagal mengambil delivery WAPI courier.",
          );
        }

        if (cancelled) return;

        const data = result.data;

        setItems(data.items ?? []);
        setCounts(data.statusCounts ?? []);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } catch (requestError) {
        if (cancelled) return;

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Gagal mengambil delivery WAPI courier.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [activeSearch, eventType, page, status]);

  async function retry(item: Item) {
    if (item.status !== "FAILED" || retrying) return;

    setRetrying(item.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/notifications/wapi-courier-deliveries/${item.id}/retry`,
        { method: "POST" },
      );

      const result = (await response.json()) as Api;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Retry WAPI courier gagal.");
      }

      const data = await loadData();
      applyData(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Retry WAPI courier gagal.",
      );
    } finally {
      setRetrying(null);
    }
  }

  function submitSearch() {
    setPage(1);
    setActiveSearch(search.trim());
  }

  const countFor = (value: Status) =>
    counts.find((item) => item.status === value)?.count ?? 0;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          WAPI Courier Delivery Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Audit notifikasi WhatsApp courier, pantau kegagalan, dan retry delivery secara terkontrol.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["PENDING", "PROCESSING", "SENT", "FAILED", "SKIPPED"] as Status[]).map(
          (value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setPage(1);
                setStatus(value);
              }}
              className={`rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 ${
                status === value ? "ring-2 ring-primary/20" : ""
              }`}
            >
              <p className="text-xs font-medium text-muted-foreground">
                {value}
              </p>
              <p className="mt-1 text-2xl font-semibold">{countFor(value)}</p>
            </button>
          ),
        )}
      </div>

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex min-w-0 flex-1 gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitSearch();
                }}
                placeholder="Cari order, courier, nomor WhatsApp..."
                className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="button"
              onClick={submitSearch}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Cari
            </button>
          </div>

          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as "" | Status);
            }}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm"
          >
            {statuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={eventType}
            onChange={(event) => {
              setPage(1);
              setEventType(event.target.value);
            }}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm"
          >
            {events.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-semibold">Delivery Log</h2>
            <p className="text-xs text-muted-foreground">{total} delivery</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Memuat delivery WAPI courier...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Tidak ada delivery yang cocok.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Courier</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Attempt</th>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-semibold">{item.order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.courier.name ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">{item.phone}</div>
                      </td>
                      <td className="px-4 py-3">{eventLabel(item.eventType)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{item.attempts}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelected(item)}
                            className="rounded-lg border px-3 py-2 text-xs font-semibold"
                          >
                            Detail
                          </button>
                          {item.status === "FAILED" ? (
                            <button
                              type="button"
                              onClick={() => void retry(item)}
                              disabled={retrying === item.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              {retrying === item.id ? "Retry..." : "Retry"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y md:hidden">
              {items.map((item) => (
                <article key={item.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{item.courier.name ?? "-"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Event</p>
                      <p className="mt-0.5 font-medium">{eventLabel(item.eventType)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Attempt</p>
                      <p className="mt-0.5 font-medium">{item.attempts}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">WhatsApp</p>
                      <p className="mt-0.5 font-medium">{item.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Waktu</p>
                      <p className="mt-0.5 font-medium">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>

                  {item.errorMessage ? (
                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800">
                      {item.errorMessage}
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="flex-1 rounded-lg border px-3 py-2 text-xs font-semibold"
                    >
                      Detail
                    </button>
                    {item.status === "FAILED" ? (
                      <button
                        type="button"
                        onClick={() => void retry(item)}
                        disabled={retrying === item.id}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {retrying === item.id ? "Retry..." : "Retry"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-background p-5 shadow-xl sm:max-w-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Detail WAPI Courier</h3>
                <p className="mt-1 text-xs text-muted-foreground">{selected.eventKey}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border p-2"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Order</p>
                <p className="font-semibold">{selected.order.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Courier</p>
                <p className="font-semibold">{selected.courier.name ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Event</p>
                <p className="font-semibold">{eventLabel(selected.eventType)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[selected.status]}`}>
                  {selected.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="font-semibold">{selected.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Attempts</p>
                <p className="font-semibold">{selected.attempts}</p>
              </div>
            </div>

            {selected.errorMessage ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">Error</p>
                <p className="mt-1">{selected.errorMessage}</p>
              </div>
            ) : null}

            <div className="mt-5 rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Message
              </p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6">
                {selected.message}
              </pre>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border px-4 py-2 text-sm font-semibold"
              >
                Tutup
              </button>
              {selected.status === "FAILED" ? (
                <button
                  type="button"
                  onClick={() => {
                    void retry(selected);
                    setSelected(null);
                  }}
                  disabled={retrying === selected.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
