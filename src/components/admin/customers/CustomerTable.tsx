import Link from "next/link";

import AdminDataTable from "@/components/admin/common/AdminDataTable";
import AdminStatusBadge from "@/components/admin/common/AdminStatusBadge";
import DeleteCustomerButton from "./DeleteCustomerButton";

import { Button } from "@/components/ui/button";
import { Mail, MapPin, Phone, ShoppingBag } from "lucide-react";

import type {
  CustomerListItem,
  CustomerSegment,
} from "@/services/customer/customer.service";

interface CustomerTableProps {
  customers: CustomerListItem[];
  mode?: "active" | "trash";
  startIndex?: number;
}

const segmentConfig: Record<
  CustomerSegment,
  {
    label: string;
    className: string;
  }
> = {
  BARU: {
    label: "Baru",
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  REPEAT: {
    label: "Repeat",
    className: "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
  LOYAL: {
    label: "Loyal",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  VIP: {
    label: "VIP",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
  },
  AKTIF: {
    label: "Aktif",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  DORMANT: {
    label: "Dormant",
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
  },
};

function SegmentBadge({ segment }: { segment: CustomerSegment }) {
  const config = segmentConfig[segment];

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1",
        "text-xs font-semibold ring-1 ring-inset",
        config.className,
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatPhone(phone: string | null) {
  return phone || "-";
}

export default function CustomerTable({
  customers,
  mode = "active",
  startIndex = 0,
}: CustomerTableProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--pisjo-navy)]">
              Daftar Customer
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Informasi kontak, transaksi, poin, dan aktivitas customer.
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 sm:flex">
            <ShoppingBag className="h-3.5 w-3.5" />
            {customers.length.toLocaleString("id-ID")} ditampilkan
          </div>
        </div>
      </div>

      {/* Desktop/tablet:
          Deliberately keep the table within the available viewport.
          Low-priority fields are grouped instead of forcing horizontal scrolling. */}
      <div className="hidden min-w-0 md:block">
        <AdminDataTable
          headers={[
            "Customer",
            "Kontak & Area",
            "Order",
            "Total Belanja",
            "Segmen",
            "Status",
            "Aksi",
          ]}
        >
          {customers.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-14 text-center">
                <div className="mx-auto max-w-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <ShoppingBag className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Belum ada customer
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Customer yang sesuai dengan filter akan muncul di sini.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            customers.map((customer, index) => (
              <tr
                key={customer.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
              >
                <td className="w-[20%] min-w-0 px-3 py-3 sm:px-4">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="group block min-w-0"
                  >
                    <p className="truncate font-semibold text-[var(--pisjo-navy)] group-hover:text-[var(--pisjo-ocean)]">
                      {customer.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      #{String(startIndex + index + 1).padStart(2, "0")} · ID{" "}
                      {customer.id.slice(0, 8)}
                    </p>
                  </Link>
                </td>

                <td className="w-[29%] min-w-0 px-3 py-3 sm:px-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {formatPhone(customer.phone)}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {customer.email || "-"}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {customer.area || "Area belum tersedia"}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="w-[9%] px-3 py-3 text-center sm:px-4">
                  <div className="font-semibold text-[var(--pisjo-navy)]">
                    {customer.totalOrders.toLocaleString("id-ID")}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {customer.lastOrderAt
                      ? formatDate(customer.lastOrderAt)
                      : "Belum belanja"}
                  </div>
                </td>

                <td className="w-[15%] whitespace-nowrap px-3 py-3 sm:px-4">
                  <div className="text-sm font-semibold text-[var(--pisjo-navy)]">
                    {formatCurrency(customer.totalSpent)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {customer.rewardPointsBalance.toLocaleString("id-ID")} poin
                  </div>
                </td>

                <td className="w-[10%] px-3 py-3 sm:px-4">
                  <SegmentBadge segment={customer.segment} />
                </td>

                <td className="w-[9%] px-3 py-3 sm:px-4">
                  <AdminStatusBadge active={customer.isActive} />
                </td>

                <td className="sticky right-0 z-10 w-[8%] min-w-[118px] border-l border-slate-100 bg-white px-2.5 py-3 shadow-[-6px_0_12px_-10px_rgba(15,23,42,0.35)] group-hover:bg-slate-50 sm:px-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/admin/customers/${customer.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg px-2.5 text-xs"
                      >
                        Detail
                      </Button>
                    </Link>

                    {mode === "active" && (
                      <DeleteCustomerButton
                        id={customer.id}
                        name={customer.name}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </AdminDataTable>
      </div>

      {/* Mobile cards: all important customer information and actions remain
          immediately accessible without any horizontal movement. */}
      <div className="divide-y divide-slate-100 md:hidden">
        {customers.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Belum ada customer
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Customer yang sesuai dengan filter akan muncul di sini.
            </p>
          </div>
        ) : (
          customers.map((customer, index) => (
            <div key={customer.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-semibold text-[var(--pisjo-navy)]">
                    {customer.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                    #{startIndex + index + 1} · ID {customer.id.slice(0, 8)}
                  </p>
                </Link>

                <AdminStatusBadge active={customer.isActive} />
              </div>

              <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3">
                <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {formatPhone(customer.phone)}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{customer.email || "-"}</span>
                </div>
                <div className="flex min-w-0 items-start gap-2 text-xs text-slate-600">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="line-clamp-2">
                    {customer.area || "Area belum tersedia"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-100 bg-white p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Order
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--pisjo-navy)]">
                    {customer.totalOrders.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Belanja
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-[var(--pisjo-navy)]">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Poin
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--pisjo-navy)]">
                    {customer.rewardPointsBalance.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <SegmentBadge segment={customer.segment} />
                  <span className="truncate text-[11px] text-slate-400">
                    {customer.lastOrderAt
                      ? `Belanja ${formatDate(customer.lastOrderAt)}`
                      : "Belum ada pesanan"}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Link href={`/admin/customers/${customer.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg px-2.5 text-xs"
                    >
                      Detail
                    </Button>
                  </Link>

                  {mode === "active" && (
                    <DeleteCustomerButton
                      id={customer.id}
                      name={customer.name}
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
