import Link from "next/link";
import { ArrowRight, Crown, Gift, ShieldCheck, Truck } from "lucide-react";

import type { CustomerMemberTierSummary } from "@/services/customer/member-tier.service";

function currency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CustomerMemberTier({
  summary,
}: {
  summary: CustomerMemberTierSummary;
}) {
  const { currentTier, currentSpend, nextTier, remainingSpend, progress } =
    summary;

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Crown className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    PISJO Member
                  </p>
                  <h2 className="mt-0.5 text-lg font-black text-slate-900">
                    {currentTier.name}
                  </h2>
                </div>

                <Link
                  href="/customer/rewards"
                  className="inline-flex items-center gap-1 text-xs font-bold text-(--pisjo-primary) hover:underline"
                >
                  Lihat benefit
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {nextTier ? (
                <>
                  <div className="mt-4 flex items-center justify-between gap-3 text-[11px]">
                    <span className="font-semibold text-slate-500">
                      {currency(currentSpend)} / {currency(nextTier.minSpend)}
                    </span>
                    <span className="font-bold text-emerald-600">
                      {progress}% menuju {nextTier.name}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-(--pisjo-primary) transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Belanja {currency(remainingSpend)} lagi untuk naik ke{" "}
                    <span className="font-semibold text-slate-700">
                      {nextTier.name}
                    </span>
                    .
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Anda sudah berada di tier tertinggi PISJO.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {currentTier.bonusPointsPercent > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                    <Gift className="h-3 w-3" />+
                    {currentTier.bonusPointsPercent}% point
                  </span>
                )}

                {currentTier.freeShipping && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-bold text-cyan-700">
                    <Truck className="h-3 w-3" />
                    Benefit ongkir
                  </span>
                )}

                {currentTier.prioritySupport && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    <ShieldCheck className="h-3 w-3" />
                    Priority support
                  </span>
                )}

                {currentTier.exclusivePricing && (
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                    Harga khusus member
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
