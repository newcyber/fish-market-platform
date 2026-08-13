import Link from "next/link";

import {
  Plus,
  Search,
} from "lucide-react";

interface PaymentChannelToolbarProps {
  search?: string;
}

export function PaymentChannelToolbar({
  search = "",
}: PaymentChannelToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <form
        action="/admin/payment-channels"
        className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Cari metode pembayaran..."
            className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition hover:bg-muted"
        >
          Cari
        </button>
      </form>

      <Link
        href="/admin/payment-channels/create"
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" />

        Tambah Metode
      </Link>
    </div>
  );
}