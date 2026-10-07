"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, WalletCards } from "lucide-react";

import { money, shortDate } from "@/components/courier/CourierUi";

type Payout = {
  id: string;
  courierId: string;
  courierName: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  createdAt: string;
};

export default function CourierPayoutPanel() {
  const [rows, setRows] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [method, setMethod] = useState<"CASH" | "TRANSFER">("TRANSFER");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/courier/payouts", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Gagal memuat payout.");
      setRows(payload.data ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal memuat payout.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function settle(id: string) {
    setSaving(id);
    setError(null);
    try {
      const response = await fetch("/api/admin/courier/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId: id, paymentMethod: method }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Settlement gagal.");
      setRows((current) => current.filter((row) => row.id !== id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Settlement gagal.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Settlement Hak Kurir</h2>
          <p className="mt-1 text-sm text-slate-500">
            Payout hanya dapat dibayar oleh Super Admin setelah order selesai.
          </p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <WalletCards className="h-5 w-5 text-blue-600" />
        <span className="text-sm font-semibold text-slate-700">Metode pembayaran</span>
        <select
          value={method}
          onChange={(event) => setMethod(event.target.value as "CASH" | "TRANSFER")}
          className="ml-auto h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="TRANSFER">Transfer</option>
          <option value="CASH">Cash</option>
        </select>
      </div>

      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[680px] overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[1.2fr_1.2fr_1fr_1fr_.9fr] gap-2 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
            <span>Kurir</span><span>Order</span><span>Tanggal</span><span>Hak Kurir</span><span>Aksi</span>
          </div>
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">Memuat payout...</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">Tidak ada payout yang belum dibayar.</div>
          ) : rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1.2fr_1.2fr_1fr_1fr_.9fr] items-center gap-2 border-t border-slate-200 px-4 py-3">
              <div><p className="text-sm font-semibold text-slate-900">{row.courierName}</p><p className="text-xs text-slate-500">{row.customerName}</p></div>
              <p className="break-all text-xs font-semibold text-slate-700">{row.orderNumber}</p>
              <p className="text-xs text-slate-500">{shortDate(row.createdAt)}</p>
              <p className="text-sm font-bold text-slate-900">{money(row.amount)}</p>
              <button
                type="button"
                disabled={saving === row.id}
                onClick={() => void settle(row.id)}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving === row.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Tandai Dibayar
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
