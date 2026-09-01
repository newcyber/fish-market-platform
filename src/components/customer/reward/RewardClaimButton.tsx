"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";

type RewardClaimButtonProps = {
  rewardCatalogId: string;
  rewardName: string;
  requiredPoints: number;
};

type ClaimResponse = {
  success: boolean;
  message: string;
};

export default function RewardClaimButton({
  rewardCatalogId,
  rewardName,
  requiredPoints,
}: RewardClaimButtonProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState<string | null>(null);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  function handleOpenConfirm() {
    if (isPending) {
      return;
    }

    setMessage(null);
    setError(null);
    setShowConfirm(true);
  }

  function handleCloseConfirm() {
    if (isPending) {
      return;
    }

    setShowConfirm(false);
  }

  function handleClaim() {
    if (
      isPending ||
      !rewardCatalogId
    ) {
      return;
    }

    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response =
          await fetch(
            "/api/rewards/claims",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                rewardCatalogId,
              }),
            }
          );

        const result =
          (await response.json()) as ClaimResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          setError(
            result.message ||
              "Gagal melakukan claim reward."
          );

          return;
        }

        setShowConfirm(false);

        setMessage(
          result.message ||
            `Reward ${rewardName} berhasil diklaim.`
        );
      } catch {
        setError(
          "Tidak dapat terhubung ke server. Silakan coba lagi."
        );
      }
    });
  }

  return (
    <>
      {/* ================================================== */}
      {/* CLAIM BUTTON */}
      {/* ================================================== */}

      <button
        type="button"
        onClick={
          handleOpenConfirm
        }
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-xl bg-cyan-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          "Tukar Reward"
        )}
      </button>

      {/* ================================================== */}
      {/* SUCCESS MESSAGE */}
      {/* ================================================== */}

      {message && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-800">
              Reward berhasil diklaim
            </p>

            <p className="mt-1 text-sm leading-5 text-emerald-700">
              {message}
            </p>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* ERROR MESSAGE */}
      {/* ================================================== */}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium leading-5 text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* ================================================== */}
      {/* CONFIRMATION MODAL */}
      {/* ================================================== */}

      {showConfirm && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">
                  Konfirmasi Reward
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Tukarkan Reward?
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseConfirm
                }
                disabled={isPending}
                aria-label="Tutup"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* DESCRIPTION */}

            <p className="mt-5 text-sm leading-6 text-slate-600">
              Anda akan menukarkan{" "}
              <strong className="text-slate-900">
                {requiredPoints.toLocaleString(
                  "id-ID"
                )}{" "}
                Poin
              </strong>{" "}
              untuk mendapatkan:
            </p>

            {/* REWARD */}

            <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
              <p className="text-base font-bold text-slate-900">
                {rewardName}
              </p>

              <p className="mt-1 text-sm text-cyan-700">
                {requiredPoints.toLocaleString(
                  "id-ID"
                )}{" "}
                Poin
              </p>
            </div>

            {/* WARNING */}

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs leading-5 text-amber-800">
                Setelah penukaran berhasil,
                Reward Point akan langsung
                dikurangi dan claim reward
                dibuat.
              </p>
            </div>

            {/* ACTIONS */}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  handleCloseConfirm
                }
                disabled={isPending}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={
                  handleClaim
                }
                disabled={isPending}
                className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Ya, Tukarkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
