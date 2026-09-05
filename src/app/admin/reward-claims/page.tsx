import Link from "next/link";

import {
  ArrowRight,
  Gift,
  User,
} from "lucide-react";

import {
  RewardClaimStatus,
} from "@prisma/client";

import {
  getAdminRewardClaims,
} from "@/services/reward/reward-claim.service";

export const dynamic =
  "force-dynamic";

function formatPoints(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID"
  ).format(value);
}

function formatDate(
  value: Date
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(value);
}

function getStatusLabel(
  status: RewardClaimStatus
) {
  switch (status) {
    case RewardClaimStatus.PENDING:
      return "Menunggu";

    case RewardClaimStatus.APPROVED:
      return "Disetujui";

    case RewardClaimStatus.PROCESSING:
      return "Diproses";

    case RewardClaimStatus.SHIPPED:
      return "Dikirim";

    case RewardClaimStatus.COMPLETED:
      return "Selesai";

    case RewardClaimStatus.REJECTED:
      return "Ditolak";

    case RewardClaimStatus.CANCELLED:
      return "Dibatalkan";

    default:
      return status;
  }
}

function getStatusClass(
  status: RewardClaimStatus
) {
  switch (status) {
    case RewardClaimStatus.PENDING:
      return "bg-amber-100 text-amber-700";

    case RewardClaimStatus.APPROVED:
      return "bg-blue-100 text-blue-700";

    case RewardClaimStatus.PROCESSING:
      return "bg-purple-100 text-purple-700";

    case RewardClaimStatus.SHIPPED:
      return "bg-indigo-100 text-indigo-700";

    case RewardClaimStatus.COMPLETED:
      return "bg-emerald-100 text-emerald-700";

    case RewardClaimStatus.REJECTED:
    case RewardClaimStatus.CANCELLED:
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function RewardClaimsPage() {
  const claims =
    await getAdminRewardClaims({
      take: 100,
    });

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--pisjo-primary)]">
              Loyalty
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Reward Claims
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola customer yang menukarkan
              Reward Point dengan reward fisik.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium text-slate-500">
              Total Claim
            </p>

            <p className="mt-0.5 text-xl font-bold text-slate-900">
              {claims.length}
            </p>
          </div>
        </div>

        {/* LIST */}

        {claims.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--pisjo-soft-blue)]">
              <Gift className="h-7 w-7 text-[var(--pisjo-primary)]" />
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-900">
              Belum ada Reward Claim
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Claim reward dari customer akan
              muncul di halaman ini.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-230 text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Reward
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Poin
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tanggal
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {claims.map(
                    (claim) => (
                      <tr
                        key={claim.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
                              <User className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {claim.user?.name ||
                                  "Customer"}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {claim.user?.email ||
                                  "-"}
                              </p>

                              {claim.user?.phone && (
                                <p className="text-xs text-slate-500">
                                  {claim.user.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {claim.rewardName}
                          </p>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-bold text-[var(--pisjo-ocean)]">
                            {formatPoints(
                              claim.pointsSpent
                            )}
                          </span>

                          <span className="ml-1 text-xs text-slate-500">
                            Poin
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                          {formatDate(
                            claim.createdAt
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                              getStatusClass(
                                claim.status
                              ),
                            ].join(" ")}
                          >
                            {getStatusLabel(
                              claim.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/reward-claims/${claim.id}`}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--pisjo-soft-blue)] hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)]"
                          >
                            Detail
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}

            <div className="divide-y divide-slate-100 md:hidden">
              {claims.map(
                (claim) => (
                  <Link
                    key={claim.id}
                    href={`/admin/reward-claims/${claim.id}`}
                    className="block p-4 transition active:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
                          <User className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {claim.user?.name ||
                              "Customer"}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {claim.user?.email ||
                              claim.user?.phone ||
                              "-"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                          getStatusClass(
                            claim.status
                          ),
                        ].join(" ")}
                      >
                        {getStatusLabel(
                          claim.status
                        )}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <p className="text-sm font-bold text-slate-900">
                        {claim.rewardName}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-[var(--pisjo-ocean)]">
                          {formatPoints(
                            claim.pointsSpent
                          )}{" "}
                          Poin
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatDate(
                            claim.createdAt
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-[var(--pisjo-primary)]">
                      Lihat Detail
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
