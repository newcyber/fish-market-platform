"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, Package } from "lucide-react";

import type { CourierAssignmentListItem } from "@/services/courier/courier.service";
import {
  CourierHeader,
  dateTime,
  money,
  OperationalBadge,
  shortDate,
  StatusBadge,
} from "@/components/courier/CourierUi";

type Filter = "today" | "7d" | "month";

function withinPeriod(value: string, filter: Filter) {
  const date = new Date(value);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (filter === "today") return date.toDateString() === now.toDateString();
  if (filter === "7d") return diff <= 7 * 86400000;
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function CourierHistory({
  initial,
}: {
  initial: CourierAssignmentListItem[];
}) {
  const [period, setPeriod] = useState<Filter>("7d");
  const [status, setStatus] = useState<"DELIVERED" | "FAILED">("DELIVERED");

  const rows = useMemo(
    () =>
      initial.filter(
        (row) =>
          row.status === status &&
          withinPeriod(
            row.deliveredAt ?? row.failedAt ?? row.assignedAt,
            period,
          ),
      ),
    [initial, period, status],
  );

  return (
    <div>
      <CourierHeader title="Riwayat Pengantaran" menu />

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
              onClick={() => setPeriod(key as Filter)}
              className={[
                "h-11 rounded-full text-[14px] font-semibold",
                period === key ? "bg-[#0B84F3] text-white" : "text-[#0F2448]",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 rounded-full bg-[#EAF5FF] p-1">
          {[
            ["DELIVERED", "Selesai"],
            ["FAILED", "Gagal"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key as typeof status)}
              className={[
                "h-11 rounded-full text-[14px] font-semibold",
                status === key ? "bg-[#0B84F3] text-white" : "text-[#0F2448]",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="px-1 text-[13px] text-[#64748B]">
          {rows.length} pengantaran pada periode terpilih.
        </p>

        <div className="space-y-3">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/courier/tasks/${row.id}`}
              className="block rounded-[18px] border border-[#DCE6F1] bg-white p-3 shadow-[0_2px_8px_rgba(15,46,94,0.08)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] text-[#64748B]">{row.order.orderNumber}</p>
                  <p className="mt-1 text-[18px] font-bold text-[#0F2448]">
                    {row.order.address.receiverName}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </div>

              <div className="mt-2 flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0F2448]" />
                <p className="line-clamp-2 text-[13px] leading-5 text-[#64748B]">
                  {row.order.address.fullAddress}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <OperationalBadge icon={CalendarDays}>
                  {shortDate(row.deliveredAt ?? row.failedAt ?? row.assignedAt)}
                </OperationalBadge>
                <OperationalBadge icon={Package}>{row.order.itemsCount} paket</OperationalBadge>
                <OperationalBadge icon={ChevronRight}>
                  Hak Kurir — detail
                </OperationalBadge>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-[#64748B]">
                  {dateTime(row.deliveredAt ?? row.failedAt ?? row.assignedAt)}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#0B84F3]">
                  Lihat Detail <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="rounded-[18px] border border-[#DCE6F1] bg-white p-10 text-center shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
            <p className="text-sm font-bold text-[#0F2448]">Belum ada data</p>
            <p className="mt-1 text-xs text-[#64748B]">
              Riwayat akan muncul setelah tugas selesai atau gagal.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
