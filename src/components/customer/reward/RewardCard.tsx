"use client";

import Image from "next/image";

import {
  Gift,
  Package,
  Coins,
} from "lucide-react";

import type {
  RewardCatalogItem,
} from "./RewardCatalog";

type RewardCardProps = {
  reward: RewardCatalogItem;
  rewardPoints: number;
};

function formatPoints(
  value: number
): string {
  return value.toLocaleString("id-ID");
}

export default function RewardCard({
  reward,
  rewardPoints,
}: RewardCardProps) {
  const canRedeem =
    rewardPoints >= reward.requiredPoints;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">

      {/* ================================================== */}
      {/* IMAGE */}
      {/* ================================================== */}

      <div className="relative aspect-square overflow-hidden bg-slate-100">

        {reward.image ? (
          <Image
            src={reward.image}
            alt={reward.name}
            fill
            sizes="
              (max-width: 640px) 100vw,
              (max-width: 1024px) 50vw,
              (max-width: 1280px) 33vw,
              25vw
            "
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
              <Gift className="h-9 w-9 text-slate-300" />
            </div>
          </div>
        )}

        {/* POINT BADGE */}

        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur">

          <Coins className="h-3.5 w-3.5 text-cyan-300" />

          {formatPoints(
            reward.requiredPoints
          )}{" "}
          Poin

        </div>

      </div>

      {/* ================================================== */}
      {/* CONTENT */}
      {/* ================================================== */}

      <div className="p-5">

        <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-slate-900">
          {reward.name}
        </h3>

        {reward.description ? (
          <p className="mt-2 line-clamp-3 min-h-15 text-sm leading-5 text-slate-500">
            {reward.description}
          </p>
        ) : (
          <p className="mt-2 min-h-15 text-sm leading-5 text-slate-400">
            Hadiah menarik yang dapat ditukarkan
            menggunakan Reward Point.
          </p>
        )}

        {/* STOCK */}

        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">

          <Package className="h-4 w-4" />

          <span>
            Tersedia {reward.stock} hadiah
          </span>

        </div>

        {/* POINT STATUS */}

        <div
          className={
            canRedeem
              ? "mt-4 rounded-xl bg-cyan-50 px-3 py-2.5"
              : "mt-4 rounded-xl bg-slate-50 px-3 py-2.5"
          }
        >

          <p className="text-xs font-medium text-slate-500">
            Saldo Anda
          </p>

          <p
            className={
              canRedeem
                ? "mt-0.5 text-sm font-bold text-cyan-700"
                : "mt-0.5 text-sm font-bold text-slate-700"
            }
          >
            {formatPoints(
              rewardPoints
            )}{" "}
            Poin
          </p>

        </div>

        {/* ACTION */}

        <button
          type="button"
          disabled={!canRedeem}
          className="
            mt-4
            w-full
            rounded-xl
            bg-slate-900
            px-4
            py-3
            text-sm
            font-bold
            text-white
            transition
            hover:bg-slate-800
            disabled:cursor-not-allowed
            disabled:bg-slate-100
            disabled:text-slate-400
          "
        >
          {canRedeem
            ? "Tukarkan Point"
            : `Butuh ${formatPoints(
                reward.requiredPoints
              )} Poin`}
        </button>

      </div>

    </article>
  );
}
