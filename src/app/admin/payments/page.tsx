import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  FileCheck2,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import { PaymentStatus } from "@prisma/client";

import { PaymentVerificationService } from "@/services/payment/payment-verification.service";

/**
 * ============================================================
 *
 * ADMIN PAYMENT VERIFICATION PAGE
 *
 * ============================================================
 */

export const dynamic = "force-dynamic";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface AdminPaymentsPageProps {
  searchParams: Promise<{
    search?: string | string[];
    status?: string | string[];
    page?: string | string[];
  }>;
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getSingleParam(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getStatusLabel(
  status: string
) {
  switch (status) {
    case "PENDING":
      return "Menunggu Verifikasi";

    case "VERIFIED":
      return "Terverifikasi";

    case "REJECTED":
      return "Ditolak";

    default:
      return status;
  }
}

function getStatusClass(
  status: string
) {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "VERIFIED":
      return "border-green-200 bg-green-50 text-green-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatDate(
  date: Date | string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(date)
  );
}

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function getInitial(
  name: string
) {
  return (
    name
      .trim()
      .charAt(0)
      .toUpperCase() || "C"
  );
}

function createPageHref(
  page: number,
  search?: string,
  status?: PaymentStatus
) {
  const params =
    new URLSearchParams();

  if (search) {
    params.set(
      "search",
      search
    );
  }

  if (status) {
    params.set(
      "status",
      status
    );
  }

  params.set(
    "page",
    String(page)
  );

  return `/admin/payments?${params.toString()}`;
}

/**
 * ============================================================
 *
 * PAYMENT DISPLAY HELPER
 *
 * ============================================================
 *
 * Helper ini menentukan informasi pembayaran yang
 * ditampilkan di halaman Admin Payments.
 *
 * Priority:
 *
 * QRIS:
 *
 * 1. paymentChannel.type === QRIS
 * 2. Tampilkan QRIS
 *
 * BANK TRANSFER:
 *
 * 1. payment.bankName
 * 2. paymentChannel.bankName
 * 3. paymentChannel.name
 * 4. Fallback
 *
 * ============================================================
 */

function getPaymentDisplay(
  payment: {
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;

    order: {
      paymentChannel?: {
        name: string;
        type: string;
        bankName: string | null;
        accountNumber: string | null;
        accountHolder: string | null;
      } | null;
    };
  }
) {
  const paymentChannel =
    payment.order.paymentChannel;

  const isQris =
    paymentChannel?.type ===
    "QRIS";

  const paymentName =
    isQris
      ? "QRIS"
      : (
          payment.bankName ??
          paymentChannel?.bankName ??
          paymentChannel?.name ??
          "Metode pembayaran tidak diketahui"
        );

  const accountNumber =
    isQris
      ? null
      : (
          payment.accountNumber ??
          paymentChannel?.accountNumber ??
          null
        );

  const accountName =
    isQris
      ? null
      : (
          payment.accountName ??
          paymentChannel?.accountHolder ??
          null
        );

  return {
    isQris,
    paymentName,
    accountNumber,
    accountName,
  };
}

/**
 * ============================================================
 *
 * KPI CARD
 *
 * ============================================================
 */

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  href,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof CreditCard;
  iconClassName: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--pisjo-soft-blue)] hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--pisjo-navy)] sm:text-3xl">
            {value.toLocaleString(
              "id-ID"
            )}
          </p>

          <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
            {description}
          </p>
        </div>

        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconClassName,
          ].join(" ")}
        >
          <Icon
            className="h-5 w-5"
            strokeWidth={2}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--pisjo-primary)]">
        Lihat daftar
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}

/**
 * ============================================================
 *
 * PAGE
 *
 * ============================================================
 */

