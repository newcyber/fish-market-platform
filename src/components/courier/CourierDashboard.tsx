"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  ClipboardList,
  Eye,
  History,
  Clock3,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";

import type {
  CourierAssignmentDetail,
  CourierAssignmentListItem,
  CourierDashboardStats,
} from "@/services/courier/courier.service";

interface CourierDashboardData {
  stats: CourierDashboardStats;
  assignments: CourierAssignmentListItem[];
}

interface CourierDashboardProps {
  initialData: CourierDashboardData;
}

const STATUS_LABELS: Record<CourierAssignmentListItem["status"], string> = {
  ASSIGNED: "Ditugaskan",
  ON_ROUTE: "Dalam perjalanan",
  PICKED_UP: "Sudah diambil",
  DELIVERED: "Terkirim",
  FAILED: "Gagal",
  CANCELLED: "Dibatalkan",
};

const STATUS_CLASSES: Record<CourierAssignmentListItem["status"], string> = {
  ASSIGNED: "bg-amber-50 text-amber-700 border-amber-200",
  ON_ROUTE: "bg-blue-50 text-blue-700 border-blue-200",
  PICKED_UP: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getNextAction(status: CourierAssignmentListItem["status"]) {
  if (status === "ASSIGNED") {
    return {
      status: "ON_ROUTE" as const,
      label: "Mulai Pengantaran",
      icon: Navigation,
    };
  }

  if (status === "ON_ROUTE") {
    return {
      status: "PICKED_UP" as const,
      label: "Tandai Sudah Diambil",
      icon: PackageCheck,
    };
  }

  if (status === "PICKED_UP") {
    return {
      status: "DELIVERED" as const,
      label: "Tandai Terkirim",
      icon: CheckCircle2,
    };
  }

  return null;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: typeof Truck;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">{title}</p>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-3xl">
            {typeof value === "number" ? value.toLocaleString("id-ID") : value}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">{description}</p>
        </div>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

export function CourierDashboard({ initialData }: CourierDashboardProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CourierAssignmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [failureTarget, setFailureTarget] = useState<CourierAssignmentListItem | null>(null);
  const [failureReason, setFailureReason] = useState("");
  const [failureCode, setFailureCode] = useState("OTHER");
  const [proofTarget, setProofTarget] = useState<CourierAssignmentListItem | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientNote, setRecipientNote] = useState("");
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [history, setHistory] = useState<CourierAssignmentListItem[]>([]);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function refreshDashboard() {
    setRefreshing(true);
    setError(null);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 700);
  }

  async function openDetail(id: string) {
    setDetailLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/courier/assignments/${id}`, { cache: "no-store" });
      const result = (await response.json()) as { data?: CourierAssignmentDetail; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message ?? "Detail pengantaran tidak dapat dimuat.");
      setDetail(result.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Detail pengantaran tidak dapat dimuat.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadHistory(reset = false) {
    setHistoryLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ limit: "12" });
      if (!reset && historyCursor) query.set("cursor", historyCursor);
      const response = await fetch(`/api/courier/history?${query.toString()}`, { cache: "no-store" });
      const result = (await response.json()) as { data?: { items: CourierAssignmentListItem[]; nextCursor: string | null }; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message ?? "Riwayat tidak dapat dimuat.");
      setHistory((current) => reset ? result.data!.items : [...current, ...result.data!.items]);
      setHistoryCursor(result.data.nextCursor);
      setHistoryLoaded(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Riwayat tidak dapat dimuat.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function transition(
    assignment: CourierAssignmentListItem,
    nextStatus: "ON_ROUTE" | "PICKED_UP" | "DELIVERED",
  ) {
    if (nextStatus === "DELIVERED") {
      setRecipientName(assignment.order.address.receiverName);
      setRecipientNote("");
      setProofPhoto(null);
      setProofTarget(assignment);
      return;
    }
    setLoadingId(assignment.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/courier/assignments/${assignment.id}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui status pengantaran.");
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Gagal memperbarui status pengantaran.",
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function submitDeliveryProof() {
    if (!proofTarget) return;
    if (!recipientName.trim()) {
      setError("Nama penerima wajib diisi.");
      return;
    }

    setProofSubmitting(true);
    setError(null);

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 30000,
            }),
          );
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch {
          // GPS is optional; delivery proof remains valid without location.
        }
      }

      const formData = new FormData();
      formData.set("recipientName", recipientName.trim());
      if (recipientNote.trim()) formData.set("recipientNote", recipientNote.trim());
      if (latitude !== null) formData.set("latitude", String(latitude));
      if (longitude !== null) formData.set("longitude", String(longitude));
      if (proofPhoto) formData.set("photo", proofPhoto);

      const proofResponse = await fetch(
        `/api/courier/assignments/${proofTarget.id}/proof`,
        { method: "POST", body: formData },
      );
      const proofPayload = await proofResponse.json();
      if (!proofResponse.ok || !proofPayload.data?.id) {
        throw new Error(proofPayload.message || "Gagal menyimpan bukti pengiriman.");
      }

      const statusResponse = await fetch(
        `/api/courier/assignments/${proofTarget.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "DELIVERED",
            proofId: proofPayload.data.id,
          }),
        },
      );
      const statusPayload = await statusResponse.json();
      if (!statusResponse.ok) {
        throw new Error(statusPayload.message || "Gagal menyelesaikan pengantaran.");
      }

      setProofTarget(null);
      setProofPhoto(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan bukti pengiriman.");
    } finally {
      setProofSubmitting(false);
    }
  }

  async function markFailed(assignment: CourierAssignmentListItem, reason: string) {
    if (!reason.trim()) {
      setError("Alasan gagal antar wajib diisi.");
      return;
    }

    setLoadingId(assignment.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/courier/assignments/${assignment.id}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "FAILED",
            failureCode,
            failureReason: reason.trim(),
          }),
        },
      );

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message || "Gagal mencatat pengantaran.");
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Gagal mencatat pengantaran.",
      );
    } finally {
      setLoadingId(null);
    }
  }

  const { stats, assignments } = initialData;

  const activeAssignments = assignments.filter((assignment) =>
    ["ASSIGNED", "ON_ROUTE", "PICKED_UP"].includes(assignment.status),
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--pisjo-primary)]">
              PISJO Market
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Dashboard Kurir
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Kelola tugas pengantaran yang menjadi tanggung jawab Anda. Perbarui
              status hanya setelah kondisi di lapangan benar-benar sesuai.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshDashboard()}
            disabled={refreshing}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="border-t bg-slate-50 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              Hari ini
            </span>
            <span>
              {new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </span>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Ditugaskan"
          value={stats.assigned}
          description="Menunggu mulai diantar"
          icon={ClipboardList}
          tone="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Dalam perjalanan"
          value={stats.onRoute}
          description="Sedang menuju tujuan"
          icon={Navigation}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Sudah diambil"
          value={stats.pickedUp}
          description="Barang sudah diambil"
          icon={PackageCheck}
          tone="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          title="Selesai hari ini"
          value={stats.deliveredToday}
          description="Berhasil dikirim"
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Gagal hari ini"
          value={stats.failedToday}
          description="Perlu evaluasi operasional"
          icon={XCircle}
          tone="bg-red-50 text-red-700"
        />
        <StatCard
          title="Completion"
          value={`${stats.completionRate}%`}
          description={`${stats.totalToday} tugas hari ini`}
          icon={Truck}
          tone="bg-slate-100 text-slate-700"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Tugas Pengantaran Aktif</h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeAssignments.length > 0
                ? `${activeAssignments.length} tugas aktif menunggu tindakan.`
                : "Tidak ada tugas aktif saat ini."}
            </p>
          </div>

          <div className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Total hari ini: {stats.totalToday.toLocaleString("id-ID")}
          </div>
        </div>

        {activeAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Truck className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Belum ada tugas aktif
            </h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
              Pesanan baru akan muncul di sini setelah admin menugaskannya kepada
              Anda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {activeAssignments.map((assignment) => {
              const nextAction = getNextAction(assignment.status);
              const isLoading = loadingId === assignment.id;
              const address = assignment.order.address;
              const hasCoordinates =
                address.latitude !== null && address.longitude !== null;

              const ActionIcon = nextAction?.icon;

              return (
                <article key={assignment.id} className="p-4 sm:p-6">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            {assignment.order.orderNumber}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[assignment.status]}`}
                          >
                            {STATUS_LABELS[assignment.status]}
                          </span>
                        </div>

                        <h3 className="mt-2 text-base font-bold text-slate-900 sm:text-lg">
                          {address.receiverName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Pesanan dibuat {formatDate(assignment.order.createdAt)} ·
                          ditugaskan {formatTime(assignment.assignedAt)}
                        </p>
                      </div>

                      <div className="w-full border-t border-slate-100 pt-3 text-left lg:w-auto lg:border-0 lg:pt-0 lg:text-right">
                        <p className="text-xs font-medium text-slate-400">Total pesanan</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {formatCurrency(assignment.order.total)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {assignment.order.itemsCount.toLocaleString("id-ID")} item
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-2xl bg-slate-50 p-3 sm:p-4 lg:grid-cols-2">
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Alamat Pengantaran
                          </p>
                          <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
                            {address.fullAddress}
                          </p>
                          <p className="text-xs text-slate-500">
                            {address.district}, {address.city} {address.postalCode}
                          </p>
                          {address.notes ? (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              Catatan: {address.notes}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Penerima
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {address.receiverName}
                          </p>

                          <a
                            href={`tel:${address.receiverPhone}`}
                            className="mt-2 inline-flex text-sm font-medium text-[var(--pisjo-primary)] hover:underline"
                          >
                            {address.receiverPhone}
                          </a>

                          {hasCoordinates ? (
                            <div className="mt-2 flex justify-start sm:justify-end">
                              <a
                                href={`/courier/navigation?assignment=${encodeURIComponent(assignment.id)}`}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
                              >
                                <Navigation className="h-4 w-4 text-[var(--pisjo-primary)]" />
                                Navigasi
                              </a>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={detailLoading}
                        onClick={() => void openDetail(assignment.id)}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
                      >
                        <Eye className="h-4 w-4" />
                        Detail
                      </button>
                      {nextAction ? (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() =>
                            void transition(assignment, nextAction.status)
                          }
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--pisjo-primary)] px-4 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {ActionIcon ? (
                            <ActionIcon
                              className={`h-4 w-4 ${isLoading ? "animate-pulse" : ""}`}
                            />
                          ) : null}
                          {isLoading ? "Memproses..." : nextAction.label}
                        </button>
                      ) : null}

                      {assignment.status === "ON_ROUTE" ||
                      assignment.status === "PICKED_UP" ? (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => { setFailureTarget(assignment); setFailureReason(""); setFailureCode("OTHER"); }}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          <XCircle className="h-4 w-4" />
                          Gagal Antar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><History className="h-5 w-5" /></div>
            <div><h2 className="text-base font-bold text-slate-900 sm:text-lg">Riwayat Pengantaran</h2><p className="text-sm text-slate-500">Pesanan selesai, gagal, atau dibatalkan.</p></div>
          </div>
          <button type="button" onClick={() => void loadHistory(true)} disabled={historyLoading} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:w-auto">
            <History className="h-4 w-4" />{historyLoaded ? "Muat Ulang" : "Lihat Riwayat"}
          </button>
        </div>
        {historyLoaded ? (
          <div className="divide-y divide-slate-200 border-t border-slate-200">
            {history.length === 0 ? <div className="px-5 py-10 text-center text-sm text-slate-500">Belum ada riwayat pengantaran.</div> : history.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.order.orderNumber}</span><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[item.status]}`}>{STATUS_LABELS[item.status]}</span></div><p className="mt-1 truncate text-sm font-semibold text-slate-800">{item.order.address.receiverName} · {item.order.address.city}</p>{item.failureReason ? <p className="mt-1 text-xs text-red-600">Alasan: {item.failureReason}</p> : null}</div>
                <div className="text-left sm:text-right"><p className="text-sm font-bold text-slate-900">{formatCurrency(item.order.total)}</p><p className="text-xs text-slate-500">{item.order.itemsCount} item</p></div>
              </div>
            ))}
            {historyCursor ? <div className="border-t border-slate-200 p-4 text-center"><button type="button" onClick={() => void loadHistory(false)} disabled={historyLoading} className="inline-flex min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700">{historyLoading ? "Memuat..." : "Muat lebih banyak"}</button></div> : null}
          </div>
        ) : null}
      </section>

      {detail ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3.5 sm:px-5 sm:py-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Detail Pengantaran</p><h2 className="font-bold text-slate-900">{detail.order.orderNumber}</h2></div><button type="button" onClick={() => setDetail(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup">×</button></div>
            <div className="min-h-0 space-y-5 overflow-y-auto p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${STATUS_CLASSES[detail.status]}`}>{STATUS_LABELS[detail.status]}</span><span className="text-base font-bold text-slate-900 sm:text-lg">{formatCurrency(detail.order.total)}</span></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Penerima</p><p className="mt-1 font-bold text-slate-900">{detail.order.address.receiverName}</p><a href={`tel:${detail.order.address.receiverPhone}`} className="mt-1 inline-flex text-sm font-medium text-[var(--pisjo-primary)]">{detail.order.address.receiverPhone}</a><p className="mt-3 text-sm leading-6 text-slate-700">{detail.order.address.fullAddress}</p><p className="text-xs text-slate-500">{detail.order.address.district}, {detail.order.address.city} {detail.order.address.postalCode}</p>{detail.order.address.latitude !== null && detail.order.address.longitude !== null ? <a href={`/courier/navigation?assignment=${encodeURIComponent(detail.id)}`} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--pisjo-primary)] px-4 py-2.5 text-sm font-semibold text-white"><Navigation className="h-4 w-4" />Buka Navigasi</a> : null}</div>
              <div><h3 className="font-bold text-slate-900">Produk ({detail.order.items.length})</h3><div className="mt-3 divide-y rounded-2xl border">{detail.order.items.map((item) => <div key={item.id} className="p-4"><div className="flex justify-between gap-4"><div><p className="font-semibold text-slate-900">{item.productName}</p>{item.productVariant ? <p className="text-xs text-slate-500">{item.productVariant}</p> : null}{item.customerNote ? <p className="mt-1 text-xs text-slate-500">Catatan: {item.customerNote}</p> : null}</div><div className="text-right"><p className="font-bold">×{item.quantity}</p><p className="text-xs text-slate-500">{formatCurrency(item.subtotal)}</p></div></div></div>)}</div></div>
              {detail.order.notes ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><p className="font-semibold">Catatan pesanan</p><p className="mt-1">{detail.order.notes}</p></div> : null}

              {detail.events.length > 0 ? (
                <div>
                  <h3 className="font-bold text-slate-900">Riwayat Tugas</h3>
                  <div className="mt-3 space-y-3 rounded-2xl border p-4">
                    {detail.events.map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--pisjo-primary)]" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{STATUS_LABELS[event.toStatus ?? detail.status]}</p>
                            <span className="text-xs text-slate-400">{formatDate(event.createdAt)} {formatTime(event.createdAt)}</span>
                          </div>
                          {event.note ? <p className="mt-1 text-xs leading-5 text-slate-500">{event.note}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {detail.deliveryProof ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Bukti Pengiriman</p>
                  <p className="mt-1 font-bold text-slate-900">Diterima oleh {detail.deliveryProof.recipientName}</p>
                  {detail.deliveryProof.recipientNote ? <p className="mt-1 text-sm text-slate-600">{detail.deliveryProof.recipientNote}</p> : null}
                  {detail.deliveryProof.photoUrl ? <img src={detail.deliveryProof.photoUrl} alt="Bukti pengiriman" className="mt-3 max-h-64 w-full rounded-xl object-cover" /> : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {proofTarget ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-4 pb-6 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bukti Pengiriman</p>
                <h2 className="mt-1 font-bold text-slate-900">Konfirmasi pesanan terkirim</h2>
                <p className="mt-1 text-sm text-slate-500">{proofTarget.order.orderNumber}</p>
              </div>
              <button type="button" onClick={() => setProofTarget(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup">×</button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Diterima oleh</span>
                <input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} maxLength={120} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[var(--pisjo-primary)]" placeholder="Nama penerima" />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Catatan penerimaan <span className="font-normal text-slate-400">(opsional)</span></span>
                <textarea value={recipientNote} onChange={(event) => setRecipientNote(event.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[var(--pisjo-primary)]" placeholder="Contoh: diterima oleh pemilik rumah" />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Foto bukti <span className="font-normal text-slate-400">(opsional, maks. 5 MB)</span></span>
                <span className="mt-2 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <Camera className="h-4 w-4" />
                  {proofPhoto ? proofPhoto.name : "Ambil / pilih foto"}
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => setProofPhoto(event.target.files?.[0] ?? null)} />
                </span>
              </label>

              <div className="rounded-xl bg-sky-50 px-3 py-3 text-xs leading-5 text-sky-700">Lokasi GPS akan dicatat jika izin lokasi tersedia. GPS bersifat opsional.</div>

              <div className="grid grid-cols-1 gap-2 pt-1 sm:flex sm:justify-end">
                <button type="button" onClick={() => setProofTarget(null)} disabled={proofSubmitting} className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 sm:w-auto">Batal</button>
                <button type="button" onClick={() => void submitDeliveryProof()} disabled={!recipientName.trim() || proofSubmitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">
                  {proofSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Simpan & Terkirim
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {failureTarget ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-4 pb-6 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl sm:p-6"><h2 className="font-bold text-slate-900">Catat Gagal Antar</h2><p className="mt-1 text-sm text-slate-500">{failureTarget.order.orderNumber} · {failureTarget.order.address.receiverName}</p><select value={failureCode} onChange={(event) => setFailureCode(event.target.value)} className="mt-4 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[var(--pisjo-primary)]"><option value="CUSTOMER_UNAVAILABLE">Customer tidak tersedia</option><option value="WRONG_ADDRESS">Alamat tidak sesuai</option><option value="ADDRESS_NOT_FOUND">Alamat tidak ditemukan</option><option value="CUSTOMER_REFUSED">Customer menolak menerima</option><option value="CUSTOMER_CANCELLED">Customer membatalkan</option><option value="DAMAGED_PACKAGE">Paket rusak</option><option value="VEHICLE_PROBLEM">Masalah kendaraan</option><option value="WEATHER">Cuaca</option><option value="OTHER">Lainnya</option></select><textarea value={failureReason} onChange={(event) => setFailureReason(event.target.value)} maxLength={500} rows={5} autoFocus className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[var(--pisjo-primary)]" placeholder="Jelaskan kondisi di lapangan..." /><div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:justify-end"><button type="button" onClick={() => setFailureTarget(null)} className="min-h-11 rounded-xl border px-4 text-sm font-semibold">Batal</button><button type="button" disabled={!failureReason.trim() || loadingId === failureTarget.id} onClick={() => void markFailed(failureTarget, failureReason)} className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{loadingId === failureTarget.id ? "Menyimpan..." : "Konfirmasi"}</button></div></div>
        </div>
      ) : null}

    </div>
  );
}


export default CourierDashboard;
