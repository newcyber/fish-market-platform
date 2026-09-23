"use client";

import { useCallback, useEffect, useState } from "react";

type WapiDeliveryStatus =
  "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "SKIPPED";

type WapiDeliveryItem = {
  id: string;
  orderId: string;
  userId: string;
  phone: string;
  message: string;
  status: WapiDeliveryStatus;
  messageId: string | null;
  jid: string | null;
  attempts: number;
  errorMessage: string | null;
  processingStartedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

type StatusCount = {
  status: WapiDeliveryStatus;
  count: number;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: WapiDeliveryItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  statusCounts?: StatusCount[];
};

const STATUS_OPTIONS: Array<{
  value: "" | WapiDeliveryStatus;
  label: string;
}> = [
  { value: "", label: "Semua status" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SENT", label: "Sent" },
  { value: "FAILED", label: "Failed" },
  { value: "SKIPPED", label: "Skipped" },
];

const STATUS_STYLES: Record<WapiDeliveryStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SENT: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
  SKIPPED: "bg-slate-100 text-slate-700",
};

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status: WapiDeliveryStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function WapiDeliveryCenter() {
  const [items, setItems] = useState<WapiDeliveryItem[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [status, setStatus] = useState<"" | WapiDeliveryStatus>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (activeSearch) {
        params.set("search", activeSearch);
      }

      if (status) {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/admin/notifications/wapi-deliveries?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil data WAPI delivery.",
        );
      }

      setItems(result.data ?? []);
      setStatusCounts(result.statusCounts ?? []);
      setTotal(result.pagination?.total ?? 0);
      setTotalPages(result.pagination?.totalPages ?? 1);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Terjadi kesalahan saat mengambil data.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeSearch, page, status]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function submitSearch() {
    setPage(1);
    setActiveSearch(search.trim());
  }

  function changeStatus(nextStatus: "" | WapiDeliveryStatus) {
    setPage(1);
    setStatus(nextStatus);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          WAPI Notification Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor status pengiriman notifikasi WhatsApp Pisjo Market.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {STATUS_OPTIONS.filter((item) => item.value !== "").map((option) => {
          const count =
            statusCounts.find((item) => item.status === option.value)?.count ??
            0;

          return (
            <div
              key={option.value}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {option.label}
              </p>
              <p className="mt-2 text-2xl font-semibold">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row">
        <div className="flex flex-1 gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitSearch();
              }
            }}
            placeholder="Cari order, nomor WhatsApp, atau customer..."
            className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            type="button"
            onClick={submitSearch}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Cari
          </button>
        </div>

        <select
          value={status}
          onChange={(event) =>
            changeStatus(event.target.value as "" | WapiDeliveryStatus)
          }
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Nomor WhatsApp</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Percobaan</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Keterangan</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Memuat data WAPI delivery...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Belum ada data WAPI delivery.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-4 font-medium">
                      {item.order.orderNumber}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {item.user.name || "Tanpa nama"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.user.email || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">{item.phone}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_STYLES[item.status]
                        }`}
                      >
                        {formatStatus(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">{item.attempts}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">
                      {formatDate(item.sentAt || item.createdAt)}
                    </td>
                    <td className="max-w-xs px-4 py-4 text-xs">
                      {item.errorMessage || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-muted-foreground">Total: {total} delivery</p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sebelumnya
            </button>

            <span className="px-2 text-muted-foreground">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
