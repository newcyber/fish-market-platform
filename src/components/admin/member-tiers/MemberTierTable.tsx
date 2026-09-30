"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useState } from "react";

export type MemberTierTableItem = {
  id: string;
  name: string;
  slug: string;
  minSpend: number;
  bonusPointsPercent: number;
  freeShipping: boolean;
  prioritySupport: boolean;
  exclusivePricing: boolean;
  isActive: boolean;
  sortOrder: number;
  userCount: number;
};

function currency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function MemberTierTable({ tiers }: { tiers: MemberTierTableItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(tier: MemberTierTableItem) {
    setError(null);
    setBusyId(tier.id);

    try {
      const response = await fetch(
        `/api/admin/member-tiers/${tier.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !tier.isActive,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? "Gagal mengubah status tier.");
      }

      router.refresh();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Gagal mengubah status tier.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (tiers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="font-semibold text-gray-900">Belum ada member tier</p>
        <p className="mt-1 text-sm text-gray-500">
          Buat tier pertama untuk mulai mengatur membership PISJO.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Tier",
                  "Minimum Spend",
                  "Bonus Point",
                  "Benefit",
                  "Customer",
                  "Status",
                  "Aksi",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {tiers.map((tier) => (
                <tr key={tier.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {tier.name}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {tier.slug} · #{tier.sortOrder}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                    {currency(tier.minSpend)}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-700">
                    +{tier.bonusPointsPercent}%
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex max-w-72 flex-wrap gap-1.5">
                      {tier.freeShipping && (
                        <span className="rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700">
                          Ongkir
                        </span>
                      )}
                      {tier.prioritySupport && (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                          Priority
                        </span>
                      )}
                      {tier.exclusivePricing && (
                        <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">
                          Harga khusus
                        </span>
                      )}
                      {!tier.freeShipping &&
                        !tier.prioritySupport &&
                        !tier.exclusivePricing && (
                          <span className="text-xs text-gray-400">
                            Tidak ada benefit khusus
                          </span>
                        )}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-700">
                    {tier.userCount}
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => toggle(tier)}
                      disabled={busyId === tier.id}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        tier.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      } disabled:opacity-50`}
                    >
                      {busyId === tier.id
                        ? "..."
                        : tier.isActive
                          ? "Aktif"
                          : "Nonaktif"}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/member-tiers/${tier.id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
