import Link from "next/link";

import { MemberTierForm } from "@/components/admin/member-tiers/MemberTierForm";

export default function CreateMemberTierPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tambah Member Tier
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Buat tier membership baru untuk customer PISJO.
          </p>
        </div>

        <Link
          href="/admin/member-tiers"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Kembali
        </Link>
      </div>

      <MemberTierForm mode="create" />
    </div>
  );
}
