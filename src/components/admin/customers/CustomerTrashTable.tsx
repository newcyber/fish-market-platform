"use client";

import { Mail, Phone, Trash2, UserRound } from "lucide-react";

import AdminStatusBadge from "@/components/admin/common/AdminStatusBadge";

import RestoreCustomerButton from "./RestoreCustomerButton";
import ForceDeleteCustomerButton from "./ForceDeleteCustomerButton";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  deletedAt: Date | null;
}

interface CustomerTrashTableProps {
  customers: Customer[];
}

function formatDeletedAt(value: Date | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CustomerTrashTable({
  customers,
}: CustomerTrashTableProps) {
  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Trash2 className="h-5 w-5 text-slate-400" />
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-700">
          Trash customer kosong
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Customer yang dihapus sementara akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden md:block">
        <div className="grid grid-cols-[minmax(180px,1.2fr)_minmax(200px,1.4fr)_100px_minmax(155px,1fr)_230px] items-center border-b border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div>Customer</div>
          <div>Kontak</div>
          <div>Status</div>
          <div>Dihapus</div>
          <div className="text-right">Aksi</div>
        </div>

        <div className="divide-y divide-slate-100">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="grid grid-cols-[minmax(180px,1.2fr)_minmax(200px,1.4fr)_100px_minmax(155px,1fr)_230px] items-center px-4 py-3.5 transition hover:bg-slate-50/70"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--pisjo-navy)]">
                  {customer.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  {customer.role}
                </p>
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {customer.phone || "-"}
                  </span>
                </div>

                <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {customer.email}
                  </span>
                </div>
              </div>

              <div>
                <AdminStatusBadge active={customer.isActive} />
              </div>

              <div className="text-xs text-slate-500">
                {formatDeletedAt(customer.deletedAt)}
              </div>

              <div className="flex justify-end gap-2">
                <RestoreCustomerButton
                  id={customer.id}
                  name={customer.name}
                />

                <ForceDeleteCustomerButton
                  id={customer.id}
                  name={customer.name}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {customers.map((customer) => (
          <div key={customer.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <UserRound className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--pisjo-navy)]">
                      {customer.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {customer.role}
                    </p>
                  </div>
                </div>
              </div>

              <AdminStatusBadge active={customer.isActive} />
            </div>

            <div className="space-y-2 rounded-xl bg-slate-50 p-3">
              <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{customer.phone || "-"}</span>
              </div>

              <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{customer.email}</span>
              </div>

              <div className="text-[11px] text-slate-400">
                Dihapus {formatDeletedAt(customer.deletedAt)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <RestoreCustomerButton
                id={customer.id}
                name={customer.name}
              />

              <ForceDeleteCustomerButton
                id={customer.id}
                name={customer.name}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
