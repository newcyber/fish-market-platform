"use client";

import { FormEvent, useEffect, useState } from "react";
import { Megaphone, Send, XCircle } from "lucide-react";

interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  status: string;
  audienceType: string;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  _count: { recipients: number };
  createdBy: { name: string } | null;
}

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Terjadwal",
  SENDING: "Mengirim",
  SENT: "Terkirim",
  PARTIAL: "Sebagian terkirim",
  FAILED: "Gagal",
  CANCELLED: "Dibatalkan",
};

export default function BroadcastManager({ initial }: { initial: BroadcastItem[] }) {
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [href, setHref] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/broadcasts", { cache: "no-store" });
    const json = await response.json();
    if (response.ok) setItems(json.data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          href: href || null,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message ?? "Gagal membuat broadcast.");
      setTitle(""); setMessage(""); setHref(""); setScheduledAt("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat broadcast.");
    } finally {
      setSaving(false);
    }
  }

  async function action(id: string, actionName: "SEND" | "CANCEL") {
    const response = await fetch("/api/admin/broadcasts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: actionName }),
    });
    const json = await response.json();
    if (!response.ok) setError(json.message ?? "Gagal memproses broadcast.");
    await refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><Megaphone className="h-5 w-5" /></div>
          <div>
            <h2 className="font-semibold text-gray-900">Buat Broadcast Customer</h2>
            <p className="text-sm text-gray-500">Broadcast in-app ke customer aktif. Push notification dikirim best-effort jika tersedia.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">Judul<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required className="w-full rounded-lg border px-3 py-2.5" placeholder="🔥 Flash Sale Dimulai!" /></label>
          <label className="space-y-1.5 text-sm font-medium">Link tujuan (opsional)<input value={href} onChange={(e) => setHref(e.target.value)} className="w-full rounded-lg border px-3 py-2.5" placeholder="/flash-sale" /></label>
        </div>
        <label className="mt-4 block space-y-1.5 text-sm font-medium">Pesan<textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} required rows={5} className="w-full rounded-lg border px-3 py-2.5" placeholder="Promo ikan segar pilihan hari ini..." /></label>
        <label className="mt-4 block max-w-sm space-y-1.5 text-sm font-medium">Jadwalkan (opsional)<input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-lg border px-3 py-2.5" /></label>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" />{saving ? "Menyimpan..." : "Simpan Broadcast"}</button></div>
      </form>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4"><h2 className="font-semibold">Riwayat Broadcast</h2></div>
        <div className="divide-y">
          {items.length === 0 ? <div className="px-5 py-10 text-center text-sm text-gray-500">Belum ada broadcast.</div> : items.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-900">{item.title}</h3><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">{statusLabel[item.status] ?? item.status}</span></div><p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.message}</p><p className="mt-2 text-xs text-gray-400">{item._count.recipients} recipient · dibuat {new Date(item.createdAt).toLocaleString("id-ID")}</p></div>
              <div className="flex shrink-0 gap-2">{["DRAFT", "SCHEDULED"].includes(item.status) && <><button onClick={() => void action(item.id, "SEND")} className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-50">Kirim Sekarang</button><button onClick={() => void action(item.id, "CANCEL")} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><XCircle className="h-3.5 w-3.5" />Batalkan</button></>}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
