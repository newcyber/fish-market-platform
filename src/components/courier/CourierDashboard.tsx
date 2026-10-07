"use client";

import Link from "next/link";
import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  PackageCheck,
  RefreshCw,
  WalletCards,
  XCircle,
  ArrowRight,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  CourierAssignmentListItem,
  CourierDashboardStats,
} from "@/services/courier/courier.service";
import {
  CourierHeader,
  money,
  OperationalBadge,
  StatusBadge,
} from "@/components/courier/CourierUi";

interface CourierDashboardProps {
  initialData: {
    stats: CourierDashboardStats;
    assignments: CourierAssignmentListItem[];
  };
  initialAssignmentId?: string | null;
}

function Stat({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: typeof ClipboardList;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[90px] items-center gap-3 rounded-[18px] border border-[#DCE6F1] bg-white p-3 shadow-[0_2px_8px_rgba(15,46,94,0.08)]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF5FF] text-[#0B84F3]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-[#64748B]">{title}</p>
        <p className="mt-0.5 text-[24px] font-bold leading-7 text-[#0F2448]">
          {typeof value === "number" ? value.toLocaleString("id-ID") : value}
        </p>
        <p className="truncate text-[11px] text-[#64748B]">{subtitle}</p>
      </div>
    </Link>
  );
}

export function CourierDashboard({
  initialData,
}: CourierDashboardProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { stats, assignments } = initialData;

  const active = assignments.filter((row) =>
    ["ASSIGNED", "PICKED_UP", "ON_ROUTE", "ARRIVED"].includes(row.status),
  );
  const featured = active[0] ?? null;

  function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 700);
  }

  const completion =
    stats.totalToday > 0
      ? Math.min(100, Math.round((stats.deliveredToday / stats.totalToday) * 100))
      : 0;

  return (
    <div>
      <CourierHeader title="Dashboard Kurir" menu />

      <div className="space-y-3 px-3 py-3">
        <section className="overflow-hidden rounded-[18px] bg-gradient-to-r from-[#0B84F3] to-[#0868D7] p-4 text-white shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
          <p className="text-[22px] font-bold">Halo, Kurir PISJO</p>
          <p className="mt-1 max-w-[250px] text-[14px] leading-5 text-white/90">
            Kelola tugas pengantaran yang menjadi tanggung jawab Anda hari ini.
          </p>
        </section>

        <section className="flex items-center justify-between rounded-[18px] border border-[#DCE6F1] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
          <div className="flex min-w-0 items-center gap-2">
            <Clock3 className="h-5 w-5 shrink-0 text-[#0B84F3]" />
            <p className="truncate text-[13px] font-semibold text-[#64748B]">
              Hari ini,{" "}
              {new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#DCE6F1] px-3 text-xs font-semibold text-[#0F2448]"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <Stat title="Ditugaskan" value={stats.assigned} subtitle="Menunggu diambil" icon={ClipboardList} href="/courier/tasks?tab=active" />
          <Stat title="Sudah Diambil" value={stats.pickedUp} subtitle="Barang sudah diambil" icon={PackageCheck} href="/courier/tasks?tab=active" />
          <Stat title="Dalam Perjalanan" value={stats.onRoute} subtitle="Sedang menuju tujuan" icon={Navigation} href="/courier/tasks?tab=active" />
          <Stat title="Selesai Hari Ini" value={stats.deliveredToday} subtitle="Berhasil dikirim" icon={CheckCircle2} href="/courier/history?status=delivered" />
          <Stat title="Gagal Hari Ini" value={stats.failedToday} subtitle="Perlu evaluasi" icon={XCircle} href="/courier/history?status=failed" />
          <Stat title="Penghasilan Hari Ini" value={money(stats.earningsToday)} subtitle={`${stats.deliveredToday} pengantaran selesai`} icon={WalletCards} href="/courier/earnings" />
        </section>

        <section className="rounded-[18px] border border-[#DCE6F1] bg-white p-4 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-bold text-[#0F2448]">Penyelesaian hari ini</p>
            <p className="text-[13px] font-bold text-[#0F2448]">
              {completion}% ({stats.deliveredToday}/{stats.totalToday} tugas)
            </p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#EAF5FF]">
            <div
              className="h-full rounded-full bg-[#16A34A] transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </section>

        <section className="rounded-[18px] border border-[#DCE6F1] bg-white p-3 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
          <div className="flex items-center justify-between px-1 py-1">
            <h2 className="text-[18px] font-bold text-[#0F2448]">
              Tugas Pengantaran Aktif
            </h2>
            <Link
              href="/courier/tasks"
              className="inline-flex items-center gap-1 text-[13px] font-bold text-[#0B84F3]"
            >
              Lihat Semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {!featured ? (
            <div className="mt-3 rounded-2xl bg-[#F7FAFC] p-6 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-[#0F2448]">
                Tidak ada tugas aktif
              </p>
              <p className="mt-1 text-xs text-[#64748B]">
                Tugas baru akan muncul setelah Admin menugaskan order.
              </p>
            </div>
          ) : (
            <article className="mt-3 rounded-[18px] border border-[#DCE6F1] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-[#64748B]">
                    {featured.order.orderNumber}
                  </p>
                  <h3 className="mt-1 truncate text-[17px] font-bold text-[#0F2448]">
                    {featured.order.address.receiverName}
                  </h3>
                </div>
                <StatusBadge status={featured.status} />
              </div>

              <div className="mt-2 flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0F2448]" />
                <p className="line-clamp-2 text-[13px] leading-5 text-[#64748B]">
                  {featured.order.address.fullAddress}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <OperationalBadge icon={ClipboardList}>
                  {featured.order.itemsCount} paket
                </OperationalBadge>
                <OperationalBadge icon={CheckCircle2}>
                  {featured.order.paymentStatus === "VERIFIED" ? "LUNAS" : "Belum Lunas"}
                </OperationalBadge>
                <OperationalBadge icon={WalletCards}>
                  Hak Kurir {money(featured.order.courierPayoutEstimate)}
                </OperationalBadge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {featured.order.address.receiverPhone ? (
                  <a
                    href={`tel:${featured.order.address.receiverPhone}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE6F1] text-sm font-semibold text-[#0F2448]"
                  >
                    <Phone className="h-4 w-4 text-[#0B84F3]" />
                    Hubungi
                  </a>
                ) : (
                  <span />
                )}
                <Link
                  href={`/courier/tasks/${featured.id}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B84F3] text-sm font-semibold text-white"
                >
                  Lihat Detail <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}

export default CourierDashboard;
