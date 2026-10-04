"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, RefreshCw, Save, TrendingUp } from "lucide-react";

type Range = "today" | "7d" | "30d";
type Performance = {
  summary: {
    totalAssigned: number;
    delivered: number;
    failed: number;
    active: number;
    successRate: number;
    failureRate: number;
    retryRate: number;
    averageAssignmentToStartMinutes: number | null;
    averageStartToPickupMinutes: number | null;
    averagePickupToDeliveryMinutes: number | null;
    averageTotalDeliveryMinutes: number | null;
  };
  sla: { settings: { assignmentToStartMinutes: number; startToPickupMinutes: number; pickupToDeliveryMinutes: number; totalDeliveryMinutes: number } };
  couriers: Array<{
    courierId: string;
    courierName: string;
    assigned: number;
    delivered: number;
    failed: number;
    active: number;
    successRate: number;
    retryRate: number;
    averageDeliveryMinutes: number | null;
    slaBreached: number;
  }>;
  slaAttention: Array<{
    id: string;
    orderNumber: string;
    courierName: string;
    receiverName: string;
    city: string;
    district: string;
    assignmentStatus: string;
    stage: string;
    elapsedMinutes: number | null;
    slaMinutes: number;
    status: "AT_RISK" | "BREACHED";
  }>;
};

const labels: Record<string, string> = {
  ASSIGNMENT_TO_START: "Ditugaskan → Mulai",
  START_TO_PICKUP: "Mulai → Pickup",
  PICKUP_TO_DELIVERY: "Pickup → Selesai",
};

function Metric({ label, value, suffix = "" }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}<span className="ml-1 text-sm font-semibold text-slate-400">{suffix}</span></p>
    </div>
  );
}

export default function CourierPerformancePanel() {
  const [range, setRange] = useState<Range>("today");
  const [data, setData] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sla, setSla] = useState({
    assignmentToStartMinutes: 15,
    startToPickupMinutes: 30,
    pickupToDeliveryMinutes: 60,
    totalDeliveryMinutes: 105,
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/courier/performance?range=${range}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Gagal memuat performa kurir.");
      setData(payload.data);
      setSla(payload.data.sla.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat performa kurir.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [range]);

  async function saveSla() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/courier/sla", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sla),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Gagal menyimpan SLA.");
      setSla(payload.data);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan SLA.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Performance & SLA</h2>
          <p className="mt-1 text-sm text-slate-500">KPI dihitung dari lifecycle assignment kurir, timezone Asia/Jakarta.</p>
        </div>
        <div className="flex gap-2">
          {(["today", "7d", "30d"] as Range[]).map((item) => (
            <button key={item} type="button" onClick={() => setRange(item)} className={`rounded-xl px-3 py-2 text-xs font-bold ${range === item ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
              {item === "today" ? "Hari ini" : item === "7d" ? "7 hari" : "30 hari"}
            </button>
          ))}
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total assignment" value={data.summary.totalAssigned} />
            <Metric label="Delivered" value={data.summary.delivered} />
            <Metric label="Success rate" value={data.summary.successRate} suffix="%" />
            <Metric label="Retry rate" value={data.summary.retryRate} suffix="%" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Assignment → Mulai" value={data.summary.averageAssignmentToStartMinutes ?? "-"} suffix="menit" />
            <Metric label="Mulai → Pickup" value={data.summary.averageStartToPickupMinutes ?? "-"} suffix="menit" />
            <Metric label="Pickup → Selesai" value={data.summary.averagePickupToDeliveryMinutes ?? "-"} suffix="menit" />
            <Metric label="Total delivery" value={data.summary.averageTotalDeliveryMinutes ?? "-"} suffix="menit" />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-700" />
              <div>
                <h3 className="font-bold text-slate-900">Courier Performance</h3>
                <p className="text-xs text-slate-500">Ranking berdasarkan success rate, SLA, lalu delivery time.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr><th className="pb-3">Kurir</th><th>Assigned</th><th>Delivered</th><th>Failed</th><th>Success</th><th>Avg delivery</th><th>SLA breach</th></tr>
                </thead>
                <tbody className="divide-y">
                  {data.couriers.map((courier) => (
                    <tr key={courier.courierId}>
                      <td className="py-3 font-semibold text-slate-900">{courier.courierName}</td>
                      <td>{courier.assigned}</td><td>{courier.delivered}</td><td>{courier.failed}</td>
                      <td className="font-bold">{courier.successRate}%</td>
                      <td>{courier.averageDeliveryMinutes ?? "-"} m</td>
                      <td className={courier.slaBreached > 0 ? "font-bold text-red-600" : "text-emerald-600"}>{courier.slaBreached}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /><div><h3 className="font-bold text-slate-900">SLA Attention</h3><p className="text-xs text-slate-500">Hanya assignment aktif yang sudah berisiko atau breach.</p></div></div>
              {data.slaAttention.length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center text-sm text-emerald-700">Tidak ada SLA yang perlu ditindaklanjuti.</div> : <div className="space-y-2">{data.slaAttention.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-500">{item.orderNumber}</span><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${item.status === "BREACHED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item.status === "BREACHED" ? "BREACH" : "AT RISK"}</span></div><p className="mt-1 text-sm font-semibold">{item.courierName} · {item.receiverName}</p><p className="text-xs text-slate-500">{labels[item.stage] ?? item.stage} · {item.elapsedMinutes ?? 0} / {item.slaMinutes} menit</p></div>)}</div>}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2"><Clock3 className="h-5 w-5 text-slate-700" /><div><h3 className="font-bold text-slate-900">SLA Settings</h3><p className="text-xs text-slate-500">Berlaku untuk evaluasi delivery berikutnya.</p></div></div>
              <div className="space-y-3">
                {([
                  ["assignmentToStartMinutes", "Assignment → Mulai"],
                  ["startToPickupMinutes", "Mulai → Pickup"],
                  ["pickupToDeliveryMinutes", "Pickup → Selesai"],
                  ["totalDeliveryMinutes", "Total Delivery"],
                ] as const).map(([key, label]) => <label key={key} className="block"><span className="text-xs font-semibold text-slate-600">{label}</span><div className="mt-1 flex items-center gap-2"><input type="number" min={1} max={1440} value={sla[key]} onChange={(e) => setSla((current) => ({ ...current, [key]: Number(e.target.value) }))} className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" /><span className="text-xs text-slate-400">menit</span></div></label>)}
                <button type="button" onClick={() => void saveSla()} disabled={saving} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Menyimpan..." : "Simpan SLA"}</button>
              </div>
            </div>
          </section>
        </>
      ) : loading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Memuat performance...</div> : null}
    </div>
  );
}
