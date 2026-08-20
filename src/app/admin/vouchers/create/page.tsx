import Link from "next/link";

import {
  VoucherForm,
} from "@/components/admin/vouchers/VoucherForm";

/**
 * ============================================================
 * CREATE VOUCHER PAGE
 * ============================================================
 */

export default function CreateVoucherPage() {
  return (
    <div className="space-y-6">
      {/* ======================================================
          BREADCRUMB
      ====================================================== */}

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/admin"
          className="transition hover:text-gray-900"
        >
          Dashboard
        </Link>

        <span>/</span>

        <Link
          href="/admin/vouchers"
          className="transition hover:text-gray-900"
        >
          Vouchers
        </Link>

        <span>/</span>

        <span className="font-medium text-gray-900">
          Tambah Voucher
        </span>
      </div>

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Tambah Voucher
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Buat voucher baru untuk promo dan program diskon.
        </p>
      </div>

      {/* ======================================================
          FORM
      ====================================================== */}

      <VoucherForm mode="create" />
    </div>
  );
}