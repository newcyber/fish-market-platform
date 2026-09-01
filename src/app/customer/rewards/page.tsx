import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  ArrowLeft,
  Gift,
  Info,
  PackageCheck,
  WalletCards,
} from "lucide-react";

import {
  auth,
} from "@/auth";

import CustomerService from "@/services/customer/customer.service";

import {
  RewardCatalogService,
} from "@/services/reward/reward-catalog.service";

import RewardCatalog from "@/components/customer/reward/RewardCatalog";

import type {
  RewardCatalogItem,
} from "@/components/customer/reward/RewardCatalog";

/**
 * ============================================================
 * CUSTOMER REWARD CATALOG PAGE
 * ============================================================
 *
 * URL:
 *
 * /customer/rewards
 *
 * ============================================================
 */

export default async function CustomerRewardsPage() {
  /**
   * ==========================================================
   * 1. AUTHENTICATION
   * ==========================================================
   */

  const session =
    await auth();

  if (
    !session?.user?.id
  ) {
    redirect("/login");
  }

  /**
   * ==========================================================
   * 2. ROLE CHECK
   * ==========================================================
   */

  if (
    session.user.role !==
    "CUSTOMER"
  ) {
    redirect("/admin");
  }

  /**
   * ==========================================================
   * 3. LOAD CUSTOMER + REWARDS
   * ==========================================================
   */

  const [
    customer,
    rewards,
  ] =
    await Promise.all([
      CustomerService.getCustomerById(
        session.user.id
      ),

      RewardCatalogService.getAvailableRewards(),
    ]);

  /**
   * ==========================================================
   * 4. VALIDATE CUSTOMER
   * ==========================================================
   */

  if (
    !customer
  ) {
    redirect("/login");
  }

  if (
    !customer.isActive
  ) {
    redirect("/login");
  }

  /**
   * ==========================================================
   * 5. CUSTOMER DISPLAY DATA
   * ==========================================================
   */

  const customerName =
    customer.name?.trim() ||
    "Customer";

  const rewardPoints =
    customer.rewardPointsBalance ??
    0;

  /**
   * ==========================================================
   * 6. MAP REWARD DATA
   * ==========================================================
   *
   * Relation category dikirim ke frontend supaya:
   *
   * - filter kategori dapat bekerja
   * - nama kategori dapat ditampilkan di card
   */

  const rewardItems:
    RewardCatalogItem[] =
    rewards.map(
      (
        reward
      ) => ({
        id:
          reward.id,

        name:
          reward.name,

        description:
          reward.description,

        image:
          reward.image,

        categoryId:
          reward.categoryId,

        category:
          reward.category
            ? {
                id:
                  reward.category.id,

                name:
                  reward.category.name,

                slug:
                  reward.category.slug,

                isActive:
                  reward.category.isActive,

                sortOrder:
                  reward.category.sortOrder,
              }
            : null,

        requiredPoints:
          reward.requiredPoints,

        stock:
          reward.stock,

        isActive:
          reward.isActive,

        sortOrder:
          reward.sortOrder,
      })
    );

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
  <main className="min-h-screen bg-slate-50">
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* BACK */}
      <div className="mb-6">
        <Link
          href="/customer/account"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Akun
        </Link>
      </div>

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="relative overflow-hidden rounded-2xl bg-slate-900 px-4 py-5 text-white shadow-sm sm:rounded-3xl sm:px-8 sm:py-10">
          {/* DECORATION */}

          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10" />

          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-500/5" />

          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              {/* TITLE */}

              <div className="max-w-2xl">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <Gift className="h-5 w-5 text-cyan-300 sm:h-6 sm:w-6" />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300 sm:text-xs sm:tracking-[0.18em]">
                      Reward Catalog
                    </p>

                    <h1 className="mt-0.5 text-xl font-black tracking-tight sm:text-3xl">
                      Tukarkan Point Anda
                    </h1>
                  </div>
                </div>

                <p className="mt-3 max-w-xl text-xs leading-6 text-slate-300 sm:mt-5 sm:text-base sm:leading-7">
                  Gunakan Reward Point yang
                  telah Anda kumpulkan untuk
                  mendapatkan berbagai hadiah
                  menarik.
                </p>
              </div>

              {/* BALANCE */}

              <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm sm:rounded-2xl sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-300 sm:text-xs sm:tracking-[0.14em]">
                      Saldo Anda
                    </p>

                    <div className="mt-1 flex items-end gap-1.5 sm:mt-2 sm:gap-2">
                      <span className="text-2xl font-black tracking-tight sm:text-3xl">
                        {rewardPoints.toLocaleString(
                          "id-ID"
                        )}
                      </span>

                      <span className="mb-0.5 text-xs font-semibold text-slate-300 sm:mb-1 sm:text-sm">
                        Poin
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-400 sm:mt-2 sm:text-xs">
                      Halo,{" "}
                      {customerName}.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <WalletCards className="h-5 w-5 text-cyan-300 sm:h-6 sm:w-6" />
                  </div>
                </div>

                <Link
                  href="/customer/account"
                  className="mt-3 inline-flex items-center gap-2 text-[10px] font-semibold text-cyan-300 transition hover:text-cyan-200 sm:mt-4 sm:text-xs"
                >
                  Lihat akun saya

                  <span aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            INFORMATION
        ================================================== */}

        <section className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 p-3 sm:mt-6 sm:rounded-2xl sm:p-5">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white sm:h-9 sm:w-9 sm:rounded-xl">
              <Info className="h-4 w-4 text-cyan-600" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900 sm:text-sm">
                Cara menggunakan Reward
                Point
              </p>

              <p className="mt-1 text-[10px] leading-5 text-slate-600 sm:text-sm">
                Pilih hadiah yang Anda
                inginkan, pastikan saldo
                point mencukupi, kemudian
                lakukan penukaran. Setiap
                penukaran akan menggunakan
                point sesuai nilai hadiah.
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            CATALOG HEADER
        ================================================== */}

        <div className="mt-7 flex flex-col gap-2 sm:mt-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 sm:text-xs sm:tracking-[0.16em]">
              Hadiah Tersedia
            </p>

            <h2 className="mt-0.5 text-xl font-black tracking-tight text-slate-900 sm:mt-1 sm:text-2xl">
              Pilih hadiah Anda
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
              Temukan hadiah berdasarkan
              kategori atau lihat seluruh
              hadiah yang tersedia.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200 sm:px-3 sm:py-2 sm:text-xs">
            <PackageCheck className="h-3.5 w-3.5 text-cyan-600 sm:h-4 sm:w-4" />

            {rewardItems.length.toLocaleString(
              "id-ID"
            )}{" "}
            hadiah tersedia
          </div>
        </div>

        {/* ==================================================
            CATALOG
        ================================================== */}

        <section className="mt-4 sm:mt-6">
          <RewardCatalog
            rewards={
              rewardItems
            }
            rewardPoints={
              rewardPoints
            }
          />
        </section>
      </div>
    </main>
  );
}
