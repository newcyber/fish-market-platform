"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  CheckCircle2,
  Loader2,
  MapPin,
  X,
} from "lucide-react";

type RewardAddress = {
  id: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
  fullAddress: string;
  label?: string | null;
  notes?: string | null;
  isDefault: boolean;
};

type RewardClaimButtonProps = {
  rewardCatalogId: string;
  rewardName: string;
  requiredPoints: number;
  addresses: RewardAddress[];
};

type ClaimResponse = {
  success: boolean;
  message: string;
};

export default function RewardClaimButton({
  rewardCatalogId,
  rewardName,
  requiredPoints,
  addresses,
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
    selectedAddressId,
    setSelectedAddressId,
  ] = useState<string | null>(
    addresses.find(
      (address) => address.isDefault
    )?.id ??
      addresses[0]?.id ??
      null
  );

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

    const defaultAddress =
      addresses.find(
        (address) => address.isDefault
      );

    setSelectedAddressId(
      defaultAddress?.id ??
        addresses[0]?.id ??
        null
    );

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

    if (!selectedAddressId) {
      setError(
        "Silakan pilih alamat pengiriman terlebih dahulu."
      );

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
                addressId:
                  selectedAddressId,
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
        disabled={
          isPending ||
          addresses.length === 0
        }
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--pisjo-primary)] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[var(--pisjo-ocean)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {addresses.length === 0
          ? "Tambahkan Alamat Dahulu"
          : isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Tukar Reward"
            )}
      </button>

      {/* ================================================== */}
      {/* NO ADDRESS INFO */}
      {/* ================================================== */}

      {addresses.length === 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                Alamat pengiriman belum tersedia
              </p>

              <p className="mt-1 text-sm leading-5 text-amber-700">
                Tambahkan alamat pengiriman
                terlebih dahulu sebelum
                menukarkan reward.
              </p>
            </div>
          </div>
        </div>
      )}

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
        <div className="fixed inset-0 z-110 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
          <div className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--pisjo-primary)]">
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

            <div className="mt-4 rounded-2xl border border-[var(--pisjo-soft-blue)] bg-[var(--pisjo-soft-blue)] p-4">
              <p className="text-base font-bold text-slate-900">
                {rewardName}
              </p>

              <p className="mt-1 text-sm font-semibold text-[var(--pisjo-ocean)]">
                {requiredPoints.toLocaleString(
                  "id-ID"
                )}{" "}
                Poin
              </p>
            </div>

            {/* SHIPPING ADDRESS */}

            <div className="mt-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--pisjo-primary)]" />

                <p className="text-sm font-bold text-slate-900">
                  Alamat Pengiriman
                </p>
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Reward akan dikirim ke alamat
                yang Anda pilih.
              </p>

              <div className="mt-3 space-y-3">
                {addresses.map(
                  (address) => {
                    const isSelected =
                      selectedAddressId ===
                      address.id;

                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() =>
                          setSelectedAddressId(
                            address.id
                          )
                        }
                        disabled={
                          isPending
                        }
                        className={[
                          "w-full rounded-2xl border p-4 text-left transition",
                          "disabled:cursor-not-allowed disabled:opacity-60",
                          isSelected
                            ? "border-[var(--pisjo-primary)] bg-[var(--pisjo-soft-blue)] ring-1 ring-[var(--pisjo-primary)]"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={[
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              isSelected
                                ? "border-[var(--pisjo-primary)]"
                                : "border-slate-300",
                            ].join(" ")}
                            aria-hidden="true"
                          >
                            {isSelected && (
                              <span className="h-2.5 w-2.5 rounded-full bg-[var(--pisjo-primary)]" />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">
                                {address.receiverName}
                              </p>

                              {address.label && (
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                  {address.label}
                                </span>
                              )}

                              {address.isDefault && (
                                <span className="rounded-full bg-[var(--pisjo-primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                                  Utama
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs font-medium text-slate-600">
                              {address.receiverPhone}
                            </p>

                            <p className="mt-2 text-xs leading-5 text-slate-600">
                              {address.fullAddress}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {address.village},{" "}
                              {address.district},{" "}
                              {address.city},{" "}
                              {address.province}{" "}
                              {address.postalCode}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* WARNING */}

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs leading-5 text-amber-800">
                Setelah penukaran berhasil,
                Reward Point akan langsung
                dikurangi dan claim reward
                dibuat menggunakan alamat
                yang Anda pilih.
              </p>
            </div>

            {/* ERROR INSIDE MODAL */}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs leading-5 text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* ACTIONS */}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  handleCloseConfirm
                }
                disabled={isPending}
                className="min-h-11 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={
                  handleClaim
                }
                disabled={
                  isPending ||
                  !selectedAddressId
                }
                className="min-h-11 rounded-xl bg-[var(--pisjo-primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--pisjo-ocean)] disabled:cursor-not-allowed disabled:opacity-50"
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