export default async function AdminPaymentsPage({
  searchParams,
}: AdminPaymentsPageProps) {
  const params =
    await searchParams;

  const search =
    getSingleParam(
      params.search
    )?.trim() ?? "";

  const rawStatus =
    getSingleParam(
      params.status
    );

  const rawPage =
    getSingleParam(
      params.page
    );

  const pageNumber =
    Number.parseInt(
      rawPage ?? "1",
      10
    );

  const page =
    Number.isInteger(pageNumber) &&
    pageNumber > 0
      ? pageNumber
      : 1;

  const status =
    rawStatus ===
      PaymentStatus.PENDING ||
    rawStatus ===
      PaymentStatus.VERIFIED ||
    rawStatus ===
      PaymentStatus.REJECTED
      ? rawStatus
      : undefined;

  /**
   * ==========================================================
   * GET DATA
   * ==========================================================
   */

  const [
    paymentsResult,
    statsResult,
  ] = await Promise.all([
    PaymentVerificationService.getAdminPayments({
      page,
      limit: 20,
      search,
      status,
    }),

    PaymentVerificationService.getAdminPaymentStats(),
  ]);

  const paymentData =
    paymentsResult.success &&
    paymentsResult.data
      ? paymentsResult.data
      : {
          payments: [],
          pagination: {
            page,
            limit: 20,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };

  const stats =
    statsResult.success &&
    statsResult.data
      ? statsResult.data
      : {
          total: 0,
          pending: 0,
          verified: 0,
          rejected: 0,
        };

  const payments =
    paymentData.payments;

  const pagination =
    paymentData.pagination;

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="min-w-0 space-y-6 pb-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="min-w-0">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--pisjo-soft-blue)] bg-[var(--pisjo-soft-blue)] px-3 py-1 text-xs font-semibold text-[var(--pisjo-ocean)]">
              <FileCheck2 className="h-3.5 w-3.5" />
              Payment Management
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[var(--pisjo-navy)] sm:text-3xl">
              Verifikasi Pembayaran
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-[var(--pisjo-text-secondary)]">
              Kelola dan verifikasi bukti
              pembayaran yang dikirim oleh
              customer.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[var(--pisjo-text-secondary)] shadow-sm">
            <CreditCard className="h-4 w-4 text-[var(--pisjo-primary)]" />
            <span>
              {stats.pending.toLocaleString(
                "id-ID"
              )}{" "}
              menunggu tindakan
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================
          ERROR STATE
      ====================================================== */}

      {!paymentsResult.success && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Gagal mengambil data pembayaran
              </p>

              <p className="mt-1 text-sm text-red-700">
                {paymentsResult.message ??
                  "Terjadi kesalahan saat mengambil data pembayaran."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          KPI
      ====================================================== */}

      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Bukti"
          value={stats.total}
          description="Seluruh bukti pembayaran"
          icon={CreditCard}
          iconClassName="bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]"
          href="/admin/payments"
        />

        <StatCard
          title="Menunggu"
          value={stats.pending}
          description="Perlu diverifikasi admin"
          icon={Clock3}
          iconClassName="bg-amber-50 text-amber-600"
          href="/admin/payments?status=PENDING"
        />

        <StatCard
          title="Terverifikasi"
          value={stats.verified}
          description="Pembayaran sudah valid"
          icon={CheckCircle2}
          iconClassName="bg-green-50 text-green-600"
          href="/admin/payments?status=VERIFIED"
        />

        <StatCard
          title="Ditolak"
          value={stats.rejected}
          description="Perlu perhatian customer"
          icon={XCircle}
          iconClassName="bg-red-50 text-red-600"
          href="/admin/payments?status=REJECTED"
        />
      </section>

      {/* ======================================================
          FILTER
      ====================================================== */}

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form
          method="GET"
          action="/admin/payments"
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]"
        >
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Cari nomor order, nama customer, atau email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--pisjo-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--pisjo-primary)]/10"
            />
          </div>

          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-[var(--pisjo-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--pisjo-primary)]/10"
          >
            <option value="">
              Semua Status
            </option>

            <option
              value={
                PaymentStatus.PENDING
              }
            >
              Menunggu Verifikasi
            </option>

            <option
              value={
                PaymentStatus.VERIFIED
              }
            >
              Terverifikasi
            </option>

            <option
              value={
                PaymentStatus.REJECTED
              }
            >
              Ditolak
            </option>
          </select>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--pisjo-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--pisjo-ocean)]"
          >
            <Search className="h-4 w-4" />
            Cari
          </button>
        </form>

        {(search || status) && (
          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--pisjo-text-secondary)]">
              Filter aktif:
            </span>

            {search && (
              <span className="max-w-full truncate rounded-full bg-[var(--pisjo-soft-blue)] px-3 py-1 text-xs font-medium text-[var(--pisjo-ocean)]">
                &quot;{search}&quot;
              </span>
            )}

            {status && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {getStatusLabel(status)}
              </span>
            )}

            <Link
              href="/admin/payments"
              className="text-xs font-semibold text-[var(--pisjo-primary)] hover:underline"
            >
              Reset
            </Link>
          </div>
        )}
      </section>

      {/* ======================================================
          RESULT SUMMARY
      ====================================================== */}

      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--pisjo-navy)]">
            Daftar Bukti Pembayaran
          </h2>

          <p className="text-sm text-[var(--pisjo-text-secondary)]">
            Menampilkan{" "}
            <span className="font-semibold text-slate-700">
              {payments.length}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-slate-700">
              {pagination.total}
            </span>{" "}
            bukti pembayaran.
          </p>
        </div>

        {pagination.totalPages > 1 && (
          <p className="text-xs text-[var(--pisjo-text-secondary)]">
            Halaman{" "}
            <span className="font-semibold text-slate-700">
              {pagination.page}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-slate-700">
              {pagination.totalPages}
            </span>
          </p>
        )}
      </div>

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
            <CreditCard className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-[var(--pisjo-navy)]">
            {search || status
              ? "Tidak ada pembayaran yang sesuai"
              : "Belum ada pembayaran"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--pisjo-text-secondary)]">
            {search || status
              ? "Coba ubah kata pencarian atau filter status."
              : "Bukti pembayaran dari customer akan muncul di halaman ini."}
          </p>

          {(search || status) && (
            <Link
              href="/admin/payments"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--pisjo-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--pisjo-ocean)]"
            >
              Reset Filter
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* ==================================================
              DESKTOP TABLE
          ================================================== */}

          <section className="hidden min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Order
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Customer
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Metode
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Nominal
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Upload
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-slate-600">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {payments.map(
                    (payment) => {
                      const paymentDisplay =
                        getPaymentDisplay(
                          payment
                        );

                      return (
                        <tr
                          key={payment.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <Link
                              href={`/admin/payments/${payment.id}`}
                              className="font-semibold text-[var(--pisjo-primary)] hover:underline"
                            >
                              {
                                payment.order
                                  .orderNumber
                              }
                            </Link>

                            <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                              Order{" "}
                              {payment.order.status}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-xs font-bold text-[var(--pisjo-ocean)]">
                                {getInitial(
                                  payment.order
                                    .user.name
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-800">
                                  {
                                    payment.order
                                      .user.name
                                  }
                                </p>

                                <p className="max-w-[190px] truncate text-xs text-[var(--pisjo-text-secondary)]">
                                  {
                                    payment.order
                                      .user.email
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                {paymentDisplay.isQris ? (
                                  <CreditCard className="h-4 w-4" />
                                ) : (
                                  <Banknote className="h-4 w-4" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="font-medium text-slate-800">
                                  {
                                    paymentDisplay.paymentName
                                  }
                                </p>

                                {paymentDisplay.accountNumber && (
                                  <p className="text-xs text-[var(--pisjo-text-secondary)]">
                                    {
                                      paymentDisplay.accountNumber
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-[var(--pisjo-navy)]">
                            {formatCurrency(
                              payment.order.total
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-xs text-[var(--pisjo-text-secondary)]">
                            {formatDate(
                              payment.createdAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={[
                                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                                getStatusClass(
                                  payment.status
                                ),
                              ].join(" ")}
                            >
                              {getStatusLabel(
                                payment.status
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/admin/payments/${payment.id}`}
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-[var(--pisjo-soft-blue)] hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)]"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Detail
                            </Link>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ==================================================
              MOBILE / TABLET CARDS
          ================================================== */}

          <section className="grid min-w-0 gap-3 lg:hidden">
            {payments.map(
              (payment) => {
                const paymentDisplay =
                  getPaymentDisplay(
                    payment
                  );

                return (
                  <article
                    key={payment.id}
                    className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    {/* ------------------------------------------
                        ORDER + STATUS
                    ------------------------------------------ */}

                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/payments/${payment.id}`}
                          className="break-all text-sm font-bold text-[var(--pisjo-primary)]"
                        >
                          {
                            payment.order
                              .orderNumber
                          }
                        </Link>

                        <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                          {formatDate(
                            payment.createdAt
                          )}
                        </p>
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold",
                          getStatusClass(
                            payment.status
                          ),
                        ].join(" ")}
                      >
                        {getStatusLabel(
                          payment.status
                        )}
                      </span>
                    </div>

                    {/* ------------------------------------------
                        CUSTOMER
                    ------------------------------------------ */}

                    <div className="mt-4 flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-sm font-bold text-[var(--pisjo-ocean)]">
                        {getInitial(
                          payment.order
                            .user.name
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {
                            payment.order
                              .user.name
                          }
                        </p>

                        <p className="truncate text-xs text-[var(--pisjo-text-secondary)]">
                          {
                            payment.order
                              .user.email
                          }
                        </p>
                      </div>
                    </div>

                    {/* ------------------------------------------
                        PAYMENT
                    ------------------------------------------ */}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Metode
                        </p>

                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          {paymentDisplay.isQris ? (
                            <CreditCard className="h-4 w-4 shrink-0 text-[var(--pisjo-primary)]" />
                          ) : (
                            <Banknote className="h-4 w-4 shrink-0 text-[var(--pisjo-primary)]" />
                          )}

                          <p className="truncate text-sm font-semibold text-slate-700">
                            {
                              paymentDisplay.paymentName
                            }
                          </p>
                        </div>

                        {paymentDisplay.accountNumber && (
                          <p className="mt-1 truncate text-xs text-[var(--pisjo-text-secondary)]">
                            {
                              paymentDisplay.accountNumber
                            }
                          </p>
                        )}
                      </div>

                      <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Nominal
                        </p>

                        <p className="mt-1 truncate text-sm font-bold text-[var(--pisjo-navy)]">
                          {formatCurrency(
                            payment.order
                              .total
                          )}
                        </p>

                        <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                          Order{" "}
                          {payment.order.status}
                        </p>
                      </div>
                    </div>

                    {/* ------------------------------------------
                        DETAIL BUTTON
                    ------------------------------------------ */}

                    <Link
                      href={`/admin/payments/${payment.id}`}
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--pisjo-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--pisjo-ocean)]"
                    >
                      <Eye className="h-4 w-4" />
                      Lihat Detail Pembayaran
                    </Link>
                  </article>
                );
              }
            )}
          </section>
        </>
      )}

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      {pagination.totalPages > 1 && (
        <nav
          aria-label="Pagination pembayaran"
          className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4"
        >
          <div className="text-xs text-[var(--pisjo-text-secondary)]">
            Halaman{" "}
            <span className="font-semibold text-slate-700">
              {pagination.page}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-slate-700">
              {pagination.totalPages}
            </span>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            {pagination.hasPreviousPage ? (
              <Link
                href={createPageHref(
                  pagination.page - 1,
                  search,
                  status
                )}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-[var(--pisjo-soft-blue)] hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)] sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Link>
            ) : (
              <span className="flex h-10 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm font-semibold text-slate-300 sm:flex-none">
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </span>
            )}

            <span className="hidden h-10 items-center rounded-xl bg-[var(--pisjo-soft-blue)] px-4 text-sm font-bold text-[var(--pisjo-ocean)] sm:flex">
              {pagination.page}
            </span>

            {pagination.hasNextPage ? (
              <Link
                href={createPageHref(
                  pagination.page + 1,
                  search,
                  status
                )}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-[var(--pisjo-soft-blue)] hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)] sm:flex-none"
              >
                Berikutnya
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex h-10 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm font-semibold text-slate-300 sm:flex-none">
                Berikutnya
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
