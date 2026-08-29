"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  Gift,
  CheckCircle2,
} from "lucide-react";

import {
  VoucherDiscountType,
} from "@prisma/client";

import {
  redeemRewardVoucherAction,
} from "@/actions/reward-voucher/redeem-reward-voucher";

type RewardVoucherItem = {
  id: string;
  name: string;
  requiredPoints: number;
  discountType: VoucherDiscountType;
  discountValue: number;
  minimumPurchase: number | null;
  maximumDiscount: number | null;
  sortOrder: number;
};

type RewardVoucherSectionProps = {
  rewardPoints: number;
  rewards: RewardVoucherItem[];
};

function formatRupiah(
  value: number
): string {
  return value.toLocaleString(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  );
}

function formatDiscount(
  reward: RewardVoucherItem
): string {
  if (
    reward.discountType ===
    VoucherDiscountType.PERCENTAGE
  ) {
    return `${reward.discountValue}%`;
  }

  return formatRupiah(
    reward.discountValue
  );
}

export default function RewardVoucherSection({
  rewardPoints,
  rewards,
}: RewardVoucherSectionProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    selectedReward,
    setSelectedReward,
  ] = useState<RewardVoucherItem | null>(
    null
  );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(
    null
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  function handleRedeem(
    reward: RewardVoucherItem
  ) {
    if (isPending) {
      return;
    }

    setSelectedReward(reward);
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  function handleConfirmRedeem() {
    if (
      !selectedReward ||
      isPending
    ) {
      return;
    }

    startTransition(
      async () => {
        const result =
          await redeemRewardVoucherAction(
            selectedReward.id
          );

        if (!result.success) {
          setErrorMessage(
            result.message
          );

          return;
        }

        setSuccessMessage(
          result.message
        );

        setSelectedReward(null);
      }
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
            <Gift className="h-5 w-5 text-cyan-600" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">
              Reward Voucher
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Tukarkan Point Anda
            </h2>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Gunakan Reward Point untuk mendapatkan
          voucher belanja.
        </p>
      </div>

      {successMessage && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <p className="text-sm font-medium text-emerald-700">
            {successMessage}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-6 text-center">
          <p className="text-sm font-medium text-slate-700">
            Belum ada reward voucher tersedia.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rewards.map(
            (reward) => {
              const canRedeem =
                rewardPoints >=
                reward.requiredPoints;

              return (
                <div
                  key={reward.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {reward.name}
                      </h3>

                      <p className="mt-1 text-2xl font-black text-cyan-600">
                        {formatDiscount(
                          reward
                        )}
                      </p>
                    </div>

                    <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                      {reward.requiredPoints.toLocaleString(
                        "id-ID"
                      )}{" "}
                      Poin
                    </div>
                  </div>

                  {reward.minimumPurchase !==
                    null && (
                    <p className="mt-4 text-xs text-slate-500">
                      Minimum pembelian{" "}
                      {formatRupiah(
                        reward.minimumPurchase
                      )}
                    </p>
                  )}

                  {reward.maximumDiscount !==
                    null &&
                    reward.discountType ===
                      VoucherDiscountType.PERCENTAGE && (
                      <p className="mt-1 text-xs text-slate-500">
                        Maksimal diskon{" "}
                        {formatRupiah(
                          reward.maximumDiscount
                        )}
                      </p>
                    )}

                  <button
                    type="button"
                    onClick={() =>
                      handleRedeem(
                        reward
                      )
                    }
                    disabled={
                      !canRedeem ||
                      isPending
                    }
                    className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {canRedeem
                      ? "Tukarkan Point"
                      : `Butuh ${reward.requiredPoints.toLocaleString(
                          "id-ID"
                        )} Poin`}
                  </button>
                </div>
              );
            }
          )}
        </div>
      )}

      {selectedReward && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">
              Konfirmasi Penukaran
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Tukarkan{" "}
              <strong>
                {selectedReward.requiredPoints.toLocaleString(
                  "id-ID"
                )}{" "}
                Poin
              </strong>{" "}
              untuk mendapatkan{" "}
              <strong>
                {selectedReward.name}
              </strong>
              ?
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">
                  Saldo saat ini
                </span>

                <span className="font-semibold text-slate-900">
                  {rewardPoints.toLocaleString(
                    "id-ID"
                  )}{" "}
                  Poin
                </span>
              </div>

              <div className="mt-2 flex justify-between gap-4 text-sm">
                <span className="text-slate-500">
                  Point digunakan
                </span>

                <span className="font-semibold text-red-600">
                  -
                  {selectedReward.requiredPoints.toLocaleString(
                    "id-ID"
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setSelectedReward(null)
                }
                disabled={isPending}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={
                  handleConfirmRedeem
                }
                disabled={isPending}
                className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending
                  ? "Menukarkan..."
                  : "Ya, Tukarkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}