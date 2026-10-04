import Link from "next/link";
import { Plus } from "lucide-react";

import { AdminMemberTierService } from "@/services/member-tier/admin-member-tier.service";
import {
  MemberTierTable,
  type MemberTierTableItem,
} from "@/components/admin/member-tiers/MemberTierTable";

export default async function AdminMemberTiersPage() {
  const [tiers, tierSystemEnabled] = await Promise.all([
    AdminMemberTierService.getAll(),
    AdminMemberTierService.getSystemStatus(),
  ]);

  const items: MemberTierTableItem[] = tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    slug: tier.slug,
    minSpend: tier.minSpend.toNumber(),
    bonusPointsPercent: tier.bonusPointsPercent,
    freeShipping: tier.freeShipping,
    prioritySupport: tier.prioritySupport,
    exclusivePricing: tier.exclusivePricing,
    isActive: tier.isActive,
    sortOrder: tier.sortOrder,
    userCount: tier.userCount,
  }));

  const activeCount = items.filter((item) => item.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Member Tier Management
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Kelola level membership PISJO, minimum transaksi, bonus point, dan
            benefit customer.
          </p>
        </div>

        <Link
          href="/admin/member-tiers/create"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Tier
        </Link>
      </div>

      {!tierSystemEnabled && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-900">
            Sistem Member Tier sedang OFF
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Data tier tetap tersimpan, tetapi tidak digunakan untuk customer
            sampai fitur diaktifkan kembali dari Pengaturan Toko.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Total Tier
          </p>
          <p className="mt-2 text-2xl font-black text-gray-900">
            {items.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Tier Aktif
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {activeCount}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Customer Ber-Tier
          </p>
          <p className="mt-2 text-2xl font-black text-gray-900">
            {items.reduce((sum, item) => sum + item.userCount, 0)}
          </p>
        </div>
      </div>

      <MemberTierTable tiers={items} />
    </div>
  );
}
