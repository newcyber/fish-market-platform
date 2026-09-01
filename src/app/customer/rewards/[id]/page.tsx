import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  Gift,
  PackageCheck,
  Coins,
} from "lucide-react";

import {
  RewardCatalogService,
} from "@/services/reward/reward-catalog.service";

import RewardClaimButton from "@/components/customer/reward/RewardClaimButton";

/**
 * ============================================================
 * CUSTOMER REWARD DETAIL PAGE
 * ============================================================
 *
 * URL:
 *
 * /customer/rewards/[id]
 *
 * Halaman ini menampilkan detail reward fisik yang tersedia
 * untuk customer.
 *
 * Data reward diambil langsung melalui:
 *
 * RewardCatalogService
 *
 * Customer hanya dapat melihat reward yang:
 *
 * - ditemukan
 * - aktif
 * - stock > 0
 *
 * ============================================================
 */

type RewardDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * ============================================================
 * FORMAT POINT
 * ============================================================
 */

function formatPoints(
  value: number
): string {
  return new Intl.NumberFormat(
    "id-ID"
  ).format(value);
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default async function RewardDetailPage({
  params,
}: RewardDetailPageProps) {
  /**
   * ==========================================================
   * GET PARAMETER
   * ==========================================================
   */

  const { id } = await params;

  /**
   * ==========================================================
   * GET REWARD
   * ==========================================================
   *
   * Service memastikan reward:
   *
   * - exists
   * - active
   * - stock > 0
   */

  const reward =
    await RewardCatalogService.getAvailableRewardById(
      id
    );

  /**
   * ==========================================================
   * NOT FOUND
   * ==========================================================
   *
   * Jangan menampilkan reward yang:
   *
   * - tidak ditemukan
   * - inactive
   * - stock habis
   */

  if (!reward) {
    notFound();
  }

  /**
   * ==========================================================
   * DISPLAY DATA
   * ==========================================================
   */

  const description =
    reward.description?.trim() ||
    "Reward spesial yang dapat Anda tukarkan menggunakan Reward Point.";

  const stockLabel =
    reward.stock === 1
      ? "1 tersedia"
      : `${formatPoints(
          reward.stock
        )} tersedia`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* BACK NAVIGATION */}
        {/* ================================================== */}

        <div className="mb-6">
          <Link
            href="/customer/rewards"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />

            Kembali ke Reward Catalog
          </Link>
        </div>

        {/* ================================================== */}
        {/* DETAIL CARD */}
        {/* ================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="grid lg:grid-cols-2">

            {/* ============================================== */}
            {/* IMAGE */}
            {/* ============================================== */}

            <div className="relative min-h-80 bg-slate-100 sm:min-h-105 lg:min-h-140">

              {reward.image ? (
                <Image
                  src={reward.image}
                  alt={reward.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-8 sm:p-12"
                />
              ) : (
                <div className="flex h-full min-h-80 items-center justify-center sm:min-h-105 lg:min-h-140">
                  <div className="flex flex-col items-center justify-center text-center">

                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
                      <Gift className="h-10 w-10 text-cyan-600" />
                    </div>

                    <p className="mt-4 text-sm font-medium text-slate-400">
                      Gambar reward belum tersedia
                    </p>

                  </div>
                </div>
              )}

            </div>

            {/* ============================================== */}
            {/* INFORMATION */}
            {/* ============================================== */}

            <div className="flex flex-col p-6 sm:p-8 lg:p-10">

              {/* BADGE */}

              <div className="flex items-center gap-2">

                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">
                  <Gift className="h-3.5 w-3.5" />

                  Reward
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <PackageCheck className="h-3.5 w-3.5" />

                  {stockLabel}
                </span>

              </div>

              {/* NAME */}

              <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {reward.name}
              </h1>

              {/* DESCRIPTION */}

              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-900">
                  Tentang Reward
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {description}
                </p>
              </div>

              {/* POINT CARD */}

              <div className="mt-7 rounded-2xl border border-cyan-100 bg-cyan-50 p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                    <Coins className="h-5 w-5 text-cyan-600" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
                      Dibutuhkan
                    </p>

                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tight text-slate-900">
                        {formatPoints(
                          reward.requiredPoints
                        )}
                      </span>

                      <span className="text-sm font-semibold text-slate-600">
                        Poin
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* STOCK INFO */}

              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">

                <div className="flex items-center justify-between gap-4">

                  <div className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-slate-500" />

                    <span className="text-sm text-slate-600">
                      Ketersediaan
                    </span>
                  </div>

                  <span className="text-sm font-bold text-slate-900">
                    {stockLabel}
                  </span>

                </div>

              </div>

              {/* CLAIM INFO */}

              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

                <p className="text-xs leading-5 text-amber-800">
                  Penukaran reward akan menggunakan
                  Reward Point Anda. Pastikan saldo
                  poin mencukupi sebelum melakukan
                  penukaran.
                </p>

              </div>

              {/* ================================================== */}
              {/* ACTION */}
              {/* ================================================== */}

                <div className="mt-7">

                        <RewardClaimButton
                    rewardCatalogId={reward.id}
                  rewardName={reward.name}
                requiredPoints={
              reward.requiredPoints
                      }
                        />

              </div>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}
