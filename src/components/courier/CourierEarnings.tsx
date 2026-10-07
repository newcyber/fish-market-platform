"use client";

import { useState } from "react";
import Link from "next/link";
import { WalletCards, Clock3, CheckCircle2, BarChart3, ChevronRight } from "lucide-react";
import { money, shortDate, CourierHeader } from "@/components/courier/CourierUi";

type EarningsData = {
  period: string;
  total: number;
  unpaid: number;
  paid: number;
  average: number;
  items: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    address: string;
    courierPayout: number;
    payoutStatus: "UNPAID" | "PAID";
    paymentMethod: "CASH" | "TRANSFER" | null;
    paidAt: string | null;
    createdAt: string;
  }>;
};

export function CourierEarnings({ initial }: { initial: EarningsData }) {
  const [data, setData] = useState(initial);
  const [period, setPeriod] = useState<"today" | "7d" | "month">(
    initial.period as "today" | "7d" | "month",
  );
  const [loading, setLoading] = useState(false);

  async function changePeriod(next: "today" | "7d" | "month") {
    setPeriod(next);
    setLoading(true);
    try {
      const response = await fetch(`/api/courier/earnings?period=${next}`, { cache: "no-store" });
      const payload = await response.json();
      if (response.ok && payload.data) setData(payload.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <CourierHeader title="Dasbor Penghasilan Kurir" menu />

      <div className="space-y-3 px-3 py-3">
        <div className="grid grid-cols-3 rounded-full bg-[#EAF5FF] p-1">
          {[
            ["today", "Hari Ini"],
            ["7d", "7 Hari"],
            ["month", "Bulan Ini"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => void changePeriod(key as typeof period)}
              className={[
                "h-11 rounded-full text-[14px] font-semibold",
                period === key ? "bg-[#0B84F3] text-white" : "text-[#0F2448]",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="rounded-[18px] border border-[#DCE6F1] bg-[#EAF5FF] p-5 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#0B84F3]">
              <WalletCards className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[14px] text-[#64748B]">Total Penghasilan</p>
              <p className="text-[30px] font-bold leading-9 text-[#0F2448]">
                {loading ? "..." : money(data.total)}
              </p>
              <p className="text-[13px] text-[#64748B]">
                {data.items.length} pengantaran selesai
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-[18px] border border-[#DCE6F1] bg-white p-3 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
            <Clock3 className="h-6 w-6 text-[#F59E0B]" />
            <p className="mt-3 text-[12px] text-[#64748B]">Belum Dibayar</p>
            <p className="mt-1 text-[18px] font-bold text-[#0F2448]">{money(data.unpaid)}</p>
          </div>
          <div className="rounded-[18px] border border-[#DCE6F1] bg-white p-3 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
            <CheckCircle2 className="h-6 w-6 text-[#16A34A]" />
            <p className="mt-3 text-[12px] text-[#64748B]">Sudah Dibayar</p>
            <p className="mt-1 text-[18px] font-bold text-[#0F2448]">{money(data.paid)}</p>
          </div>
          <div className="rounded-[18px] border border-[#DCE6F1] bg-white p-3 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
            <BarChart3 className="h-6 w-6 text-[#7C3AED]" />
            <p className="mt-3 text-[12px] text-[#64748B]">Rata-rata / order</p>
            <p className="mt-1 text-[18px] font-bold text-[#0F2448]">{money(data.average)}</p>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#DCE6F1] bg-white p-3 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
          <h2 className="px-1 py-2 text-[18px] font-bold text-[#0F2448]">Daftar Penghasilan</h2>

          <div className="mt-2 overflow-hidden rounded-2xl border border-[#DCE6F1]">
            <div className="grid grid-cols-[1.2fr_.8fr_.9fr] gap-2 bg-[#EAF5FF] px-3 py-3 text-[11px] font-semibold text-[#64748B]">
              <span>Order</span>
              <span>Hak Kurir</span>
              <span>Status Payout</span>
            </div>
            {data.items.map((item) => (
              <Link
                key={item.id}
                href={`/courier/tasks/${item.orderId}`}
                className="grid grid-cols-[1.2fr_.8fr_.9fr] items-center gap-2 border-t border-[#DCE6F1] px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="break-all text-[12px] font-semibold text-[#0F2448]">{item.orderNumber}</p>
                  <p className="mt-1 text-[11px] text-[#64748B]">{shortDate(item.createdAt)}</p>
                </div>
                <p className="text-[13px] font-bold text-[#0F2448]">{money(item.courierPayout)}</p>
                <span className={`justify-self-start rounded-full px-2 py-1 text-[10px] font-semibold ${item.payoutStatus === "PAID" ? "bg-[#EAF8F0] text-[#16A34A]" : "bg-[#FFF4E5] text-[#F59E0B]"}`}>
                  {item.payoutStatus === "PAID" ? "Sudah Dibayar" : "Belum Dibayar"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
