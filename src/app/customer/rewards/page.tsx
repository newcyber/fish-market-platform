import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowLeft,
  Gift,
  Info,
  PackageCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { auth } from "@/auth";

import CustomerService from "@/services/customer/customer.service";

import {
  RewardCatalogService,
} from "@/services/reward/reward-catalog.service";

/**
 * ============================================================
 * CUSTOMER REWARD CATALOG PAGE
 * ============================================================
 *
 * /customer/rewards
 *
 * Halaman katalog hadiah fisik yang dapat ditukarkan
 * menggunakan Reward Point.
 *
 * SECURITY:
 *
 * - Customer harus login.
 * - Customer harus aktif.
 * - Role harus CUSTOMER.
 *
 * DATA:
 *
 * RewardCatalogService hanya mengembalikan reward:
 *
 * - isActive = true
 * - stock > 0
 *
 * Proses claim TIDAK dilakukan di halaman ini.
 *
 * Claim akan menggunakan:
 *
 * POST /api/rewards/claims
 *
 * ============================================================
 */

export default async function CustomerRewardsPage() {
  /**
   * ==========================================================
   * 1. AUTHENTICATION
   * ==========================================================
   */

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  /**
   * ==========================================================
   * 2. ROLE CHECK
   * ==========================================================
   */

  if (session.user.role !== "CUSTOMER") {
    redirect("/admin");
  }

  /**
   * ==========================================================
   * 3. LOAD CUSTOMER + REWARDS
   * ==========================================================
   *
   * Customer diambil berdasarkan session.user.id.
   *
   * Tidak ada userId dari URL atau client.
   */

  const [
    customer,
    rewards,
  ] = await Promise.all([
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

  if (!customer) {
    redirect("/login");
  }

  if (!customer.isActive) {
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
    customer.rewardPointsBalance ?? 0;

  /**
   * ==========================================================
   * 6. RENDER
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* BACK */}
        {/* ================================================== */}

        <div className="mb-6">
          <Link
            href="/customer/account"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Akun
          </Link>
        </div>

        {/* ================================================== */}
        {/* HERO */}
        {/* ================================================== */}

        <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-sm sm:px-8 sm:py-10">

          {/* DECORATION */}

          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10" />

          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-500/5" />

          <div className="relative">

            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

              {/* TITLE */}

              <div className="max-w-2xl">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <Gift className="h-6 w-6 text-cyan-300" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                      Reward Catalog
                    </p>

                    <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Tukarkan Point Anda
                    </h1>
                  </div>

                </div>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  Gunakan Reward Point yang telah Anda
                  kumpulkan untuk mendapatkan berbagai
                  hadiah menarik.
                </p>

              </div>

              {/* BALANCE */}

              <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                      Saldo Anda
                    </p>

                    <div className="mt-2 flex items-end gap-2">

                      <span className="text-3xl font-black tracking-tight">
                        {rewardPoints.toLocaleString(
                          "id-ID"
                        )}
                      </span>

                      <span className="mb-1 text-sm font-semibold text-slate-300">
                        Poin
                      </span>

                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Halo, {customerName}.
                    </p>

                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10">
                    <WalletCards className="h-6 w-6 text-cyan-300" />
                  </div>

                </div>

                <Link
                  href="/customer/account"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
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

        {/* ================================================== */}
        {/* INFORMATION */}
        {/* ================================================== */}

        <section className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 sm:p-5">

          <div className="flex items-start gap-3">

            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
              <Info className="h-4 w-4 text-cyan-600" />
            </div>

            <div>

              <p className="text-sm font-bold text-slate-900">
                Cara menggunakan Reward Point
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                Pilih hadiah yang Anda inginkan,
                pastikan saldo point mencukupi,
                kemudian lakukan penukaran.
                Setiap penukaran akan menggunakan
                point sesuai nilai hadiah.
              </p>

            </div>

          </div>

        </section>

        {/* ================================================== */}
        {/* CATALOG HEADER */}
        {/* ================================================== */}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">
              Hadiah Tersedia
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              Pilih hadiah Anda
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Hadiah yang tersedia saat ini dapat
              langsung Anda tukarkan dengan point.
            </p>

          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 sm:self-auto">
            <PackageCheck className="h-4 w-4 text-cyan-600" />

            {rewards.length.toLocaleString(
              "id-ID"
            )}{" "}
            hadiah tersedia
          </div>

        </div>

        {/* ================================================== */}
        {/* EMPTY STATE */}
        {/* ================================================== */}

        {rewards.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Gift className="h-7 w-7 text-slate-400" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              Belum ada hadiah tersedia
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Saat ini belum ada hadiah yang dapat
              ditukarkan. Silakan kembali lagi nanti.
            </p>

            <Link
              href="/customer/account"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Kembali ke Akun
            </Link>

          </section>
        ) : (

          /* ================================================= */
          /* REWARD GRID */
          /* ================================================= */

          <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {rewards.map(
              (reward) => {

                const canRedeem =
                  rewardPoints >=
                  reward.requiredPoints;

                return (
                  <article
                    key={reward.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >

                    {/* IMAGE */}

                    <div className="relative aspect-4/3 overflow-hidden bg-slate-100">

                      {reward.image ? (
                        <Image
                          src={reward.image}
                          alt={reward.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Gift className="h-12 w-12 text-slate-300" />
                        </div>
                      )}

                      {/* POINT BADGE */}

                      <div className="absolute right-3 top-3 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                        {reward.requiredPoints.toLocaleString(
                          "id-ID"
                        )}{" "}
                        Poin
                      </div>

                    </div>

                    {/* CONTENT */}

                    <div className="p-5">

                      <h3 className="text-lg font-bold text-slate-900">
                        {reward.name}
                      </h3>

                      {reward.description ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                          {reward.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">
                          Hadiah menarik untuk Anda.
                        </p>
                      )}

                      {/* STOCK */}

                      <div className="mt-4 flex items-center justify-between gap-3">

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">

                          <PackageCheck className="h-4 w-4 text-emerald-500" />

                          Stok{" "}
                          {reward.stock.toLocaleString(
                            "id-ID"
                          )}

                        </div>

                        {canRedeem ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <Sparkles className="h-3.5 w-3.5" />
                            Point cukup
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-slate-400">
                            Point belum cukup
                          </div>
                        )}

                      </div>

                      {/* ACTION */}

                      <Link
                        href={`/customer/rewards/${reward.id}`}
                        className="mt-5 flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                      >
                        Lihat Hadiah
                      </Link>

                    </div>

                  </article>
                );
              }
            )}

          </section>

        )}

      </div>
    </main>
  );
}
