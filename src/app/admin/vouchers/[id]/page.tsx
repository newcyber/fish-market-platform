import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminVoucherService } from "@/services/voucher/admin-voucher.service";

/**
 * ============================================================
 * VOUCHER DETAIL PAGE
 * ============================================================
 */

type VoucherDetailPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    page?: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getVoucherPeriodStatus(
  startAt: Date | null,
  endAt: Date | null
) {
  const now = new Date();

  if (startAt && now < startAt) {
    return {
      label: "Belum Dimulai",
      className:
        "bg-yellow-100 text-yellow-800",
    };
  }

  if (endAt && now > endAt) {
    return {
      label: "Berakhir",
      className:
        "bg-red-100 text-red-800",
    };
  }

  return {
    label: "Aktif",
    className:
      "bg-green-100 text-green-800",
  };
}

export default async function VoucherDetailPage({
  params,
  searchParams,
}: VoucherDetailPageProps) {
  const { id } = await params;

  const resolvedSearchParams =
    await searchParams;

  const page = Math.max(
    Number(resolvedSearchParams.page) || 1,
    1
  );

  let voucher;
  let usageHistory;

  try {
    [voucher, usageHistory] =
      await Promise.all([
        AdminVoucherService.getById(id),

        AdminVoucherService.getUsageHistory(
          id,
          {
            page,
            limit: 20,
          }
        ),
      ]);
  } catch (error) {
    console.error(
      "[ADMIN_VOUCHER_DETAIL_PAGE_ERROR]",
      error
    );

    notFound();
  }

  const usageLimit =
    voucher.usageLimit ?? null;

  const usageCount =
    voucher.usageCount ?? 0;

  const remainingUsage =
    usageLimit !== null
      ? Math.max(
          usageLimit - usageCount,
          0
        )
      : null;

  const periodStatus =
    getVoucherPeriodStatus(
      voucher.startAt,
      voucher.endAt
    );

  return (
    <div className="space-y-8">
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
          {voucher.code}
        </span>
      </div>

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {voucher.name}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                voucher.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {voucher.isActive
                ? "Aktif"
                : "Nonaktif"}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${periodStatus.className}`}
            >
              {periodStatus.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Kode voucher:{" "}
            <span className="font-semibold text-gray-900">
              {voucher.code}
            </span>
          </p>

          {voucher.description && (
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              {voucher.description}
            </p>
          )}
        </div>

        <Link
          href={`/admin/vouchers/${voucher.id}/edit`}
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Edit Voucher
        </Link>
      </div>

      {/* ====================================================
          STATISTICS
      ==================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Total Digunakan
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {usageCount}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Batas Penggunaan
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {usageLimit ?? "Tanpa Batas"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Sisa Kuota
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {remainingUsage ?? "∞"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Per User
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {voucher.perUserLimit ??
              "Tanpa Batas"}
          </p>
        </div>
      </div>

      {/* ====================================================
          VOUCHER CONFIGURATION
      ==================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Konfigurasi Voucher
          </h2>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">
              Tipe Diskon
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {voucher.discountType ===
              "PERCENTAGE"
                ? "Persentase"
                : "Nominal"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Nilai Diskon
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {voucher.discountType ===
              "PERCENTAGE"
                ? `${voucher.discountValue.toNumber()}%`
                : formatCurrency(
                    voucher.discountValue.toNumber()
                  )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Minimum Pembelian
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {voucher.minimumPurchase
                ? formatCurrency(
                    voucher.minimumPurchase.toNumber()
                  )
                : "Tidak ada"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Maksimum Diskon
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {voucher.maximumDiscount
                ? formatCurrency(
                    voucher.maximumDiscount.toNumber()
                  )
                : "Tidak dibatasi"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Mulai Berlaku
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {formatDate(voucher.startAt)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Berakhir
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {formatDate(voucher.endAt)}
            </p>
          </div>
        </div>
      </div>

      {/* ====================================================
          USAGE HISTORY
      ==================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Riwayat Penggunaan
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Total{" "}
              {usageHistory.pagination.total} penggunaan
            </p>
          </div>
        </div>

        {usageHistory.data.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            Voucher ini belum pernah digunakan.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      User
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Order
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Diskon
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status Order
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Pembayaran
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Digunakan
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {usageHistory.data.map(
                    (usage) => (
                      <tr
                        key={usage.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {usage.user.name ??
                              "User"}
                          </div>

                          <div className="text-sm text-gray-500">
                            {usage.user.email}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {usage.order.orderNumber}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(
                            usage.discountAmount.toNumber()
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {usage.order.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {usage.order.paymentStatus}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(
                            usage.usedAt
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* ====================================================
                PAGINATION
            ==================================================== */}

            {usageHistory.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                <p className="text-sm text-gray-500">
                  Halaman{" "}
                  {usageHistory.pagination.page} dari{" "}
                  {usageHistory.pagination.totalPages}
                </p>

                <div className="flex gap-2">
                  {usageHistory.pagination.page > 1 && (
                    <Link
                      href={`/admin/vouchers/${voucher.id}?page=${
                        usageHistory.pagination.page - 1
                      }`}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Sebelumnya
                    </Link>
                  )}

                  {usageHistory.pagination.page <
                    usageHistory.pagination.totalPages && (
                    <Link
                      href={`/admin/vouchers/${voucher.id}?page=${
                        usageHistory.pagination.page + 1
                      }`}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Berikutnya
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}