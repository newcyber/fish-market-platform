"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  WalletCards,
  History,
  Menu,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useState } from "react";
import { CourierNotificationBell } from "@/components/courier/CourierNotificationBell";

export const COURIER_STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Ditugaskan",
  PICKED_UP: "Sudah Diambil",
  ON_ROUTE: "Dalam Perjalanan",
  ARRIVED: "Tiba di Lokasi",
  DELIVERED: "Selesai",
  FAILED: "Gagal",
  CANCELLED: "Dibatalkan",
};

export function statusClass(status: string) {
  switch (status) {
    case "ASSIGNED":
      return "bg-[#FFF4E5] text-[#F59E0B]";
    case "PICKED_UP":
      return "bg-[#EAF5FF] text-[#0B84F3]";
    case "ON_ROUTE":
      return "bg-[#EAF5FF] text-[#0B84F3]";
    case "ARRIVED":
      return "bg-[#EAF5FF] text-[#0B84F3]";
    case "DELIVERED":
      return "bg-[#EAF8F0] text-[#16A34A]";
    case "FAILED":
      return "bg-[#FFF0F0] text-[#EF4444]";
    default:
      return "bg-slate-100 text-slate-500";
  }
}

export function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function dateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function shortDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function CourierBottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/courier", label: "Dashboard", icon: Home },
    { href: "/courier/tasks", label: "Tugas", icon: ClipboardList },
    { href: "/courier/earnings", label: "Penghasilan", icon: WalletCards },
    { href: "/courier/history", label: "Riwayat", icon: History },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[74px] max-w-[430px] items-center justify-around border-t border-[#DCE6F1] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/courier"
            ? pathname === "/courier"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex h-14 min-w-[76px] flex-col items-center justify-center gap-1 rounded-2xl px-3 text-[11px] font-semibold",
              active
                ? "bg-[#EAF5FF] text-[#0B84F3]"
                : "text-[#64748B]",
            ].join(" ")}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function CourierHeader({
  title,
  subtitle,
  back,
  menu = false,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  menu?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-[66px] items-center gap-3 border-b border-[#DCE6F1] bg-white/95 px-4 backdrop-blur">
        {back ? (
          <Link
            href="/courier/tasks"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DCE6F1] bg-white"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5 text-[#0F2448]" />
          </Link>
        ) : menu ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DCE6F1] bg-white"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-[#0F2448]" />
          </button>
        ) : (
          <div className="h-10 w-10 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-[#0B84F3]">
            PISJO MARKET
          </p>
          <h1 className="truncate text-[20px] font-bold leading-6 text-[#0F2448]">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-[13px] text-[#64748B]">{subtitle}</p>
          ) : null}
        </div>

        <CourierNotificationBell />
      </header>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          />
          <aside className="absolute left-0 top-0 h-full w-[290px] bg-white p-5 shadow-2xl">
            <p className="text-lg font-bold text-[#0F2448]">PISJO KURIR</p>
            <div className="mt-6 space-y-2">
              <Link onClick={() => setOpen(false)} href="/courier" className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#0F2448] hover:bg-[#EAF5FF]">Dashboard</Link>
              <Link onClick={() => setOpen(false)} href="/courier/tasks" className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#0F2448] hover:bg-[#EAF5FF]">Tugas</Link>
              <Link onClick={() => setOpen(false)} href="/courier/earnings" className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#0F2448] hover:bg-[#EAF5FF]">Penghasilan</Link>
              <Link onClick={() => setOpen(false)} href="/courier/history" className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#0F2448] hover:bg-[#EAF5FF]">Riwayat</Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(status)}`}>
      {COURIER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PaymentBadge({ paid }: { paid: boolean }) {
  return (
    <span className="inline-flex items-center rounded-xl bg-[#EAF8F0] px-3 py-2 text-xs font-bold text-[#16A34A]">
      {paid ? "LUNAS" : "Belum Lunas"}
    </span>
  );
}

export function OperationalBadge({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-xl bg-[#F1F5F9] px-3 py-2 text-xs font-semibold text-[#0F2448]">
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function Timeline({
  status,
  timestamps,
}: {
  status: string;
  timestamps: Record<string, string | null>;
}) {
  const steps = [
    ["ASSIGNED", "Ditugaskan"],
    ["PICKED_UP", "Sudah Diambil"],
    ["ON_ROUTE", "Dalam Perjalanan"],
    ["ARRIVED", "Tiba di Lokasi"],
    ["DELIVERED", "Pesanan Diserahkan"],
  ];

  const currentIndex = Math.max(
    0,
    steps.findIndex(([key]) => key === status),
  );

  return (
    <div className="rounded-2xl border border-[#DCE6F1] bg-white p-4 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
      {steps.map(([key, label], index) => {
        const done = status === "DELIVERED" ? index <= 4 : index < currentIndex;
        const active = index === currentIndex && status !== "DELIVERED";
        const stamp = timestamps[key];

        return (
          <div key={key} className="relative flex min-h-[48px] gap-3">
            {index < steps.length - 1 ? (
              <div className={`absolute left-[11px] top-7 h-9 w-0.5 ${done ? "bg-[#16A34A]" : "bg-slate-200"}`} />
            ) : null}
            <div className={[
              "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
              done ? "bg-[#16A34A] text-white" : active ? "bg-[#0B84F3] text-white" : "bg-slate-200 text-white",
            ].join(" ")}>
              {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Circle className="h-3 w-3 fill-current" /> : <Circle className="h-3 w-3" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-bold ${done || active ? "text-[#0F2448]" : "text-[#64748B]"}`}>{label}</p>
                <span className="text-[11px] text-[#64748B]">{stamp ? dateTime(stamp) : "-"}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ActionButton({
  children,
  href,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "success" | "danger";
}) {
  const cls = [
    "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" && "bg-[#0B84F3] text-white",
    variant === "secondary" && "border border-[#DCE6F1] bg-white text-[#0F2448]",
    variant === "success" && "bg-[#16A34A] text-white",
    variant === "danger" && "bg-[#EF4444] text-white",
  ].filter(Boolean).join(" ");

  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}
