"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Gift,
  Package,
  Coins,
} from "lucide-react";

import type {
  RewardCatalogItem,
} from "./RewardCatalog";

/**
 * ============================================================
 * PROPS
 * ============================================================
 */

type RewardCardProps = {
  reward: RewardCatalogItem;

  rewardPoints: number;
};

/**
 * ============================================================
 * FORMAT POINT
 * ============================================================
 */

function formatPoints(
  value: number
): string {
  return value.toLocaleString(
    "id-ID"
  );
}

/**
 * ============================================================
 * CARD
 * ============================================================
 */

export default function RewardCard({
  reward,
  rewardPoints,
}: RewardCardProps) {
  const canRedeem =
    rewardPoints >=
    reward.requiredPoints;

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:rounded-2xl">
      {/* ====================================================
          IMAGE
      ==================================================== */}

      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {reward.image ? (
          <Image
            src={reward.image}
            alt={
              reward.name
            }
            fill
            sizes="
              (max-width: 639px) 33vw,
              (max-width: 767px) 25vw,
              (max-width: 1279px) 25vw,
              20vw
            "
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl">
              <Gift className="h-5 w-5 text-slate-300 sm:h-7 sm:w-7" />
            </div>
          </div>
        )}

        {/* ==================================================
            POINT BADGE
        ================================================== */}

        <div className="absolute left-1.5 top-1.5 inline-flex max-w-[calc(100%-12px)] items-center gap-1 rounded-full bg-slate-900/90 px-2 py-1 text-[9px] font-bold leading-none text-white shadow-sm backdrop-blur sm:left-2 sm:top-2 sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-[10px]">
          <Coins className="h-2.5 w-2.5 shrink-0 text-cyan-300 sm:h-3 sm:w-3" />

          <span className="truncate">
            {formatPoints(
              reward.requiredPoints
            )}
          </span>

          <span className="hidden sm:inline">
            Poin
          </span>
        </div>
      </div>

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <div className="p-2 sm:p-3.5 lg:p-4">
        {/* ==================================================
            CATEGORY
        ================================================== */}

        {reward.category ? (
          <p className="mb-1 line-clamp-1 text-[8px] font-bold uppercase tracking-wide text-cyan-600 sm:text-[9px]">
            {
              reward.category
                .name
            }
          </p>
        ) : null}

        {/* ==================================================
            NAME
        ================================================== */}

        <h3 className="line-clamp-2 min-h-[2.25rem] text-[11px] font-bold leading-4 text-slate-900 sm:min-h-[2.75rem] sm:text-sm sm:leading-5 lg:text-base">
          {reward.name}
        </h3>

        {/* ==================================================
            DESCRIPTION

            Di mobile disembunyikan agar 3-column tetap
            nyaman digunakan.
        ================================================== */}

        {reward.description ? (
          <p className="mt-1 hidden line-clamp-2 text-xs leading-5 text-slate-500 sm:mt-1.5 sm:block">
            {
              reward.description
            }
          </p>
        ) : null}

        {/* ==================================================
            STOCK
        ================================================== */}

        <div className="mt-2 flex items-center gap-1 text-[9px] font-medium text-slate-500 sm:mt-3 sm:gap-1.5 sm:text-[11px]">
          <Package className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />

          <span className="truncate">
            Stok{" "}
            {formatPoints(
              reward.stock
            )}
          </span>
        </div>

        {/* ==================================================
            POINT STATUS
        ================================================== */}

        <div
          className={
            canRedeem
              ? "mt-2 rounded-lg bg-cyan-50 px-2 py-1.5 sm:mt-3 sm:rounded-xl sm:px-2.5 sm:py-2"
              : "mt-2 rounded-lg bg-slate-50 px-2 py-1.5 sm:mt-3 sm:rounded-xl sm:px-2.5 sm:py-2"
          }
        >
          <p className="text-[8px] font-medium text-slate-500 sm:text-[10px]">
            Saldo Anda
          </p>

          <p
            className={
              canRedeem
                ? "mt-0.5 truncate text-[10px] font-bold text-cyan-700 sm:text-xs"
                : "mt-0.5 truncate text-[10px] font-bold text-slate-700 sm:text-xs"
            }
          >
            {formatPoints(
              rewardPoints
            )}{" "}
            <span className="hidden sm:inline">
              Poin
            </span>
          </p>
        </div>

        {/* ==================================================
            ACTION
        ================================================== */}

        <Link
  href={`/customer/rewards/${reward.id}`}
          className="mt-2 flex min-h-8 w-full items-center justify-center rounded-lg bg-slate-900 px-1.5 py-2 text-[9px] font-bold text-white transition hover:bg-slate-800 sm:mt-3 sm:min-h-9 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-xs"
        >
          Lihat Hadiah
        </Link>
      </div>
    </article>
  );
}
