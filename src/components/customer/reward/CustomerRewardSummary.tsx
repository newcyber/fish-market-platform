"use client";

import Link from "next/link";
import { ArrowRight, Gift, Star, Ticket } from "lucide-react";

import type { CustomerRewardSummary as Summary } from "@/services/customer/customer-reward-summary.service";

function points(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function voucherType(type: Summary["vouchers"]["items"][number]["type"]) {
  return type === "FREE_SHIPPING" ? "Gratis Ongkir" : "Voucher Diskon";
}

export default function CustomerRewardSummary({
  summary,
}: {
  summary: Summary;
}) {
  const next = summary.nextReward;

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          <Link
            href="/customer/rewards"
            className="group p-4 transition hover:bg-slate-50 sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <Star className="h-5 w-5 fill-current" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Point Saya
                  </p>
                  <p className="mt-0.5 text-xl font-black text-slate-900">
                    {points(summary.points)}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" />
            </div>
          </Link>

          <Link
            href="/customer/vouchers"
            className="group p-4 transition hover:bg-slate-50 sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <Ticket className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Voucher Saya
                  </p>
                  <p className="mt-0.5 text-xl font-black text-slate-900">
                    {summary.vouchers.count}
                    <span className="ml-1 text-sm font-semibold text-slate-500">
                      voucher
                    </span>
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" />
            </div>

            {summary.vouchers.items.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {summary.vouchers.items.map((voucher) => (
                  <span
                    key={voucher.id}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                  >
                    {voucherType(voucher.type)}
                  </span>
                ))}
                {summary.vouchers.count > summary.vouchers.items.length && (
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
                    +{summary.vouchers.count - summary.vouchers.items.length}{" "}
                    lagi
                  </span>
                )}
              </div>
            )}
          </Link>

          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Gift className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500">
                  Reward Berikutnya
                </p>

                {next ? (
                  <>
                    <p className="mt-0.5 truncate text-sm font-black text-slate-900">
                      {next.name}
                    </p>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-(--pisjo-primary) transition-all"
                        style={{ width: `${next.progress}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 text-[10px]">
                      <span className="font-semibold text-slate-500">
                        {points(next.currentPoints)} /{" "}
                        {points(next.requiredPoints)} poin
                      </span>
                      <span className="font-bold text-emerald-600">
                        {points(next.remainingPoints)} lagi
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      {next.estimatedWeightKg !== null
                        ? `Perlu sekitar ${new Intl.NumberFormat("id-ID", {
                            maximumFractionDigits: 2,
                          }).format(next.estimatedWeightKg)} kg pembelian lagi.`
                        : "Tambah transaksi untuk mengumpulkan poin berikutnya."}
                    </p>

                    <Link
                      href="/customer/products"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-(--pisjo-primary) hover:underline"
                    >
                      Belanja sekarang
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Semua reward aktif saat ini sudah dapat Anda capai dengan
                    saldo point yang tersedia.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
