"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  Gift,
  X,
} from "lucide-react";

import {
  markRewardAsViewedAction,
} from "@/actions/reward-point/mark-reward-viewed";

type RewardPointPopupProps = {
  reward: {
    id: string;
    points: number;
    weightGrams: number | null;
    description: string | null;
  };
};

export default function RewardPointPopup({
  reward,
}: RewardPointPopupProps) {
  const [
    open,
    setOpen,
  ] = useState(true);

  const [
    isPending,
    startTransition,
  ] = useTransition();

  function handleClose() {
    if (isPending) {
      return;
    }

    startTransition(
      async () => {
        const result =
          await markRewardAsViewedAction(
            reward.id
          );

        if (!result.success) {
          console.error(
            result.message
          );
        }

        setOpen(false);
      }
    );
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* CLOSE */}

        <button
          type="button"
          onClick={handleClose}
          disabled={isPending}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>

        {/* HEADER */}

        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 px-6 pb-8 pt-10 text-center text-white">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/25">
            <Gift className="h-10 w-10" />
          </div>

          <p className="mt-5 text-sm font-medium text-cyan-100">
            Selamat!
          </p>

          <h2 className="mt-1 text-3xl font-black">
            Kamu mendapatkan
          </h2>

          <div className="mt-3 text-5xl font-black tracking-tight">
            +{reward.points}
          </div>

          <p className="mt-1 text-lg font-bold">
            Reward Point
          </p>

        </div>

        {/* CONTENT */}

        <div className="px-6 py-6 text-center">

          <p className="text-sm leading-6 text-slate-600">
            Terima kasih sudah berbelanja.
            Point reward dari pesanan kamu
            telah ditambahkan ke saldo akun.
          </p>

          {reward.weightGrams !== null &&
            reward.weightGrams > 0 && (
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Total pembelian
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {(
                    reward.weightGrams /
                    1000
                  ).toLocaleString(
                    "id-ID",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}{" "}
                  kg
                </p>
              </div>
            )}

          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "Menyimpan..."
              : "Mantap!"}
          </button>

        </div>
      </div>
    </div>
  );
}