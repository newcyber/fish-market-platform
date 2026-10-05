"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Truck, X } from "lucide-react";

type Candidate = {
  courierId: string;
  courierName: string;
  phone?: string | null;
  rank: number;
  score: number;
  activeAssignments: number;
  metrics?: {
    workload?: number;
    sla?: number;
    success?: number;
    deliveryTime?: number;
    retry?: number;
  };
  reasons?: string[];
};

type Props = {
  orderId: string;
  orderNumber: string;
};

export default function AssignCourierOrderButton({
  orderId,
  orderNumber,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [error, setError] = useState("");

  async function openDialog() {
    setOpen(true);
    setLoading(true);
    setError("");
    setCandidates([]);
    setSelectedCourier("");

    try {
      const response = await fetch(
        `/api/admin/courier/dispatch/candidates?orderId=${encodeURIComponent(orderId)}`,
        { cache: "no-store" },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Gagal memuat daftar courier.");
      }

      const nextCandidates = Array.isArray(payload?.data?.candidates)
        ? payload.data.candidates
        : [];

      setCandidates(nextCandidates);

      if (nextCandidates.length > 0) {
        setSelectedCourier(nextCandidates[0].courierId);
      } else {
        setError("Tidak ada courier aktif yang tersedia untuk order ini.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat daftar courier.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function assignCourier() {
    if (!selectedCourier) {
      setError("Pilih courier terlebih dahulu.");
      return;
    }

    setAssigning(selectedCourier);
    setError("");

    try {
      const response = await fetch("/api/admin/courier/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          courierId: selectedCourier,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message || "Gagal menugaskan courier.",
        );
      }

      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menugaskan courier.",
      );
    } finally {
      setAssigning(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--pisjo-ocean)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Truck className="h-4 w-4" />
        Tugaskan Courier
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-[var(--pisjo-navy)]">
                  Tugaskan Courier
                </h2>
                <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                  Pilih courier untuk order {orderNumber}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={Boolean(assigning)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {loading ? (
                <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Menghitung courier terbaik...
                </div>
              ) : candidates.length > 0 ? (
                <div className="space-y-2">
                  {candidates.map((candidate) => {
                    const selected = selectedCourier === candidate.courierId;

                    return (
                      <button
                        key={candidate.courierId}
                        type="button"
                        onClick={() => setSelectedCourier(candidate.courierId)}
                        disabled={Boolean(assigning)}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-[var(--pisjo-ocean)] bg-[var(--pisjo-soft-blue)]/50 ring-1 ring-[var(--pisjo-ocean)]"
                            : "border-slate-200 bg-white hover:border-[var(--pisjo-ocean)]/40 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-[var(--pisjo-navy)]">
                                {candidate.courierName}
                              </p>
                              {selected ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--pisjo-ocean)]" />
                              ) : null}
                            </div>

                            {candidate.phone ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {candidate.phone}
                              </p>
                            ) : null}
                          </div>

                          <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                            Score {candidate.score}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            {candidate.activeAssignments} order aktif
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            Rank #{candidate.rank}
                          </span>
                        </div>

                        {candidate.reasons?.length ? (
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {candidate.reasons.slice(0, 2).join(" · ")}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={Boolean(assigning)}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={assignCourier}
                disabled={loading || !selectedCourier || Boolean(assigning)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--pisjo-ocean)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menugaskan...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" />
                    Tugaskan Courier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
