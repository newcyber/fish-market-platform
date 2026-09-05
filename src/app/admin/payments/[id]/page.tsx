import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  FileCheck2,
  MapPin,
  Package,
  ReceiptText,
  ShoppingBag,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  PaymentVerificationService,
} from "@/services/payment/payment-verification.service";

import PaymentVerificationActions from "@/components/admin/payments/PaymentVerificationActions";

/**
 * ============================================================
 *
 * ADMIN PAYMENT DETAIL PAGE
 *
 * ============================================================
 */

export const dynamic = "force-dynamic";

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getPaymentStatusLabel(
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

function getPaymentStatusClass(
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

function getPaymentStatusIcon(
  status: string
) {
  switch (status) {
    case "VERIFIED":
      return (
        <CheckCircle2 className="h-4 w-4" />
      );

    case "REJECTED":
      return (
        <XCircle className="h-4 w-4" />
      );

    default:
      return (
        <Clock3 className="h-4 w-4" />
      );
  }
}

function formatDate(
  date: Date | string | null | undefined
) {
  if (!date) {
    return "-";
  }

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
  name: string | null | undefined
) {
  return (
    name?.trim().charAt(0).toUpperCase() ||
    "C"
  );
}

/**
 * ============================================================
 * PAYMENT DISPLAY
 * ============================================================
 */

function getPaymentDisplay(
  payment: {
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;

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
    paymentChannel?.type === "QRIS";

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
 * DATA TYPE
 * ============================================================
 */

interface AdminPaymentDetail {
  id: string;
  status: string;

  image?: string | null;

  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;

  createdAt?: string | Date | null;

  verifiedAt?: string | Date | null;

  rejectionReason?: string | null;

  order: {
    id: string;
    orderNumber: string;
    total: number | string;
    status: string;

    items: Array<{
      id: string;
      quantity: number | string;
      price: number | string;

      product: {
        name: string;
      };
    }>;

    user: {
      id?: string;
      name?: string | null;
      email: string;
      phone?: string | null;
    };

    address?: {
      recipientName: string;
      phone: string;
      address: string;
      city: string;
    } | null;

    paymentChannel?: {
      id?: string;
      name: string;
      type: string;
      bankName: string | null;
      accountNumber: string | null;
      accountHolder: string | null;
      instructions?: string | null;
      description?: string | null;
    } | null;
  };
}

/**
 * ============================================================
 * PAGE PROPS
 * ============================================================
 */

interface AdminPaymentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default async function AdminPaymentDetailPage({
  params,
}: AdminPaymentDetailPageProps) {
  const { id } =
    await params;

  const result =
    await PaymentVerificationService.getById(
      id
    );

  if (
    !result.success ||
    !result.data
  ) {
    notFound();
  }

  const payment =
    result.data as AdminPaymentDetail;

  const paymentDisplay =
    getPaymentDisplay(payment);

  const orderTotal =
    Number(
      payment.order.total
    );

  const itemCount =
    payment.order.items.reduce(
      (total, item) =>
        total +
        Number(item.quantity),
      0
    );

  return (
    <div className="min-w-0 space-y-6 pb-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="min-w-0">
        <Link
          href="/admin/payments"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--pisjo-text-secondary)] transition hover:text-[var(--pisjo-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pembayaran
        </Link>

        <div className="mt-4 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--pisjo-soft-blue)] bg-[var(--pisjo-soft-blue)] px-3 py-1 text-xs font-semibold text-[var(--pisjo-ocean)]">
              <FileCheck2 className="h-3.5 w-3.5" />
              Payment Verification
            </div>

            <h1 className="break-words text-2xl font-bold tracking-tight text-[var(--pisjo-navy)] sm:text-3xl">
              Verifikasi Pembayaran
            </h1>

            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--pisjo-text-secondary)]">
              <span>
                Order:
              </span>

              <Link
                href={`/admin/orders/${payment.order.id}`}
                className="break-all font-bold text-[var(--pisjo-primary)] hover:underline"
              >
                {payment.order.orderNumber}
              </Link>

              <span className="hidden text-slate-300 sm:inline">
                •
              </span>

              <span>
                Upload{" "}
                {formatDate(
                  payment.createdAt
                )}
              </span>
            </div>
          </div>

          <div
            className={[
              "inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold",
              getPaymentStatusClass(
                payment.status
              ),
            ].join(" ")}
          >
            {getPaymentStatusIcon(
              payment.status
            )}

            {getPaymentStatusLabel(
              payment.status
            )}
          </div>
        </div>
      </section>

      {/* ======================================================
          PENDING ACTION NOTICE
      ====================================================== */}

      {payment.status === "PENDING" && (
        <div className="rounded-2xl border border-[var(--pisjo-soft-blue)] bg-[var(--pisjo-soft-blue)] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--pisjo-primary)] shadow-sm">
              <FileCheck2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-[var(--pisjo-navy)]">
                Pembayaran membutuhkan pemeriksaan
              </p>

              <p className="mt-1 text-sm leading-6 text-[var(--pisjo-text-secondary)]">
                Periksa bukti pembayaran,
                nominal, metode pembayaran,
                dan informasi customer sebelum
                melakukan verifikasi atau penolakan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MAIN GRID
      ====================================================== */}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">

        {/* ====================================================
            LEFT CONTENT
        ==================================================== */}

        <div className="min-w-0 space-y-6">

          {/* ==================================================
              PAYMENT PROOF
          ================================================== */}

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
                  <ReceiptText className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="font-bold text-[var(--pisjo-navy)]">
                    Bukti Pembayaran
                  </h2>

                  <p className="mt-1 text-sm text-[var(--pisjo-text-secondary)]">
                    Bukti yang diupload oleh customer.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {payment.image ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="relative min-h-[360px] w-full sm:min-h-[500px] lg:min-h-[620px]">
                    <Image
                      src={payment.image}
                      alt={`Bukti pembayaran ${payment.order.orderNumber}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 70vw"
                      priority
                      unoptimized
                    />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                      <ReceiptText className="h-7 w-7" />
                    </div>

                    <p className="mt-4 font-semibold text-slate-700">
                      Bukti pembayaran tidak tersedia
                    </p>

                    <p className="mt-1 text-sm text-[var(--pisjo-text-secondary)]">
                      Tidak ada gambar bukti pembayaran
                      yang tersimpan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ==================================================
              PAYMENT INFORMATION
          ================================================== */}

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
                  {paymentDisplay.isQris ? (
                    <CreditCard className="h-5 w-5" />
                  ) : (
                    <Banknote className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="font-bold text-[var(--pisjo-navy)]">
                    Informasi Pembayaran
                  </h2>

                  <p className="mt-1 text-sm text-[var(--pisjo-text-secondary)]">
                    Detail pembayaran yang dikirim customer.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid min-w-0 gap-4 p-4 sm:grid-cols-2 sm:p-5">

              {/* METODE */}

              <div className="min-w-0 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Metode Pembayaran
                </p>

                <p className="mt-2 break-words font-bold text-[var(--pisjo-navy)]">
                  {paymentDisplay.paymentName}
                </p>

                {payment.order.paymentChannel?.description && (
                  <p className="mt-1 text-xs leading-5 text-[var(--pisjo-text-secondary)]">
                    {
                      payment.order
                        .paymentChannel
                        .description
                    }
                  </p>
                )}
              </div>

              {/* NOMINAL */}

              <div className="min-w-0 rounded-xl bg-[var(--pisjo-soft-blue)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-ocean)]">
                  Nominal Pesanan
                </p>

                <p className="mt-2 break-words text-xl font-bold text-[var(--pisjo-navy)] sm:text-2xl">
                  {formatCurrency(
                    orderTotal
                  )}
                </p>
              </div>

              {/* BANK */}

              {!paymentDisplay.isQris && (
                <>
                  <div className="min-w-0 rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Bank
                    </p>

                    <p className="mt-2 break-words font-semibold text-slate-800">
                      {paymentDisplay.paymentName}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Nomor Rekening
                    </p>

                    <p className="mt-2 break-all font-mono font-semibold text-slate-800">
                      {paymentDisplay.accountNumber ??
                        "-"}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Nama Pengirim
                    </p>

                    <p className="mt-2 break-words font-semibold text-slate-800">
                      {paymentDisplay.accountName ??
                        "-"}
                    </p>
                  </div>
                </>
              )}

              {/* WAKTU UPLOAD */}

              <div className="min-w-0 rounded-xl border border-slate-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Waktu Upload
                </p>

                <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">
                  {formatDate(
                    payment.createdAt
                  )}
                </p>
              </div>

              {/* VERIFIED AT */}

              {payment.verifiedAt && (
                <div className="min-w-0 rounded-xl border border-green-100 bg-green-50 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                    Waktu Diproses
                  </p>

                  <p className="mt-2 text-sm font-semibold text-green-800">
                    {formatDate(
                      payment.verifiedAt
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ==================================================
              REJECTION REASON
          ================================================== */}

          {payment.status === "REJECTED" &&
            payment.rejectionReason && (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                    <XCircle className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-bold text-red-800">
                      Alasan Penolakan
                    </h2>

                    <p className="mt-2 break-words text-sm leading-6 text-red-700">
                      {payment.rejectionReason}
                    </p>
                  </div>
                </div>
              </section>
            )}

          {/* ==================================================
              ORDER ITEMS
          ================================================== */}

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
                    <ShoppingBag className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-bold text-[var(--pisjo-navy)]">
                      Item Pesanan
                    </h2>

                    <p className="mt-1 text-sm text-[var(--pisjo-text-secondary)]">
                      {itemCount.toLocaleString(
                        "id-ID"
                      )}{" "}
                      item dalam pesanan.
                    </p>
                  </div>
                </div>

                <Package className="hidden h-5 w-5 shrink-0 text-slate-300 sm:block" />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {payment.order.items.map(
                (item) => {
                  const quantity =
                    Number(
                      item.quantity
                    );

                  const price =
                    Number(
                      item.price
                    );

                  const subtotal =
                    quantity *
                    price;

                  return (
                    <div
                      key={item.id}
                      className="flex min-w-0 items-start justify-between gap-4 p-4 sm:p-5"
                    >
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-800">
                          {item.product.name}
                        </p>

                        <p className="mt-1 text-sm text-[var(--pisjo-text-secondary)]">
                          {quantity.toLocaleString(
                            "id-ID"
                          )}{" "}
                          ×{" "}
                          {formatCurrency(
                            price
                          )}
                        </p>
                      </div>

                      <p className="shrink-0 text-right font-bold text-[var(--pisjo-navy)]">
                        {formatCurrency(
                          subtotal
                        )}
                      </p>
                    </div>
                  );
                }
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-600">
                  Total Pesanan
                </span>

                <span className="text-lg font-bold text-[var(--pisjo-navy)]">
                  {formatCurrency(
                    orderTotal
                  )}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ====================================================
            RIGHT SIDEBAR
        ==================================================== */}

        <aside className="min-w-0 space-y-6">

          {/* ==================================================
              VERIFICATION ACTION
          ================================================== */}

          {payment.status === "PENDING" && (
            <section className="min-w-0 rounded-2xl border border-[var(--pisjo-soft-blue)] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-primary)]">
                  Tindakan Admin
                </p>

                <h2 className="mt-1 text-lg font-bold text-[var(--pisjo-navy)]">
                  Proses Pembayaran
                </h2>

                <p className="mt-1 text-sm leading-6 text-[var(--pisjo-text-secondary)]">
                  Pastikan bukti pembayaran valid
                  sebelum menyetujui transaksi.
                </p>
              </div>

              <PaymentVerificationActions
                paymentProofId={
                  payment.id
                }
              />
            </section>
          )}

          {/* ==================================================
              PAYMENT STATUS
          ================================================== */}

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    payment.status === "VERIFIED"
                      ? "bg-green-50 text-green-600"
                      : payment.status === "REJECTED"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-600",
                  ].join(" ")}
                >
                  {getPaymentStatusIcon(
                    payment.status
                  )}
                </div>

                <div>
                  <h2 className="font-bold text-[var(--pisjo-navy)]">
                    Status Pembayaran
                  </h2>

                  <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                    Status terakhir payment proof.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div
                className={[
                  "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold",
                  getPaymentStatusClass(
                    payment.status
                  ),
                ].join(" ")}
              >
                {getPaymentStatusIcon(
                  payment.status
                )}

                {getPaymentStatusLabel(
                  payment.status
                )}
              </div>

              {payment.verifiedAt && (
                <p className="mt-3 text-xs leading-5 text-[var(--pisjo-text-secondary)]">
                  Diproses pada{" "}
                  <span className="font-semibold text-slate-700">
                    {formatDate(
                      payment.verifiedAt
                    )}
                  </span>
                </p>
              )}
            </div>
          </section>

          {/* ==================================================
              ORDER SUMMARY
          ================================================== */}

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
                  <Package className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-[var(--pisjo-navy)]">
                    Informasi Pesanan
                  </h2>

                  <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                    Ringkasan order terkait pembayaran.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Nomor Pesanan
                </p>

                <Link
                  href={`/admin/orders/${payment.order.id}`}
                  className="mt-1 inline-flex max-w-full break-all font-bold text-[var(--pisjo-primary)] hover:underline"
                >
                  {payment.order.orderNumber}
                </Link>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total Pesanan
                </p>

                <p className="mt-1 text-xl font-bold text-[var(--pisjo-navy)]">
                  {formatCurrency(
                    orderTotal
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status Order
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {payment.order.status}
                </p>
              </div>

              <Link
                href={`/admin/orders/${payment.order.id}`}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--pisjo-soft-blue)] bg-[var(--pisjo-soft-blue)] px-4 text-sm font-bold text-[var(--pisjo-ocean)] transition hover:bg-[var(--pisjo-primary)] hover:text-white"
              >
                Lihat Detail Pesanan
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* ==================================================
              CUSTOMER
          ================================================== */}

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
                  <UserRound className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-[var(--pisjo-navy)]">
                    Customer
                  </h2>

                  <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                    Informasi pemilik transaksi.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-sm font-bold text-[var(--pisjo-ocean)]">
                  {getInitial(
                    payment.order.user.name
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-800">
                    {payment.order.user.name ??
                      "Customer"}
                  </p>

                  <p className="truncate text-xs text-[var(--pisjo-text-secondary)]">
                    Customer
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email
                </p>

                <p className="mt-1 break-all text-sm text-slate-700">
                  {payment.order.user.email}
                </p>
              </div>

              {payment.order.user.phone && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Nomor Telepon
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {payment.order.user.phone}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ==================================================
              SHIPPING ADDRESS
          ================================================== */}

          {payment.order.address && (
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-bold text-[var(--pisjo-navy)]">
                      Alamat Pengiriman
                    </h2>

                    <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                      Tujuan pesanan customer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-4 text-sm sm:p-5">
                <p className="font-bold text-slate-800">
                  {
                    payment.order
                      .address
                      .recipientName
                  }
                </p>

                <p className="text-[var(--pisjo-text-secondary)]">
                  {
                    payment.order
                      .address
                      .phone
                  }
                </p>

                <p className="break-words leading-6 text-[var(--pisjo-text-secondary)]">
                  {
                    payment.order
                      .address
                      .address
                  }
                </p>

                <p className="text-[var(--pisjo-text-secondary)]">
                  {
                    payment.order
                      .address
                      .city
                  }
                </p>
              </div>
            </section>
          )}

          {/* ==================================================
              QUICK BACK
          ================================================== */}

          <Link
            href="/admin/payments"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[var(--pisjo-soft-blue)] hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Pembayaran
          </Link>
        </aside>
      </div>
    </div>
  );
}
