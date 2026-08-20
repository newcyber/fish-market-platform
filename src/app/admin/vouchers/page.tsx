import {
  VoucherDiscountType,
} from "@prisma/client";

import {
  AdminVoucherService,
} from "@/services/voucher/admin-voucher.service";

import {
  VoucherToolbar,
} from "@/components/admin/vouchers/VoucherToolbar";

import {
  VoucherTable,
  type VoucherTableItem,
} from "@/components/admin/vouchers/VoucherTable";

/**
 * ============================================================
 * ADMIN VOUCHERS PAGE
 * ============================================================
 */

type AdminVouchersPageProps = {
  searchParams: Promise<{
    search?: string;
    isActive?: string;
    discountType?: string;
    page?: string;
  }>;
};

function parseBoolean(
  value?: string
): boolean | undefined {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function parseDiscountType(
  value?: string
): VoucherDiscountType | undefined {
  if (
    value ===
    VoucherDiscountType.PERCENTAGE
  ) {
    return VoucherDiscountType.PERCENTAGE;
  }

  if (
    value ===
    VoucherDiscountType.FIXED_AMOUNT
  ) {
    return VoucherDiscountType.FIXED_AMOUNT;
  }

  return undefined;
}

function parsePage(
  value?: string
): number {
  if (!value) {
    return 1;
  }

  const page =
    Number(value);

  if (
    !Number.isInteger(page) ||
    page < 1
  ) {
    return 1;
  }

  return page;
}

export default async function AdminVouchersPage({
  searchParams,
}: AdminVouchersPageProps) {
  const params =
    await searchParams;

  const page =
    parsePage(
      params.page
    );

  const result =
  await AdminVoucherService.getList({
      search:
        params.search?.trim() ||
        undefined,

      isActive:
        parseBoolean(
          params.isActive
        ),

      discountType:
        parseDiscountType(
          params.discountType
        ),

      page,

      limit: 20,
    });

  const vouchers:
    VoucherTableItem[] =
    result.data.map(
      (voucher) => ({
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,

        discountType:
          voucher.discountType,

        discountValue:
          Number(
            voucher.discountValue
          ),

        usageLimit:
          voucher.usageLimit,

        usageCount:
          voucher.usageCount,

        perUserLimit:
          voucher.perUserLimit,

        startAt:
          voucher.startAt,

        endAt:
          voucher.endAt,

        isActive:
          voucher.isActive,
      })
    );

  return (
    <div className="space-y-6">
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Voucher Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Kelola voucher, diskon, batas penggunaan,
          dan periode promo.
        </p>
      </div>

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <VoucherToolbar
        search={
          params.search
        }
        isActive={
          params.isActive
        }
        discountType={
          params.discountType
        }
      />

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="text-sm text-gray-500">
        Total voucher ditemukan:{" "}
        <span className="font-semibold text-gray-900">
          {result.pagination.total}
        </span>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <VoucherTable
        vouchers={vouchers}
      />
    </div>
  );
}