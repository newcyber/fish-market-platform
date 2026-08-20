import Link from "next/link";
import { notFound } from "next/navigation";

import { VoucherForm } from "@/components/admin/vouchers/VoucherForm";
import { AdminVoucherService } from "@/services/voucher/admin-voucher.service";

/**
 * ============================================================
 * EDIT VOUCHER PAGE
 * ============================================================
 */

type EditVoucherPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditVoucherPage({
  params,
}: EditVoucherPageProps) {
  const { id } = await params;

  let voucher;

  try {
    voucher = await AdminVoucherService.getById(id);
  } catch (error) {
    console.error(
      "[ADMIN_EDIT_VOUCHER_PAGE_ERROR]",
      error
    );

    notFound();
  }

  return (
    <div className="space-y-6">
      {/* ====================================================
          BREADCRUMB
      ==================================================== */}

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
          Edit Voucher
        </span>
      </div>

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Voucher
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Perbarui informasi dan pengaturan voucher.
        </p>
      </div>

      {/* ====================================================
          FORM
      ==================================================== */}

      <VoucherForm
        mode="edit"
        initialData={{
          id: voucher.id,

          code: voucher.code,
          name: voucher.name,
          description: voucher.description,

          discountType: voucher.discountType,

          discountValue:
            voucher.discountValue.toNumber(),

          minimumPurchase:
            voucher.minimumPurchase?.toNumber() ?? null,

          maximumDiscount:
            voucher.maximumDiscount?.toNumber() ?? null,

          usageLimit:
            voucher.usageLimit,

          perUserLimit:
            voucher.perUserLimit,

          startAt:
            voucher.startAt,

          endAt:
            voucher.endAt,

          isActive:
            voucher.isActive,
        }}
      />
    </div>
  );
}